const CACHE_NAME = "static-cache-v2";
const DATA_CACHE_NAME = "data-cache-v1";

const iconSizes = ["192", "512"];
const iconFiles = iconSizes.map(
  (size) => `/icons/icon-${size}x${size}.png`
);

const staticFilesToPreCache = [
    "/",
    "index.html",
    "/manifest.webmanifest",
    "/styles.css",
    "/index.js",
    "/api/transaction"
].concat(iconFiles);


// install
self.addEventListener("install", function(evt) {
  evt.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      console.log("Your files were pre-cached successfully!");
      return cache.addAll(staticFilesToPreCache);
    })
  );

  self.skipWaiting();
});

// //the net ninja's approach: activate
// self.addEventListener("activate", evt =>{
//   evt.waitUntil(
//    caches.keys().then(keys =>{
//      console.log(keys);
//      return Promise.all(keys
//       .filter(key => key !== CACHE_NAME)
//       .map(key = caches.delete(key))
//       )
//    })
//   )
// })

// activate
self.addEventListener("activate", function(evt) {
  evt.waitUntil(
    caches.keys().then(keyList => {
      return Promise.all(
        keyList.map(key => {
          if (key !== CACHE_NAME && key !== DATA_CACHE_NAME) {
            console.log("Removing old cache data", key);
            return caches.delete(key);
          }
        })
      );
    })
  );

  self.clients.claim();
});

//the net ninja's approach: fetch
// self.addEventListener("fetch", evt =>{
//   //for data response only
//   if(evt.request.url.includes("/api/") === -1){
//     evt.respondWith(
//         caches.match(evt.request).then(cacheRes =>{
//             return cacheRes || fetch(evt.request).then(fetchRes => {
//               return caches.open(DATA_CACHE_NAME).then(cache =>{
//                 cache.put(evt.request.url, fetchRes.clone());
//                 return fetchRes;
//               })
//             })
//         })
//     )
//       }
// })

fetch
self.addEventListener("fetch", function(evt) {
  const {url} = evt.request;
  if (url.includes("/api/")) {
    evt.respondWith(
      caches.open(DATA_CACHE_NAME).then(cache => {
        return fetch(evt.request)
          .then(response => {
            // If the response was good, clone it and store it in the cache.
            if (response.status === 200) {
              cache.put(evt.request, response.clone());
            }

            return response;
          })
          .catch(err => {
            // Network request failed, try to get it from the cache.
            return cache.match(evt.request);
          });
      }).catch(err => console.log(err))
    );
  } else {
    // respond from static cache, request is not for /api/*
    evt.respondWith(
      caches.open(CACHE_NAME).then(cache => {
        return cache.match(evt.request).then(response => {
          return response || fetch(evt.request);
        });
      })
    );
  }
});
