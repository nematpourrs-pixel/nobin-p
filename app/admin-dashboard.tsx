import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Alert, RefreshControl, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { api } from '../src/api';
import { effectiveAudience, paletteFor } from '../src/prefs';
import { usePrefs } from '../src/usePrefs';
import { InternalHeader, NText } from '../src/ui';

const modules=[
 ['users','کاربران','people-outline','users'],
 ['businesses','کسب‌وکارها','storefront-outline','businesses'],
 ['staff','پرسنل','person-circle-outline','staff'],
 ['services','خدمات','cut-outline','services'],
 ['bookings','رزروها','calendar-outline','bookings'],
 ['reviews','نظرات','star-outline','reviews'],
 ['campaigns','کمپین‌ها','megaphone-outline','campaigns'],
 ['notifications','اعلان‌ها','notifications-outline','notifications'],
 ['business_badges','نشان‌ها','ribbon-outline','business_badges'],
] as const;

export default function AdminDashboard(){
 const[prefs]=usePrefs();const t=paletteFor(effectiveAudience(prefs),prefs.appearance);const s=useMemo(()=>styles(t),[prefs]);
 const[stats,setStats]=useState<any>({});const[diag,setDiag]=useState<any>({});const[busy,setBusy]=useState(false);
 const load=async()=>{setBusy(true);try{const[a,d]=await Promise.all([api('/v1/app-admin/stats'),api('/v1/app-admin/diagnostics')]);setStats(a.stats||{});setDiag(d.diagnostics||{})}catch(e:any){Alert.alert('دسترسی مدیریت',e.message)}finally{setBusy(false)}};
 useEffect(()=>{load()},[]);
 const setWebhook=async()=>{try{await api('/v1/app-admin/bale/set-webhook',{method:'POST'});Alert.alert('انجام شد','وب‌هوک بله مجدداً تنظیم شد.')}catch(e:any){Alert.alert('خطا',e.message)}};
 return <SafeAreaView edges={['bottom']} style={s.root}><ScrollView refreshControl={<RefreshControl refreshing={busy} onRefresh={load}/>} contentContainerStyle={s.wrap}>
  <InternalHeader t={t} title="مرکز مدیریت سیستم" sub="دسترسی کامل مدیر نوبین از داخل اپ" hideSupport/>
  <View style={s.hero}><View style={s.heroIcon}><Ionicons name="shield-checkmark" size={24} color="#fff"/></View><View style={{flex:1}}><NText weight="bold" style={s.heroTitle}>مدیریت نوبین</NText><NText style={s.heroSub}>{'Backend '+(diag.version||'—')+' · PHP '+(diag.php||'—')+' · '+(diag.storage_writable?'ذخیره‌سازی سالم':'بررسی ذخیره‌سازی')}</NText></View></View>
  <View style={s.kpis}><Kpi t={t} n={stats.users} label="کاربر"/><Kpi t={t} n={stats.businesses} label="کسب‌وکار"/><Kpi t={t} n={stats.today_bookings} label="رزرو امروز"/><Kpi t={t} n={stats.open_support} label="پشتیبانی باز"/></View>
  <NText weight="bold" style={s.section}>مدیریت داده‌ها</NText>
  <View style={s.grid}>{modules.map(([entity,title,icon,key])=><TouchableOpacity key={entity} activeOpacity={.75} style={s.tile} onPress={()=>router.push({pathname:'/admin-entity',params:{entity}})}><View style={s.tileIcon}><Ionicons name={icon as any} size={21} color={t.accent}/></View><NText weight="semi" style={s.tileTitle}>{title}</NText><NText style={s.tileNum}>{new Intl.NumberFormat('fa-IR').format(Number(stats[key]||0))} رکورد</NText></TouchableOpacity>)}</View>
  <NText weight="bold" style={s.section}>عملیات مدیریتی</NText>
  <View style={s.menu}>
   <Menu t={t} icon="headset-outline" title="پشتیبانی کاربران" sub="مشاهده و پاسخ مستقیم به تمام گفتگوها" onPress={()=>router.push('/admin-support')}/>
   <Menu t={t} icon="newspaper-outline" title="بلاگ و پیام هدفمند" sub="ارسال سراسری، استانی، شهری یا اختصاصی" onPress={()=>router.push('/admin-posts')}/>
   <Menu t={t} icon="settings-outline" title="تنظیمات و سلامت سیستم" sub={diag.db?'MySQL '+diag.db+' · تنظیمات فنی و بله':'تنظیمات فنی و بله'} onPress={()=>router.push('/admin-system')}/>
  </View>
 </ScrollView></SafeAreaView>
}
function Kpi({t,n,label}:any){return <View style={{flex:1,minWidth:'45%',backgroundColor:t.card,borderWidth:1,borderColor:t.line,borderRadius:15,padding:12}}><NText weight="bold" style={{fontSize:20,color:t.text,textAlign:'right'}}>{new Intl.NumberFormat('fa-IR').format(Number(n||0))}</NText><NText style={{fontSize:10.5,color:t.muted,textAlign:'right'}}>{label}</NText></View>}
function Menu({t,icon,title,sub,onPress}:any){return <TouchableOpacity onPress={onPress} style={{padding:13,flexDirection:'row-reverse',alignItems:'center',gap:10,borderBottomWidth:StyleSheet.hairlineWidth,borderBottomColor:t.line}}><View style={{width:39,height:39,borderRadius:12,backgroundColor:t.accentSoft,alignItems:'center',justifyContent:'center'}}><Ionicons name={icon} size={19} color={t.accent}/></View><View style={{flex:1}}><NText weight="semi" style={{fontSize:13.5,color:t.text,textAlign:'right'}}>{title}</NText><NText style={{fontSize:10.8,color:t.muted,textAlign:'right',marginTop:2}}>{sub}</NText></View><Ionicons name="chevron-back" size={17} color={t.muted}/></TouchableOpacity>}
const styles=(t:any)=>StyleSheet.create({root:{flex:1,backgroundColor:t.bg},wrap:{padding:16,paddingBottom:40,gap:12},hero:{backgroundColor:t.card,borderWidth:1,borderColor:t.line,borderRadius:18,padding:14,flexDirection:'row-reverse',gap:10,alignItems:'center'},heroIcon:{width:48,height:48,borderRadius:15,backgroundColor:t.accent,alignItems:'center',justifyContent:'center'},heroTitle:{fontSize:16,color:t.text,textAlign:'right'},heroSub:{fontSize:10.5,color:t.muted,textAlign:'right',marginTop:3},kpis:{flexDirection:'row-reverse',flexWrap:'wrap',gap:8},section:{fontSize:15,color:t.text,textAlign:'right',marginTop:3},grid:{flexDirection:'row-reverse',flexWrap:'wrap',gap:8},tile:{width:'48.7%',backgroundColor:t.card,borderWidth:1,borderColor:t.line,borderRadius:16,padding:12,gap:5},tileIcon:{width:38,height:38,borderRadius:12,backgroundColor:t.accentSoft,alignItems:'center',justifyContent:'center'},tileTitle:{fontSize:13,color:t.text,textAlign:'right'},tileNum:{fontSize:10.2,color:t.muted,textAlign:'right'},menu:{backgroundColor:t.card,borderWidth:1,borderColor:t.line,borderRadius:17,overflow:'hidden'}})
