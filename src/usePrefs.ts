import { useEffect, useState } from 'react';
import { defaultPrefs, type LocalPrefs } from './prefs';
import { getPrefs, subscribePrefs } from './session';
export function usePrefs(){const[prefs,setPrefs]=useState<LocalPrefs>(defaultPrefs);useEffect(()=>{let active=true;getPrefs().then(p=>{if(active&&p)setPrefs(p)});const off=subscribePrefs(p=>setPrefs(p));return()=>{active=false;off()}},[]);return[prefs,setPrefs] as const}
