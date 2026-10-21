import { ReactNode, useRef } from 'react';
import { findNodeHandle, KeyboardAvoidingView, Platform, ScrollView, TextInput, View } from 'react-native';
import { NText } from './ui';

export function FormScreen({children,scrollRef}: {children:ReactNode;scrollRef:any}){
  return <KeyboardAvoidingView style={{flex:1}} behavior={Platform.OS==='ios'?'padding':'height'}>
    <ScrollView ref={scrollRef} contentContainerStyle={{padding:16,paddingBottom:360,gap:11}} keyboardShouldPersistTaps="always" keyboardDismissMode="none" showsVerticalScrollIndicator={false}>{children}</ScrollView>
  </KeyboardAvoidingView>
}
export function FormField({label,value,onChange,t,numeric=false,multiline=false,placeholder='',scrollRef}:any){
  const ref=useRef<TextInput>(null);
  const focus=()=>setTimeout(()=>{const node=findNodeHandle(ref.current);if(node)scrollRef?.current?.scrollResponderScrollNativeHandleToKeyboard?.(node,260,true)},260);
  return <View style={{gap:5}}>
    <NText weight="medium" style={{fontSize:11.3,color:t.muted,textAlign:'right'}}>{label}</NText>
    <TextInput ref={ref} value={value} onChangeText={onChange} onFocus={focus} keyboardType={numeric?'number-pad':'default'} multiline={multiline} textAlign="right" placeholder={placeholder} placeholderTextColor={t.muted} style={{minHeight:multiline?96:48,maxHeight:multiline?170:48,borderWidth:1,borderColor:t.line,backgroundColor:t.card,borderRadius:14,paddingHorizontal:12,paddingVertical:multiline?10:0,fontFamily:'Vazirmatn_400Regular',fontSize:12.5,color:t.text,textAlignVertical:multiline?'top':'center'}}/>
  </View>
}
export const asciiDigits=(v:string)=>v.replace(/[۰-۹]/g,d=>'۰۱۲۳۴۵۶۷۸۹'.indexOf(d).toString()).replace(/[٠-٩]/g,d=>'٠١٢٣٤٥٦٧٨٩'.indexOf(d).toString());
export const moneyDigits=(v:string)=>asciiDigits(v).replace(/\D/g,'');
export const moneyInput=(v:any)=>{const d=moneyDigits(String(v??''));return d?d.replace(/\B(?=(\d{3})+(?!\d))/g,','):''};
export const moneyValue=(v:any)=>Number(moneyDigits(String(v??''))||0);