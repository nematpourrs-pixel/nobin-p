import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { api } from '../src/api';
import { nobinAlert } from '../src/dialogs';
import { faNum, jalaliDate } from '../src/dateFa';
import { effectiveAudience, paletteFor } from '../src/prefs';
import { TimeInput } from '../src/TimeInput';
import { usePrefs } from '../src/usePrefs';
import { InternalHeader, NText } from '../src/ui';

type Range = {start:string;end:string};
type ViewMode = 'month'|'week';
type DayMode = 'weekly'|'off'|'special';
const weekdays = ['شنبه','یکشنبه','دوشنبه','سه‌شنبه','چهارشنبه','پنجشنبه','جمعه'];
const shortWeekdays = ['ش','ی','د','س','چ','پ','ج'];
const todayISO = localISO(new Date());

function localISO(d:Date) {
  return [d.getFullYear(),String(d.getMonth()+1).padStart(2,'0'),String(d.getDate()).padStart(2,'0')].join('-');
}
function toDate(iso:string) {const p=iso.split('-').map(Number);return new Date(p[0],p[1]-1,p[2],12);}
function shiftDate(iso:string,n:number) {const d=toDate(iso);d.setDate(d.getDate()+n);return localISO(d);}
function weekday(iso:string) {return (toDate(iso).getDay()+1)%7;}
function persianParts(iso:string) {
  const parts=new Intl.DateTimeFormat('en-US-u-ca-persian',{year:'numeric',month:'numeric',day:'numeric'}).formatToParts(toDate(iso));
  const get=(key:string)=>Number(parts.find(p=>p.type===key)?.value||0);
  return {year:get('year'),month:get('month'),day:get('day')};
}
function persianMonthStart(iso:string) {return shiftDate(iso,1-persianParts(iso).day);}
function rangeOfWeek(iso:string) {const first=shiftDate(iso,-weekday(iso));return Array.from({length:7},(_,i)=>shiftDate(first,i));}
function parseTime(value:any){return String(value||'').slice(0,5);}
function validateRanges(ranges:Range[]) {
  const sorted=[...ranges].sort((a,b)=>a.start.localeCompare(b.start));
  for(let i=0;i<sorted.length;i++){
    const a=sorted[i];
    if(!/^(?:[01][0-9]|2[0-3]):[0-5][0-9]$/.test(a.start)||!/^(?:[01][0-9]|2[0-3]):[0-5][0-9]$/.test(a.end)||a.start>=a.end)
      return 'زمان شروع و پایان شیفت را صحیح انتخاب کنید.';
    if(i>0&&a.start<sorted[i-1].end)return 'دو بازه کاری نباید با یکدیگر تداخل داشته باشند.';
  }
  return '';
}
function dayRanges(b:any,staffId:number,iso:string):Range[] {
  const shifts=(b?.shifts||[]) as any[];
  const day=toDate(iso).getDay(); // API stores Sunday=0 through Saturday=6.
  let rows=shifts.filter(x=>Number(x.weekday)===day&&Number(x.staff_id)===staffId&&Number(x.active)!==0);
  if(!rows.length)rows=shifts.filter(x=>Number(x.weekday)===day&&(x.staff_id===null||x.staff_id==='')&&Number(x.active)!==0);
  return rows.map(x=>({start:parseTime(x.start_time),end:parseTime(x.end_time)})).sort((a,b)=>a.start.localeCompare(b.start));
}
function exceptionFor(b:any,staffId:number,iso:string){
  return (b?.schedule_exceptions||[]).find((x:any)=>Number(x.staff_id)===staffId&&String(x.work_date||'').slice(0,10)===iso);
}
function dayInfo(b:any,staffId:number,iso:string){
  const ex=exceptionFor(b,staffId,iso);
  if(ex&&Number(ex.is_working)===0)return {kind:'off',text:'تعطیل / مرخصی',ranges:[] as Range[],exception:ex};
  if(ex)return {kind:'special',text:'ساعت ویژه',ranges:[{start:parseTime(ex.start_time),end:parseTime(ex.end_time)}],exception:ex};
  const ranges=dayRanges(b,staffId,iso);
  return {kind:ranges.length?'work':'empty',text:ranges.length?'روز کاری':'بدون شیفت',ranges,exception:null};
}
function workDuration(ranges:Range[]){
  return ranges.reduce((sum,r)=>{const mins=(v:string)=>Number(v.slice(0,2))*60+Number(v.slice(3,5));return sum+Math.max(0,mins(r.end)-mins(r.start));},0);
}
function isActiveStaff(x:any){return Number(x.active)!==0;}
function formatRanges(ranges:Range[]){return ranges.map(x=>x.start+' تا '+x.end).join('  ·  ');}
function DayPill({text,color,t}:any){return <View style={{backgroundColor:color+'16',paddingVertical:5,paddingHorizontal:10,borderRadius:12}}><NText weight="semi" style={{color,fontSize:10}}>{text}</NText></View>;}

export default function BusinessCalendar(){
  const p=useLocalSearchParams<{businessId:string;staffId?:string}>();
  const businessId=Number(p.businessId||0);
  const[prefs]=usePrefs();
  const t=paletteFor(effectiveAudience(prefs),prefs.appearance);
  const s=useMemo(()=>styles(t),[t]);
  const[b,setB]=useState<any>(null);
  const[staffId,setStaffId]=useState(Number(p.staffId||0));
  const[selected,setSelected]=useState(todayISO);
  const[view,setView]=useState<ViewMode>('month');
  const[loading,setLoading]=useState(true);
  const[busy,setBusy]=useState(false);
  const[dayEditor,setDayEditor]=useState(false);
  const[dayMode,setDayMode]=useState<DayMode>('weekly');
  const[specialStart,setSpecialStart]=useState('09:00');
  const[specialEnd,setSpecialEnd]=useState('18:00');
  const[weeklyEditor,setWeeklyEditor]=useState(false);
  const[weeklyDay,setWeeklyDay]=useState(6);
  const[weeklyRanges,setWeeklyRanges]=useState<Range[]>([]);

  const reload=useCallback(async()=>{
    const j=await api('/v1/me/businesses/'+businessId);
    setB(j.business);
    setStaffId(old=>{
      const rows=(j.business?.staff||[]).filter(isActiveStaff);
      return rows.some((x:any)=>Number(x.id)===old)?old:Number(rows[0]?.id||0);
    });
  },[businessId]);
  useFocusEffect(useCallback(()=>{
    let active=true;
    setLoading(true);
    void api('/v1/me/businesses/'+businessId).then(j=>{
      if(!active)return;
      setB(j.business);
      setStaffId(old=>{
        const rows=(j.business?.staff||[]).filter(isActiveStaff);
        return rows.some((x:any)=>Number(x.id)===old)?old:Number(rows[0]?.id||0);
      });
    }).catch((e:any)=>{if(active)nobinAlert('دریافت تقویم انجام نشد',e.message);})
      .finally(()=>{if(active)setLoading(false);});
    return ()=>{active=false;};
  },[businessId]));

  const staff=(b?.staff||[]).filter(isActiveStaff);
  const person=staff.find((x:any)=>Number(x.id)===staffId);
  const info=useMemo(()=>dayInfo(b,staffId,selected),[b,staffId,selected]);
  const monthStart=persianMonthStart(selected);
  const persianMonth=persianParts(selected);
  const monthCells=useMemo(()=>{
    const offset=weekday(monthStart);
    const first=shiftDate(monthStart,-offset);
    let count=0;
    while(count<32) {
      const parts=persianParts(shiftDate(monthStart,count));
      if(parts.year!==persianMonth.year||parts.month!==persianMonth.month)break;
      count++;
    }
    const total=offset+count<=35?35:42;
    return Array.from({length:total},(_,i)=>shiftDate(first,i));
  },[monthStart,persianMonth.month,persianMonth.year]);
  const weekCells=useMemo(()=>rangeOfWeek(selected),[selected]);
  const visibleDays=view==='month'?monthCells:weekCells;
  const summary=useMemo(()=>{
    let work=0,special=0,off=0,hours=0;
    for(const iso of visibleDays){
      if(view==='month'&&persianParts(iso).month!==persianMonth.month)continue;
      const d=dayInfo(b,staffId,iso);
      if(d.kind==='off')off++;
      if(d.kind==='special')special++;
      if(d.ranges.length){work++;hours+=workDuration(d.ranges);}
    }
    return {work,special,off,hours};
  },[b,staffId,visibleDays,view,persianMonth.month]);

  const selectDate=(iso:string)=>{setSelected(iso);setDayEditor(false);setWeeklyEditor(false);};
  const changeStaff=(id:number)=>{if(busy)return;setStaffId(id);setDayEditor(false);setWeeklyEditor(false);};
  const navigate=(delta:number)=>{
    if(busy)return;
    if(view==='week'){selectDate(shiftDate(selected,7*delta));return;}
    const start=persianMonthStart(selected);
    const candidate=delta<0?shiftDate(start,-1):shiftDate(start,35);
    selectDate(persianMonthStart(candidate));
  };
  const editDay=()=>{
    const ex=info.exception;
    setDayMode(!ex?'weekly':Number(ex.is_working)===0?'off':'special');
    setSpecialStart(ex&&Number(ex.is_working)!==0?parseTime(ex.start_time):info.ranges[0]?.start||'09:00');
    setSpecialEnd(ex&&Number(ex.is_working)!==0?parseTime(ex.end_time):info.ranges[0]?.end||'18:00');
    setWeeklyEditor(false);
    setDayEditor(true);
  };
  const openWeekly=(iso:string)=>{
    const d=toDate(iso).getDay();
    const rs=(b?.shifts||[]).filter((x:any)=>Number(x.weekday)===d&&Number(x.staff_id)===staffId&&Number(x.active)!==0);
    setWeeklyDay(d);
    setWeeklyRanges(rs.map((x:any)=>({start:parseTime(x.start_time),end:parseTime(x.end_time)})).sort((a:Range,b:Range)=>a.start.localeCompare(b.start)));
    setDayEditor(false);
    setWeeklyEditor(true);
  };
  const saveDay=async()=>{
    if(!staffId||busy)return;
    if(selected<todayISO)return nobinAlert('تاریخ گذشته','ویرایش برنامه کاری فقط برای امروز و تاریخ‌های آینده انجام می‌شود.');
    if(dayMode==='special'){
      const issue=validateRanges([{start:specialStart,end:specialEnd}]);
      if(issue)return nobinAlert('ساعت نامعتبر',issue);
    }
    const existing=exceptionFor(b,staffId,selected);
    setBusy(true);
    try{
      if(dayMode==='weekly'){
        if(existing)await api('/v1/businesses/'+businessId+'/schedule-exceptions/'+existing.id,{method:'DELETE'});
      }else{
        await api('/v1/businesses/'+businessId+'/schedule-exceptions',{
          method:'POST',
          body:JSON.stringify({staff_id:staffId,date:selected,is_working:dayMode==='special',start_time:specialStart,end_time:specialEnd,note:dayMode==='off'?'مرخصی / تعطیلی':'ساعت کاری ویژه'})
        });
      }
      await reload();setDayEditor(false);
      nobinAlert('تقویم به‌روزرسانی شد','برنامه روز '+jalaliDate(selected)+' ذخیره شد.');
    }catch(e:any){nobinAlert('ذخیره انجام نشد',e.message);}
    finally{setBusy(false);}
  };
  const saveWeekly=async()=>{
    if(!staffId||busy)return;
    const issue=validateRanges(weeklyRanges);
    if(issue)return nobinAlert('تداخل شیفت‌ها',issue);
    setBusy(true);
    try{
      await api('/v1/businesses/'+businessId+'/staff/'+staffId+'/shifts/'+weeklyDay,{
        method:'PUT',
        body:JSON.stringify({ranges:weeklyRanges.map(x=>({start_time:x.start,end_time:x.end}))})
      });
      await reload();setWeeklyEditor(false);
      nobinAlert('الگوی هفتگی ذخیره شد','شیفت‌های '+weekdays[(weeklyDay+1)%7]+' برای این متخصص به‌روزرسانی شد.');
    }catch(e:any){nobinAlert('ذخیره انجام نشد',e.message);}
    finally{setBusy(false);}
  };
  const updateRange=(i:number,key:'start'|'end',value:string)=>setWeeklyRanges(v=>v.map((x,k)=>i===k?{...x,[key]:value}:x));
  const colorOf=(kind:string)=>kind==='off'?t.danger:kind==='special'?t.warning:kind==='work'?t.success:t.muted;
  const isToday=(iso:string)=>iso===todayISO;

  return <SafeAreaView edges={['bottom']} style={s.root}><ScrollView contentContainerStyle={s.wrap} keyboardShouldPersistTaps="always" showsVerticalScrollIndicator={false}>
    <InternalHeader t={t} title="تقویم کاری" sub="نمای ماه و هفته، ساعات حضور و مرخصی متخصصان"/>
    {loading?<View style={s.load}><ActivityIndicator color={t.accent}/><NText style={s.muted}>در حال دریافت برنامه کاری…</NText></View>:null}
    {!loading&&!staff.length?<View style={s.blank}><Ionicons name="people-outline" size={31} color={t.accent}/><NText weight="semi" style={s.title}>ابتدا متخصص تعریف کنید</NText><NText style={s.muted}>تقویم کاری به هر متخصص مرتبط است. برای شروع در بخش «کارکنان» یک متخصص ثبت کنید.</NText></View>:null}
    {staff.length>0?<><ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.staffRow}>
      {staff.map((x:any)=><TouchableOpacity key={x.id} accessibilityRole="button" accessibilityState={{selected:staffId===Number(x.id)}} onPress={()=>changeStaff(Number(x.id))} activeOpacity={.78} style={[s.staffChip,staffId===Number(x.id)&&s.staffChipOn]}>
        <View style={[s.avatar,staffId===Number(x.id)&&s.avatarOn]}><Ionicons name="person-outline" size={16} color={staffId===Number(x.id)?'#fff':t.accent}/></View>
        <NText weight={staffId===Number(x.id)?'bold':'medium'} style={[s.staffText,staffId===Number(x.id)&&s.staffTextOn]}>{x.name}</NText>
      </TouchableOpacity>)}
    </ScrollView>
    <View style={s.calendarCard}>
      <View style={s.monthHeader}>
        <TouchableOpacity accessibilityLabel="دوره بعد" onPress={()=>navigate(1)} style={s.arrow}><Ionicons name="chevron-forward" size={21} color={t.text}/></TouchableOpacity>
        <View style={{flex:1,alignItems:'center',gap:2}}>
          <NText weight="bold" style={s.monthTitle}>{new Intl.DateTimeFormat('fa-IR-u-ca-persian',{month:'long',year:'numeric'}).format(toDate(selected))}</NText>
          <NText style={s.monthSub}>{view==='month'?'نمای ماهانه':jalaliDate(weekCells[0])+' تا '+jalaliDate(weekCells[6])}</NText>
        </View>
        <TouchableOpacity accessibilityLabel="دوره قبل" onPress={()=>navigate(-1)} style={s.arrow}><Ionicons name="chevron-back" size={21} color={t.text}/></TouchableOpacity>
      </View>
      <View style={s.toolbar}>
        <View style={s.switcher}>
          {(['month','week'] as const).map(x=><TouchableOpacity key={x} onPress={()=>{setView(x);setDayEditor(false);setWeeklyEditor(false);}} style={[s.switchBtn,view===x&&s.switchOn]}>
            <NText weight="semi" style={{fontSize:11,color:view===x?'#fff':t.muted}}>{x==='month'?'ماهانه':'هفتگی'}</NText>
          </TouchableOpacity>)}
        </View>
        <TouchableOpacity onPress={()=>selectDate(todayISO)} style={s.todayBtn}><Ionicons name="locate-outline" size={16} color={t.accent}/><NText weight="semi" style={s.todayText}>امروز</NText></TouchableOpacity>
      </View>
      <View style={s.weekHeader}>{shortWeekdays.map((x,i)=><NText key={i} style={[s.weekday,i===6&&{color:t.danger}]}>{x}</NText>)}</View>
      <View style={s.monthGrid}>{visibleDays.map(iso=>{
        const pDate=persianParts(iso);const infoDay=dayInfo(b,staffId,iso);
        const active=iso===selected;const other=view==='month'&&pDate.month!==persianMonth.month;
        const c=colorOf(infoDay.kind);
        return <TouchableOpacity key={iso} accessible accessibilityLabel={jalaliDate(iso)+', '+infoDay.text} accessibilityRole="button" accessibilityState={{selected:active}} onPress={()=>selectDate(iso)} activeOpacity={.7} style={[s.dateCell,active&&s.cellOn,isToday(iso)&&!active&&s.cellToday]}>
          <NText weight={active?'bold':'medium'} style={[s.dateText,other&&s.dateDim,active&&s.dateActive]}>{faNum(pDate.day)}</NText>
          <View style={[s.indicator,{backgroundColor:active?'#fff':c},other&&{opacity:.35}]} />
        </TouchableOpacity>;
      })}</View>
      <View style={s.legend}>
        <LegendDot color={t.success} label="کاری" t={t}/><LegendDot color={t.warning} label="ساعت ویژه" t={t}/><LegendDot color={t.danger} label="تعطیل" t={t}/><LegendDot color={t.muted} label="بدون شیفت" t={t}/>
      </View>
    </View>
    <View style={s.metrics}>
      <Metric label="روزهای کاری" value={faNum(summary.work)} icon="calendar-outline" color={t.success} t={t}/>
      <Metric label="ساعت حضور" value={faNum(Math.round(summary.hours/60))} icon="time-outline" color={t.accent} t={t}/>
      <Metric label="استثناها" value={faNum(summary.off+summary.special)} icon="options-outline" color={t.warning} t={t}/>
    </View>
    <View style={s.details}>
      <View style={s.detailHead}><View style={{flex:1,gap:6}}>
        <NText weight="bold" style={s.selectedTitle}>{jalaliDate(selected,true)}</NText>
        <NText style={s.muted}>{person?.name||'متخصص'}</NText>
      </View><DayPill text={info.text} color={colorOf(info.kind)} t={t}/></View>
      {info.ranges.length?<View style={s.rangeList}>{info.ranges.map((r,i)=><View key={i} style={s.rangeItem}><Ionicons name="time-outline" size={18} color={t.accent}/><NText weight="semi" style={s.rangeText}>{r.start} تا {r.end}</NText><NText style={s.rangeDuration}>{faNum(workDuration([r])/60)} ساعت</NText></View>)}</View>:<View style={s.emptyDay}><Ionicons name={info.kind==='off'?'moon-outline':'calendar-clear-outline'} size={20} color={t.muted}/><NText style={s.muted}>{info.kind==='off'?'برای این روز مرخصی یا تعطیلی ثبت شده است.':'برای این روز ساعت کاری تعریف نشده است.'}</NText></View>}
      <View style={s.detailActions}>
        <TouchableOpacity onPress={editDay} disabled={busy} style={s.primaryBtn}><Ionicons name="create-outline" size={18} color="#fff"/><NText weight="semi" style={s.primaryText}>ویرایش این روز</NText></TouchableOpacity>
        <TouchableOpacity onPress={()=>openWeekly(selected)} disabled={busy} style={s.secondaryBtn}><Ionicons name="repeat-outline" size={18} color={t.accent}/><NText weight="semi" style={s.secondaryText}>الگوی هفتگی</NText></TouchableOpacity>
      </View>
    </View>
    {dayEditor?<View style={s.editor}>
      <View style={s.editorHead}><NText weight="bold" style={s.editorTitle}>ویرایش برنامه روزانه</NText><TouchableOpacity accessibilityLabel="بستن ویرایش" onPress={()=>setDayEditor(false)}><Ionicons name="close-circle-outline" size={24} color={t.muted}/></TouchableOpacity></View>
      <View style={s.modeRow}>{([
        ['weekly','طبق الگوی هفتگی','calendar-outline'],
        ['special','ساعت ویژه','time-outline'],
        ['off','مرخصی / تعطیل','moon-outline']
      ] as const).map(([mode,label,icon])=><TouchableOpacity key={mode} onPress={()=>setDayMode(mode)} style={[s.mode,s.modeBase,dayMode===mode&&s.modeSelected]}><Ionicons name={icon} size={19} color={dayMode===mode?t.accent:t.muted}/><NText weight="semi" style={[s.modeText,dayMode===mode&&{color:t.accent}]}>{label}</NText></TouchableOpacity>)}</View>
      {dayMode==='special'?<View style={s.timeRow}><View style={{flex:1}}><TimeInput label="ساعت شروع" value={specialStart} onChange={setSpecialStart} t={t}/></View><View style={{flex:1}}><TimeInput label="ساعت پایان" value={specialEnd} onChange={setSpecialEnd} t={t}/></View></View>:null}
      <NText style={s.hint}>{dayMode==='weekly'?'استثنای این روز پاک می‌شود و ساعات الگوی هفتگی اعمال خواهد شد.':dayMode==='off'?'این روز برای نوبت‌های جدید بسته می‌شود.':'ساعات ویژه جایگزین الگوی هفتگی این تاریخ می‌شود.'}</NText>
      <TouchableOpacity disabled={busy} onPress={saveDay} style={[s.save, busy&&s.disabled]}><Ionicons name="checkmark-circle-outline" size={19} color="#fff"/><NText weight="bold" style={s.saveText}>{busy?'در حال ذخیره…':'ذخیره تغییرات روز'}</NText></TouchableOpacity>
    </View>:null}
    {weeklyEditor?<View style={s.editor}>
      <View style={s.editorHead}><NText weight="bold" style={s.editorTitle}>مدیریت شیفت‌های تکرارشونده</NText><TouchableOpacity accessibilityLabel="بستن شیفت‌ها" onPress={()=>setWeeklyEditor(false)}><Ionicons name="close-circle-outline" size={24} color={t.muted}/></TouchableOpacity></View>
      <View style={s.weekChips}>{weekdays.map((x,i)=>{const d=(i+6)%7;return <TouchableOpacity key={d} accessibilityRole="button" accessibilityState={{selected:weeklyDay===d}} onPress={()=>openWeekly(shiftDate(selected,i-weekday(selected)))} style={[s.dayChip,weeklyDay===d&&s.dayChipOn]}><NText style={{fontSize:10,color:weeklyDay===d?'#fff':t.text}}>{x}</NText></TouchableOpacity>;})}</View>
      {weeklyRanges.map((r,i)=><View style={s.shiftEditor} key={i}><View style={s.timeRow}><View style={{flex:1}}><TimeInput label={'شروع شیفت '+faNum(i+1)} value={r.start} onChange={v=>updateRange(i,'start',v)} t={t}/></View><View style={{flex:1}}><TimeInput label={'پایان شیفت '+faNum(i+1)} value={r.end} onChange={v=>updateRange(i,'end',v)} t={t}/></View></View><TouchableOpacity onPress={()=>setWeeklyRanges(v=>v.filter((_,j)=>j!==i))} style={s.remove}><Ionicons name="trash-outline" size={16} color={t.danger}/><NText style={{color:t.danger,fontSize:11}}>حذف بازه</NText></TouchableOpacity></View>)}
      {!weeklyRanges.length?<NText style={s.hint}>این روز شیفت اختصاصی ندارد؛ برای تعریف ساعت جدید دکمه زیر را بزنید. ذخیره بدون بازه، شیفت‌های این روز را حذف می‌کند.</NText>:null}
      <TouchableOpacity onPress={()=>setWeeklyRanges(v=>[...v,{start:'09:00',end:'18:00'}])} style={s.addBtn}><Ionicons name="add-circle-outline" size={19} color={t.accent}/><NText weight="semi" style={s.secondaryText}>افزودن بازه کاری</NText></TouchableOpacity>
      <NText style={s.hint}>ویرایش الگوی هفتگی روی تمام هفته‌های بعدی اثر می‌گذارد. استثناهای روزانه ثبت‌شده همچنان اولویت دارند.</NText>
      <TouchableOpacity disabled={busy} onPress={saveWeekly} style={[s.save,busy&&s.disabled]}><Ionicons name="save-outline" size={19} color="#fff"/><NText weight="bold" style={s.saveText}>{busy?'در حال ذخیره…':'ذخیره الگوی هفتگی'}</NText></TouchableOpacity>
    </View>:null}
    <View style={s.notice}><Ionicons name="information-circle-outline" size={20} color={t.accent}/><NText style={s.noticeText}>تغییر ساعات کاری فقط بر زمان‌های قابل رزرو آینده اثر می‌گذارد. قبل از ثبت مرخصی یا تغییر شیفت، نوبت‌های تأییدشده همان روز را بررسی کنید؛ این صفحه هنوز فهرست رزروها را نمایش نمی‌دهد.</NText></View>
    </>:null}
  </ScrollView></SafeAreaView>;
}
function LegendDot({color,label,t}:any){return <View style={{flexDirection:'row-reverse',gap:4,alignItems:'center'}}><View style={{width:7,height:7,borderRadius:4,backgroundColor:color}}/><NText style={{fontSize:9,color:t.muted}}>{label}</NText></View>}
function Metric({label,value,icon,color,t}:any){return <View style={{flex:1,backgroundColor:t.card,borderWidth:1,borderColor:t.line,borderRadius:16,paddingVertical:11,paddingHorizontal:8,alignItems:'center',gap:4}}><Ionicons name={icon} size={20} color={color}/><NText weight="bold" style={{color:t.text,fontSize:16}}>{value}</NText><NText style={{fontSize:9.5,color:t.muted}}>{label}</NText></View>}
const styles=(t:any)=>StyleSheet.create({
  root:{flex:1,backgroundColor:t.bg},wrap:{padding:16,paddingBottom:70,gap:12},
  load:{padding:32,alignItems:'center',gap:14},blank:{backgroundColor:t.card,borderColor:t.line,borderWidth:1,borderRadius:20,padding:28,gap:12,alignItems:'center'},
  muted:{fontSize:11,color:t.muted,lineHeight:20,textAlign:'right'},title:{fontSize:15,color:t.text},
  staffRow:{flexDirection:'row-reverse',gap:8,paddingVertical:3},
  staffChip:{height:46,flexDirection:'row-reverse',alignItems:'center',gap:8,borderWidth:1,borderColor:t.line,backgroundColor:t.card,borderRadius:15,paddingHorizontal:10},
  staffChipOn:{borderColor:t.accent,backgroundColor:t.accentSoft},avatar:{width:29,height:29,borderRadius:11,alignItems:'center',justifyContent:'center',backgroundColor:t.accentSoft},avatarOn:{backgroundColor:t.accent},
  staffText:{fontSize:11,color:t.text},staffTextOn:{color:t.accent},
  calendarCard:{backgroundColor:t.card,borderWidth:1,borderColor:t.line,borderRadius:23,paddingHorizontal:10,paddingVertical:16,gap:13,shadowColor:'#000',shadowOpacity:.04,shadowRadius:12,elevation:1},
  monthHeader:{flexDirection:'row-reverse',justifyContent:'space-between',alignItems:'center',gap:6,paddingHorizontal:4},
  monthTitle:{fontSize:19,color:t.text,textAlign:'center'},monthSub:{fontSize:9,color:t.muted,textAlign:'center',maxWidth:250},
  arrow:{width:42,height:42,borderRadius:14,backgroundColor:t.bg,borderColor:t.line,borderWidth:1,alignItems:'center',justifyContent:'center'},
  toolbar:{flexDirection:'row-reverse',justifyContent:'space-between',alignItems:'center',paddingHorizontal:6},
  switcher:{backgroundColor:t.bg,borderWidth:1,borderColor:t.line,borderRadius:14,padding:3,flexDirection:'row-reverse',gap:3},switchBtn:{minWidth:66,height:34,alignItems:'center',justifyContent:'center',borderRadius:11},switchOn:{backgroundColor:t.accent},
  todayBtn:{flexDirection:'row-reverse',alignItems:'center',gap:5,paddingHorizontal:9,height:36},todayText:{fontSize:10.5,color:t.accent},
  weekHeader:{flexDirection:'row-reverse'},weekday:{width:'14.285%',textAlign:'center',fontSize:12,color:t.muted},
  monthGrid:{flexDirection:'row-reverse',flexWrap:'wrap',rowGap:4},
  dateCell:{width:'14.285%',height:51,borderRadius:13,alignItems:'center',justifyContent:'center',gap:5},
  cellOn:{backgroundColor:t.accent},cellToday:{borderColor:t.accent,borderWidth:1},
  dateText:{fontSize:14,color:t.text},dateActive:{color:'#fff'},dateDim:{opacity:.32},indicator:{width:6,height:6,borderRadius:3},
  legend:{flexDirection:'row-reverse',justifyContent:'space-around',flexWrap:'wrap',gap:9,paddingTop:7,borderTopWidth:StyleSheet.hairlineWidth,borderTopColor:t.line},
  metrics:{flexDirection:'row-reverse',gap:8},
  details:{backgroundColor:t.card,borderWidth:1,borderColor:t.line,borderRadius:20,padding:15,gap:12},
  detailHead:{flexDirection:'row-reverse',gap:8,alignItems:'flex-start'},selectedTitle:{color:t.text,fontSize:16,textAlign:'right',lineHeight:26},
  rangeList:{gap:8},rangeItem:{backgroundColor:t.bg,borderRadius:14,padding:12,flexDirection:'row-reverse',alignItems:'center',gap:9},rangeText:{fontSize:13,color:t.text,flex:1,textAlign:'right'},rangeDuration:{fontSize:10,color:t.muted},
  emptyDay:{backgroundColor:t.bg,padding:15,borderRadius:14,flexDirection:'row-reverse',gap:8,alignItems:'center'},
  detailActions:{flexDirection:'row-reverse',gap:8},primaryBtn:{flex:1,height:47,borderRadius:13,backgroundColor:t.accent,flexDirection:'row-reverse',alignItems:'center',justifyContent:'center',gap:6},primaryText:{fontSize:11,color:'#fff'},secondaryBtn:{flex:1,height:47,borderRadius:13,backgroundColor:t.accentSoft,flexDirection:'row-reverse',alignItems:'center',justifyContent:'center',gap:6},secondaryText:{fontSize:11,color:t.accent},
  editor:{backgroundColor:t.card,borderRadius:20,borderColor:t.line,borderWidth:1,padding:14,gap:13},editorHead:{flexDirection:'row-reverse',alignItems:'center',justifyContent:'space-between'},editorTitle:{fontSize:15,color:t.text},
  modeRow:{flexDirection:'row-reverse',gap:7},mode:{flex:1,minHeight:72,paddingHorizontal:4,alignItems:'center',justifyContent:'center',gap:6},modeBase:{borderRadius:14,borderWidth:1,borderColor:t.line,backgroundColor:t.bg},modeSelected:{borderColor:t.accent,backgroundColor:t.accentSoft},modeText:{fontSize:10,color:t.muted,textAlign:'center'},
  timeRow:{flexDirection:'row-reverse',gap:10},hint:{fontSize:10.5,lineHeight:19,color:t.muted,textAlign:'right'},
  save:{minHeight:49,borderRadius:14,backgroundColor:t.accent,flexDirection:'row-reverse',alignItems:'center',justifyContent:'center',gap:7},saveText:{fontSize:12,color:'#fff'},disabled:{opacity:.55},
  weekChips:{flexDirection:'row-reverse',flexWrap:'wrap',gap:6},dayChip:{paddingHorizontal:9,paddingVertical:9,borderRadius:11,backgroundColor:t.bg,borderColor:t.line,borderWidth:1},dayChipOn:{backgroundColor:t.accent,borderColor:t.accent},
  shiftEditor:{padding:10,borderRadius:14,backgroundColor:t.bg,gap:8},remove:{flexDirection:'row-reverse',alignItems:'center',gap:6,alignSelf:'flex-end',padding:5},addBtn:{minHeight:46,borderColor:t.accent,borderWidth:1,borderStyle:'dashed',borderRadius:13,flexDirection:'row-reverse',justifyContent:'center',alignItems:'center',gap:7},
  notice:{borderRadius:15,backgroundColor:t.accentSoft,padding:13,flexDirection:'row-reverse',gap:8,alignItems:'flex-start'},noticeText:{flex:1,fontSize:10.5,lineHeight:19,color:t.text,textAlign:'right'}
});
