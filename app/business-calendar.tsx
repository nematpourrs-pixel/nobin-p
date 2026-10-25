import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { api } from '../src/api';
import { jalaliDate, jalaliShort, faNum } from '../src/dateFa';
import { nobinAlert } from '../src/dialogs';
import { effectiveAudience, paletteFor } from '../src/prefs';
import { TimeInput } from '../src/TimeInput';
import { usePrefs } from '../src/usePrefs';
import { InternalHeader, NText } from '../src/ui';

type Shift = { start: string; end: string };
type DayPlan = { kind: 'closed' | 'special' | 'regular' | 'none'; ranges: Shift[]; exception?: any };
type ViewMode = 'month' | 'week';
type EditMode = 'weekly' | 'exception' | null;
const weekNames = ['ش', 'ی', 'د', 'س', 'چ', 'پ', 'ج'];
const fullDays = ['یکشنبه', 'دوشنبه', 'سه‌شنبه', 'چهارشنبه', 'پنجشنبه', 'جمعه', 'شنبه'];

const atNoon = (date: Date) => new Date(date.getFullYear(), date.getMonth(), date.getDate(), 12);
const addDays = (date: Date, days: number) => { const d = atNoon(date); d.setDate(d.getDate() + days); return d; };
const isoDate = (date: Date) => [date.getFullYear(), String(date.getMonth() + 1).padStart(2, '0'), String(date.getDate()).padStart(2, '0')].join('-');
const shortTime = (value: any) => String(value ?? '').slice(0, 5);
const dateInfo = (d: Date) => {
  const pts = new Intl.DateTimeFormat('en-US-u-ca-persian', { year: 'numeric', month: 'numeric', day: 'numeric' }).formatToParts(d);
  const num = (name: string) => Number(pts.find(p => p.type === name)?.value || 0);
  return { year: num('year'), month: num('month'), day: num('day') };
};
const startOfPersianMonth = (date: Date) => {
  let d = atNoon(date);
  for (let i = 0; i < 32 && dateInfo(d).day !== 1; i++) d = addDays(d, -1);
  return d;
};
const startOfWeek = (date: Date) => addDays(date, -((date.getDay() + 1) % 7));
const monthCells = (anchor: Date) => {
  const first = startOfPersianMonth(anchor);
  const start = startOfWeek(first);
  return Array.from({ length: 42 }, (_, i) => addDays(start, i));
};
const validTime = (s: string) => /^(?:[01]\d|2[0-3]):[0-5]\d$/.test(s);
const validateShifts = (ranges: Shift[]) => {
  const sorted = [...ranges].sort((a, b) => a.start.localeCompare(b.start));
  for (let i = 0; i < sorted.length; i++) {
    if (!validTime(sorted[i].start) || !validTime(sorted[i].end) || sorted[i].start >= sorted[i].end) return 'ساعت شروع و پایان شیفت معتبر نیست.';
    if (i > 0 && sorted[i].start < sorted[i - 1].end) return 'بازه‌های کاری یک متخصص نباید تداخل داشته باشند.';
  }
  return null;
};
const status = (plan: DayPlan) => plan.kind === 'closed' ? 'مرخصی / تعطیل' : plan.kind === 'special' ? 'ساعت کاری ویژه' : plan.kind === 'none' ? 'بدون شیفت' : 'شیفت معمول';
const clock = (rs: Shift[]) => rs.map(x => x.start + ' تا ' + x.end).join('  |  ');

export default function BusinessCalendar() {
  const params = useLocalSearchParams<{ businessId: string; staffId?: string }>();
  const bid = Number(params.businessId || 0);
  const initialStaff = Number(params.staffId || 0);
  const [prefs] = usePrefs();
  const t = paletteFor(effectiveAudience(prefs), prefs.appearance);
  const styles = useMemo(() => makeStyles(t), [t]);
  const [business, setBusiness] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [staffId, setStaffId] = useState(initialStaff);
  const [mode, setMode] = useState<ViewMode>('month');
  const [selected, setSelected] = useState<Date>(() => atNoon(new Date()));
  const [cursor, setCursor] = useState<Date>(() => atNoon(new Date()));
  const [editMode, setEditMode] = useState<EditMode>(null);
  const [weeklyRanges, setWeeklyRanges] = useState<Shift[]>([]);
  const [exWorking, setExWorking] = useState(false);
  const [exStart, setExStart] = useState('09:00');
  const [exEnd, setExEnd] = useState('18:00');

  const refresh = useCallback(async () => {
    const data = await api('/v1/me/businesses/' + bid);
    const b = data.business;
    setBusiness(b);
    setStaffId(old => Number(old) || Number((b?.staff || []).find((x: any) => Number(x.active) !== 0)?.id || 0));
    setLoading(false);
    return b;
  }, [bid]);
  useFocusEffect(useCallback(() => {
    let active = true;
    setLoading(true);
    void refresh().catch((e: any) => { if (active) { setLoading(false); nobinAlert('دریافت تقویم ناموفق بود', e.message); } });
    return () => { active = false; };
  }, [refresh]));

  const staff = (business?.staff || []).filter((x: any) => Number(x.active) !== 0);
  const chosenStaff = staff.find((x: any) => Number(x.id) === staffId);
  const shifts: any[] = business?.shifts || [];
  const exceptions: any[] = business?.schedule_exceptions || [];
  const planFor = (date: Date): DayPlan => {
    const key = isoDate(date);
    const ex = exceptions.find(x => Number(x.staff_id) === staffId && String(x.work_date || '').slice(0, 10) === key);
    if (ex) {
      if (!Number(ex.is_working)) return { kind: 'closed', ranges: [], exception: ex };
      return { kind: 'special', ranges: [{ start: shortTime(ex.start_time), end: shortTime(ex.end_time) }], exception: ex };
    }
    const weekly = shifts.filter(x => Number(x.staff_id) === staffId && Number(x.weekday) === date.getDay() && Number(x.active) !== 0);
    const fallback = shifts.filter(x => (x.staff_id === null || x.staff_id === undefined) && Number(x.weekday) === date.getDay() && Number(x.active) !== 0);
    const available = weekly.length ? weekly : fallback;
    if (!available.length) return { kind: 'none', ranges: [] };
    return { kind: 'regular', ranges: available.map(x => ({ start: shortTime(x.start_time), end: shortTime(x.end_time) })).sort((a, b) => a.start.localeCompare(b.start)) };
  };

  const monthDays = useMemo(() => monthCells(cursor), [cursor]);
  const weekDays = useMemo(() => { const start = startOfWeek(selected); return Array.from({ length: 7 }, (_, i) => addDays(start, i)); }, [selected]);
  const visibleDays = mode === 'month' ? monthDays : weekDays;
  const currentMonth = dateInfo(cursor);
  const visibleMonthDays = monthDays.filter(d => { const j = dateInfo(d); return j.year === currentMonth.year && j.month === currentMonth.month; });
  const stats = {
    open: visibleMonthDays.filter(d => ['regular', 'special'].includes(planFor(d).kind)).length,
    closed: visibleMonthDays.filter(d => planFor(d).kind === 'closed').length,
    special: visibleMonthDays.filter(d => planFor(d).kind === 'special').length
  };
  const selectedPlan = planFor(selected);
  const selectedKey = isoDate(selected);
  const selectedWeekday = selected.getDay();
  const resetEditor = () => setEditMode(null);
  const selectDay = (date: Date) => { setSelected(date); setCursor(date); resetEditor(); };
  const selectStaff = (id: number) => { setStaffId(id); resetEditor(); };

  const go = (delta: number) => {
    if (mode === 'week') {
      const d = addDays(selected, delta * 7);
      selectDay(d);
    } else {
      const first = startOfPersianMonth(cursor);
      const d = delta > 0 ? addDays(first, 35) : addDays(first, -1);
      setCursor(d);
      setSelected(startOfPersianMonth(d));
      resetEditor();
    }
  };
  const editWeekly = () => {
    const own = shifts.filter(x => Number(x.staff_id) === staffId && Number(x.weekday) === selectedWeekday && Number(x.active) !== 0);
    setWeeklyRanges(own.map(x => ({ start: shortTime(x.start_time), end: shortTime(x.end_time) })).sort((a, b) => a.start.localeCompare(b.start)));
    setEditMode('weekly');
  };
  const editException = () => {
    const ex = selectedPlan.exception;
    setExWorking(ex ? Number(ex.is_working) !== 0 : true);
    setExStart(shortTime(ex?.start_time) || '09:00');
    setExEnd(shortTime(ex?.end_time) || '18:00');
    setEditMode('exception');
  };
  const changeRange = (index: number, field: 'start' | 'end', value: string) => setWeeklyRanges(rs => rs.map((r, i) => i === index ? { ...r, [field]: value } : r));
  const saveWeekly = async () => {
    if (!staffId || saving) return;
    const error = validateShifts(weeklyRanges);
    if (error) return nobinAlert('بازه کاری نامعتبر', error);
    setSaving(true);
    try {
      await api('/v1/businesses/' + bid + '/staff/' + staffId + '/shifts/' + selectedWeekday, { method: 'PUT', body: JSON.stringify({ ranges: weeklyRanges.map(r => ({ start_time: r.start, end_time: r.end })) }) });
      await refresh(); resetEditor(); nobinAlert('برنامه هفتگی ذخیره شد', 'شیفت‌های ' + fullDays[selectedWeekday] + ' این متخصص به‌روزرسانی شد.');
    } catch (e: any) { nobinAlert('ذخیره نشد', e.message); }
    finally { setSaving(false); }
  };
  const saveException = async () => {
    if (!staffId || saving) return;
    if (exWorking && (!validTime(exStart) || !validTime(exEnd) || exStart >= exEnd)) return nobinAlert('ساعت نامعتبر', 'ساعت پایان باید از ساعت شروع بزرگ‌تر باشد.');
    setSaving(true);
    try {
      await api('/v1/businesses/' + bid + '/schedule-exceptions', {
        method: 'POST', body: JSON.stringify({
          staff_id: staffId, date: selectedKey, is_working: exWorking,
          start_time: exStart, end_time: exEnd, note: exWorking ? 'ساعت کاری ویژه' : 'مرخصی/تعطیلی'
        })
      });
      await refresh(); resetEditor(); nobinAlert('تقویم به‌روزرسانی شد', 'برنامه ' + jalaliDate(selected) + ' ذخیره شد.');
    } catch (e: any) { nobinAlert('ذخیره نشد', e.message); }
    finally { setSaving(false); }
  };
  const removeException = () => {
    const ex = selectedPlan.exception;
    if (!ex || saving) return;
    nobinAlert('بازگشت به شیفت هفتگی', 'استثنای این تاریخ حذف شود و برنامه معمول هفتگی دوباره اعمال شود؟', [
      { text: 'انصراف', style: 'cancel' },
      { text: 'حذف استثنا', style: 'destructive', onPress: () => {
        setSaving(true);
        void api('/v1/businesses/' + bid + '/schedule-exceptions/' + ex.id, { method: 'DELETE' })
          .then(() => refresh()).then(() => { resetEditor(); nobinAlert('انجام شد', 'برنامه هفتگی دوباره فعال شد.'); })
          .catch((e: any) => nobinAlert('حذف نشد', e.message))
          .finally(() => setSaving(false));
      } }
    ]);
  };
  const editor = editMode === 'weekly' ? (
    <View style={styles.editor}>
      <View style={styles.rowBetween}>
        <NText weight="bold" style={styles.editorTitle}>ویرایش شیفت‌های {fullDays[selectedWeekday]}</NText>
        <ActionText title="بستن" onPress={resetEditor} t={t} />
      </View>
      <NText style={styles.hint}>این تغییر برای تمام {fullDays[selectedWeekday]}‌های آینده اعمال می‌شود، مگر روزهایی که ساعت ویژه یا مرخصی دارند.</NText>
      {weeklyRanges.map((r, i) => <View key={i} style={styles.shiftItem}>
        <View style={styles.rowBetween}><NText style={styles.muted}>بازه {faNum(i + 1)}</NText><ActionText title="حذف" onPress={() => setWeeklyRanges(rs => rs.filter((_, index) => index !== i))} t={t} danger /></View>
        <View style={styles.two}><View style={styles.field}><TimeInput label="شروع" value={r.start} onChange={v => changeRange(i, 'start', v)} t={t} /></View><View style={styles.field}><TimeInput label="پایان" value={r.end} onChange={v => changeRange(i, 'end', v)} t={t} /></View></View>
      </View>)}
      {!weeklyRanges.length && <NText style={styles.hint}>برای این روز شیفت اختصاصی تعریف نشده است.</NText>}
      <TouchableOpacity accessibilityRole="button" style={styles.secondaryButton} onPress={() => setWeeklyRanges(rs => [...rs, { start: '09:00', end: '18:00' }])}><Ionicons name="add-circle-outline" size={19} color={t.accent}/><NText weight="semi" style={styles.secondaryLabel}>افزودن بازه کاری</NText></TouchableOpacity>
      <Primary title={saving ? 'در حال ذخیره...' : 'ذخیره شیفت‌های هفتگی'} disabled={saving} onPress={saveWeekly} t={t} />
      <NText style={styles.hint}>توجه: تغییر ساعت کاری نوبت‌های قبلاً ثبت‌شده را لغو نمی‌کند.</NText>
    </View>
  ) : editMode === 'exception' ? (
    <View style={styles.editor}>
      <View style={styles.rowBetween}><NText weight="bold" style={styles.editorTitle}>ویرایش {jalaliShort(selected)}</NText><ActionText title="بستن" onPress={resetEditor} t={t}/></View>
      <View style={styles.modeRow}>
        <TouchableOpacity onPress={() => setExWorking(true)} style={[styles.modePill, exWorking && styles.modePillOn]}><Ionicons name="time-outline" size={17} color={exWorking ? '#fff' : t.accent}/><NText weight="semi" style={{ color: exWorking ? '#fff' : t.text, fontSize: 11 }}>ساعت ویژه</NText></TouchableOpacity>
        <TouchableOpacity onPress={() => setExWorking(false)} style={[styles.modePill, !exWorking && styles.modePillOn]}><Ionicons name="moon-outline" size={17} color={!exWorking ? '#fff' : t.accent}/><NText weight="semi" style={{ color: !exWorking ? '#fff' : t.text, fontSize: 11 }}>مرخصی / تعطیل</NText></TouchableOpacity>
      </View>
      {exWorking ? <View style={styles.two}><View style={styles.field}><TimeInput label="شروع" value={exStart} onChange={setExStart} t={t}/></View><View style={styles.field}><TimeInput label="پایان" value={exEnd} onChange={setExEnd} t={t}/></View></View> : <NText style={styles.hint}>این روز در تقویم رزرو متخصص غیرفعال خواهد شد؛ رزروهای قبلی به‌طور خودکار لغو نمی‌شوند.</NText>}
      <Primary title={saving ? 'در حال ثبت...' : 'ثبت برنامه این تاریخ'} disabled={saving} onPress={saveException} t={t}/>
      {selectedPlan.exception ? <TouchableOpacity onPress={removeException} style={styles.secondaryButton} disabled={saving}><Ionicons name="arrow-undo-outline" size={17} color={t.accent}/><NText weight="semi" style={styles.secondaryLabel}>حذف استثنا و بازگشت به شیفت هفتگی</NText></TouchableOpacity> : null}
    </View>
  ) : null;

  return <SafeAreaView edges={['bottom']} style={styles.root}>
    <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="always">
      <InternalHeader t={t} title="تقویم کاری" sub="برنامه متخصصان، مرخصی‌ها و ویرایش شیفت‌ها" />
      {loading ? <ActivityIndicator color={t.accent} size="large"/> : !staff.length ? (
        <View style={styles.empty}><Ionicons name="people-outline" size={32} color={t.muted}/><NText style={styles.hint}>ابتدا در بخش «کارکنان» یک متخصص فعال ثبت کنید.</NText></View>
      ) : <>
        <View style={styles.card}>
          <View style={styles.rowBetween}><NText weight="semi" style={styles.sectionLabel}>انتخاب متخصص</NText><NText style={styles.muted}>{faNum(staff.length)} نفر</NText></View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.staffRow}>
            {staff.map((x: any) => <TouchableOpacity key={x.id} accessibilityRole="button" accessibilityState={{ selected: staffId === Number(x.id) }} onPress={() => selectStaff(Number(x.id))} style={[styles.staffChip, staffId === Number(x.id) && styles.staffChipOn]}>
              <Ionicons name="person-circle-outline" size={19} color={staffId === Number(x.id) ? '#fff' : t.accent}/>
              <NText weight="semi" style={{ fontSize: 11, color: staffId === Number(x.id) ? '#fff' : t.text }}>{x.name}</NText>
            </TouchableOpacity>)}
          </ScrollView>
        </View>
        <View style={styles.card}>
          <View style={styles.rowBetween}>
            <View style={styles.pager}>
              <TouchableOpacity accessibilityLabel="دوره قبل" onPress={() => go(-1)} style={styles.arrow}><Ionicons name="chevron-forward" size={19} color={t.text}/></TouchableOpacity>
              <TouchableOpacity accessibilityLabel="دوره بعد" onPress={() => go(1)} style={styles.arrow}><Ionicons name="chevron-back" size={19} color={t.text}/></TouchableOpacity>
            </View>
            <View style={{ flex: 1, alignItems: 'flex-end' }}>
              <NText weight="bold" style={styles.monthTitle}>{mode === 'month' ? new Intl.DateTimeFormat('fa-IR-u-ca-persian', { month: 'long', year: 'numeric' }).format(cursor) : jalaliShort(weekDays[0]) + ' تا ' + jalaliShort(weekDays[6])}</NText>
              <NText style={styles.muted}>تقویم شمسی · {chosenStaff?.name || 'متخصص'}</NText>
            </View>
          </View>
          <View style={styles.rowBetween}>
            <TouchableOpacity onPress={() => selectDay(atNoon(new Date()))} style={styles.today}><Ionicons name="locate-outline" size={15} color={t.accent}/><NText style={styles.todayText}>امروز</NText></TouchableOpacity>
            <View style={styles.switch}>
              <TouchableOpacity onPress={() => { setMode('week'); resetEditor(); }} style={[styles.switchTab, mode === 'week' && styles.switchOn]}><NText style={[styles.switchText, mode === 'week' && styles.switchTextOn]}>هفتگی</NText></TouchableOpacity>
              <TouchableOpacity onPress={() => { setMode('month'); resetEditor(); }} style={[styles.switchTab, mode === 'month' && styles.switchOn]}><NText style={[styles.switchText, mode === 'month' && styles.switchTextOn]}>ماهانه</NText></TouchableOpacity>
            </View>
          </View>
          {mode === 'month' ? <>
            <View style={styles.weekHeader}>{weekNames.map((x, i) => <NText key={i} weight="semi" style={[styles.weekLabel, i === 6 && { color: t.danger }]}>{x}</NText>)}</View>
            <View style={styles.monthGrid}>{visibleDays.map((date, i) => {
              const info = dateInfo(date);
              const inside = info.month === currentMonth.month && info.year === currentMonth.year;
              const today = isoDate(date) === isoDate(new Date());
              const on = isoDate(date) === selectedKey;
              const plan = planFor(date);
              const color = plan.kind === 'closed' ? t.danger : plan.kind === 'special' ? t.warning : plan.kind === 'regular' ? t.success : t.line;
              return <TouchableOpacity accessibilityRole="button" accessibilityState={{ selected: on }} accessibilityLabel={jalaliDate(date) + '، ' + status(plan)} key={i} onPress={() => selectDay(date)} style={styles.gridSlot}>
                <View style={[styles.dateCell, on && styles.dayOn, today && !on && styles.dayToday, !inside && { opacity: 0.35 }]}>
                  <NText weight={on || today ? 'bold' : 'medium'} style={[styles.dayNum, { color: on ? '#fff' : t.text }]}>{faNum(info.day)}</NText>
                  <View style={[styles.dot, { backgroundColor: on ? '#fff' : color }]} />
                </View>
              </TouchableOpacity>;
            })}</View>
            <View style={styles.legend}>
              <Legend label="شیفت کاری" color={t.success} t={t}/><Legend label="ساعت ویژه" color={t.warning} t={t}/><Legend label="تعطیل" color={t.danger} t={t}/>
            </View>
            <View style={styles.stats}><Statistic title="روز کاری" value={stats.open} t={t}/><Statistic title="ساعت ویژه" value={stats.special} t={t}/><Statistic title="مرخصی" value={stats.closed} t={t}/></View>
          </> : <View style={styles.weekList}>{weekDays.map(date => {
            const plan = planFor(date);
            const on = isoDate(date) === selectedKey;
            const accent = plan.kind === 'closed' ? t.danger : plan.kind === 'special' ? t.warning : t.accent;
            return <TouchableOpacity key={isoDate(date)} accessibilityRole="button" accessibilityState={{ selected: on }} onPress={() => selectDay(date)} style={[styles.weekCard, on && { borderColor: t.accent, backgroundColor: t.accentSoft }]}>
              <View style={styles.weekDate}><NText weight="bold" style={{ color: t.text, fontSize: 16 }}>{faNum(dateInfo(date).day)}</NText><NText style={styles.muted}>{fullDays[date.getDay()]}</NText></View>
              <View style={{ flex: 1 }}><NText weight="semi" style={{ color: accent, fontSize: 11.5, textAlign: 'right' }}>{status(plan)}</NText><NText style={styles.muted}>{plan.ranges.length ? clock(plan.ranges) : 'زمان قابل رزرو ندارد'}</NText></View>
              <Ionicons name={on ? 'checkmark-circle' : 'chevron-back-outline'} size={20} color={accent}/>
            </TouchableOpacity>;
          })}</View>}
        </View>
        <View style={styles.card}>
          <View style={styles.rowBetween}>
            <NText weight="bold" style={styles.sectionLabel}>{jalaliDate(selected, true)}</NText>
            <View style={[styles.statusPill, { backgroundColor: selectedPlan.kind === 'closed' ? '#FAE8E9' : t.accentSoft }]}><NText weight="semi" style={{ fontSize: 10, color: selectedPlan.kind === 'closed' ? t.danger : t.accent }}>{status(selectedPlan)}</NText></View>
          </View>
          <View style={styles.summary}>
            <Ionicons name={selectedPlan.kind === 'closed' ? 'moon-outline' : 'time-outline'} color={selectedPlan.kind === 'closed' ? t.danger : t.accent} size={21}/>
            <View style={{ flex: 1 }}><NText weight="semi" style={{ color: t.text, textAlign: 'right', fontSize: 12 }}>{selectedPlan.ranges.length ? clock(selectedPlan.ranges) : 'برای این تاریخ ساعت کاری ثبت نشده است'}</NText><NText style={styles.muted}>{selectedPlan.exception ? 'برنامه اختصاصی این تاریخ، جایگزین شیفت هفتگی شده است.' : 'بر اساس برنامه هفتگی متخصص'}</NText></View>
          </View>
          <View style={styles.twoButtons}>
            <TouchableOpacity onPress={editException} style={styles.mainSmall}><Ionicons name="create-outline" size={17} color="#fff"/><NText weight="semi" style={styles.mainSmallText}>ویرایش این روز</NText></TouchableOpacity>
            <TouchableOpacity onPress={editWeekly} style={styles.subSmall}><Ionicons name="repeat-outline" size={17} color={t.accent}/><NText weight="semi" style={styles.subSmallText}>برنامه هفتگی</NText></TouchableOpacity>
          </View>
          {selectedPlan.exception && !editMode ? <TouchableOpacity accessibilityRole="button" onPress={removeException} style={styles.restore}><Ionicons name="arrow-undo-outline" size={15} color={t.accent}/><NText style={styles.restoreText}>بازگشت به برنامه معمول این روز</NText></TouchableOpacity> : null}
          {editor}
        </View>
        <NText style={styles.footer}>تغییر در تقویم روی زمان‌های قابل رزرو آینده اثر می‌گذارد؛ نوبت‌های قبلی باید جداگانه مدیریت شوند.</NText>
      </>}
    </ScrollView>
  </SafeAreaView>;
}

function Primary({ title, onPress, disabled, t }: { title: string; onPress: () => void; disabled?: boolean; t: any }) {
  return <TouchableOpacity accessibilityRole="button" disabled={disabled} onPress={onPress} style={{ backgroundColor: t.accent, borderRadius: 14, height: 48, justifyContent: 'center', alignItems: 'center', opacity: disabled ? .5 : 1 }}><NText weight="bold" style={{ color: '#fff', fontSize: 12 }}>{title}</NText></TouchableOpacity>;
}
function ActionText({ title, onPress, t, danger = false }: { title: string; onPress: () => void; t: any; danger?: boolean }) {
  return <TouchableOpacity onPress={onPress} accessibilityRole="button"><NText weight="semi" style={{ color: danger ? t.danger : t.accent, fontSize: 11 }}>{title}</NText></TouchableOpacity>;
}
function Legend({ label, color, t }: { label: string; color: string; t: any }) {
  return <View style={{ flexDirection: 'row-reverse', alignItems: 'center', gap: 5 }}><View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: color }}/><NText style={{ color: t.muted, fontSize: 9.7 }}>{label}</NText></View>;
}
function Statistic({ title, value, t }: { title: string; value: number; t: any }) {
  return <View style={{ flex: 1, alignItems: 'center', gap: 3 }}><NText weight="bold" style={{ color: t.text, fontSize: 16 }}>{faNum(value)}</NText><NText style={{ color: t.muted, fontSize: 10 }}>{title}</NText></View>;
}
const makeStyles = (t: any) => StyleSheet.create({
  root: { flex: 1, backgroundColor: t.bg }, container: { padding: 15, paddingBottom: 55, gap: 12 },
  card: { backgroundColor: t.card, borderWidth: 1, borderColor: t.line, borderRadius: 21, padding: 14, gap: 13 },
  rowBetween: { flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center', gap: 8 },
  staffRow: { flexDirection: 'row-reverse', gap: 7, paddingVertical: 2 },
  staffChip: { flexDirection: 'row-reverse', alignItems: 'center', gap: 6, borderWidth: 1, borderColor: t.line, borderRadius: 16, backgroundColor: t.bg, paddingHorizontal: 12, paddingVertical: 9 },
  staffChipOn: { borderColor: t.accent, backgroundColor: t.accent },
  sectionLabel: { fontSize: 13.5, color: t.text, textAlign: 'right' },
  muted: { fontSize: 10.3, lineHeight: 17, color: t.muted, textAlign: 'right' },
  monthTitle: { color: t.text, fontSize: 17, textAlign: 'right' },
  pager: { flexDirection: 'row-reverse', gap: 6 }, arrow: { width: 36, height: 36, borderWidth: 1, borderColor: t.line, backgroundColor: t.bg, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  today: { flexDirection: 'row-reverse', gap: 4, alignItems: 'center', paddingHorizontal: 10, height: 31, borderRadius: 11, backgroundColor: t.accentSoft }, todayText: { color: t.accent, fontSize: 11 },
  switch: { flexDirection: 'row-reverse', backgroundColor: t.bg, padding: 3, borderRadius: 12, gap: 3 },
  switchTab: { paddingHorizontal: 11, paddingVertical: 6, borderRadius: 9 }, switchOn: { backgroundColor: t.accent },
  switchText: { fontSize: 10.5, color: t.muted }, switchTextOn: { color: '#fff' },
  weekHeader: { flexDirection: 'row-reverse' }, weekLabel: { width: '14.2857%', fontSize: 10.5, color: t.muted, textAlign: 'center' },
  monthGrid: { flexDirection: 'row-reverse', flexWrap: 'wrap', marginTop: -3 }, gridSlot: { width: '14.2857%', alignItems: 'center', paddingVertical: 2 },
  dateCell: { width: 37, height: 47, borderRadius: 13, alignItems: 'center', justifyContent: 'center', gap: 4 }, dayOn: { backgroundColor: t.accent }, dayToday: { backgroundColor: t.accentSoft, borderWidth: 1, borderColor: t.accent },
  dayNum: { fontSize: 12.2, lineHeight: 18 }, dot: { width: 5, height: 5, borderRadius: 3 },
  legend: { flexDirection: 'row-reverse', justifyContent: 'space-around', gap: 8, flexWrap: 'wrap' },
  stats: { flexDirection: 'row-reverse', backgroundColor: t.bg, borderRadius: 14, paddingVertical: 10 },
  weekList: { gap: 7 }, weekCard: { flexDirection: 'row-reverse', alignItems: 'center', gap: 10, borderWidth: 1, borderColor: t.line, borderRadius: 13, paddingHorizontal: 10, paddingVertical: 8, backgroundColor: t.bg },
  weekDate: { width: 61, alignItems: 'center', borderLeftWidth: 1, borderColor: t.line, paddingLeft: 6 },
  statusPill: { paddingHorizontal: 9, paddingVertical: 6, borderRadius: 10 },
  summary: { flexDirection: 'row-reverse', gap: 10, backgroundColor: t.bg, borderRadius: 15, padding: 12, alignItems: 'center' },
  twoButtons: { flexDirection: 'row-reverse', gap: 8 }, mainSmall: { flex: 1, backgroundColor: t.accent, borderRadius: 12, height: 44, flexDirection: 'row-reverse', justifyContent: 'center', alignItems: 'center', gap: 5 },
  mainSmallText: { fontSize: 11, color: '#fff' }, subSmall: { flex: 1, height: 44, borderRadius: 12, borderWidth: 1, borderColor: t.line, flexDirection: 'row-reverse', justifyContent: 'center', alignItems: 'center', gap: 5 },
  subSmallText: { color: t.accent, fontSize: 11 }, restore: { flexDirection: 'row-reverse', gap: 5, alignItems: 'center', justifyContent: 'center', paddingVertical: 4 }, restoreText: { color: t.accent, fontSize: 10.5 },
  editor: { padding: 11, borderRadius: 16, backgroundColor: t.bg, borderWidth: 1, borderColor: t.line, gap: 12 }, editorTitle: { fontSize: 13, color: t.text, textAlign: 'right' },
  hint: { fontSize: 11, lineHeight: 21, color: t.muted, textAlign: 'right' }, shiftItem: { borderRadius: 12, borderWidth: 1, borderColor: t.line, padding: 10, gap: 7, backgroundColor: t.card },
  two: { flexDirection: 'row-reverse', gap: 9 }, field: { flex: 1 }, modeRow: { flexDirection: 'row-reverse', gap: 7 }, modePill: { flex: 1, flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'center', gap: 5, borderRadius: 12, borderWidth: 1, borderColor: t.line, minHeight: 45 },
  modePillOn: { borderColor: t.accent, backgroundColor: t.accent }, secondaryButton: { minHeight: 43, borderRadius: 12, borderWidth: 1, borderColor: t.line, flexDirection: 'row-reverse', justifyContent: 'center', alignItems: 'center', gap: 6, padding: 7 },
  secondaryLabel: { fontSize: 11, color: t.accent }, empty: { paddingVertical: 30, alignItems: 'center', gap: 12 }, footer: { color: t.muted, fontSize: 10.5, textAlign: 'right', lineHeight: 20, paddingHorizontal: 6 }
});
