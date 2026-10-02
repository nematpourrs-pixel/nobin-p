import type { Salon } from './demo';
const fa=new Intl.NumberFormat('fa-IR');
export const faMoney=(v:any)=>`${fa.format(Number(v||0))} تومان`;
export function salonCard(b:any):Salon{
  return {
    id:String(b.id),
    name:String(b.name||'کسب‌وکار نوبین'),
    city:String(b.city||''),
    neighborhood:String(b.address||''),
    rating:Number(b.average_rating||0),
    reviews:Number(b.rating_count||0),
    price:'مشاهده خدمات',
    next:'زمان‌های آزاد',
    badges:b.verified?['تأییدشده']:[],
    services:[],
    coverUrl:b.cover_url||b.logo_url||undefined,
    logoUrl:b.logo_url||undefined,
    gender:b.gender||'ALL'
  };
}
export function salonDetail(b:any):Salon{
  const card=salonCard(b);
  return {
    ...card,
    services:Array.isArray(b.services)?b.services.map((s:any)=>({
      id:String(s.id),
      name:String(s.title||s.name||'خدمت'),
      duration:`${fa.format(Number(s.duration_minutes||0))} دقیقه`,
      price:faMoney(s.price)
    })):[]
  };
}
