import AsyncStorage from '@react-native-async-storage/async-storage';
import { defaultPrefs, normalizePrefs, type LocalPrefs } from './prefs';
const TOKEN='nobin_token_v2',USER='nobin_user_v2',PREFS='nobin_prefs_v2';
const prefListeners=new Set<(p:LocalPrefs)=>void>();
export async function getToken(){return (await AsyncStorage.getItem(TOKEN))||''}
export async function setSession(token:string,user:any){await AsyncStorage.multiSet([[TOKEN,token],[USER,JSON.stringify(user||{})]])}
export async function clearSession(){await AsyncStorage.multiRemove([TOKEN,USER])}
export async function getStoredUser(){try{return JSON.parse((await AsyncStorage.getItem(USER))||'{}')}catch{return {}}}
export async function saveStoredUser(user:any){await AsyncStorage.setItem(USER,JSON.stringify(user||{}))}
export async function getPrefs():Promise<LocalPrefs|null>{try{const v=await AsyncStorage.getItem(PREFS);if(!v)return null;return normalizePrefs({...defaultPrefs,...JSON.parse(v)})}catch{return null}}
export async function savePrefs(p:LocalPrefs){const next=normalizePrefs({...defaultPrefs,...p});await AsyncStorage.setItem(PREFS,JSON.stringify(next));prefListeners.forEach(fn=>fn(next));return next}
export function subscribePrefs(fn:(p:LocalPrefs)=>void){prefListeners.add(fn);return()=>{prefListeners.delete(fn)}}
