!function(e,t){"object"==typeof exports&&"object"==typeof module?module.exports=t(require("Rx")):"function"==typeof define&&define.amd?define(["Rx"],t):"object"==typeof exports?exports.RxCSS=t(require("Rx")):e.RxCSS=t(e.Rx)}(this,function(e){return function(e){function t(r){if(n[r])return n[r].exports;var o=n[r]={exports:{},id:r,loaded:!1};return e[r].call(o.exports,o,o.exports,t),o.loaded=!0,o.exports}var n={};return t.m=e,t.c=n,t.p="",t(0)}([function(e,t,n){n(2),e.exports=n(2)},function(t,n){t.exports=e},function(e,t,n){"use strict";function r(e){return e&&e.__esModule?e:{"default":e}}function o(e,t,n){return t in e?Object.defineProperty(e,t,{value:n,enumerable:!0,configurable:!0,writable:!0}):e[t]=n,e}function u(e){if(Array.isArray(e)){for(var t=0,n=Array(e.length);t<e.length;t++)n[t]=e[t];return n}return Array.from(e)}function i(e){var t=arguments.length>1&&void 0!==arguments[1]?arguments[1]:document.documentElement,n=a.Observable.merge.apply(a.Observable,u(Object.keys(e).map(function(t){var n=e[t];return n instanceof a.Observable||(n=a.Observable.of(n)),n.map(function(e){return o({},t,e)})}))).scan(function(e,t){return f({},e,t)},{});return n.subscribe(function(e){return j(t).set(e)}),n}var f=Object.assign||function(e){for(var t=1;t<arguments.length;t++){var n=arguments[t];for(var r in n)Object.prototype.hasOwnProperty.call(n,r)&&(e[r]=n[r])}return e},c="function"==typeof Symbol&&"symbol"==typeof Symbol.iterator?function(e){return typeof e}:function(e){return e&&"function"==typeof Symbol&&e.constructor===Symbol&&e!==Symbol.prototype?"symbol":typeof e},a=n(1),l=n(7),s=r(l),d=n(6),p=r(d),y=n(5),b=r(y),m=n(4),v=r(m),x=function(e){return"boolean"==typeof e?e?1:0:e},j=function O(){var e=arguments.length>0&&void 0!==arguments[0]?arguments[0]:document.documentElement;return{set:function(t,n){return"object"!==("undefined"==typeof t?"undefined":c(t))||n?"object"===("undefined"==typeof n?"undefined":c(n))?Object.keys(n).forEach(function(r){O(e).set(t+"-"+r,n[r])}):e.style.setProperty("--"+t,x(n)):Object.keys(t).map(function(n){return O(e).set(n,t[n])})},get:function(t){return e.style.getPropertyValue("--"+t)}}};i.styledash=j,i.unit=s["default"],i.rect=p["default"],i.lerp=b["default"],i.animationFrame=v["default"],e.exports=i},function(e,t){"use strict";function n(e,t){var n={};return Object.keys(e||{}).forEach(function(r){n[r]=t(e[r],r,e)}),n}Object.defineProperty(t,"__esModule",{value:!0}),t["default"]=n},function(e,t,n){"use strict";function r(){return o.Observable.create(function(e){var t=!0,n=Date.now(),r=(Date.now(),function o(){var r=Date.now()-n;e.next(r),t&&u(o)});return r(),function(){return t=!1}})}Object.defineProperty(t,"__esModule",{value:!0}),t.createAnimationFrameTicker=r;var o=n(1),u=window.requestAnimationFrame||window.mozRequestAnimationFrame||window.webkitRequestAnimationFrame||window.msRequestAnimationFrame;t["default"]=r()},function(e,t,n){"use strict";function r(e){return e&&e.__esModule?e:{"default":e}}Object.defineProperty(t,"__esModule",{value:!0});var o="function"==typeof Symbol&&"symbol"==typeof Symbol.iterator?function(e){return typeof e}:function(e){return e&&"function"==typeof Symbol&&e.constructor===Symbol&&e!==Symbol.prototype?"symbol":typeof e},u=n(3),i=r(u),f=function(e){return function(t,n){if(null!==t&&("object"===("undefined"==typeof t?"undefined":o(t))||"array"==typeof t))return(0,i["default"])(t,function(t,r){var o=(n[r]-t)*e;return t+o});var r=(n-t)*e;return t+r}};t["default"]=f},function(e,t,n){"use strict";function r(e){var t=arguments.length>1&&void 0!==arguments[1]?arguments[1]:o.Observable.just(null);return t.map(function(){return e.getBoundingClientRect()})}Object.defineProperty(t,"__esModule",{value:!0}),t["default"]=r;var o=n(1)},function(e,t,n){"use strict";function r(e){return e&&e.__esModule?e:{"default":e}}Object.defineProperty(t,"__esModule",{value:!0});var o=n(3),u=r(o),i={px:function(e){return e.map(function(e){return"number"==typeof e?e+"px":(0,u["default"])(e,function(e){return e+"px"})})}};t["default"]=i}])});