import { nobinAlert } from '../src/dialogs';
import { Ionicons } from '@expo/vector-icons';
import { useEffect, useMemo, useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { api } from '../src/api';
import { effectiveAudience, paletteFor } from '../src/prefs';
import { usePrefs } from '../src/usePrefs';
import { InternalHeader, NText } from '../src/ui';

export default function AdminSystem(){
 const[prefs]=usePrefs();const t=paletteFor(effectiveAudience(prefs),prefs.appearance);const s=useMemo(()=>styles(t),[prefs]);
 const[diag,setDiag]=useState<any>({});const[chatId,setChatId]=useState('');const[flags,setFlags]=useState<any[]>([]);const[flagSaving,setFlagSaving]=useState(false);
 const load=async()=>{try{const [j,f]=await Promise.all([api('/v1/app-admin/diagnostics'),api('/v1/app-admin/feature-flags')]);setDiag(j.diagnostics||{});setFlags(f.items||[])}catch(e:any){nobinAlert('خطا',e.message)}};useEffect(()=>{void load()},[]);
 const labels:Record<string,string>={new_bookings_enabled:'ثبت نوبت جدید',public_feed_enabled:'مطالب عمومی',business_registration_enabled:'ثبت کسب‌وکار جدید'};
 const changeFlag=(row:any)=>{if(flagSaving)return;const enabled=!Number(row.enabled);
 nobinAlert('تأیید تغییر',labels[row.flag_key]+' '+(enabled?'فعال':'غیرفعال')+' شود؟ تغییر برای تمام کاربران اعمال خواهد شد.',[
 {text:'انصراف',style:'cancel'},
 {text:'تأیید',onPress:async()=>{setFlagSaving(true);try{await api('/v1/app-admin/feature-flags/'+row.flag_key,{method:'PUT',body:JSON.stringify({enabled})});await load();nobinAlert('ثبت شد','تنظیمات جدید ذخیره شد.')}catch(e:any){nobinAlert('خطا',e.message)}finally{setFlagSaving(false)}}}
 ])};

 const saveChat=async()=>{try{await api('/v1/app-admin/settings/bale-admin-chat',{method:'POST',body:JSON.stringify({chat_id:chatId.trim()})});nobinAlert('ذخیره شد','شناسه مدیر بله به‌روزرسانی شد.')}catch(e:any){nobinAlert('خطا',e.message)}};
 const hook=async()=>{try{await api('/v1/app-admin/bale/set-webhook',{method:'POST'});nobinAlert('انجام شد','وب‌هوک بله مجدداً تنظیم شد.')}catch(e:any){nobinAlert('خطا',e.message)}};
 return <SafeAreaView edges={['bottom']} style={s.root}><KeyboardAvoidingView style={{flex:1}} behavior={Platform.OS==='ios'?'padding':'height'}><ScrollView contentContainerStyle={s.wrap} keyboardShouldPersistTaps="always"><InternalHeader t={t} title="تنظیمات و سلامت سیستم" sub="ابزارهای فنی مدیر سیستم" hideSupport/>
 <View style={s.card}><Row t={t} label="نسخه بکند" value={diag.version||'—'}/><Row t={t} label="PHP" value={diag.php||'—'}/><Row t={t} label="MySQL" value={diag.db||'—'}/><Row t={t} label="فضای ذخیره‌سازی" value={diag.storage_writable?'سالم':'نیاز به بررسی'}/><Row t={t} label="ربات بله" value={diag.bale_configured?'پیکربندی شده':'پیکربندی نشده'}/><Row t={t} label="Base URL" value={diag.base_url||'—'}/></View>
 <NText weight="bold" style={s.h}>فعال‌سازی قابلیت‌ها</NText><NText style={{color:t.muted,fontSize:10.5,textAlign:'right'}}>تغییرات روی کل سامانه اعمال می‌شوند و در تاریخچه مدیریتی ثبت خواهند شد.</NText>
 <View style={s.card}>{flags.filter(x=>['new_bookings_enabled','public_feed_enabled','business_registration_enabled'].includes(x.flag_key)).map(x=><TouchableOpacity key={x.flag_key} disabled={flagSaving} onPress={()=>changeFlag(x)} style={{flexDirection:'row-reverse',alignItems:'center',paddingVertical:14,borderBottomWidth:StyleSheet.hairlineWidth,borderColor:t.line,gap:9}}><View style={{flex:1}}><NText weight="semi" style={{color:t.text,fontSize:12,textAlign:'right'}}>{labels[x.flag_key]}</NText><NText style={{color:t.muted,fontSize:10,textAlign:'right'}}>{Number(x.enabled)?'فعال':'غیرفعال'}</NText></View><Ionicons name={Number(x.enabled)?'toggle':'toggle-outline'} size={33} color={Number(x.enabled)?t.accent:t.muted}/></TouchableOpacity>)}</View>
 <NText weight="bold" style={s.h}>مدیر بله</NText><TextInput value={chatId} onChangeText={setChatId} placeholder="شناسه chat_id مدیر" placeholderTextColor={t.muted} style={s.input}/><TouchableOpacity onPress={saveChat} style={s.btn}><NText weight="bold" style={s.btnT}>ذخیره شناسه مدیر</NText></TouchableOpacity>
 <TouchableOpacity onPress={hook} style={s.secondary}><NText weight="semi" style={s.secondaryT}>تنظیم مجدد وب‌هوک بله</NText></TouchableOpacity>
 <TouchableOpacity onPress={load} style={s.secondary}><NText weight="semi" style={s.secondaryT}>بررسی مجدد سلامت سیستم</NText></TouchableOpacity>
 </ScrollView></KeyboardAvoidingView></SafeAreaView>
}
function Row({t,label,value}:any){return <View style={{flexDirection:'row-reverse',justifyContent:'space-between',gap:10,paddingVertical:9,borderBottomWidth:StyleSheet.hairlineWidth,borderBottomColor:t.line}}><NText weight="medium" style={{fontSize:11.5,color:t.text}}>{label}</NText><NText numberOfLines={1} style={{flex:1,fontSize:10.5,color:t.muted,textAlign:'left'}}>{String(value)}</NText></View>}
const styles=(t:any)=>StyleSheet.create({root:{flex:1,backgroundColor:t.bg},wrap:{padding:16,paddingBottom:50,gap:11},card:{backgroundColor:t.card,borderWidth:1,borderColor:t.line,borderRadius:16,paddingHorizontal:12},h:{fontSize:14,color:t.text,textAlign:'right',marginTop:4},input:{height:46,borderWidth:1,borderColor:t.line,borderRadius:13,backgroundColor:t.card,paddingHorizontal:11,fontFamily:'Vazirmatn_400Regular',color:t.text,textAlign:'right'},btn:{height:47,borderRadius:14,backgroundColor:t.accent,alignItems:'center',justifyContent:'center'},btnT:{fontSize:12.3,color:'#fff'},secondary:{height:44,borderRadius:13,borderWidth:1,borderColor:t.line,backgroundColor:t.card,alignItems:'center',justifyContent:'center'},secondaryT:{fontSize:11.5,color:t.accent}})
