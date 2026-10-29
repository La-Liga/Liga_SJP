const CACHE = 'liga-crm-rounds-time-v7';
const ASSETS = ['./', './index.html', './manifest.json', './icon-transparent-v3-192.png', './logo-liga.png', './icon-transparent-v3-512.png', './apple-touch-transparent-v3.png'];
// Librerías externas que la app necesita para arrancar sin conexión (Firebase y Excel).
const CDN_HOSTS = ['www.gstatic.com', 'cdnjs.cloudflare.com'];

self.addEventListener('install', e=>{
  // Se cachea archivo por archivo: si falta uno, el service worker igual se instala.
  e.waitUntil(caches.open(CACHE).then(c=>Promise.all(ASSETS.map(a=>c.add(a).catch(()=>{})))));
  self.skipWaiting();
});
self.addEventListener('activate', e=>{
  e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith('liga-crm-') && k!==CACHE).map(k=>caches.delete(k)))));
  self.clients.claim();
});
self.addEventListener('fetch', e=>{
  if(e.request.method!=='GET' || !e.request.url.startsWith('http')) return;
  const url = new URL(e.request.url);
  const sameOrigin = url.origin===self.location.origin;
  const isCdn = CDN_HOSTS.includes(url.hostname);
  // Las conexiones a Firebase Realtime Database y Auth no pasan por la caché.
  if(!sameOrigin && !isCdn) return;
  e.respondWith(
    fetch(e.request).then(res=>{
      // Las respuestas de las librerías externas llegan "opacas" (ok=false): también se guardan.
      if((sameOrigin && res.ok) || (isCdn && (res.ok || res.type==='opaque'))){
        const clone = res.clone();
        e.waitUntil(caches.open(CACHE).then(c=>c.put(e.request, clone)).catch(()=>{}));
      }
      return res;
    }).catch(()=> caches.match(e.request, {ignoreSearch:true}).then(r=> r || (e.request.mode==='navigate' ? caches.match('./index.html') : undefined)))
  );
});
