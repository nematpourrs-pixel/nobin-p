const base=(process.env.EXPO_PUBLIC_API_URL||'').replace(/\/$/,'');
export const hasApi=Boolean(base);
export async function api(path:string, init:RequestInit={}){
  if(!base) throw new Error('API_NOT_CONFIGURED');
  const r=await fetch(`${base}${path}`,{...init,headers:{'content-type':'application/json',...(init.headers||{})}});
  if(!r.ok){let msg='خطا در ارتباط با سرور'; try{const j=await r.json(); msg=j.message||msg}catch{} throw new Error(msg)}
  return r.json();
}
