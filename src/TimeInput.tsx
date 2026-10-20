import { Ionicons } from '@expo/vector-icons';
import { useEffect, useMemo, useState } from 'react';
import { Modal, StyleSheet, TouchableOpacity, View } from 'react-native';
import { NText } from './ui';

export function TimeInput({label,value,onChange,t}:{label:string;value:string;onChange:(v:string)=>void;t:any}){
  const[open,setOpen]=useState(false);
  return <View style={{gap:5}}><NText weight="medium" style={{fontSize:11.2,color:t.muted,textAlign:'right'}}>{label}</NText>
    <TouchableOpacity activeOpacity={.72} onPress={()=>setOpen(true)} style={{height:50,borderWidth:1,borderColor:t.line,backgroundColor:t.card,borderRadius:14,paddingHorizontal:12,flexDirection:'row-reverse',alignItems:'center',justifyContent:'space-between'}}>
      <NText weight="semi" style={{fontSize:15,color:t.text}}>{value}</NText><Ionicons name="time-outline" size={19} color={t.accent}/>
    </TouchableOpacity>
    <Picker visible={open} value={value} t={t} title={label} onClose={()=>setOpen(false)} onDone={v=>{onChange(v);setOpen(false)}}/>
  </View>
}
function Picker({visible,value,t,title,onClose,onDone}:any){
  const parts=String(value||'09:00').split(':');const[h,setH]=useState(Number(parts[0]||9));const[m,setM]=useState(Number(parts[1]||0));
  useEffect(()=>{const p=String(value||'09:00').split(':');setH(Number(p[0]||9));setM(Number(p[1]||0))},[value,visible]);
  const minutes=useMemo(()=>Array.from(new Set([0,10,15,20,30,40,45,50,m])).filter(x=>x>=0&&x<60).sort((a,b)=>a-b),[m]);
  const done=()=>onDone(String(h).padStart(2,'0')+':'+String(m).padStart(2,'0'));
  return <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}><View style={s.overlay}><View style={[s.sheet,{backgroundColor:t.bg,borderColor:t.line}]}>
    <View style={s.head}><TouchableOpacity onPress={onClose}><Ionicons name="close" size={23} color={t.text}/></TouchableOpacity><NText weight="bold" style={{fontSize:15,color:t.text}}>{title}</NText></View>
    <NText style={{fontSize:11,color:t.muted,textAlign:'right'}}>ساعت</NText><View style={s.grid}>{Array.from({length:24},(_,i)=>i).map(x=><TouchableOpacity key={x} onPress={()=>setH(x)} style={[s.hour,{borderColor:h===x?t.accent:t.line,backgroundColor:h===x?t.accentSoft:t.card}]}><NText weight={h===x?'bold':'regular'} style={{fontSize:11,color:h===x?t.accent:t.text}}>{String(x).padStart(2,'0')}</NText></TouchableOpacity>)}</View>
    <NText style={{fontSize:11,color:t.muted,textAlign:'right'}}>دقیقه</NText><View style={s.minutes}>{minutes.map(x=><TouchableOpacity key={x} onPress={()=>setM(x)} style={[s.minute,{borderColor:m===x?t.accent:t.line,backgroundColor:m===x?t.accentSoft:t.card}]}><NText weight={m===x?'bold':'regular'} style={{fontSize:12,color:m===x?t.accent:t.text}}>{String(x).padStart(2,'0')}</NText></TouchableOpacity>)}</View>
    <View style={[s.preview,{backgroundColor:t.card,borderColor:t.line}]}><Ionicons name="time-outline" size={21} color={t.accent}/><NText weight="bold" style={{fontSize:20,color:t.text}}>{String(h).padStart(2,'0')}:{String(m).padStart(2,'0')}</NText></View>
    <TouchableOpacity onPress={done} style={[s.done,{backgroundColor:t.accent}]}><NText weight="bold" style={{fontSize:12.5,color:'#fff'}}>تأیید ساعت</NText></TouchableOpacity>
  </View></View></Modal>
}
const s=StyleSheet.create({overlay:{flex:1,backgroundColor:'rgba(0,0,0,.35)',justifyContent:'flex-end'},sheet:{borderTopLeftRadius:26,borderTopRightRadius:26,borderWidth:1,padding:18,paddingBottom:28,gap:10},head:{flexDirection:'row',justifyContent:'space-between',alignItems:'center'},grid:{flexDirection:'row-reverse',flexWrap:'wrap',gap:6},hour:{width:'14%',height:38,borderRadius:10,borderWidth:1,alignItems:'center',justifyContent:'center'},minutes:{flexDirection:'row-reverse',flexWrap:'wrap',gap:7},minute:{minWidth:48,height:40,borderRadius:11,borderWidth:1,alignItems:'center',justifyContent:'center'},preview:{height:54,borderRadius:14,borderWidth:1,flexDirection:'row-reverse',gap:8,alignItems:'center',justifyContent:'center'},done:{height:48,borderRadius:14,alignItems:'center',justifyContent:'center'}});