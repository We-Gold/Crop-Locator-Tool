if(!self.define){const e=e=>{"require"!==e&&(e+=".js");let r=Promise.resolve();return s[e]||(r=new Promise((async r=>{if("document"in self){const s=document.createElement("script");s.src=e,document.head.appendChild(s),s.onload=r}else importScripts(e),r()}))),r.then((()=>{if(!s[e])throw new Error(`Module ${e} didn’t register its module`);return s[e]}))},r=(r,s)=>{Promise.all(r.map(e)).then((e=>s(1===e.length?e[0]:e)))},s={require:Promise.resolve(r)};self.define=(r,i,n)=>{s[r]||(s[r]=Promise.resolve().then((()=>{let s={};const c={uri:location.origin+r.slice(1)};return Promise.all(i.map((r=>{switch(r){case"exports":return s;case"module":return c;default:return e(r)}}))).then((e=>{const r=n(...e);return s.default||(s.default=r),s}))})))}}define("./sw.js",["./workbox-d236bde4"],(function(e){"use strict";self.skipWaiting(),e.clientsClaim(),e.precacheAndRoute([{url:"assets/index.052e2f01.js",revision:"b58b6ca029d4da593e6685f9ff907972"},{url:"assets/index.4c317ce7.css",revision:"33ca91bc31b29f8d6f3c2e63177770f1"},{url:"assets/vendor.ce0ff7dc.js",revision:"6d6f136a5758e8ec25a6eb4372da49f6"},{url:"index.html",revision:"2a7a44f43c3762bf2abef6846fd63c5a"},{url:"./icon-192x192.png",revision:"baced486bc62a52a72c5e0974455ac0c"},{url:"./icon-256x256.png",revision:"355e29c431a8723ef2fb385ca4fcd22a"},{url:"./icon-384x384.png",revision:"628b6b27b4363925b2cceca23eeb16f7"},{url:"./icon-512x512.png",revision:"23d3a01031ab9f4a1a8b64829d5c1ed8"},{url:"manifest.webmanifest",revision:"eaa1662b9144ddcf58151085eb105202"}],{}),e.cleanupOutdatedCaches(),e.registerRoute(new e.NavigationRoute(e.createHandlerBoundToURL("index.html")))}));
//# sourceMappingURL=sw.js.map
