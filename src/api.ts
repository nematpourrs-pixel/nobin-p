const base=(process.env.EXPO_PUBLIC_API_URL||'https://picamo.ir/nobin_api').replace(/\/$/,'');
export const API_BASE=base;
export const hasApi=Boolean(base);
export async function api(path:string, init:RequestInit={}){
  if(!base) throw new Error('API_NOT_CONFIGURED');
  const url=`${base}${path.startsWith('/')?path:`/${path}`}`;
  const headers:any={Accept:'application/json',...(init.body?{'content-type':'application/json'}:{}),...(init.headers||{})};
  const r=await fetch(url,{...init,headers});
  if(!r.ok){let msg='خطا در ارتباط با سرور'; try{const j=await r.json(); msg=j.message||msg}catch{} throw new Error(msg)}
  return r.json();
}
