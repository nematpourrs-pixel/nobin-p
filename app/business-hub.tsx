import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { Alert, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { api } from '../src/api';
import { effectiveAudience, paletteFor } from '../src/prefs';
import { usePrefs } from '../src/usePrefs';
import { InternalHeader, NText } from '../src/ui';

export default function BusinessHub(){
 const p=useLocalSearchParams<{businessId:string}>();const bid=Number(p.businessId||0);const[prefs]=usePrefs();const t=paletteFor(effectiveAudience(prefs),prefs.appearance);const s=useMemo(()=>styles(t),[prefs]);const[b,setB]=useState<any>(null);
 const load=useCallback(()=>{api('/v1/me/businesses/'+bid).then(j=>setB(j.business)).catch((e:any)=>Alert.alert('خطا',e.message))},[bid]);useFocusEffect(load);
 const cards=[
  ['business-info','اطلاعات کسب‌وکار','نام، مدیر، تماس، نشانی، معرفی و تصاویر','storefront-outline'],
  ['business-services','خدمات','خدمات، قیمت، مدت و نمونه‌کارها','cut-outline'],
  ['business-staff','کارکنان','پرسنل، تخصص، تصویر و خدمات اختصاصی','people-outline'],
  ['business-calendar','تقویم کاری','شیفت‌ها، مرخصی و استثناهای شمسی','calendar-outline'],
 ] as const;
 return <SafeAreaView edges={['bottom']} style={s.root}><ScrollView contentContainerStyle={s.wrap}><InternalHeader t={t} title={b?.name||'مدیریت کسب‌وکار'} sub="هر بخش مستقل است؛ اطلاعات را به ترتیب تکمیل کنید"/>
 <View style={s.progress}><Step n="۱" title="کسب‌وکار" done={Boolean(b?.name&&b?.city&&b?.address)} t={t}/><Step n="۲" title="خدمات" done={(b?.services||[]).length>0} t={t}/><Step n="۳" title="کارکنان" done={(b?.staff||[]).length>0} t={t}/><Step n="۴" title="تقویم" done={(b?.shifts||[]).length>0} t={t}/></View>
 {cards.map(([route,title,sub,icon],i)=><TouchableOpacity key={route} activeOpacity={.72} style={s.card} onPress={()=>router.push({pathname:('/'+route) as any,params:{businessId:String(bid)}})}><View style={s.icon}><Ionicons name={icon as any} size={23} color={t.accent}/></View><View style={{flex:1}}><NText weight="bold" style={s.title}>{i+1}. {title}</NText><NText style={s.sub}>{sub}</NText></View><Ionicons name="chevron-back" size={19} color={t.muted}/></TouchableOpacity>)}
 <View style={s.tip}><Ionicons name="sparkles-outline" size={18} color={t.accent}/><NText style={s.tipT}>ترتیب پیشنهادی: ابتدا پروفایل کسب‌وکار، بعد خدمات سالن، سپس کارکنان و در پایان تقویم کاری هر نفر.</NText></View>
 </ScrollView></SafeAreaView>
}
function Step({n,title,done,t}:any){return <View style={{flex:1,alignItems:'center',gap:4}}><View style={{width:30,height:30,borderRadius:10,backgroundColor:done?t.accent:t.accentSoft,alignItems:'center',justifyContent:'center'}}>{done?<Ionicons name="checkmark" size={17} color="#fff"/>:<NText weight="bold" style={{fontSize:11,color:t.accent}}>{n}</NText>}</View><NText style={{fontSize:9.5,color:done?t.text:t.muted}}>{title}</NText></View>}
const styles=(t:any)=>StyleSheet.create({root:{flex:1,backgroundColor:t.bg},wrap:{padding:16,paddingBottom:40,gap:11},progress:{flexDirection:'row-reverse',backgroundColor:t.card,borderWidth:1,borderColor:t.line,borderRadius:18,padding:12},card:{minHeight:88,backgroundColor:t.card,borderWidth:1,borderColor:t.line,borderRadius:18,padding:13,flexDirection:'row-reverse',alignItems:'center',gap:11},icon:{width:48,height:48,borderRadius:16,backgroundColor:t.accentSoft,alignItems:'center',justifyContent:'center'},title:{fontSize:14.5,color:t.text,textAlign:'right'},sub:{fontSize:11,lineHeight:19,color:t.muted,textAlign:'right',marginTop:3},tip:{backgroundColor:t.accentSoft,borderRadius:16,padding:12,flexDirection:'row-reverse',gap:8,alignItems:'flex-start'},tipT:{flex:1,fontSize:10.7,lineHeight:19,color:t.text,textAlign:'right'}})