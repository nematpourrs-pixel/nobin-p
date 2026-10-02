import AsyncStorage from '@react-native-async-storage/async-storage';
import type { LocalPrefs } from './prefs';
const TOKEN='nobin_token_v2',USER='nobin_user_v2',PREFS='nobin_prefs_v2';
export async function getToken(){return (await AsyncStorage.getItem(TOKEN))||''}
export async function setSession(token:string,user:any){await AsyncStorage.multiSet([[TOKEN,token],[USER,JSON.stringify(user||{})]])}
export async function clearSession(){await AsyncStorage.multiRemove([TOKEN,USER])}
export async function getStoredUser(){try{return JSON.parse((await AsyncStorage.getItem(USER))||'{}')}catch{return {}}}
export async function saveStoredUser(user:any){await AsyncStorage.setItem(USER,JSON.stringify(user||{}))}
export async function getPrefs():Promise<LocalPrefs|null>{try{const v=await AsyncStorage.getItem(PREFS);return v?JSON.parse(v):null}catch{return null}}
export async function savePrefs(p:LocalPrefs){await AsyncStorage.setItem(PREFS,JSON.stringify(p))}
