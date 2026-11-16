/**
 * Copyright 2018 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *     http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

// If the loader is already loaded, just stop.
if (!self.define) {
  let registry = {};

  // Used for `eval` and `importScripts` where we can't get script URL by other means.
  // In both cases, it's safe to use a global var because those functions are synchronous.
  let nextDefineUri;

  const singleRequire = (uri, parentUri) => {
    uri = new URL(uri + ".js", parentUri).href;
    return registry[uri] || (
      
        new Promise(resolve => {
          if ("document" in self) {
            const script = document.createElement("script");
            script.src = uri;
            script.onload = resolve;
            document.head.appendChild(script);
          } else {
            nextDefineUri = uri;
            importScripts(uri);
            resolve();
          }
        })
      
      .then(() => {
        let promise = registry[uri];
        if (!promise) {
          throw new Error(`Module ${uri} didn’t register its module`);
        }
        return promise;
      })
    );
  };

  self.define = (depsNames, factory) => {
    const uri = nextDefineUri || ("document" in self ? document.currentScript.src : "") || location.href;
    if (registry[uri]) {
      // Module is already loading or loaded.
      return;
    }
    let exports = {};
    const require = depUri => singleRequire(depUri, uri);
    const specialDeps = {
      module: { uri },
      exports,
      require
    };
    registry[uri] = Promise.all(depsNames.map(
      depName => specialDeps[depName] || require(depName)
    )).then(deps => {
      factory(...deps);
      return exports;
    });
  };
}
define(['./workbox-afac4cd2'], (function (workbox) { 'use strict';

  self.skipWaiting();
  workbox.clientsClaim();
  /**
   * The precacheAndRoute() method efficiently caches and responds to
   * requests for URLs in the manifest.
   * See https://goo.gl/S9QRab
   */
  workbox.precacheAndRoute([{
    "url": "pwa-maskable-512x512.png",
    "revision": "38f52785ccff3f510c90bd1eafbb2020"
  }, {
    "url": "pwa-512x512.png",
    "revision": "e77f25d2b8fac8b78136be87bbbe80eb"
  }, {
    "url": "pwa-192x192.png",
    "revision": "242ac4e273a3a33249ba4aa69f22345c"
  }, {
    "url": "index.html",
    "revision": "bd3f347acafbff2386e027ca8763406b"
  }, {
    "url": "icon.svg",
    "revision": "7df92d3b4273b8b432a3ba2810fff47c"
  }, {
    "url": "apple-touch-icon.png",
    "revision": "e3fe4617dcee95fb0be5834a24d01a20"
  }, {
    "url": "assets/workbox-window.prod.es5-Bd17z0YL.js",
    "revision": null
  }, {
    "url": "assets/index-PhTEN-Yf.js",
    "revision": null
  }, {
    "url": "assets/index-B1X6su1j.css",
    "revision": null
  }, {
    "url": "assets/WeeklyBarChart-CQqd5V-O.js",
    "revision": null
  }, {
    "url": "assets/ProgressStackedChart-DYNxKJ2C.js",
    "revision": null
  }, {
    "url": "assets/BarChart-nE84KSSC.js",
    "revision": null
  }, {
    "url": "apple-touch-icon.png",
    "revision": "e3fe4617dcee95fb0be5834a24d01a20"
  }, {
    "url": "icon.svg",
    "revision": "7df92d3b4273b8b432a3ba2810fff47c"
  }, {
    "url": "pwa-192x192.png",
    "revision": "242ac4e273a3a33249ba4aa69f22345c"
  }, {
    "url": "pwa-512x512.png",
    "revision": "e77f25d2b8fac8b78136be87bbbe80eb"
  }, {
    "url": "pwa-maskable-512x512.png",
    "revision": "38f52785ccff3f510c90bd1eafbb2020"
  }, {
    "url": "manifest.webmanifest",
    "revision": "58f56cf0c0e9e4b61e69ef85ec02a3c9"
  }], {});
  workbox.cleanupOutdatedCaches();
  workbox.registerRoute(new workbox.NavigationRoute(workbox.createHandlerBoundToURL("index.html")));
  workbox.registerRoute(/^https:\/\/fonts\.googleapis\.com\/.*/i, new workbox.CacheFirst({
    "cacheName": "google-fonts-cache",
    plugins: [new workbox.ExpirationPlugin({
      maxEntries: 10,
      maxAgeSeconds: 31536000
    }), new workbox.CacheableResponsePlugin({
      statuses: [0, 200]
    })]
  }), 'GET');
  workbox.registerRoute(/^https:\/\/fonts\.gstatic\.com\/.*/i, new workbox.CacheFirst({
    "cacheName": "gstatic-fonts-cache",
    plugins: [new workbox.ExpirationPlugin({
      maxEntries: 10,
      maxAgeSeconds: 31536000
    }), new workbox.CacheableResponsePlugin({
      statuses: [0, 200]
    })]
  }), 'GET');

}));
