import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useFonts, Vazirmatn_400Regular, Vazirmatn_500Medium, Vazirmatn_600SemiBold, Vazirmatn_700Bold, Vazirmatn_800ExtraBold } from '@expo-google-fonts/vazirmatn';

export default function Layout(){
  const [loaded]=useFonts({Vazirmatn_400Regular,Vazirmatn_500Medium,Vazirmatn_600SemiBold,Vazirmatn_700Bold,Vazirmatn_800ExtraBold});
  if(!loaded)return null;
  return <SafeAreaProvider><StatusBar style="dark"/><Stack screenOptions={{headerTitleAlign:'center',headerShadowVisible:false,headerTintColor:'#394643',headerStyle:{backgroundColor:'#F8FAF9'},headerTitleStyle:{fontFamily:'Vazirmatn_600SemiBold',fontSize:16},contentStyle:{backgroundColor:'#F8FAF9'},animation:'slide_from_right'}}>
    <Stack.Screen name="index" options={{headerShown:false}}/>
    <Stack.Screen name="onboarding" options={{headerShown:false}}/>
    <Stack.Screen name="search" options={{headerShown:false}}/>
    <Stack.Screen name="bookings" options={{headerShown:false}}/>
    <Stack.Screen name="profile" options={{headerShown:false}}/>
    <Stack.Screen name="preferences" options={{title:'شخصی‌سازی'}}/>
    <Stack.Screen name="login" options={{title:'ورود به نوبین'}}/>
    <Stack.Screen name="assistant" options={{title:'دستیار نوبین'}}/>
    <Stack.Screen name="business/[id]" options={{title:''}}/>
    <Stack.Screen name="booking" options={{title:'رزرو نوبت'}}/>
    <Stack.Screen name="business-dashboard" options={{title:'مدیریت کسب‌وکار'}}/>
    <Stack.Screen name="business-register" options={{title:'راه‌اندازی کسب‌وکار'}}/>
  </Stack></SafeAreaProvider>
}
