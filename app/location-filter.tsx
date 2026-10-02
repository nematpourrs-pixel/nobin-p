import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { IRAN_LOCATIONS, IRAN_PROVINCES } from '../src/iranLocations';
import { defaultPrefs, effectiveAudience, paletteFor, type LocalPrefs } from '../src/prefs';
import { getPrefs, savePrefs } from '../src/session';
import { useEffect } from 'react';
import { NText, MiniBack } from '../src/ui';

export default function LocationFilter(){
 const[prefs,setPrefs]=useState<LocalPrefs>(defaultPrefs);const[province,setProvince]=useState('');const[query,setQuery]=useState('');const t=paletteFor(effectiveAudience(prefs),prefs.appearance);const s=useMemo(()=>styles(t),[prefs]);
 useEffect(()=>{getPrefs().then(p=>{if(p){setPrefs(p);setProvince(p.preferredProvince||'')}})},[]);
 const provinces=IRAN_PROVINCES.filter(x=>!query||x.includes(query));
 const cities=province?(IRAN_LOCATIONS[province]||[]).filter(x=>!query||x.includes(query)):[];
 const chooseProvince=(p:string)=>{setProvince(p);setQuery('')};
 const chooseCity=async(city:string)=>{const next={...prefs,preferredProvince:province,preferredCity:city};await savePrefs(next);setPrefs(next);router.back()};
 const allIran=async()=>{const next={...prefs,preferredProvince:'',preferredCity:''};await savePrefs(next);router.back()};
 return <SafeAreaView edges={['bottom']} style={s.root}><View style={s.wrap}><View style={s.head}><MiniBack t={t}/><View style={{flex:1}}><NText weight="bold" style={s.h1}>{province?'انتخاب شهر':'انتخاب استان'}</NText><NText style={s.sub}>این محدوده تا زمانی که تغییرش ندهی در نوبین حفظ می‌شود.</NText></View></View><View style={s.search}><Ionicons name="search-outline" size={18} color={t.muted}/><TextInput value={query} onChangeText={setQuery} style={s.input} placeholder={province?'نام شهر...':'نام استان...'} placeholderTextColor={t.muted}/></View><TouchableOpacity onPress={allIran} style={s.all}><Ionicons name="map-outline" size={18} color={t.accent}/><NText weight="semi" style={s.allT}>سراسر ایران</NText></TouchableOpacity><ScrollView contentContainerStyle={s.list} keyboardShouldPersistTaps="handled">{province?<><TouchableOpacity onPress={()=>{setProvince('');setQuery('')}} style={s.backProvince}><Ionicons name="chevron-forward" size={17} color={t.accent}/><NText weight="medium" style={s.backT}>{province} · تغییر استان</NText></TouchableOpacity>{cities.map(city=><TouchableOpacity key={city} onPress={()=>chooseCity(city)} style={s.item}><Ionicons name={prefs.preferredCity===city?'radio-button-on':'radio-button-off'} size={18} color={prefs.preferredCity===city?t.accent:t.muted}/><NText weight="medium" style={s.itemT}>{city}</NText></TouchableOpacity>)}</>:provinces.map(p=><TouchableOpacity key={p} onPress={()=>chooseProvince(p)} style={s.item}><Ionicons name="chevron-back" size={17} color={t.muted}/><NText weight="medium" style={s.itemT}>{p}</NText></TouchableOpacity>)}</ScrollView></View></SafeAreaView>
}
const styles=(t:any)=>StyleSheet.create({root:{flex:1,backgroundColor:t.bg},wrap:{flex:1,padding:18,gap:12},head:{flexDirection:'row-reverse',alignItems:'center',gap:10},h1:{fontSize:20,color:t.text,textAlign:'right'},sub:{fontSize:11.5,lineHeight:19,color:t.muted,textAlign:'right'},search:{height:48,borderWidth:1,borderColor:t.line,backgroundColor:t.card,borderRadius:15,flexDirection:'row-reverse',alignItems:'center',paddingHorizontal:12,gap:7},input:{flex:1,textAlign:'right',fontFamily:'Vazirmatn_400Regular',fontSize:13,color:t.text},all:{height:46,borderWidth:1,borderColor:t.line,backgroundColor:t.card,borderRadius:14,flexDirection:'row-reverse',alignItems:'center',justifyContent:'center',gap:6},allT:{fontSize:12.5,color:t.accent},list:{gap:7,paddingBottom:24},item:{minHeight:47,borderWidth:1,borderColor:t.line,backgroundColor:t.card,borderRadius:14,paddingHorizontal:13,flexDirection:'row',alignItems:'center',justifyContent:'space-between'},itemT:{fontSize:12.5,color:t.text,textAlign:'right'},backProvince:{height:43,flexDirection:'row-reverse',alignItems:'center',gap:5,alignSelf:'flex-end'},backT:{fontSize:11.5,color:t.accent}})
