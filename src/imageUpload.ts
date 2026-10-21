import * as ImagePicker from 'expo-image-picker';
import { API_BASE } from './api';
import { getToken } from './session';

export type UploadScope='business_cover'|'business_logo'|'service_sample'|'staff_avatar';

export async function pickAndUploadImage(scope:UploadScope,businessId:number,entityId?:number){
  const p=await ImagePicker.requestMediaLibraryPermissionsAsync();
  if(!p.granted)throw new Error('برای انتخاب تصویر، دسترسی گالری را فعال کنید.');
  const r=await ImagePicker.launchImageLibraryAsync({
    mediaTypes:ImagePicker.MediaTypeOptions.Images,
    allowsEditing:false,
    quality:0.65,
    exif:false,
    selectionLimit:1,
  } as any);
  if(r.canceled||!r.assets?.[0])return null;
  const a:any=r.assets[0];
  if(a.fileSize&&a.fileSize>8*1024*1024)throw new Error('حجم تصویر اولیه بیش از ۸ مگابایت است. تصویر سبک‌تری انتخاب کنید.');
  const token=await getToken();
  if(!token)throw new Error('برای بارگذاری تصویر وارد حساب شوید.');
  const form=new FormData();
  form.append('scope',scope);
  form.append('business_id',String(businessId));
  if(entityId)form.append('entity_id',String(entityId));
  form.append('image',{uri:a.uri,name:a.fileName||('nobin-'+Date.now()+'.jpg'),type:a.mimeType||'image/jpeg'} as any);
  const res=await fetch(API_BASE+'/v1/uploads/image',{method:'POST',headers:{Authorization:'Bearer '+token,Accept:'application/json'},body:form});
  let j:any={};try{j=await res.json()}catch{}
  if(!res.ok)throw new Error(j.message||'بارگذاری تصویر انجام نشد.');
  return j as {url:string;width?:number;height?:number;bytes?:number};
}