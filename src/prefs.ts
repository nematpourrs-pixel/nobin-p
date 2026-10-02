export type Audience='FEMALE'|'MALE'|'ALL';
export type ProfileGender='FEMALE'|'MALE'|'UNSPECIFIED';
export type LocalPrefs={profileGender:ProfileGender;audience:Audience};

export const palettes={
  FEMALE:{bg:'#FFF8FB',card:'#FFFFFF',text:'#24191F',muted:'#756770',accent:'#9E3F6B',accentSoft:'#F6E3EC',line:'#EEDDE5',success:'#227A55',warning:'#A46715',danger:'#B43A4A',ink:'#3B2832'},
  MALE:{bg:'#F4F8F9',card:'#FFFFFF',text:'#18272B',muted:'#617278',accent:'#245D67',accentSoft:'#DDECEF',line:'#D7E3E6',success:'#1F7754',warning:'#9A671A',danger:'#A73E48',ink:'#22363B'},
  ALL:{bg:'#F7F9F8',card:'#FFFFFF',text:'#202927',muted:'#687470',accent:'#3E716A',accentSoft:'#E2EFEC',line:'#DCE6E3',success:'#257554',warning:'#95691B',danger:'#A33E49',ink:'#293B37'}
} as const;
export const paletteFor=(a:Audience)=>palettes[a];
export const categoriesFor=(a:Audience)=>a==='MALE'
 ? [{t:'کوتاهی مو',e:'✂️'},{t:'ریش و اصلاح',e:'🧔'},{t:'پوست',e:'✨'},{t:'گریم داماد',e:'🤵'},{t:'ماساژ',e:'💆'},{t:'VIP',e:'⭐'},{t:'در محل',e:'🏠'}]
 : a==='FEMALE'
 ? [{t:'مو',e:'✂️'},{t:'ناخن',e:'💅'},{t:'پوست',e:'✨'},{t:'میکاپ',e:'💄'},{t:'ابرو و مژه',e:'👁️'},{t:'عروس',e:'👰'},{t:'اسپا',e:'💆'}]
 : [{t:'مو',e:'✂️'},{t:'پوست',e:'✨'},{t:'ناخن',e:'💅'},{t:'ریش و اصلاح',e:'🧔'},{t:'میکاپ',e:'💄'},{t:'ماساژ',e:'💆'},{t:'در محل',e:'🏠'}];
export const audienceLabel=(a:Audience)=>a==='FEMALE'?'خدمات بانوان':a==='MALE'?'خدمات آقایان':'همه خدمات';
