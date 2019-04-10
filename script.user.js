// ==UserScript==
// @name SAS
// @description Smotretanime-Ad-Skiper
// @version 0.4.0
// @author Syleront
// @include /https?:\/\/smotretanime\.ru\/.+/embed/
// @connect smotretanime.ru
// @run-at document-start
// @copyright 2018, Syleront
// @homepage https://github.com/syleront/smotretanime-ad-skiper
// @updateURL https://github.com/syleront/smotretanime-ad-skiper/raw/master/script.user.js
// @downloadURL https://github.com/syleront/smotretanime-ad-skiper/raw/master/script.user.js

// @license MIT
// ==/UserScript==

(() => {
  const wait_timeout = 15; // seconds
  const overlay_text = "Тут реклама братан, ща уберем подожди";
  const TempData = {};

  if (!window.unsafeWindow) window.unsafeWindow = typeof unsafeWindow !== "undefined" ? unsafeWindow : window;
  if (!window.exportFunction) window.exportFunction = typeof exportFunction !== "undefined" ? exportFunction : null;

  if (!window.unsafeWindow) window.unsafeWindow = window;
  if (!window.exportFunction) window.exportFunction = function (f) { return f; };

  let listener = new createElementListener();
  listener.on("created", (node) => {
    if (node.tagName === "IFRAME") {
      document.body.appendChild = (elem) => {
        let result = Element.prototype.appendChild.bind(document.body, elem)();

        if (elem.tagName === "IFRAME") {
          elem.contentWindow.window.HTMLAudioElement.prototype.play = () => { };
        }

        return result;
      };
    }
  });

  let skip_button;

  window.addEventListener("DOMContentLoaded", () => {
    skip_button = document.querySelector(".skip-button");
    if (skip_button !== null) {
      console.log("[ad-skiper] ad detected");
      showWaitOverlay(false);
    }
  });

  window.addEventListener("load", () => {
    window.unsafeWindow.playerGlobal.concatenate.notActivatedAlert = () => {
      console.log("[ad-skiper] activation alert bypassed");
    };

    let yt_elems = document.querySelectorAll(".seed-player-container");
    if (yt_elems.length) {
      console.log("[ad-skiper] removing youtube ad");
      yt_elems.forEach((e) => e.remove());
    }

    if (skip_button) {
      let sas_key = localStorage.getItem("sas-key");
      if (sas_key !== null) {
        console.log("[ad-skiper] using key from cache");
        getAndSetPromoCode(sas_key);
      } else {
        console.log("[ad-skiper] cache is empty, getting a new key");
        window.unsafeWindow.playerGlobal.concatenate.activate = window.exportFunction((code) => {
          let key = encodeURIComponent(code);
          localStorage.setItem("sas-key", key);
          getAndSetPromoCode(key);
        }, window.unsafeWindow);

        document.querySelector(".vjs-big-play-button").click();
        showWaitOverlay(true);
      }
    }
  });

  function createElementListener() {
    let events = [];

    this.emit = (name, data) => {
      events.forEach((e) => {
        if (e.name == name) {
          e._cb(data);
        }
      });
    };

    this.on = (name, _cb) => {
      events.push({ name, _cb });
    };

    let ctx = this;
    let createElement = document.createElement;
    document.createElement = function (...args) {
      let elem = createElement.bind(document)(...args);
      ctx.emit("created", elem);
      return elem;
    };
  }

  function getAndSetPromoCode(key) {
    console.log("[ad-skiper] getting response...");
    let url = `https://smotretanime.ru/translations/embedActivation?code=${key}`;
    request(url, {
      "Accept": "application/json, text/javascript, */*; q=0.01",
      "x-requested-with": "XMLHttpRequest"
    }).then((body) => {
      let res = JSON.parse(body);
      if (res.error) {
        console.log("[ad-skiper] ad-key is wrong, removing it and try again...");
        localStorage.removeItem("sas-key");
        window.location.reload();
      } else {
        console.log("[ad-skiper] set cookie");
        setCookie("watchedPromoVideo", res.cookieValue);
        setTimeout(() => {
          window.location.reload();
        }, 500);
      }
    });
  }

  function showWaitOverlay(is_main) {
    if (TempData.overlayDiv) TempData.overlayDiv.remove();

    let overlayDiv = document.createElement("div");
    overlayDiv.style.position = "fixed";
    overlayDiv.style.display = "block";
    overlayDiv.style.width = "100%";
    overlayDiv.style.height = "100%";
    overlayDiv.style.background = "#000";
    overlayDiv.style.zIndex = "10000";
    overlayDiv.style.opacity = "0.9";

    let textDiv = document.createElement("div");
    textDiv.style.textAlign = "center";
    textDiv.style.marginTop = "50px";
    textDiv.style.fontSize = "25px";
    textDiv.style.userSelect = "none";
    textDiv.innerHTML = overlay_text;

    overlayDiv.appendChild(textDiv);
    document.body.insertAdjacentElement("afterbegin", overlayDiv);

    TempData.overlayDiv = overlayDiv;

    if (is_main) {
      let timer = wait_timeout;
      (function tick() {
        if (timer > 0) {
          textDiv.innerHTML = `${overlay_text} [${timer}]`;
          timer -= 1;
          setTimeout(tick, 1000);
        } else {
          textDiv.innerHTML = `${overlay_text}...`;
        }
      })();
    }
  }

  function request(url, headers) {
    let xhr = new XMLHttpRequest();
    xhr.open("GET", url, true);

    if (headers) {
      Object.entries(headers).forEach((header) => {
        xhr.setRequestHeader(header[0], header[1]);
      });
    }

    xhr.send();

    return new Promise((resolve, reject) => {
      xhr.onreadystatechange = () => {
        if (xhr.readyState != 4) return;
        if (xhr.status !== 200) {
          reject(xhr);
        } else {
          resolve(xhr.responseText);
        }
      };
    });
  }

  function setCookie(name, value, options) {
    options = options || {};

    let expires = options.expires;

    if (typeof expires == "number" && expires) {
      let d = new Date();
      d.setTime(d.getTime() + expires * 1000);
      expires = options.expires = d;
    }
    if (expires && expires.toUTCString) {
      options.expires = expires.toUTCString();
    }

    value = encodeURIComponent(value);

    let updatedCookie = name + "=" + value;

    for (let propName in options) {
      updatedCookie += "; " + propName;
      let propValue = options[propName];
      if (propValue !== true) {
        updatedCookie += "=" + propValue;
      }
    }

    document.cookie = updatedCookie;
  }
})();