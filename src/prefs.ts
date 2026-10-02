export type Audience='FEMALE'|'MALE'|'ALL';
export type ProfileGender='FEMALE'|'MALE'|'UNSPECIFIED';
export type Appearance='AUTO'|'ROSE'|'TEAL'|'NEUTRAL';
export type Density='COMFORTABLE'|'COMPACT';
export type LocalPrefs={profileGender:ProfileGender;audience:Audience;appearance:Appearance;density:Density;preferredCity:string;showAssistant:boolean};

export const defaultPrefs:LocalPrefs={profileGender:'UNSPECIFIED',audience:'ALL',appearance:'AUTO',density:'COMFORTABLE',preferredCity:'',showAssistant:true};
export const palettes={
  FEMALE:{bg:'#FFF9FB',card:'#FFFFFF',text:'#241A20',muted:'#776A72',accent:'#A13F6C',accentSoft:'#F7E7EF',line:'#EEDFE6',success:'#247456',warning:'#956718',danger:'#B13E4D',ink:'#382A31'},
  MALE:{bg:'#F5F8F9',card:'#FFFFFF',text:'#18262A',muted:'#647278',accent:'#2A626B',accentSoft:'#E2EEF0',line:'#DCE6E8',success:'#237356',warning:'#93671B',danger:'#A9414D',ink:'#24373B'},
  ALL:{bg:'#F7F9F8',card:'#FFFFFF',text:'#202826',muted:'#6A7572',accent:'#47756E',accentSoft:'#E7F0EE',line:'#DFE7E5',success:'#287357',warning:'#936B20',danger:'#A6434D',ink:'#2D3B38'}
} as const;
export const paletteFor=(a:Audience,appearance:Appearance='AUTO')=>appearance==='ROSE'?palettes.FEMALE:appearance==='TEAL'?palettes.MALE:appearance==='NEUTRAL'?palettes.ALL:palettes[a];
export const categoriesFor=(a:Audience)=>a==='MALE'
 ? [{t:'کوتاهی مو',icon:'cut-outline'},{t:'ریش و اصلاح',icon:'man-outline'},{t:'پوست',icon:'sparkles-outline'},{t:'داماد',icon:'shirt-outline'},{t:'ماساژ',icon:'body-outline'},{t:'VIP',icon:'diamond-outline'},{t:'در محل',icon:'home-outline'}]
 : a==='FEMALE'
 ? [{t:'مو',icon:'cut-outline'},{t:'ناخن',icon:'color-palette-outline'},{t:'پوست',icon:'sparkles-outline'},{t:'میکاپ',icon:'brush-outline'},{t:'ابرو و مژه',icon:'eye-outline'},{t:'عروس',icon:'heart-outline'},{t:'اسپا',icon:'water-outline'}]
 : [{t:'مو',icon:'cut-outline'},{t:'پوست',icon:'sparkles-outline'},{t:'ناخن',icon:'color-palette-outline'},{t:'ریش و اصلاح',icon:'man-outline'},{t:'میکاپ',icon:'brush-outline'},{t:'ماساژ',icon:'body-outline'},{t:'در محل',icon:'home-outline'}];
export const audienceLabel=(a:Audience)=>a==='FEMALE'?'بانوان':a==='MALE'?'آقایان':'همه';
export const audienceLongLabel=(a:Audience)=>a==='FEMALE'?'خدمات بانوان':a==='MALE'?'خدمات آقایان':'همه خدمات';
export const appearanceLabel=(a:Appearance)=>a==='ROSE'?'رز':a==='TEAL'?'نفتی':a==='NEUTRAL'?'خنثی':'خودکار';
