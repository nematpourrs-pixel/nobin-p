import { Ionicons } from '@expo/vector-icons';
import { useEffect, useMemo, useState } from 'react';
import { Modal, ScrollView, StyleSheet, TouchableOpacity, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NText } from './ui';
import { faDigits } from './dateFa';

export function TimeInput({label,value,onChange,t}:{label:string;value:string;onChange:(v:string)=>void;t:any}){
  const[open,setOpen]=useState(false);
  return <View style={{gap:5}}><NText weight="medium" style={{fontSize:11.2,color:t.muted,textAlign:'right'}}>{label}</NText>
    <TouchableOpacity activeOpacity={.72} onPress={()=>setOpen(true)} style={{height:50,borderWidth:1,borderColor:t.line,backgroundColor:t.card,borderRadius:14,paddingHorizontal:12,flexDirection:'row-reverse',alignItems:'center',justifyContent:'space-between'}}>
      <NText weight="semi" style={{fontSize:15,color:t.text}}>{faDigits(value)}</NText><Ionicons name="time-outline" size={19} color={t.accent}/>
    </TouchableOpacity>
    <Picker visible={open} value={value} t={t} title={label} onClose={()=>setOpen(false)} onDone={(v:string)=>{onChange(v);setOpen(false)}}/>
  </View>
}
function Picker({visible,value,t,title,onClose,onDone}:any){
  const parts=String(value||'09:00').split(':');const[h,setH]=useState(Number(parts[0]||9));const[m,setM]=useState(Number(parts[1]||0));
  const insets=useSafeAreaInsets();const {height}=useWindowDimensions();
  useEffect(()=>{const p=String(value||'09:00').split(':');setH(Number(p[0]||9));setM(Number(p[1]||0))},[value,visible]);
  const minutes=useMemo(()=>Array.from(new Set([0,10,15,20,30,40,45,50,m])).filter(x=>x>=0&&x<60).sort((a,b)=>a-b),[m]);
  const done=()=>onDone(String(h).padStart(2,'0')+':'+String(m).padStart(2,'0'));
  return <Modal visible={visible} transparent animationType="slide" statusBarTranslucent={false} navigationBarTranslucent={false} onRequestClose={onClose}>
    <View style={s.overlay}><View style={[s.sheet,{backgroundColor:t.bg,borderColor:t.line,maxHeight:Math.max(320,height-insets.top-28),paddingBottom:Math.max(insets.bottom,24)+12}]}>
      <View style={s.head}><TouchableOpacity accessibilityRole="button" accessibilityLabel="بستن انتخاب ساعت" onPress={onClose}><Ionicons name="close" size={23} color={t.text}/></TouchableOpacity><NText weight="bold" style={{fontSize:15,color:t.text}}>{title}</NText></View>
      <ScrollView style={s.scroller} contentContainerStyle={s.scrollContent} keyboardShouldPersistTaps="always" showsVerticalScrollIndicator={false}>
        <NText style={{fontSize:11,color:t.muted,textAlign:'right'}}>ساعت</NText>
        <View style={s.grid}>{Array.from({length:24},(_,i)=>i).map(x=><TouchableOpacity key={x} accessibilityRole="button" accessibilityState={{selected:h===x}} onPress={()=>setH(x)} style={[s.hour,{borderColor:h===x?t.accent:t.line,backgroundColor:h===x?t.accentSoft:t.card}]}><NText weight={h===x?'bold':'regular'} style={{fontSize:11,color:h===x?t.accent:t.text}}>{faDigits(String(x).padStart(2,'0'))}</NText></TouchableOpacity>)}</View>
        <NText style={{fontSize:11,color:t.muted,textAlign:'right'}}>دقیقه</NText>
        <View style={s.minutes}>{minutes.map(x=><TouchableOpacity key={x} accessibilityRole="button" accessibilityState={{selected:m===x}} onPress={()=>setM(x)} style={[s.minute,{borderColor:m===x?t.accent:t.line,backgroundColor:m===x?t.accentSoft:t.card}]}><NText weight={m===x?'bold':'regular'} style={{fontSize:12,color:m===x?t.accent:t.text}}>{faDigits(String(x).padStart(2,'0'))}</NText></TouchableOpacity>)}</View>
        <View style={[s.preview,{backgroundColor:t.card,borderColor:t.line}]}><Ionicons name="time-outline" size={21} color={t.accent}/><NText weight="bold" style={{fontSize:20,color:t.text}}>{faDigits(String(h).padStart(2,'0')+':'+String(m).padStart(2,'0'))}</NText></View>
      </ScrollView>
      <View style={s.actionFooter}><TouchableOpacity accessibilityRole="button" onPress={done} style={[s.done,{backgroundColor:t.accent}]}><NText weight="bold" style={{fontSize:12.5,color:'#fff'}}>تأیید ساعت</NText></TouchableOpacity></View>
    </View></View>
  </Modal>
}
const s=StyleSheet.create({
 overlay:{flex:1,backgroundColor:'rgba(0,0,0,.42)',justifyContent:'flex-end'},
 sheet:{borderTopLeftRadius:26,borderTopRightRadius:26,borderWidth:1,paddingHorizontal:18,paddingTop:18,gap:10,width:'100%'},
 head:{flexDirection:'row',justifyContent:'space-between',alignItems:'center',paddingBottom:5},
 scroller:{flexShrink:1},scrollContent:{gap:10,paddingBottom:10},
 grid:{flexDirection:'row-reverse',flexWrap:'wrap',gap:6},
 hour:{width:'14%',height:38,borderRadius:10,borderWidth:1,alignItems:'center',justifyContent:'center'},
 minutes:{flexDirection:'row-reverse',flexWrap:'wrap',gap:7},
 minute:{minWidth:48,height:40,borderRadius:11,borderWidth:1,alignItems:'center',justifyContent:'center'},
 preview:{height:54,borderRadius:14,borderWidth:1,flexDirection:'row-reverse',gap:8,alignItems:'center',justifyContent:'center',marginTop:2},
 actionFooter:{borderTopWidth:StyleSheet.hairlineWidth,borderTopColor:'#DDCFD5',paddingTop:10},
 done:{height:52,borderRadius:14,alignItems:'center',justifyContent:'center'}
});
