import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import type { ReactNode } from 'react';
import { Linking, StyleSheet, Text, type TextProps, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export const fonts={regular:'Vazirmatn_400Regular',medium:'Vazirmatn_500Medium',semi:'Vazirmatn_600SemiBold',bold:'Vazirmatn_700Bold',extra:'Vazirmatn_800ExtraBold'} as const;
export type FontWeight=keyof typeof fonts;
export function NText({style,weight='regular',...props}:TextProps&{weight?:FontWeight}){return <Text {...props} style={[{fontFamily:fonts[weight],writingDirection:'rtl'},style]}/>}

export function PageTitle({title,sub,right}: {title:string;sub?:string;right?:ReactNode}){return <View style={u.titleRow}><View style={{flex:1}}><NText weight="bold" style={u.title}>{title}</NText>{sub?<NText style={u.sub}>{sub}</NText>:null}</View>{right}</View>}

const tabs=[
  {key:'home',label:'خانه',icon:'home-outline',activeIcon:'home',route:'/'},
  {key:'search',label:'جستجو',icon:'search-outline',activeIcon:'search',route:'/search'},
  {key:'blog',label:'بلاگ',icon:'newspaper-outline',activeIcon:'newspaper',route:'/blog'},
  {key:'bookings',label:'نوبت‌ها',icon:'calendar-outline',activeIcon:'calendar',route:'/bookings'},
  {key:'profile',label:'حساب',icon:'person-outline',activeIcon:'person',route:'/profile'},
] as const;
export function BottomNav({active,t}: {active:string;t:any}){return <SafeAreaView edges={['bottom']} style={[u.navSafe,{backgroundColor:t.card,borderTopColor:t.line}]}><View style={u.nav}>{tabs.map(x=>{const on=active===x.key;return <TouchableOpacity accessibilityRole="button" accessibilityState={{selected:on}} activeOpacity={.72} key={x.key} style={u.navItem} onPress={()=>{if(!on)router.replace(x.route as any)}}><Ionicons name={(on?x.activeIcon:x.icon) as any} size={20} color={on?t.accent:t.muted}/><NText weight={on?'semi':'medium'} style={[u.navLabel,{color:on?t.accent:t.muted}]}>{x.label}</NText></TouchableOpacity>})}</View></SafeAreaView>}

export function MiniBack({t,onPress}: {t:any;onPress?:()=>void}){return <TouchableOpacity activeOpacity={.7} onPress={onPress||(()=>router.back())} style={[u.back,{borderColor:t.line,backgroundColor:t.card}]}><Ionicons name="chevron-forward" size={20} color={t.text}/></TouchableOpacity>}
export function SupportButton({t,label=false}: {t:any;label?:boolean}){return <TouchableOpacity accessibilityLabel="ارتباط با پشتیبانی" activeOpacity={.72} onPress={()=>Linking.openURL('https://ble.ir/nobin_bot?start=support')} style={[u.support,{borderColor:t.line,backgroundColor:t.card},label&&u.supportWide]}><Ionicons name="headset-outline" size={19} color={t.accent}/>{label?<NText weight="semi" style={{fontSize:11.5,color:t.accent}}>پشتیبانی</NText>:null}</TouchableOpacity>}
export function InternalHeader({t,title,sub}: {t:any;title?:string;sub?:string}){return <View style={u.internal}><MiniBack t={t}/><View style={{flex:1}}>{title?<NText weight="semi" style={[u.internalTitle,{color:t.text}]}>{title}</NText>:null}{sub?<NText style={[u.internalSub,{color:t.muted}]}>{sub}</NText>:null}</View><SupportButton t={t}/></View>}

export function Pill({children,t,icon,onPress}: {children:ReactNode;t:any;icon?:any;onPress?:()=>void}){const body=<View style={[u.pill,{backgroundColor:t.accentSoft}]}>{icon?<Ionicons name={icon} size={15} color={t.accent}/>:null}<NText weight="semi" style={{fontSize:12,color:t.accent}}>{children}</NText></View>;return onPress?<TouchableOpacity activeOpacity={.7} onPress={onPress}>{body}</TouchableOpacity>:body}

const u=StyleSheet.create({titleRow:{flexDirection:'row-reverse',alignItems:'center',justifyContent:'space-between',gap:12},title:{fontSize:22,lineHeight:32,textAlign:'right'},sub:{fontSize:12.5,lineHeight:21,textAlign:'right',marginTop:2,opacity:.8},navSafe:{borderTopWidth:StyleSheet.hairlineWidth},nav:{height:58,flexDirection:'row-reverse',alignItems:'center',justifyContent:'space-around',paddingHorizontal:4},navItem:{minWidth:54,height:52,alignItems:'center',justifyContent:'center',gap:3},navLabel:{fontSize:9.8,lineHeight:14},back:{width:38,height:38,borderRadius:19,borderWidth:1,alignItems:'center',justifyContent:'center'},support:{width:40,height:40,borderRadius:14,borderWidth:1,alignItems:'center',justifyContent:'center'},supportWide:{width:'auto',height:40,paddingHorizontal:11,flexDirection:'row-reverse',gap:6},internal:{flexDirection:'row-reverse',alignItems:'center',gap:9},internalTitle:{fontSize:14.5,textAlign:'right'},internalSub:{fontSize:10.5,lineHeight:17,textAlign:'right'},pill:{height:32,borderRadius:16,paddingHorizontal:10,flexDirection:'row-reverse',alignItems:'center',gap:5}});
