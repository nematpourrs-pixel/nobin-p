import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import type { ReactNode } from 'react';
import { StyleSheet, Text, type TextProps, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export const fonts={regular:'Vazirmatn_400Regular',medium:'Vazirmatn_500Medium',semi:'Vazirmatn_600SemiBold',bold:'Vazirmatn_700Bold',extra:'Vazirmatn_800ExtraBold'} as const;
export type FontWeight=keyof typeof fonts;
export function NText({style,weight='regular',...props}:TextProps&{weight?:FontWeight}){return <Text {...props} style={[{fontFamily:fonts[weight],writingDirection:'rtl'},style]}/>}

export function PageTitle({title,sub,right}: {title:string;sub?:string;right?:ReactNode}){return <View style={u.titleRow}><View style={{flex:1}}><NText weight="bold" style={u.title}>{title}</NText>{sub?<NText style={u.sub}>{sub}</NText>:null}</View>{right}</View>}

const tabs=[
  {key:'home',label:'خانه',icon:'home-outline',activeIcon:'home',route:'/'},
  {key:'search',label:'جستجو',icon:'search-outline',activeIcon:'search',route:'/search'},
  {key:'bookings',label:'نوبت‌ها',icon:'calendar-outline',activeIcon:'calendar',route:'/bookings'},
  {key:'profile',label:'حساب',icon:'person-outline',activeIcon:'person',route:'/profile'},
] as const;
export function BottomNav({active,t}: {active:string;t:any}){return <SafeAreaView edges={['bottom']} style={[u.navSafe,{backgroundColor:t.card,borderTopColor:t.line}]}><View style={u.nav}>{tabs.map(x=>{const on=active===x.key;return <TouchableOpacity accessibilityRole="button" accessibilityState={{selected:on}} activeOpacity={.72} key={x.key} style={u.navItem} onPress={()=>{if(!on)router.replace(x.route as any)}}><Ionicons name={(on?x.activeIcon:x.icon) as any} size={21} color={on?t.accent:t.muted}/><NText weight={on?'semi':'medium'} style={[u.navLabel,{color:on?t.accent:t.muted}]}>{x.label}</NText></TouchableOpacity>})}</View></SafeAreaView>}

export function MiniBack({t,onPress}: {t:any;onPress?:()=>void}){return <TouchableOpacity activeOpacity={.7} onPress={onPress||(()=>router.back())} style={[u.back,{borderColor:t.line,backgroundColor:t.card}]}><Ionicons name="chevron-forward" size={20} color={t.text}/></TouchableOpacity>}

export function Pill({children,t,icon,onPress}: {children:ReactNode;t:any;icon?:any;onPress?:()=>void}){const body=<View style={[u.pill,{backgroundColor:t.accentSoft}]}>{icon?<Ionicons name={icon} size={15} color={t.accent}/>:null}<NText weight="semi" style={{fontSize:12,color:t.accent}}>{children}</NText></View>;return onPress?<TouchableOpacity activeOpacity={.7} onPress={onPress}>{body}</TouchableOpacity>:body}

const u=StyleSheet.create({titleRow:{flexDirection:'row-reverse',alignItems:'center',justifyContent:'space-between',gap:12},title:{fontSize:22,lineHeight:32,textAlign:'right'},sub:{fontSize:12.5,lineHeight:21,textAlign:'right',marginTop:2,opacity:.8},navSafe:{borderTopWidth:StyleSheet.hairlineWidth},nav:{height:58,flexDirection:'row-reverse',alignItems:'center',justifyContent:'space-around',paddingHorizontal:12},navItem:{minWidth:62,height:52,alignItems:'center',justifyContent:'center',gap:3},navLabel:{fontSize:10.5,lineHeight:15},back:{width:38,height:38,borderRadius:19,borderWidth:1,alignItems:'center',justifyContent:'center'},pill:{height:32,borderRadius:16,paddingHorizontal:10,flexDirection:'row-reverse',alignItems:'center',gap:5}});
