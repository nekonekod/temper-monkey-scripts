// ==UserScript==
// @name         Titter orig img
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  try to take over the world!
// @author       You
// @match        https://www.acgpy.com/wpx/download.php?id=19926
// @grant        none
// ==/UserScript==

(function() {
    'use strict';
    let url = location.href;
    if(url.indexOf(':orig')<0)
       location.href = url + ':orig';
})();