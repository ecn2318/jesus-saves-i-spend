const FILES_TO_CACHE = [
  '/',
  '/index.html',
  '/index.js',
  '/manifest.webmanifest',
  '/styles.css',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png'
];

const CACHE_NAME = "static-cache-v2";
const DATA_CACHE_NAME = "data-cache-v1";

// self - refer to global context
// install event
// when you first hit the site, this event will get fired
self.addEventListener("install", function (evt) {
  // supply custom callback function
  // waitUntil() - don't finish installing until the code finishes
  evt.waitUntil(
    // cache api - CACHE_NAME - first cache created 
    caches.open(CACHE_NAME).then(cache => {
      console.log("Your files were pre-cached successfully!");
      // once cache created, add all files_to_cache - successfully downloaded to machine
      // store files in cache api - see Application tab
      return cache.addAll(FILES_TO_CACHE);
    })
  );
  // once done installing, immediately call activate event below
  self.skipWaiting();
});

// activate
self.addEventListener("activate", function (evt) {
  // wait until below code completes before calling "activate" done
  // activate event - clean up old data after installing
  // check if there's old cache data around - if there is, remove it
  evt.waitUntil(
    // iterate over keys - CACHE_NAME and DATA_CACHE_NAME
    caches.keys().then(keyList => {
      return Promise.all(
        // for each key - check the name of it. 
        // remove if it doesn't match the name of the keys we are targeting
        keyList.map(key => {
          if (key !== CACHE_NAME && key !== DATA_CACHE_NAME) {
            console.log("Removing old cache data", key);
            // delete if there are old data lying around
            return caches.delete(key);
          }
        })
      );
    })
  );

  // if files_to_cache are added, use them if available. 
  // don't make http calls to grab them because they already exist
  self.clients.claim();
});

// fetch event - on any http request to my api 
// inspect all http request - target api request "/api/"
// cache successful request to the API
self.addEventListener("fetch", function (evt) {
  if (evt.request.url.includes("/api/")) {
    evt.respondWith(
      // open DATA_CACHE_NAME 
      caches.open(DATA_CACHE_NAME).then(cache => {
        return fetch(evt.request)
          .then(response => {
            // If the response was good, clone it and store it in the cache.
            if (response.status === 200) {
              // add url and store response
              cache.put(evt.request.url, response.clone());
            }

            return response;
          })
          .catch(err => {
            // Network request failed, try to get it from the cache.
            // see if we have api request sitting in cache - pull from cache if we have it
            return cache.match(evt.request);
          });
      }).catch(err => console.log(err))
    );

    return;
  }

  // if the request is not an aip rest, serve static assets (offline-first appraoch)
  evt.respondWith(
    // see if static asset(s) exist within our cache
    caches.open(CACHE_NAME).then(cache => {
      return cache.match(evt.request).then(response => {
        // return response or fetch http request to get the value
        return response || fetch(evt.request);
      });
    })
  );
});
