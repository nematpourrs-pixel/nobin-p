export type Salon = {id:string; name:string; city:string; neighborhood:string; rating:number; reviews:number; price:string; next:string; badges:string[]; services:{id:string;name:string;duration:string;price:string}[]};
export const salons:Salon[] = [
{id:'n1',name:'استودیو زیبایی نوبین',city:'تهران',neighborhood:'سعادت‌آباد',rating:4.9,reviews:284,price:'از ۴۵۰ هزار تومان',next:'امروز ۱۸:۳۰',badges:['تأییدشده','پاسخ‌گو'],services:[{id:'s1',name:'کوتاهی و براشینگ',duration:'۶۰ دقیقه',price:'۶۵۰ هزار تومان'},{id:'s2',name:'رنگ و لایت',duration:'۱۸۰ دقیقه',price:'از ۲.۸ میلیون تومان'},{id:'s3',name:'مانیکور ژل',duration:'۷۵ دقیقه',price:'۷۹۰ هزار تومان'}]},
{id:'n2',name:'خانه زیبایی رز',city:'تهران',neighborhood:'ونک',rating:4.8,reviews:191,price:'از ۳۲۰ هزار تومان',next:'فردا ۱۰:۰۰',badges:['محبوب'],services:[{id:'s4',name:'اصلاح و ابرو',duration:'۴۰ دقیقه',price:'۳۲۰ هزار تومان'},{id:'s5',name:'فیشیال پوست',duration:'۹۰ دقیقه',price:'۱.۴ میلیون تومان'}]},
{id:'n3',name:'کلینیک زیبایی آرا',city:'کرج',neighborhood:'جهانشهر',rating:4.7,reviews:122,price:'از ۵۰۰ هزار تومان',next:'امروز ۲۰:۰۰',badges:['تأییدشده'],services:[{id:'s6',name:'پاکسازی تخصصی پوست',duration:'۷۵ دقیقه',price:'۹۸۰ هزار تومان'},{id:'s7',name:'میکاپ',duration:'۹۰ دقیقه',price:'۱.۹ میلیون تومان'}]}
];
export const categories=['مو','ناخن','پوست','میکاپ','ابرو و مژه','خدمات آقایان','در محل'];
export const quick=['امروز','فردا','نزدیک من','تخفیف‌دار'];
export const bookingTimes=['۱۰:۰۰','۱۱:۳۰','۱۳:۰۰','۱۵:۳۰','۱۷:۰۰','۱۸:۳۰','۲۰:۰۰'];
