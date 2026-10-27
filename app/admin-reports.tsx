import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, RefreshControl, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { api } from '../src/api';
import { faDigits, jalaliShort } from '../src/dateFa';
import { nobinAlert } from '../src/dialogs';
import { effectiveAudience, paletteFor } from '../src/prefs';
import { usePrefs } from '../src/usePrefs';
import { InternalHeader, NText } from '../src/ui';

type Trend = { date:string; installs:number; users:number; bookings:number; paid_amount:number };
type Report = { metrics:Record<string,number>;trend:Trend[];business_status:any[];booking_status:any[];booking_source:any[];top_businesses:any[];recent_actions:any[];note:string };
type SeriesKey = 'installs'|'users'|'bookings'|'paid_amount';
const num=(v:any)=>faDigits(Number(v||0).toLocaleString('en-US'));
const dateFa=(d:string)=>{try{return jalaliShort(new Date(d+'T12:00:00'));}catch{return d;}};
const display:Record<string,string>={PENDING:'در انتظار',APPROVED:'تأییدشده',REJECTED:'ردشده',SUSPENDED:'تعلیق',DRAFT:'پیش‌نویس',COMPLETED:'تکمیل‌شده',CANCELLED:'لغوشده',CONFIRMED:'تأیید شده',APP:'اپلیکیشن',WEB:'وب',BALE:'بله',business_status:'تغییر وضعیت کسب‌وکار',feature_flag_update:'تغییر تنظیمات'};
const keys:{title:string;field:string;icon:string;note?:string}[]=[
{title:'نصب‌های ثبت‌شده',field:'installations_total',icon:'phone-portrait-outline',note:'از زمان فعال‌سازی ثبت نصب'},
{title:'نصب‌های جدید',field:'installations_new',icon:'download-outline'},
{title:'فعال در ۷ روز',field:'installations_active_7d',icon:'pulse-outline'},
{title:'فعال در ۳۰ روز',field:'installations_active_30d',icon:'analytics-outline'},
{title:'همه کاربران',field:'users_total',icon:'people-outline'},
{title:'کاربران جدید',field:'new_users',icon:'person-add-outline'},
{title:'کسب‌وکارها',field:'businesses_total',icon:'storefront-outline'},
{title:'منتظر تأیید',field:'pending_businesses',icon:'hourglass-outline'},
{title:'رزروهای دوره',field:'bookings_period',icon:'calendar-outline'},
{title:'رزرو تکمیل‌شده',field:'bookings_completed',icon:'checkmark-circle-outline'},
{title:'رزرو لغوشده',field:'bookings_cancelled',icon:'close-circle-outline'},
{title:'تعداد پرداخت موفق',field:'payments_paid_count',icon:'card-outline'},
{title:'مبلغ پرداخت موفق',field:'payments_paid_amount',icon:'cash-outline',note:'واحد پول پایگاه داده'},
{title:'تعداد استرداد',field:'refunds_count',icon:'return-down-back-outline'},
{title:'نظرات در انتظار',field:'reviews_pending',icon:'chatbubble-outline'},
{title:'پشتیبانی باز',field:'support_open',icon:'headset-outline'}
];
export default function AdminReports(){
 const[prefs]=usePrefs();const t=paletteFor(effectiveAudience(prefs),prefs.appearance);const s=useMemo(()=>styles(t),[t]);
 const[days,setDays]=useState<7|30|90>(30);const[report,setReport]=useState<Report|null>(null);
 const[busy,setBusy]=useState(false);const[series,setSeries]=useState<SeriesKey>('bookings');
 const load=useCallback(async()=>{setBusy(true);try{const d=await api('/v1/app-admin/reports?days='+days);if(!d?.metrics||!Array.isArray(d.trend))throw Error('گزارش معتبر از سرور دریافت نشد.');setReport(d);}catch(e:any){nobinAlert('گزارش دریافت نشد',e.message||'بک‌اند ۱.۹.۴ را بررسی کنید.');}finally{setBusy(false)}},[days]);
 useFocusEffect(useCallback(()=>{void load();},[load]));
 const metrics=report?.metrics||{};
 const bins=(report?.trend||[]).reduce((acc:{value:number;date:string}[],row,i,list)=>{const length=Math.ceil(list.length/(days===7?7:days===30?10:15));const j=Math.floor(i/length);if(!acc[j])acc[j]={date:row.date,value:0};acc[j].value+=Number(row[series]||0);return acc;},[]);
 const max=Math.max(1,...bins.map(x=>x.value));
 const sections=[{title:'وضعیت کسب‌وکارها',values:report?.business_status||[],field:'status'},{title:'وضعیت رزروها',values:report?.booking_status||[],field:'status'},{title:'منبع رزرو',values:report?.booking_source||[],field:'source'}];
 return <SafeAreaView edges={['bottom']} style={s.root}><ScrollView contentContainerStyle={s.container} refreshControl={<RefreshControl refreshing={busy} onRefresh={load}/>}>
  <InternalHeader t={t} title="گزارش جامع سامانه" sub="آمار نصب، کسب‌وکارها، کاربران، رزروها و امور مالی" hideSupport/>
  <View style={s.tabs}>{([7,30,90] as const).map(n=><TouchableOpacity key={n} onPress={()=>setDays(n)} style={[s.tab,n===days&&{backgroundColor:t.accent}]}><NText style={{fontSize:11.5,color:n===days?'#fff':t.text}}>{num(n)} روز</NText></TouchableOpacity>)}</View>
  {!report&&busy?<ActivityIndicator size="large" color={t.accent}/>:!report?<NText style={s.muted}>داده‌ای دریافت نشده است. نسخه بک‌اند ۱.۹.۴ لازم است.</NText>:<>
  <View style={s.grid}>{keys.map(k=><View key={k.field} style={s.stat}><View style={s.statHeading}><Ionicons name={k.icon as any} size={18} color={t.accent}/><NText style={s.muted}>{k.title}</NText></View><NText weight="bold" style={s.value}>{num(metrics[k.field])}</NText>{k.note?<NText style={s.note}>{k.note}</NText>:null}</View>)}</View>
  <View style={s.panel}><NText weight="bold" style={s.heading}>نمودار روند دوره‌ای</NText><View style={s.picker}>{([{key:'bookings',title:'رزرو'},{key:'users',title:'ثبت‌نام'},{key:'installs',title:'نصب'},{key:'paid_amount',title:'پرداخت'}] as const).map(x=><TouchableOpacity key={x.key} onPress={()=>setSeries(x.key)} style={[s.chip,series===x.key&&{backgroundColor:t.accent}]}><NText style={{fontSize:10.5,color:series===x.key?'#fff':t.text}}>{x.title}</NText></TouchableOpacity>)}</View><View style={s.graph}>{bins.map((b,i)=><View key={i} style={s.slot}><NText style={{fontSize:8,color:t.muted}}>{b.value?num(b.value):' '}</NText><View style={{height:Math.max(3,95*b.value/max),width:'78%',maxWidth:23,backgroundColor:t.accent,borderTopLeftRadius:5,borderTopRightRadius:5}}/></View>)}</View><View style={s.between}><NText style={s.muted}>{dateFa(report.trend[0]?.date||'')}</NText><NText style={s.muted}>{dateFa(report.trend[report.trend.length-1]?.date||'')}</NText></View></View>
  <TouchableOpacity onPress={()=>router.push('/admin-businesses')} style={[s.panel,{backgroundColor:t.accentSoft,flexDirection:'row-reverse',alignItems:'center'}]}><View style={{flex:1}}><NText weight="bold" style={s.heading}>درخواست‌های کسب‌وکار</NText><NText style={s.muted}>ورود به تأیید، رد و ویرایش درخواست‌ها</NText></View><NText weight="bold" style={[s.value,{color:t.accent}]}>{num(metrics.pending_businesses)}</NText><Ionicons name="chevron-back" size={17} color={t.accent}/></TouchableOpacity>
  {sections.map(section=><View style={s.panel} key={section.title}><NText weight="bold" style={s.heading}>{section.title}</NText>{section.values.length?section.values.map((v:any,i:number)=>{const q=Number(v.count||0);const mx=Math.max(1,...section.values.map((x:any)=>Number(x.count||0)));return <View key={i} style={{gap:5}}><View style={s.between}><NText style={s.muted}>{display[v[section.field]]||v[section.field]||'نامشخص'}</NText><NText style={[s.muted,{color:t.text}]}>{num(q)}</NText></View><View style={{height:7,borderRadius:4,backgroundColor:t.bg,overflow:'hidden'}}><View style={{height:7,width:((q/mx*100)+'%') as `${number}%`,backgroundColor:t.accent,borderRadius:4}}/></View></View>}):<NText style={s.muted}>داده‌ای موجود نیست.</NText>}</View>)}
  <View style={s.panel}><NText weight="bold" style={s.heading}>کسب‌وکارهای پرتراکنش</NText>{report.top_businesses.length?report.top_businesses.map((b:any,i:number)=><View style={s.listItem} key={i}><NText style={[s.muted,{color:t.text,flex:1}]}>{num(i+1)}. {b.name} · {b.city||'—'}</NText><NText style={{color:t.accent,fontSize:11}}>{num(b.bookings)} رزرو</NText></View>):<NText style={s.muted}>موردی ثبت نشده است.</NText>}</View>
  <View style={s.panel}><NText weight="bold" style={s.heading}>تاریخچه اقدامات مدیریت</NText>{report.recent_actions.length?report.recent_actions.map((x:any,i:number)=><View style={s.listItem} key={i}><View style={{flex:1}}><NText style={[s.muted,{color:t.text}]}>{display[x.action]||x.action} · {x.actor_name||'سیستم'}</NText><NText style={s.note}>{x.entity_type||''} / {x.entity_id||''}</NText></View><NText style={s.note}>{faDigits(String(x.created_at||''))}</NText></View>):<NText style={s.muted}>رویدادی ثبت نشده است.</NText>}</View>
  <View style={[s.panel,{backgroundColor:t.accentSoft}]}><NText style={s.muted}>{report.note} آمار دانلود کافه‌بازار و نصب‌های پیش از فعال‌سازی از این اطلاعات قابل محاسبه نیست.</NText></View>
  </>}
 </ScrollView></SafeAreaView>
}
const styles=(t:any)=>StyleSheet.create({
 root:{flex:1,backgroundColor:t.bg},container:{padding:14,paddingBottom:60,gap:12},
 tabs:{flexDirection:'row-reverse',backgroundColor:t.card,borderRadius:13,padding:4,gap:5},tab:{flex:1,height:37,justifyContent:'center',alignItems:'center',borderRadius:9},
 grid:{flexDirection:'row-reverse',flexWrap:'wrap',gap:8},stat:{width:'48.6%',backgroundColor:t.card,borderWidth:1,borderColor:t.line,borderRadius:16,padding:11,minHeight:95,gap:7},
 statHeading:{flexDirection:'row-reverse',gap:6,alignItems:'center'},value:{color:t.text,fontSize:21,textAlign:'right'},
 muted:{fontSize:10.5,lineHeight:19,color:t.muted,textAlign:'right'},note:{fontSize:9,color:t.muted,textAlign:'right'},
 panel:{borderRadius:17,borderWidth:1,borderColor:t.line,backgroundColor:t.card,padding:14,gap:11},
 heading:{color:t.text,fontSize:14,textAlign:'right'},picker:{flexDirection:'row-reverse',gap:5,flexWrap:'wrap'},
 chip:{paddingHorizontal:10,paddingVertical:8,borderRadius:10,backgroundColor:t.bg,borderWidth:1,borderColor:t.line},
 graph:{height:135,flexDirection:'row',alignItems:'flex-end',gap:3,paddingTop:15},slot:{flex:1,height:125,alignItems:'center',justifyContent:'flex-end',gap:2},
 between:{flexDirection:'row-reverse',justifyContent:'space-between',gap:9},
 listItem:{flexDirection:'row-reverse',justifyContent:'space-between',alignItems:'center',gap:11,paddingVertical:9,borderBottomColor:t.line,borderBottomWidth:StyleSheet.hairlineWidth}
});
