/* LO's Burgers service worker: opens offline after the first visit */
var VERSION='lo-burgers-v16';
var SHELL=['./','index.html','manifest.webmanifest','icons/apple-touch-icon.png','icons/icon-192.png','icons/icon-512.png'];
self.addEventListener('install',function(e){
  e.waitUntil(caches.open(VERSION).then(function(c){return c.addAll(SHELL)}).then(function(){return self.skipWaiting()}));
});
self.addEventListener('activate',function(e){
  e.waitUntil(caches.keys().then(function(keys){
    return Promise.all(keys.filter(function(k){return k!==VERSION}).map(function(k){return caches.delete(k)}));
  }).then(function(){return self.clients.claim()}));
});
self.addEventListener('fetch',function(e){
  var req=e.request;
  if(req.method!=='GET')return;
  var url=new URL(req.url),same=url.origin===self.location.origin;
  if(req.mode==='navigate'){
    e.respondWith(fetch(req).then(function(r){
      var copy=r.clone();caches.open(VERSION).then(function(c){c.put('index.html',copy)});return r;
    }).catch(function(){return caches.match('index.html')}));
    return;
  }
  /* same-origin files and the three.js / font hosts: cache first, refresh in the background */
  if(same||/cdnjs\.cloudflare\.com|fonts\.(googleapis|gstatic)\.com/.test(url.hostname)){
    e.respondWith(caches.open(VERSION).then(function(c){
      return c.match(req).then(function(hit){
        var net=fetch(req).then(function(r){if(r&&(r.ok||r.type==='opaque'))c.put(req,r.clone());return r}).catch(function(){return hit});
        return hit||net;
      });
    }));
  }
});
