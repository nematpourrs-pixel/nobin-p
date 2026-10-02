import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { api } from '../src/api';
import { audienceLongLabel, defaultPrefs, paletteFor, type Audience } from '../src/prefs';
import { savePrefs } from '../src/session';
import { NText } from '../src/ui';

export default function Onboarding(){
  const[audience,setAudience]=useState<Audience>('FEMALE');
  const t=paletteFor(audience);const s=useMemo(()=>styles(t),[audience]);
  const done=async()=>{const p={...defaultPrefs,audience};await savePrefs(p);try{await api('/v1/me/preferences',{method:'PATCH',body:JSON.stringify({profile_gender:'UNSPECIFIED',service_audience:audience})})}catch{}router.replace('/')};
  return <SafeAreaView edges={['top','bottom']} style={s.root}><View style={s.wrap}>
    <View style={s.logo}><NText weight="extra" style={s.logoT}>ن</NText></View>
    <View><NText weight="extra" style={s.brand}>نوبین</NText><NText style={s.tag}>زیبایی و آراستگی، ساده و مطمئن</NText></View>
    <View style={s.intro}><NText weight="bold" style={s.h1}>برای شروع چه خدماتی ببینی؟</NText><NText style={s.p}>این فقط محتوای پیشنهادی و ظاهر اپ را تنظیم می‌کند؛ هر زمان از بخش شخصی‌سازی قابل تغییر است.</NText></View>
    <View style={s.cards}>{([
      ['FEMALE','خدمات بانوان','سالن‌ها، متخصص‌ها و دسته‌بندی‌های بانوان','sparkles-outline'],
      ['MALE','خدمات آقایان','آرایشگاه‌ها و خدمات تخصصی آقایان','man-outline'],
      ['ALL','همه خدمات','برای رزروهای شخصی و اعضای خانواده','grid-outline']
    ] as any[]).map(([key,title,sub,icon])=><TouchableOpacity activeOpacity={.72} key={key} onPress={()=>setAudience(key)} style={[s.card,audience===key&&s.cardOn]}><View style={[s.icon,audience===key&&s.iconOn]}><Ionicons name={icon} size={22} color={audience===key?'#fff':t.accent}/></View><View style={{flex:1}}><NText weight="semi" style={s.cardTitle}>{title}</NText><NText style={s.cardSub}>{sub}</NText></View>{audience===key?<Ionicons name="checkmark-circle" size={21} color={t.accent}/>:null}</TouchableOpacity>)}</View>
    <TouchableOpacity activeOpacity={.75} style={s.btn} onPress={done}><NText weight="bold" style={s.btnT}>ادامه با {audienceLongLabel(audience)}</NText></TouchableOpacity>
  </View></SafeAreaView>
}
const styles=(t:any)=>StyleSheet.create({root:{flex:1,backgroundColor:t.bg},wrap:{flex:1,paddingHorizontal:22,paddingVertical:24,justifyContent:'center',gap:20},logo:{width:52,height:52,borderRadius:18,backgroundColor:t.accentSoft,alignItems:'center',justifyContent:'center'},logoT:{fontSize:24,color:t.accent},brand:{fontSize:30,lineHeight:42,textAlign:'right',color:t.accent},tag:{fontSize:12.5,lineHeight:20,textAlign:'right',color:t.muted},intro:{gap:6,marginTop:4},h1:{fontSize:25,lineHeight:38,textAlign:'right',color:t.text},p:{fontSize:13.5,lineHeight:23,textAlign:'right',color:t.muted},cards:{gap:9},card:{minHeight:78,flexDirection:'row-reverse',alignItems:'center',gap:12,backgroundColor:t.card,borderWidth:1,borderColor:t.line,borderRadius:19,padding:13},cardOn:{borderColor:t.accent,backgroundColor:t.accentSoft},icon:{width:42,height:42,borderRadius:14,alignItems:'center',justifyContent:'center',backgroundColor:t.accentSoft},iconOn:{backgroundColor:t.accent},cardTitle:{fontSize:15.5,textAlign:'right',color:t.text},cardSub:{fontSize:11.5,lineHeight:19,textAlign:'right',color:t.muted,marginTop:2},btn:{backgroundColor:t.accent,borderRadius:16,padding:15,alignItems:'center',marginTop:2},btnT:{color:'#fff',fontSize:14}})
