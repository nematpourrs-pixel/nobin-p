import { useEffect, useMemo, useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { api } from '../src/api';
import { jalaliDateTime } from '../src/dateFa';
import { effectiveAudience, paletteFor } from '../src/prefs';
import { usePrefs } from '../src/usePrefs';
import { InternalHeader, NText } from '../src/ui';

export default function AdminPosts(){
 const[prefs]=usePrefs();const t=paletteFor(effectiveAudience(prefs),prefs.appearance);const s=useMemo(()=>styles(t),[prefs]);
 const[items,setItems]=useState<any[]>([]);const[title,setTitle]=useState('');const[body,setBody]=useState('');const[scope,setScope]=useState('GLOBAL');const[audience,setAudience]=useState('ALL');const[province,setProvince]=useState('');const[city,setCity]=useState('');const[userIds,setUserIds]=useState('');
 const load=async()=>{try{const j=await api('/v1/app-admin/posts');setItems(j.items||[])}catch(e:any){Alert.alert('خطا',e.message)}};useEffect(()=>{load()},[]);
 const send=async()=>{try{const payload:any={title,body,scope,audience,province,city};if(scope==='CUSTOM')payload.user_ids=userIds.split(',').map(x=>Number(x.trim())).filter(Boolean);await api('/v1/app-admin/posts',{method:'POST',body:JSON.stringify(payload)});setTitle('');setBody('');setUserIds('');Alert.alert('ارسال شد','پیام در بلاگ نوبین منتشر شد.');load()}catch(e:any){Alert.alert('ارسال نشد',e.message)}};
 return <SafeAreaView edges={['bottom']} style={s.root}><KeyboardAvoidingView style={{flex:1}} behavior={Platform.OS==='ios'?'padding':'height'}><ScrollView contentContainerStyle={s.wrap} keyboardShouldPersistTaps="always"><InternalHeader t={t} title="پیام‌های مدیریتی" sub="انتشار هدفمند از داخل اپ" hideSupport/>
 <TextInput value={title} onChangeText={setTitle} placeholder="عنوان پیام" placeholderTextColor={t.muted} style={s.input}/>
 <TextInput multiline value={body} onChangeText={setBody} placeholder="متن پیام..." placeholderTextColor={t.muted} style={[s.input,s.area]}/>
 <NText weight="medium" style={s.label}>محدوده انتشار</NText><View style={s.chips}>{[['GLOBAL','سراسری'],['PROVINCE','استان'],['CITY','شهر'],['CUSTOM','اختصاصی']].map(([v,l])=><Chip key={v} t={t} on={scope===v} label={l} press={()=>setScope(v)}/>)}</View>
 {scope==='PROVINCE'||scope==='CITY'?<TextInput value={province} onChangeText={setProvince} placeholder="استان" placeholderTextColor={t.muted} style={s.input}/>:null}
 {scope==='CITY'?<TextInput value={city} onChangeText={setCity} placeholder="شهر" placeholderTextColor={t.muted} style={s.input}/>:null}
 {scope==='CUSTOM'?<TextInput value={userIds} onChangeText={setUserIds} placeholder="شناسه کاربران، جداشده با ویرگول" placeholderTextColor={t.muted} style={s.input}/>:null}
 <NText weight="medium" style={s.label}>مخاطب</NText><View style={s.chips}>{[['ALL','همه'],['FEMALE','بانوان'],['MALE','آقایان']].map(([v,l])=><Chip key={v} t={t} on={audience===v} label={l} press={()=>setAudience(v)}/>)}</View>
 <TouchableOpacity onPress={send} style={s.btn}><NText weight="bold" style={s.btnT}>انتشار پیام</NText></TouchableOpacity>
 <NText weight="bold" style={s.heading}>پیام‌های اخیر</NText>{items.map(x=><View key={x.id} style={s.card}><NText weight="semi" style={s.title}>{x.title}</NText><NText numberOfLines={3} style={s.body}>{x.body}</NText><NText style={s.meta}>{x.scope} · {x.audience} · {jalaliDateTime(x.published_at||x.created_at||'')}</NText></View>)}
 </ScrollView></KeyboardAvoidingView></SafeAreaView>
}
function Chip({t,on,label,press}:any){return <TouchableOpacity onPress={press} style={{borderWidth:1,borderColor:on?t.accent:t.line,backgroundColor:on?t.accentSoft:t.card,borderRadius:11,paddingHorizontal:10,paddingVertical:8}}><NText weight={on?'semi':'regular'} style={{fontSize:10.8,color:on?t.accent:t.text}}>{label}</NText></TouchableOpacity>}
const styles=(t:any)=>StyleSheet.create({root:{flex:1,backgroundColor:t.bg},wrap:{padding:16,paddingBottom:50,gap:10},input:{minHeight:46,borderWidth:1,borderColor:t.line,borderRadius:13,backgroundColor:t.card,paddingHorizontal:11,paddingVertical:10,fontFamily:'Vazirmatn_400Regular',fontSize:12.5,color:t.text,textAlign:'right'},area:{minHeight:125,textAlignVertical:'top'},label:{fontSize:11.5,color:t.text,textAlign:'right'},chips:{flexDirection:'row-reverse',gap:7,flexWrap:'wrap'},btn:{height:48,borderRadius:14,backgroundColor:t.accent,alignItems:'center',justifyContent:'center'},btnT:{fontSize:12.5,color:'#fff'},heading:{fontSize:15,color:t.text,textAlign:'right',marginTop:6},card:{backgroundColor:t.card,borderWidth:1,borderColor:t.line,borderRadius:15,padding:12,gap:5},title:{fontSize:13.2,color:t.text,textAlign:'right'},body:{fontSize:11.3,lineHeight:19,color:t.text,textAlign:'right'},meta:{fontSize:9.8,color:t.muted,textAlign:'right'}})
