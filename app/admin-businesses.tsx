import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, Image, KeyboardAvoidingView, Modal, Platform, RefreshControl, ScrollView, StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { api } from '../src/api';
import { faDigits } from '../src/dateFa';
import { nobinAlert } from '../src/dialogs';
import { effectiveAudience, paletteFor } from '../src/prefs';
import { usePrefs } from '../src/usePrefs';
import { InternalHeader, NText } from '../src/ui';

type B = { id: number; name: string; status: string; [key: string]: any };
type F = 'PENDING' | 'APPROVED' | 'REJECTED' | 'ALL';
const statuses: Record<string,string> = { PENDING: 'در انتظار بررسی', APPROVED: 'تأییدشده', REJECTED: 'ردشده', SUSPENDED: 'تعلیق‌شده', DRAFT: 'پیش‌نویس' };
const types: Record<string,string> = { SALON: 'سالن', CLINIC: 'کلینیک', FREELANCER: 'متخصص مستقل', SERVICE_PROVIDER: 'ارائه‌دهنده خدمت' };
const genders: Record<string,string> = { FEMALE: 'بانوان', MALE: 'آقایان', ALL: 'همه' };
const filters: { key: F; title: string }[] = [{key:'PENDING',title:'در انتظار'}, {key:'ALL',title:'همه'}, {key:'APPROVED',title:'تأییدشده'}, {key:'REJECTED',title:'ردشده'}];
const fields: {key:string;title:string;big?:boolean}[] = [
 {key:'name',title:'نام کسب‌وکار'}, {key:'manager_name',title:'نام مسئول'},
 {key:'type',title:'نوع فعالیت'}, {key:'gender',title:'مخاطب'},
 {key:'province',title:'استان'}, {key:'city',title:'شهر'},
 {key:'address',title:'نشانی',big:true}, {key:'phone',title:'تلفن'},
 {key:'alternate_phone',title:'تلفن دیگر'}, {key:'email',title:'ایمیل'},
 {key:'instagram',title:'اینستاگرام'}, {key:'website',title:'وب‌سایت'},
 {key:'description',title:'معرفی کسب‌وکار',big:true}
];
const editable = fields.filter(x=>!['type','gender'].includes(x.key));
const empty = (v:any) => v===null||v===undefined||String(v).trim()==='';
const statusColor = (s:string,t:any) => s==='APPROVED'?t.success:s==='REJECTED'||s==='SUSPENDED'?t.danger:s==='PENDING'?t.warning:t.muted;

export default function AdminBusinesses(){
 const [prefs]=usePrefs();const t=paletteFor(effectiveAudience(prefs),prefs.appearance);
 const s=useMemo(()=>makeStyles(t),[t]);
 const [rows,setRows]=useState<B[]>([]);const [filter,setFilter]=useState<F>('PENDING');const [query,setQuery]=useState('');
 const [busy,setBusy]=useState(false);const [saving,setSaving]=useState(false);
 const [chosen,setChosen]=useState<B|null>(null);const [editing,setEditing]=useState(false);const [form,setForm]=useState<Record<string,string>>({});
 const load=useCallback(async(q='')=>{
   setBusy(true);try {const data=await api('/v1/app-admin/crud/businesses?limit=500&q='+encodeURIComponent(q));setRows(Array.isArray(data.items)?data.items:[]);}
   catch(e:any){nobinAlert('خطا در دریافت کسب‌وکارها',e.message||'ارتباط با سرور برقرار نشد.');}
   finally{setBusy(false);}
 },[]);
 useFocusEffect(useCallback(()=>{void load();},[load]));
 const list=useMemo(()=>rows.filter(x=>(filter==='ALL'||x.status===filter)&&(!query.trim()||[x.name,x.city,x.province,x.phone,String(x.id)].some(v=>String(v||'').toLowerCase().includes(query.toLowerCase())))),[rows,filter,query]);
 const pending=rows.filter(x=>x.status==='PENDING').length;
 const open=async(row:B)=>{
   setChosen(row);setEditing(false);
   try{const j=await api('/v1/app-admin/crud/businesses/'+row.id);setChosen(j.item||row);}
   catch(e:any){nobinAlert('دریافت جزئیات',e.message);}
 };
 const close=()=>{if(saving)return;setChosen(null);setEditing(false);};
 const startEdit=()=>{if(!chosen)return;const d:Record<string,string>={};for(const x of editable)d[x.key]=String(chosen[x.key]??'');setForm(d);setEditing(true);};
 const saveEdit=async()=>{
   if(!chosen||saving)return;
   if(!form.name?.trim())return nobinAlert('اطلاعات ناقص','نام کسب‌وکار الزامی است.');
   const changes:Record<string,string|null>={};
   for(const x of editable){const value=(form[x.key]??'').trim();if(value!==String(chosen[x.key]??''))changes[x.key]=value||null;}
   if(!Object.keys(changes).length){setEditing(false);return;}
   setSaving(true);
   try{
     await api('/v1/app-admin/crud/businesses/'+chosen.id,{method:'PATCH',body:JSON.stringify(changes)});
     const j=await api('/v1/app-admin/crud/businesses/'+chosen.id);
     setChosen(j.item);setEditing(false);await load();nobinAlert('ویرایش ثبت شد','اطلاعات کسب‌وکار به‌روزرسانی شد.');
   }catch(e:any){nobinAlert('ویرایش ناموفق',e.message);}
   finally{setSaving(false);}
 };
 const changeStatus=(newStatus:'APPROVED'|'REJECTED'|'SUSPENDED'|'PENDING')=>{
   if(!chosen||saving||chosen.status===newStatus)return;
   const id=chosen.id, name=chosen.name;
   nobinAlert('تغییر وضعیت کسب‌وکار', 'وضعیت «'+name+'» به «'+(statuses[newStatus]||newStatus)+'» تغییر کند؟',[
     {text:'انصراف',style:'cancel'},
     {text:'بله، ثبت شود',style:newStatus==='REJECTED'||newStatus==='SUSPENDED'?'destructive':'default',onPress:async()=>{
       if(saving)return;
       setSaving(true);
       try{
         await api('/v1/app-admin/businesses/'+id+'/status',{method:'POST',body:JSON.stringify({status:newStatus})});
         const j=await api('/v1/app-admin/crud/businesses/'+id);
         if(String(j.item?.status)!==newStatus)throw new Error('سرور تغییر وضعیت را تأیید نکرد.');
         setChosen(j.item);await load();
         nobinAlert('وضعیت ثبت شد',statuses[newStatus]+'؛ اطلاعات از سرور مجدداً دریافت شد.');
       }catch(e:any){nobinAlert('عملیات ناموفق بود',e.message);}
       finally{setSaving(false);}
     }}
   ]);
 };
 const detail=(label:string,value:any)=>{
   if(empty(value))return null;
   return <View key={label} style={s.detailRow}><NText style={s.detailLabel}>{label}</NText><NText selectable style={s.detailValue}>{String(value)}</NText></View>;
 };
 const a=(status:string)=>({backgroundColor:statusColor(status,t)+'17',borderColor:statusColor(status,t)+'55'});
 return <SafeAreaView edges={['bottom']} style={s.root}>
  <View style={s.page}>
   <InternalHeader t={t} title="بررسی کسب‌وکارها" sub="مشاهده، ویرایش، تأیید و رد درخواست‌ها" hideSupport/>
   <View style={s.highlight}><View style={{flex:1}}><NText weight="bold" style={s.highlightTitle}>{faDigits(pending)} درخواست نیازمند بررسی</NText><NText style={s.highlightSub}>قبل از تغییر وضعیت، کارت کسب‌وکار را باز و اطلاعات آن را بررسی کنید.</NText></View><Ionicons name="shield-checkmark-outline" size={28} color={t.accent}/></View>
   <View style={s.searchBox}><TouchableOpacity accessibilityRole="button" accessibilityLabel="به‌روزرسانی" onPress={()=>load(query)}><Ionicons name="refresh" size={21} color={t.accent}/></TouchableOpacity><TextInput value={query} onChangeText={setQuery} placeholder="نام، شهر، شماره یا شناسه کسب‌وکار" placeholderTextColor={t.muted} style={s.search} returnKeyType="search" onSubmitEditing={()=>load(query)}/><Ionicons name="search-outline" size={19} color={t.muted}/></View>
   <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.filters}>{filters.map(x=><TouchableOpacity key={x.key} onPress={()=>setFilter(x.key)} style={[s.filter,filter===x.key&&s.filterOn]}><NText weight="semi" style={{fontSize:11,color:filter===x.key?'#fff':t.text}}>{x.title}</NText></TouchableOpacity>)}</ScrollView>
   <ScrollView style={{flex:1}} keyboardShouldPersistTaps="handled" refreshControl={<RefreshControl refreshing={busy} onRefresh={()=>load(query)}/>} contentContainerStyle={{gap:9,paddingBottom:36}}>
    {busy&&!rows.length?<ActivityIndicator color={t.accent} size="large"/>:list.map(row=><TouchableOpacity key={row.id} accessibilityRole="button" onPress={()=>open(row)} style={s.card}>
      <View style={s.cardHead}><View style={[s.avatar,{backgroundColor:t.accentSoft}]}>{row.logo_url?<Image source={{uri:String(row.logo_url),cache:'force-cache'}} style={s.avatarImage}/>:<Ionicons name="storefront-outline" size={23} color={t.accent}/>}</View><View style={{flex:1,gap:3}}><NText weight="bold" style={s.name}>{row.name}</NText><NText style={s.meta}>{[types[row.type]||row.type,row.province,row.city].filter(Boolean).join(' · ')}</NText></View><Ionicons name="chevron-back" size={18} color={t.muted}/></View>
      <View style={s.cardFoot}><NText style={s.meta}>کد {faDigits(row.id)} · {row.phone||'تلفن ثبت نشده'}</NText><View style={[s.chip,a(row.status)]}><NText style={{color:statusColor(row.status,t),fontSize:10}}>{statuses[row.status]||row.status}</NText></View></View>
    </TouchableOpacity>)}
    {!busy&&!list.length?<View style={s.empty}><Ionicons name="file-tray-outline" size={29} color={t.muted}/><NText style={s.meta}>کسب‌وکاری با این فیلتر پیدا نشد.</NText></View>:null}
   </ScrollView>
  </View>
  <Modal visible={!!chosen} animationType="slide" onRequestClose={close}>
   <SafeAreaView style={s.root} edges={['top','bottom']}><KeyboardAvoidingView style={{flex:1}} behavior={Platform.OS==='ios'?'padding':undefined}>
    <View style={s.sheetHead}><TouchableOpacity accessibilityLabel="بستن" onPress={close}><Ionicons name="close" color={t.text} size={25}/></TouchableOpacity><NText weight="bold" style={{color:t.text,fontSize:15}}>{editing?'ویرایش کسب‌وکار':'جزئیات کسب‌وکار'}</NText><View style={{width:24}}/></View>
    <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{padding:15,gap:11,paddingBottom:18}}>
     <View style={s.card}>
       <NText weight="bold" style={s.sheetTitle}>{chosen?.name||'—'}</NText>
       <NText style={s.meta}>شناسه {faDigits(chosen?.id||0)} · {statuses[chosen?.status||'']||chosen?.status}</NText>
     </View>
     {editing?<>
       {editable.map(f=><View key={f.key} style={s.field}><NText style={s.label}>{f.title}</NText><TextInput value={form[f.key]||''} onChangeText={value=>setForm(old=>({...old,[f.key]:value}))} multiline={!!f.big} placeholder={f.title} placeholderTextColor={t.muted} style={[s.input,f.big&&{minHeight:82,textAlignVertical:'top'}]}/></View>)}
       <NText style={s.help}>وضعیت تأیید یا رد از فرم ویرایش جداست تا اشتباهی تغییر نکند.</NText>
     </>:<View style={s.details}>
       {detail('مسئول',chosen?.manager_name)}
       {detail('شناسه مالک',chosen?.owner_user_id?faDigits(chosen.owner_user_id):null)}
       {detail('نوع فعالیت',types[chosen?.type||'']||chosen?.type)}
       {detail('مخاطب',genders[chosen?.gender||'']||chosen?.gender)}
       {detail('استان',chosen?.province)}
       {detail('شهر',chosen?.city)}
       {detail('نشانی',chosen?.address)}
       {detail('تلفن',chosen?.phone)}
       {detail('تلفن دوم',chosen?.alternate_phone)}
       {detail('ایمیل',chosen?.email)}
       {detail('وب‌سایت',chosen?.website)}
       {detail('اینستاگرام',chosen?.instagram)}
       {detail('توضیحات',chosen?.description)}
       {detail('ساعات کاری',chosen?.working_hours_text)}
       {detail('پارکینگ',chosen?.parking_info)}
       {detail('تاریخ ثبت',chosen?.created_at)}
       {detail('آخرین ویرایش',chosen?.updated_at)}
       {detail('تصویر لوگو',chosen?.logo_url)}
       {detail('تصویر کاور',chosen?.cover_url)}
      </View>}
    </ScrollView>
    <View style={s.actions}>
      {editing?<View style={s.actionRow}><Btn title="انصراف" t={t} secondary onPress={()=>setEditing(false)} disabled={saving}/><Btn title={saving?'در حال ذخیره...':'ذخیره ویرایش'} t={t} onPress={saveEdit} disabled={saving}/></View>:
      <>
       <Btn title="ویرایش مشخصات" t={t} secondary onPress={startEdit} disabled={saving} icon="create-outline"/>
       <View style={s.actionRow}>
        {chosen?.status==='APPROVED'?<Btn title="تعلیق" t={t} danger onPress={()=>changeStatus('SUSPENDED')} disabled={saving}/>:<Btn title="رد درخواست" t={t} danger onPress={()=>changeStatus('REJECTED')} disabled={saving||chosen?.status==='REJECTED'}/>}
        <Btn title="تأیید کسب‌وکار" t={t} onPress={()=>changeStatus('APPROVED')} disabled={saving||chosen?.status==='APPROVED'} icon="checkmark-circle-outline"/>
       </View>
       {chosen?.status==='REJECTED'||chosen?.status==='SUSPENDED'?<Btn title="بازگشت به بررسی" t={t} secondary onPress={()=>changeStatus('PENDING')} disabled={saving}/>:null}
      </>}
    </View>
   </KeyboardAvoidingView></SafeAreaView>
  </Modal>
 </SafeAreaView>;
}
function Btn({title,onPress,t,secondary=false,danger=false,disabled=false,icon}:any){return <TouchableOpacity accessibilityRole="button" disabled={disabled} onPress={onPress} style={{flex:1,minHeight:46,borderRadius:13,backgroundColor:danger?t.danger:secondary?t.card:t.accent,borderWidth:secondary?1:0,borderColor:t.line,flexDirection:'row-reverse',alignItems:'center',justifyContent:'center',gap:7,opacity:disabled?.45:1}}>{icon?<Ionicons name={icon} color={secondary?t.accent:'#fff'} size={17}/>:null}<NText weight="semi" style={{color:secondary?t.accent:'#fff',fontSize:11.5}}>{title}</NText></TouchableOpacity>}
const makeStyles=(t:any)=>StyleSheet.create({
 root:{flex:1,backgroundColor:t.bg},page:{flex:1,paddingHorizontal:14,paddingTop:12,gap:10},
 highlight:{backgroundColor:t.accentSoft,borderRadius:17,padding:14,flexDirection:'row-reverse',alignItems:'center',gap:10},
 highlightTitle:{fontSize:15,color:t.text,textAlign:'right'},highlightSub:{fontSize:10.5,color:t.muted,textAlign:'right',lineHeight:19},
 searchBox:{height:48,flexDirection:'row-reverse',gap:8,alignItems:'center',borderWidth:1,borderColor:t.line,backgroundColor:t.card,borderRadius:14,paddingHorizontal:11},
 search:{flex:1,textAlign:'right',fontFamily:'Vazirmatn_400Regular',fontSize:12,color:t.text},
 filters:{gap:7,flexDirection:'row-reverse',paddingBottom:4},
 filter:{borderRadius:11,backgroundColor:t.card,borderWidth:1,borderColor:t.line,paddingHorizontal:13,paddingVertical:9},
 filterOn:{backgroundColor:t.accent,borderColor:t.accent},
 card:{backgroundColor:t.card,borderWidth:1,borderColor:t.line,borderRadius:17,padding:13,gap:9},
 cardHead:{flexDirection:'row-reverse',alignItems:'center',gap:10},
 avatar:{width:50,height:50,borderRadius:15,alignItems:'center',justifyContent:'center',overflow:'hidden'},
 avatarImage:{width:50,height:50},
 name:{fontSize:13.5,textAlign:'right',color:t.text},
 meta:{fontSize:10.5,textAlign:'right',color:t.muted},
 cardFoot:{flexDirection:'row-reverse',justifyContent:'space-between',alignItems:'center',gap:10},
 chip:{borderWidth:1,borderRadius:10,paddingHorizontal:9,paddingVertical:5},
 empty:{alignItems:'center',padding:35,gap:12},
 sheetHead:{flexDirection:'row',justifyContent:'space-between',alignItems:'center',padding:16,borderBottomWidth:1,borderColor:t.line},
 sheetTitle:{fontSize:16,textAlign:'right',color:t.text},details:{backgroundColor:t.card,borderRadius:17,borderWidth:1,borderColor:t.line,paddingHorizontal:12},
 detailRow:{paddingVertical:11,borderBottomWidth:StyleSheet.hairlineWidth,borderBottomColor:t.line,gap:4},
 detailLabel:{fontSize:10.5,color:t.muted,textAlign:'right'},detailValue:{fontSize:12.5,color:t.text,textAlign:'right',lineHeight:22},
 field:{gap:5},label:{fontSize:11,color:t.muted,textAlign:'right'},
 input:{borderRadius:13,backgroundColor:t.card,borderWidth:1,borderColor:t.line,minHeight:46,paddingHorizontal:11,paddingVertical:8,textAlign:'right',color:t.text,fontSize:12,fontFamily:'Vazirmatn_400Regular'},
 help:{fontSize:11,color:t.muted,textAlign:'right'},
 actions:{paddingHorizontal:14,paddingTop:11,paddingBottom:Math.max(13,Platform.OS==='android'?16:12),backgroundColor:t.bg,borderTopWidth:1,borderColor:t.line,gap:8},
 actionRow:{flexDirection:'row-reverse',gap:8}
});
