import AsyncStorage from '@react-native-async-storage/async-storage';
import { getToken } from './session';
const base=(process.env.EXPO_PUBLIC_API_URL||'https://picamo.ir/nobin_api').replace(/\/$/,'');
export const API_BASE=base;
export const hasApi=Boolean(base);
const CACHE_PREFIX='nobin_api_cache_v1:';
function cacheKey(path:string,token:string){return CACHE_PREFIX+(token?'auth:':'pub:')+path}
export async function api(path:string, init:RequestInit={}){
  if(!base) throw new Error('API_NOT_CONFIGURED');
  const url=`${base}${path.startsWith('/')?path:`/${path}`}`;
  const token=await getToken();
  const headers:any={Accept:'application/json',...(init.body?{'content-type':'application/json'}:{}),...(token?{Authorization:`Bearer ${token}`}:{}) ,...(init.headers||{})};
  const r=await fetch(url,{...init,headers});
  let j:any={}; try{j=await r.json()}catch{}
  if(!r.ok){const e:any=new Error(j.message||'خطا در ارتباط با سرور');e.status=r.status;e.code=j.code;e.payload=j;throw e}
  if((init.method||'GET').toUpperCase()!=='GET') await clearApiCache();
  return j;
}
export async function apiCached(path:string, ttlMs=180000, force=false){
  const token=await getToken(); const key=cacheKey(path,token);
  if(!force){try{const raw=await AsyncStorage.getItem(key);if(raw){const c=JSON.parse(raw);if(Date.now()-Number(c.ts||0)<ttlMs)return c.data}}catch{}}
  try{const data=await api(path);try{await AsyncStorage.setItem(key,JSON.stringify({ts:Date.now(),data}))}catch{}return data}
  catch(e){try{const raw=await AsyncStorage.getItem(key);if(raw)return JSON.parse(raw).data}catch{}throw e}
}
export async function clearApiCache(){try{const keys=await AsyncStorage.getAllKeys();const hit=keys.filter(k=>k.startsWith(CACHE_PREFIX));if(hit.length)await AsyncStorage.multiRemove(hit)}catch{}}
