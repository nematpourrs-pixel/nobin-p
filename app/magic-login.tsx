import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Linking, StyleSheet, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { api } from '../src/api';
import { API_BASE } from '../src/api';
import { defaultPrefs, paletteFor } from '../src/prefs';
import { clearSession, savePrefs, setSession } from '../src/session';
import { NText } from '../src/ui';

export default function MagicLogin(){
 const params=useLocalSearchParams<{ticket?:string;target?:string}>();
 const adminMode=process.env.EXPO_PUBLIC_NOBIN_ADMIN_APP==='1';
 const expected=adminMode?'admin-app':'user-app';
 const ticket=String(params.ticket||'');const target=String(params.target||'');
 const t=paletteFor('ALL');const s=useMemo(()=>StyleSheet.create({
 root:{flex:1,backgroundColor:t.bg},wrap:{flex:1,justifyContent:'center',padding:24,gap:15},
 symbol:{width:78,height:78,borderRadius:24,backgroundColor:t.accentSoft,alignItems:'center',justifyContent:'center',alignSelf:'center'},
 title:{fontSize:23,color:t.text,textAlign:'center'},
 text:{fontSize:12,color:t.muted,textAlign:'center',lineHeight:24},
 button:{height:54,backgroundColor:t.accent,borderRadius:16,alignItems:'center',justifyContent:'center'},
 secondary:{height:48,backgroundColor:t.card,borderRadius:16,alignItems:'center',justifyContent:'center',borderWidth:1,borderColor:t.line}
 }),[t]);
 const[working,setWorking]=useState(false);
 const[error,setError]=useState('');
 const valid=/^[a-f0-9]{64}$/.test(ticket)&&target===expected;
 const finish=async()=>{
   if(!valid||working)return;setWorking(true);setError('');
   try{
     const r=await fetch(API_BASE+'/v1/auth/magic/consume',{method:'POST',headers:{'content-type':'application/json',accept:'application/json'},body:JSON.stringify({ticket,target})});
     const d=await r.json();if(!r.ok||!d.token)throw new Error(d.message||'لینک ورود معتبر نیست.');
     await setSession(d.token,d.user);
     if(adminMode){
       try{await api('/v1/app-admin/stats')}catch(e:any){throw new Error('مجوز مدیریت سیستم تأیید نشد.');}
       router.replace('/admin-dashboard');
     }else{
       const g=d.user?.profile_gender;
       const audience=g==='MALE'||g==='FEMALE'?g:d.user?.service_audience||'ALL';
       await savePrefs({...defaultPrefs,profileGender:g==='MALE'||g==='FEMALE'?g:'UNSPECIFIED',audience});
       router.replace('/');
     }
   }catch(e:any){await clearSession();setError(e.message||'اتصال با سرور برقرار نشد.');}
   finally{setWorking(false);}
 };
 useEffect(()=>{if(valid){void finish();}},[valid,ticket,target]);
 return <SafeAreaView edges={['top','bottom']} style={s.root}><View style={s.wrap}>
  <View style={s.symbol}><Ionicons name="shield-checkmark-outline" size={39} color={t.accent}/></View>
  <NText weight="bold" style={s.title}>ورود امن به نوبین</NText>
  <NText style={s.text}>لینک ارسال‌شده از ربات بله فقط یک‌بار و تا سه دقیقه معتبر است. برای ورود، دکمه زیر را انتخاب کنید.</NText>
  {!!error&&<NText style={[s.text,{color:t.danger}]}>{error}</NText>}
  {!valid?<NText style={[s.text,{color:t.danger}]}>این لینک برای این برنامه معتبر نیست. از ربات لینک جدید دریافت کنید.</NText>:null}
  <TouchableOpacity disabled={!valid||working} accessibilityRole="button" style={[s.button,(!valid||working)&&{opacity:.55}]} onPress={finish}>{working?<ActivityIndicator color="#fff"/>:<NText weight="bold" style={{color:'#fff',fontSize:13}}>ورود به حساب من</NText>}</TouchableOpacity>
  <TouchableOpacity style={s.secondary} onPress={()=>Linking.openURL('https://ble.ir/nobin_bot?start=login')}><NText weight="semi" style={{color:t.accent,fontSize:12}}>دریافت لینک جدید از ربات بله</NText></TouchableOpacity>
 </View></SafeAreaView>;
}
