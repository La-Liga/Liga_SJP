const CACHE = 'liga-crm-launch-v2';
const ASSETS = ['./', './index.html', './manifest.json', './icon-192.png', './logo-liga.png', './icon-512.png', './apple-touch-icon.png'];

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
  e.respondWith(
    fetch(e.request).then(res=>{
      if(res.ok && new URL(e.request.url).origin===self.location.origin){
        const clone = res.clone();
        caches.open(CACHE).then(c=>c.put(e.request, clone));
      }
      return res;
    }).catch(()=> caches.match(e.request).then(r=> r || (e.request.mode==='navigate' ? caches.match('./index.html') : undefined)))
  );
});
