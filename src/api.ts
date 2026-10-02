import { getToken } from './session';
const base=(process.env.EXPO_PUBLIC_API_URL||'https://picamo.ir/nobin_api').replace(/\/$/,'');
export const API_BASE=base;
export const hasApi=Boolean(base);
export async function api(path:string, init:RequestInit={}){
  if(!base) throw new Error('API_NOT_CONFIGURED');
  const url=`${base}${path.startsWith('/')?path:`/${path}`}`;
  const token=await getToken();
  const headers:any={Accept:'application/json',...(init.body?{'content-type':'application/json'}:{}),...(token?{Authorization:`Bearer ${token}`}:{}) ,...(init.headers||{})};
  const r=await fetch(url,{...init,headers});
  let j:any={}; try{j=await r.json()}catch{}
  if(!r.ok){const e:any=new Error(j.message||'خطا در ارتباط با سرور');e.status=r.status;e.code=j.code;e.payload=j;throw e}
  return j;
}
