// ==UserScript==
// @name         test iframe
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  try to take over the world!
// @author       You
// @match        http://*
// @grant        none
// @require    https://cdn.bootcss.com/jslite/1.1.12/JSLite.min.js
// ==/UserScript==

(function () {
    'use strict';
    $('img').forEach((img, i) => {
        var src = $(img).attr('src');
        console.log(src);
        $('a').attr('href', src).attr('download', src.split('?')[0]).trigger('click');
    });
})();