/* Borç Defteri — service worker (yalnızca tarayıcı / GitHub Pages sürümü).
   Capacitor içinde kaydedilmez; orada dosyalar zaten uygulamanın içindedir.

   - Sayfa (index.html) önce ağdan istenir → yeni sürüm hemen gelir.
     Ağ yoksa ya da NET_TIMEOUT içinde cevap gelmezse önbellekteki kopya açılır.
   - Diğer dosyalar (ikon, manifest) önbellekten verilir, arkada tazelenir.
   - Kayıtlar burada DEĞİL, localStorage'ta durur; service worker veriye dokunmaz.

   Aynı github.io alan adını kullanıcının diğer Pages siteleri de paylaşır;
   bu yüzden yalnızca "borc-defteri-" önekli önbelleklere dokunuyoruz. */
"use strict";

var CACHE = "borc-defteri-v1";
var SHELL = [
  "./",
  "manifest.webmanifest",
  "icons/icon.svg",
  "icons/icon-192.png",
  "icons/icon-512.png",
  "icons/maskable-512.png",
  "icons/apple-touch-icon.png"
];
var NET_TIMEOUT = 3500;

self.addEventListener("install", function(e){
  e.waitUntil(
    caches.open(CACHE)
      .then(function(c){ return c.addAll(SHELL); })
      .then(function(){ return self.skipWaiting(); })
  );
});

self.addEventListener("activate", function(e){
  e.waitUntil(
    caches.keys()
      .then(function(keys){
        return Promise.all(keys.filter(function(k){ return k.indexOf("borc-defteri-") === 0 && k !== CACHE; })
          .map(function(k){ return caches.delete(k); }));
      })
      .then(function(){ return self.clients.claim(); })
  );
});

self.addEventListener("fetch", function(e){
  var req = e.request;
  if(req.method !== "GET") return;
  if(new URL(req.url).origin !== self.location.origin) return;
  e.respondWith(req.mode === "navigate" ? networkFirst(req) : staleWhileRevalidate(req));
});

/* Sayfa: ağ öncelikli, zaman aşımında/ağ yokken önbellek */
function networkFirst(req){
  return caches.open(CACHE).then(function(cache){
    var net = fetch(req).then(function(res){
      if(res && res.ok) cache.put("./", res.clone());
      return res;
    });
    var timeout = new Promise(function(resolve){ setTimeout(resolve, NET_TIMEOUT); });
    return Promise.race([net.catch(function(){}), timeout]).then(function(res){
      if(res) return res;
      return cache.match("./").then(function(hit){ return hit || net; });
    });
  });
}

/* Diğer dosyalar: önbellekten hemen ver, arkada ağdan tazele */
function staleWhileRevalidate(req){
  return caches.open(CACHE).then(function(cache){
    return cache.match(req).then(function(hit){
      var net = fetch(req).then(function(res){
        if(res && res.ok) cache.put(req, res.clone());
        return res;
      });
      if(hit){ net.catch(function(){}); return hit; }
      return net;
    });
  });
}
