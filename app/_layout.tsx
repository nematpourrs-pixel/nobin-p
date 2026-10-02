import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useFonts, Vazirmatn_400Regular, Vazirmatn_500Medium, Vazirmatn_600SemiBold, Vazirmatn_700Bold, Vazirmatn_800ExtraBold } from '@expo-google-fonts/vazirmatn';
import { api } from '../src/api';
import { defaultPrefs } from '../src/prefs';
import { getPrefs, getToken, savePrefs } from '../src/session';

export default function Layout(){
  const [loaded]=useFonts({Vazirmatn_400Regular,Vazirmatn_500Medium,Vazirmatn_600SemiBold,Vazirmatn_700Bold,Vazirmatn_800ExtraBold});
  useEffect(()=>{let active=true;(async()=>{try{if(!(await getToken())||!active)return;const j=await api('/v1/me');const g=j.user?.profile_gender;if((g==='FEMALE'||g==='MALE')&&active){const p=(await getPrefs())||defaultPrefs;await savePrefs({...p,profileGender:g,audience:g})}}catch{}})();return()=>{active=false}},[]);
  if(!loaded)return null;
  return <SafeAreaProvider><StatusBar style="dark"/><Stack screenOptions={{headerTitleAlign:'center',headerShadowVisible:false,headerTintColor:'#394643',headerStyle:{backgroundColor:'#F8FAF9'},headerTitleStyle:{fontFamily:'Vazirmatn_600SemiBold',fontSize:16},contentStyle:{backgroundColor:'#F8FAF9'},animation:'fade',headerBackButtonDisplayMode:'minimal'}}>
    <Stack.Screen name="index" options={{headerShown:false,animation:'none',gestureEnabled:false}}/>
    <Stack.Screen name="onboarding" options={{headerShown:false,animation:'fade'}}/>
    <Stack.Screen name="search" options={{headerShown:false,animation:'none',gestureEnabled:false}}/>
    <Stack.Screen name="blog" options={{headerShown:false,animation:'none',gestureEnabled:false}}/>
    <Stack.Screen name="bookings" options={{headerShown:false,animation:'none',gestureEnabled:false}}/>
    <Stack.Screen name="profile" options={{headerShown:false,animation:'none',gestureEnabled:false}}/>
    <Stack.Screen name="location-filter" options={{headerShown:false,animation:'fade'}}/>
    <Stack.Screen name="preferences" options={{title:'شخصی‌سازی',animation:'fade'}}/>
    <Stack.Screen name="login" options={{title:'ورود به نوبین',animation:'fade'}}/>
    <Stack.Screen name="assistant" options={{title:'دستیار نوبین',animation:'fade'}}/>
    <Stack.Screen name="business/[id]" options={{title:'',animation:'fade'}}/>
    <Stack.Screen name="booking" options={{title:'رزرو نوبت',animation:'fade'}}/>
    <Stack.Screen name="business-dashboard" options={{title:'مدیریت کسب‌وکار',animation:'fade'}}/>
    <Stack.Screen name="business-register" options={{title:'راه‌اندازی کسب‌وکار',animation:'fade'}}/>
    <Stack.Screen name="business-manage" options={{title:'مدیریت کسب‌وکار',animation:'fade'}}/>
    <Stack.Screen name="business-post-create" options={{headerShown:false,animation:'fade'}}/>
  </Stack></SafeAreaProvider>
}
