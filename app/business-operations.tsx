import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { api } from '../src/api';
import { NText } from '../src/ui';
const fa=(v:any)=>new Intl.NumberFormat('fa-IR').format(Number(v||0));
const currency=(v:any)=>fa(v)+' تومان';
const sections=[['reports','گزارش'],['finance','مالی'],['inventory','انبار'],['bookings','نوبت‌ها']] as const;
export default function BusinessOperations(){
 const params=useLocalSearchParams<{businessId:string;section?:string}>();const bid=Number(params.businessId||0);const [view,setView]=useState(String(params.section||'reports'));
 const [rows,setRows]=useState<any[]>([]);const [summary,setSummary]=useState<any>(null);const [busy,setBusy]=useState(false);const[message,setMessage]=useState('');const[entryType,setEntryType]=useState('INCOME');
 const [form,setForm]=useState({category:'',amount:'',note:'',title:'',sku:'',unit:'عدد',threshold:'0',quantity:'',reason:''});
 const[stockId,setStockId]=useState(0);const[dir,setDir]=useState(1);
 const styles=useMemo(()=>StyleSheet.create({root:{flex:1,backgroundColor:'#F4F8F6'},wrap:{padding:16,gap:13,paddingBottom:40},title:{color:'#173F34',fontSize:23,textAlign:'right'},body:{fontSize:12,color:'#59776A',textAlign:'right',lineHeight:23},
 tabs:{flexDirection:'row-reverse',gap:6},tab:{flex:1,paddingVertical:12,borderRadius:12,alignItems:'center',backgroundColor:'#E7F2EC'},active:{backgroundColor:'#0E6955'},tabText:{fontSize:11,color:'#0D6655'},
 grid:{flexDirection:'row-reverse',flexWrap:'wrap',gap:9},metric:{width:'48%',borderRadius:18,padding:15,backgroundColor:'#FFF',borderWidth:1,borderColor:'#E0EAE5',gap:8},
 metricValue:{fontSize:19,color:'#146653',textAlign:'right'},card:{backgroundColor:'#FFF',padding:16,borderRadius:20,borderWidth:1,borderColor:'#DFEAE4',gap:11},
 label:{fontSize:13,color:'#204D40',textAlign:'right'},input:{borderWidth:1,borderColor:'#D6E6DD',borderRadius:12,backgroundColor:'#FAFDFC',padding:12,color:'#173F34',fontSize:13,textAlign:'right'},
 btn:{backgroundColor:'#116C55',borderRadius:13,minHeight:47,alignItems:'center',justifyContent:'center',paddingHorizontal:10},
 btnText:{color:'#FFF',fontSize:12},line:{paddingVertical:11,borderBottomWidth:.6,borderBottomColor:'#E0EBE5',gap:5},
 picker:{flexDirection:'row-reverse',flexWrap:'wrap',gap:7},pill:{backgroundColor:'#E7F4EE',paddingHorizontal:12,paddingVertical:9,borderRadius:12},
 error:{color:'#BA433C',fontSize:12,textAlign:'right'}
 }),[]);
 const load=useCallback(async()=>{if(!bid)return;setBusy(true);setMessage('');try{const url='/v1/businesses/'+bid+'/ops/';if(view==='reports'){const j=await api(url+'summary?days=30');setSummary(j);setRows([]);}else{const path=view==='finance'?'entries':view==='inventory'?'inventory':'bookings';const j=await api(url+path);setRows(j.items||[])} }catch(e:any){setMessage(e.message||'دریافت اطلاعات ناموفق بود');setRows([]);}finally{setBusy(false)}},[bid,view]);
 useFocusEffect(useCallback(()=>{void load()},[load]));
 const patch=(k:string,v:string)=>setForm(o=>({...o,[k]:v}));
 const submit=async(mode:'entry'|'item'|'move')=>{setBusy(true);setMessage('');try{
 const base='/v1/businesses/'+bid+'/ops/';
 const d=mode==='entry'?{entry_type:entryType,amount:Number(form.amount),category:form.category.trim(),note:form.note,entry_date:new Date().toISOString().slice(0,10)}:mode==='item'?{title:form.title.trim(),sku:form.sku.trim(),unit:form.unit,low_stock_threshold:Number(form.threshold)}:{item_id:stockId,quantity_delta:Number(form.quantity)*dir,reason:form.reason.trim()};
 await api(base+(mode==='entry'?'entries':mode==='item'?'inventory':'stock-move'),{method:'POST',body:JSON.stringify(d)});
 setForm(o=>({...o,category:'',amount:'',note:'',title:'',quantity:'',reason:''}));setStockId(0);await load();
 }catch(e:any){setMessage(e.message||'ثبت انجام نشد')}finally{setBusy(false)}};
 const field=(label:string,key:keyof typeof form,placeholder='',numeric=false)=><View style={{gap:6}}><NText style={styles.label}>{label}</NText><TextInput value={form[key]} onChangeText={v=>patch(key,v)} placeholder={placeholder||label} keyboardType={numeric?'decimal-pad':'default'} style={styles.input} placeholderTextColor="#869A91"/></View>;
 const metric=(label:string,v:string)=><View style={styles.metric}><NText style={styles.body}>{label}</NText><NText weight="extra" style={styles.metricValue}>{v}</NText></View>;
 const button=(label:string,handler:()=>void)=><TouchableOpacity disabled={busy} onPress={handler} style={[styles.btn,busy&&{opacity:.5}]}><NText weight="bold" style={styles.btnText}>{label}</NText></TouchableOpacity>;
 const itemRow=(heading:string,sub:string,right:string)=><View style={styles.line}><View style={{flexDirection:'row-reverse',justifyContent:'space-between',gap:8}}><NText weight="semi" style={styles.label}>{heading}</NText><NText style={styles.label}>{right}</NText></View><NText style={styles.body}>{sub}</NText></View>;
 return <SafeAreaView edges={['bottom']} style={styles.root}><ScrollView contentContainerStyle={styles.wrap}>
 <TouchableOpacity onPress={()=>router.back()}><NText style={{textAlign:'right',color:'#136E5A'}}>بازگشت به فضای کاری</NText></TouchableOpacity>
 <NText weight="extra" style={styles.title}>مدیریت مالی و عملیات</NText><NText style={styles.body}>ثبت‌ها و گزارش‌ها فقط از اطلاعات این مجموعه دریافت می‌شوند.</NText>
 <View style={styles.tabs}>{sections.map(([id,title])=><TouchableOpacity key={id} style={[styles.tab,view===id&&styles.active]} onPress={()=>setView(id)}><NText weight="semi" style={[styles.tabText,view===id&&{color:'#fff'}]}>{title}</NText></TouchableOpacity>)}</View>
 {busy&&<ActivityIndicator color="#126B58"/>}{!!message&&<NText style={styles.error}>{message}</NText>}
 {view==='reports'&&summary&&<><View style={styles.grid}>{metric('درآمد دستی',currency(summary.operating_income))}{metric('هزینه دستی',currency(summary.operating_expense))}{metric('مانده ثبت‌ها',currency(summary.operating_balance))}{metric('هشدار موجودی',fa(summary.inventory?.low_stock||0)+' قلم')}</View><View style={styles.card}><NText weight="bold" style={styles.label}>وضعیت نوبت‌ها در ۳۰ روز اخیر</NText>{(summary.bookings||[]).map((r:any,i:number)=><View key={i}>{itemRow(String(r.status),fa(r.n)+' نوبت',currency(r.amount))}</View>)}</View><View style={styles.card}><NText weight="bold" style={styles.label}>خدمات پرتکرار</NText>{(summary.top_services||[]).map((r:any,i:number)=><View key={i}>{itemRow(String(r.title||'خدمت'),fa(r.count)+' مرتبه',currency(r.amount))}</View>)}</View><NText style={styles.body}>{summary.note}</NText></>}
 {view==='finance'&&<><View style={styles.card}><NText weight="bold" style={styles.label}>ثبت سند درآمد یا هزینه</NText><View style={styles.picker}>{[['INCOME','درآمد'],['EXPENSE','هزینه']].map(([k,l])=><TouchableOpacity key={k} style={[styles.pill,entryType===k&&styles.active]} onPress={()=>setEntryType(k)}><NText style={[styles.label,entryType===k&&{color:'#fff'}]}>{l}</NText></TouchableOpacity>)}</View>{field('دسته حساب','category','مثلاً مواد مصرفی یا فروش')}{field('مبلغ به تومان','amount','مبلغ',true)}{field('شرح سند','note','توضیحات اختیاری')}{button('ثبت سند مالی',()=>void submit('entry'))}</View><View style={styles.card}><NText style={styles.label}>آخرین اسناد مالی</NText>{rows.map(x=><View key={x.id}>{itemRow(x.category,x.entry_date+' · '+(x.note||''),(x.entry_type==='INCOME'?'+':'−')+currency(x.amount))}</View>)}</View></>}
 {view==='inventory'&&<><View style={styles.card}><NText weight="bold" style={styles.label}>افزودن کالای جدید</NText>{field('نام کالا','title')}{field('کد انبار','sku')}{field('واحد','unit')}{field('حد هشدار موجودی','threshold','مقدار',true)}{button('ثبت کالای جدید',()=>void submit('item'))}</View><View style={styles.card}><NText weight="bold" style={styles.label}>موجودی فعلی</NText>{rows.map(x=><TouchableOpacity key={x.id} onPress={()=>setStockId(Number(x.id))} style={[styles.line,stockId===Number(x.id)&&{backgroundColor:'#EDF9F2'}]}>{itemRow(x.title,x.sku||'بدون کد',fa(x.quantity)+' '+(x.unit||'عدد'))}{Number(x.quantity)<=Number(x.low_stock_threshold)&&<NText style={styles.error}>⚠️ هشدار موجودی</NText>}</TouchableOpacity>)}</View>{stockId>0&&<View style={styles.card}><NText style={styles.label}>ثبت گردش برای کالای انتخاب‌شده</NText><View style={styles.picker}>{[['1','ورودی'],['-1','مصرف / خروج']].map(([k,l])=><TouchableOpacity key={k} onPress={()=>setDir(Number(k))} style={[styles.pill,dir===Number(k)&&styles.active]}><NText style={[styles.label,dir===Number(k)&&{color:'#fff'}]}>{l}</NText></TouchableOpacity>)}</View>{field('مقدار تغییر','quantity','مقدار',true)}{field('علت گردش','reason')}{button('ثبت گردش انبار',()=>void submit('move'))}</View>}</>}
 {view==='bookings'&&<View style={styles.card}><NText style={styles.label}>آخرین نوبت‌های مجموعه</NText>{rows.map(x=><View key={x.id}>{itemRow(x.reference,x.starts_at+' · '+x.status,currency(x.total_amount))}</View>)}</View>}
 </ScrollView></SafeAreaView>
}