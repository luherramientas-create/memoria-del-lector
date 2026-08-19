const CACHE='memoria-lector-v7-6-0';
const ASSETS=['./','./index.html','./styles.css','./app.js','./map-labels.js','./backup.js','./duplicate-manager.js','./character-name-guard.js','./relationship-guard.js','./delete-manager.js','./session-manager.js','./cover-manager.js','./mobile-map-fullscreen.js','./neural-map-real.html','./manifest.webmanifest','./icon.svg'];
self.addEventListener('install',event=>event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(ASSETS))));
self.addEventListener('activate',event=>event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>key.startsWith('memoria-lector-')&&key!==CACHE).map(key=>caches.delete(key))))));
self.addEventListener('fetch',event=>{if(event.request.method!=='GET')return;event.respondWith(fetch(event.request).then(response=>{const copy=response.clone();caches.open(CACHE).then(cache=>cache.put(event.request,copy)).catch(()=>{});return response;}).catch(()=>caches.match(event.request)));});
