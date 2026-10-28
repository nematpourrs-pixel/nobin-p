import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { Linking, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { api } from '../src/api';
import { getToken } from '../src/session';
import { paletteFor } from '../src/prefs';
import { NText } from '../src/ui';
const sections=[
 ['business-info','اطلاعات مجموعه','پروفایل و تصاویر','storefront-outline'],
 ['business-services','خدمات و تعرفه‌ها','قیمت و زمان هر خدمت','cut-outline'],
 ['business-staff','پرسنل و متخصصان','تخصص‌ها و دسترسی‌ها','people-outline'],
 ['business-calendar','تقویم شیفت‌ها','برنامه حضور و مرخصی','calendar-outline'],
 ['finance','مالی و حسابداری','ثبت درآمد و هزینه','wallet-outline'],
 ['inventory','انبارداری','کالا و گردش موجودی','cube-outline'],
 ['reports','گزارش‌های مدیریتی','نوبت و شاخص‌های عملکرد','bar-chart-outline'],
 ['bookings','رزروهای مجموعه','فهرست و وضعیت رزروها','receipt-outline'],
] as const;
export default function BusinessWorkspace(){
 const t=paletteFor('ALL');const s=useMemo(()=>StyleSheet.create({
 root:{flex:1,backgroundColor:'#F5F8F7'},content:{padding:18,gap:14,paddingBottom:50},
 eyebrow:{color:'#13806D',fontSize:12,textAlign:'right'},title:{color:'#173C32',fontSize:24,textAlign:'right'},
 hero:{backgroundColor:'#0D6655',padding:22,borderRadius:25,gap:9},heroTitle:{color:'#FFF',fontSize:19,textAlign:'right'},heroSub:{color:'#D5EBE3',fontSize:12,lineHeight:23,textAlign:'right'},
 business:{padding:13,borderRadius:16,backgroundColor:'#fff',borderWidth:1,borderColor:'#DEEAE5',flexDirection:'row-reverse',alignItems:'center',gap:8},
 name:{fontSize:13,color:'#21453A',textAlign:'right',flex:1},grid:{flexDirection:'row-reverse',flexWrap:'wrap',gap:11},
 tile:{width:'48%',minHeight:126,backgroundColor:'#fff',borderRadius:20,padding:16,borderWidth:1,borderColor:'#DFEAE4',justifyContent:'space-between'},
 tileIcon:{width:37,height:37,borderRadius:12,backgroundColor:'#E7F4EF',alignItems:'center',justifyContent:'center'},
 tileTitle:{fontSize:13,fontWeight:'bold',color:'#21453A',textAlign:'right'},
 tileSub:{fontSize:10.5,color:'#6B8177',textAlign:'right',lineHeight:18},
 btn:{backgroundColor:'#E2F0EB',padding:15,borderRadius:15,alignItems:'center'},
 btnT:{color:'#116451',fontSize:12}
 }),[]);
 const[items,setItems]=useState<any[]>([]);const[bid,setBid]=useState(0);const[loading,setLoading]=useState(true);const[message,setMessage]=useState('');
 const load=useCallback(()=>{getToken().then(token=>{if(!token){setLoading(false);setMessage('برای مدیریت کسب‌وکار با بله وارد شوید.');return;}return api('/v1/me/businesses').then(j=>{const a=j.items||[];setItems(a);setBid(old=>a.some((b:any)=>Number(b.id)===old)?old:Number(a[0]?.id||0));setMessage('');setLoading(false)}).catch(e=>{setMessage(e.message||'ارتباط با سرور برقرار نشد');setLoading(false)})})},[]);
 useFocusEffect(useCallback(()=>{load()},[load]));
 const selected=items.find(x=>Number(x.id)===bid);
 const go=(route:string)=>{if(!bid)return;if(['finance','inventory','reports','bookings'].includes(route))router.push({pathname:'/business-operations',params:{businessId:String(bid),section:route}});else router.push({pathname:('/'+route) as any,params:{businessId:String(bid)}})};
 return <SafeAreaView edges={['top','bottom']} style={s.root}><ScrollView contentContainerStyle={s.content}>
 <NText style={s.eyebrow}>NOBIN BUSINESS</NText><NText weight="extra" style={s.title}>فضای مدیریت کسب‌وکار</NText>
 <View style={s.hero}><NText weight="bold" style={s.heroTitle}>همه ابزارهای سالن، یکجا</NText><NText style={s.heroSub}>خدمات، کارکنان، برنامه کاری، دخل‌وخرج و انبار در فضای کاری یکپارچه و مبتنی بر اطلاعات واقعی سرور.</NText></View>
 {loading?<NText>در حال دریافت کسب‌وکارها…</NText>:message?<View style={s.business}><NText style={s.name}>{message}</NText><TouchableOpacity onPress={()=>router.push('/login')}><NText style={s.btnT}>ورود</NText></TouchableOpacity></View>:items.length===0?<View style={s.business}><NText style={s.name}>هنوز کسب‌وکاری برای مدیریت ندارید.</NText><TouchableOpacity onPress={()=>router.push('/business-register')}><NText style={s.btnT}>ثبت مجموعه</NText></TouchableOpacity></View>:<>
 <NText weight="semi" style={s.name}>مجموعه فعال</NText>
 <View style={{gap:8}}>{items.map(b=><TouchableOpacity key={b.id} style={[s.business,bid===Number(b.id)&&{borderColor:'#13806D',backgroundColor:'#EDF7F2'}]} onPress={()=>setBid(Number(b.id))}><Ionicons name={bid===Number(b.id)?'radio-button-on':'radio-button-off'} size={18} color="#11715F"/><NText weight="semi" style={s.name}>{b.name}</NText><NText style={{fontSize:10,color:'#668278'}}>{b.status==='APPROVED'?'فعال':'در بررسی'}</NText></TouchableOpacity>)}</View>
 <View style={s.grid}>{sections.map(([route,title,sub,ico])=><TouchableOpacity key={route} style={s.tile} onPress={()=>go(route)}><View style={s.tileIcon}><Ionicons name={ico as any} size={20} color="#126B58"/></View><NText weight="bold" style={s.tileTitle}>{title}</NText><NText style={s.tileSub}>{sub}</NText></TouchableOpacity>)}</View>
 </>}
 <TouchableOpacity style={s.btn} onPress={()=>router.push('/business-register')}><NText weight="semi" style={s.btnT}>+ ثبت کسب‌وکار دیگر</NText></TouchableOpacity>
 <TouchableOpacity style={s.btn} onPress={()=>Linking.openURL('https://picamo.ir/nobin_business/')}><NText weight="semi" style={s.btnT}>باز کردن پنل وب کسب‌وکار</NText></TouchableOpacity>
 </ScrollView></SafeAreaView>
}