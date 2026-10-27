import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { API_BASE } from './api';

const ID_KEY='nobin_anonymous_install_id_v1';
const PING_KEY='nobin_install_last_ping_v1';
const alphabet='abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
function idNew():string{
 let value='';for(let i=0;i<36;i++)value+=alphabet[Math.floor(Math.random()*alphabet.length)];
 return value;
}
/** Best-effort anonymous install count. No hardware ID or private user data. */
export async function trackFirstPartyInstall():Promise<void>{
 if(Platform.OS!=='android')return;
 try{
   const now=Date.now();
   if(now-Number(await AsyncStorage.getItem(PING_KEY)||0)<18*60*60*1000)return;
   let id=await AsyncStorage.getItem(ID_KEY);
   if(!id){id=idNew();await AsyncStorage.setItem(ID_KEY,id);}
   const response=await fetch(API_BASE+'/v1/telemetry/install',{
     method:'POST',
     headers:{'content-type':'application/json',accept:'application/json'},
     body:JSON.stringify({installation_id:id,platform:'ANDROID',app_version:'2.2.8'})
   });
   if(response.ok)await AsyncStorage.setItem(PING_KEY,String(now));
 }catch{
   // Telemetry must not delay or break application launch.
 }
}
