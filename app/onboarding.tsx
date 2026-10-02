import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { api } from '../src/api';
import { paletteFor, savePrefs as _x } from '../src/prefs';
import { savePrefs } from '../src/session';
import type { Audience, ProfileGender } from '../src/prefs';

export default function Onboarding(){
  const [gender,setGender]=useState<ProfileGender>('UNSPECIFIED');
  const [audience,setAudience]=useState<Audience>('ALL');
  const [step,setStep]=useState(1);
  const t=paletteFor(audience); const s=styles(t);
  const chooseGender=(g:ProfileGender)=>{setGender(g);if(g==='FEMALE')setAudience('FEMALE');if(g==='MALE')setAudience('MALE')};
  const done=async()=>{const p={profileGender:gender,audience};await savePrefs(p);try{await api('/v1/me/preferences',{method:'PATCH',body:JSON.stringify({profile_gender:gender,service_audience:audience})})}catch{}router.replace('/')};
  return <SafeAreaView edges={['top','bottom']} style={s.root}><View style={s.wrap}>
    <Text style={s.brand}>نوبین</Text><Text style={s.kicker}>تجربه‌ای متناسب با خودت</Text>
    {step===1?<><Text style={s.h1}>پروفایل شما چیست؟</Text><Text style={s.p}>این انتخاب برای شخصی‌سازی ظاهر و پیشنهادهاست و هر زمان قابل تغییر است.</Text>
      <View style={s.cards}><Choice title="خانم" sub="پیشنهادها و ظاهر مناسب خدمات بانوان" on={gender==='FEMALE'} onPress={()=>chooseGender('FEMALE')} t={t}/><Choice title="آقا" sub="پیشنهادها و ظاهر مناسب خدمات آقایان" on={gender==='MALE'} onPress={()=>chooseGender('MALE')} t={t}/><Choice title="ترجیح می‌دهم نگویم" sub="فقط نوع خدمات را انتخاب می‌کنم" on={gender==='UNSPECIFIED'} onPress={()=>chooseGender('UNSPECIFIED')} t={t}/></View>
      <TouchableOpacity style={s.btn} onPress={()=>setStep(2)}><Text style={s.btnT}>ادامه</Text></TouchableOpacity></>
    :<><Text style={s.h1}>معمولاً چه خدماتی می‌خواهید ببینید؟</Text><Text style={s.p}>این مورد مستقل از جنسیت حساب است؛ مثلاً می‌توانید برای اعضای خانواده هم رزرو کنید.</Text>
      <View style={s.cards}><Choice title="خدمات بانوان" sub="سالن‌ها و دسته‌بندی بانوان" on={audience==='FEMALE'} onPress={()=>setAudience('FEMALE')} t={t}/><Choice title="خدمات آقایان" sub="آرایشگاه و دسته‌بندی آقایان" on={audience==='MALE'} onPress={()=>setAudience('MALE')} t={t}/><Choice title="هر دو" sub="نمایش همه خدمات" on={audience==='ALL'} onPress={()=>setAudience('ALL')} t={t}/></View>
      <TouchableOpacity style={s.btn} onPress={done}><Text style={s.btnT}>ورود به نوبین</Text></TouchableOpacity><TouchableOpacity onPress={()=>setStep(1)}><Text style={s.back}>بازگشت</Text></TouchableOpacity></>}
  </View></SafeAreaView>
}
function Choice({title,sub,on,onPress,t}:any){return <TouchableOpacity onPress={onPress} style={[{borderWidth:1,borderColor:t.line,backgroundColor:t.card,borderRadius:20,padding:16},on&&{borderColor:t.accent,backgroundColor:t.accentSoft}]}><Text style={{textAlign:'right',fontWeight:'900',fontSize:17,color:t.text}}>{title}</Text><Text style={{textAlign:'right',marginTop:5,color:t.muted,lineHeight:21}}>{sub}</Text></TouchableOpacity>}
const styles=(t:any)=>StyleSheet.create({root:{flex:1,backgroundColor:t.bg},wrap:{flex:1,padding:22,gap:16,justifyContent:'center'},brand:{textAlign:'right',fontSize:28,fontWeight:'900',color:t.accent},kicker:{textAlign:'right',fontSize:15,fontWeight:'700',color:t.accent},h1:{textAlign:'right',fontSize:30,lineHeight:44,fontWeight:'900',color:t.text},p:{textAlign:'right',fontSize:15,lineHeight:25,color:t.muted},cards:{gap:10},btn:{backgroundColor:t.accent,borderRadius:17,padding:16,alignItems:'center',marginTop:4},btnT:{color:'#fff',fontSize:16,fontWeight:'900'},back:{textAlign:'center',color:t.muted,fontWeight:'700',padding:8}})
