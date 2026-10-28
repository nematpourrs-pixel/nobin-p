/** Canonicalize Android scheme deep links before Expo Router matches a screen. */
export function redirectSystemPath({path}:{path:string; initial:boolean}):string {
  try {
    const original = String(path || '');
    if (!original.includes('magic-login')) return original;
    const url = new URL(original.includes('://') ? original : 'nobin://'+original.replace(/^\/+/, ''));
    const ticket = url.searchParams.get('ticket') || '';
    const target = url.searchParams.get('target') || '';
    if (!/^[a-f0-9]{64}$/.test(ticket) || !['user-app','admin-app','business-app'].includes(target)) {
      return process.env.EXPO_PUBLIC_NOBIN_ADMIN_APP==='1' ? '/admin-login' : '/login';
    }
    const expected = process.env.EXPO_PUBLIC_NOBIN_ADMIN_APP==='1' ? 'admin-app' : process.env.EXPO_PUBLIC_NOBIN_BUSINESS_APP==='1' ? 'business-app' : 'user-app';
    if(target !== expected) return process.env.EXPO_PUBLIC_NOBIN_ADMIN_APP==='1' ? '/admin-login' : '/login';
    return '/magic-login?ticket='+encodeURIComponent(ticket)+'&target='+encodeURIComponent(target);
  } catch {
    return process.env.EXPO_PUBLIC_NOBIN_ADMIN_APP==='1' ? '/admin-login' : '/login';
  }
}
