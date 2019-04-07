// ==UserScript==
// @name SAS
// @description Smotretanime-Ad-Skiper
// @version 0.3.3
// @author Syleront
// @include /https?:\/\/smotretanime\.ru\/.+/embed/
// @connect smotretanime.ru
// @grant GM_xmlhttpRequest
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

  window.addEventListener("DOMContentLoaded", () => {
    let skip_button = document.querySelector(".skip-button");
    if (skip_button !== null) {
      console.log("[ad-skiper] ad detected");
      showWaitOverlay(false);

      let sas_key = localStorage.getItem("sas-key");
      if (sas_key !== null) {
        console.log("[ad-skiper] using key from cache");
        getAndSetPromoCode(sas_key);
      } else {
        console.log("[ad-skiper] cache is empty, getting a new key");
        initSasKeyGetter();
      }
    }
  });

  window.addEventListener("load", () => {
    unsafeWindow.playerGlobal.concatenate.notActivatedAlert = () => {
      console.log("[ad-skiper] activation alert bypassed");
    };
  });

  function initSasKeyGetter() {
    window.addEventListener("sasKey", (evt) => {
      let key = encodeURIComponent(evt.detail);
      localStorage.setItem("sas-key", key);
      getAndSetPromoCode(key);
    });

    request(document.location.href, {
      "accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3",
      "upgrade-insecure-requests": 1
    }).then((body) => {
      let matched = body.match(/data:text\/javascript;base64,(.+?)"/);
      if (matched) {
        let code = atob(matched[1]).replace(/(delete window\.activateCodeTmp;).*/, "$1 var event = new CustomEvent('sasKey', { 'detail': activateCode }); window.dispatchEvent(event); return;");
        let script = document.createElement("script");
        script.src = `data:text/javascript;base64,${btoa(code)}`;
        document.body.appendChild(script);
      }
    });
  }

  function getAndSetPromoCode(key) {
    let url = `https://smotretanime.ru/translations/embedActivation?code=${key}`;
    (function get(url, is_reconnect) {
      console.log("[ad-skiper] getting response...");
      request(url, {
        "Accept": "application/json, text/javascript, */*; q=0.01",
        "x-requested-with": "XMLHttpRequest"
      }).then((body) => {
        let res = JSON.parse(body);
        if (res === null || res.error && is_reconnect) {
          console.log("[ad-skiper] ad-key is wrong, removing it and try again...");
          localStorage.removeItem("sas-key");
          window.location.reload();
        } else if (res.error) {
          console.log(`[ad-skiper] error, retry after ${wait_timeout} sec...`);
          showWaitOverlay(true);
          setTimeout(() => {
            get(url, true);
          }, wait_timeout * 1000);
        } else {
          console.log("[ad-skiper] set cookie");
          setCookie("watchedPromoVideo", res.cookieValue);
          setTimeout(() => {
            window.location.reload();
          }, 500);
        }
      });
    })(url);
  }

  function showWaitOverlay(is_main) {
    if (TempData.overlayDiv) TempData.overlayDiv.remove();

    let overlayDiv = document.createElement("div");
    overlayDiv.style.position = "fixed";
    overlayDiv.style.display = "block";
    overlayDiv.style.width = "100%";
    overlayDiv.style.height = "100%";
    overlayDiv.style.background = "#000";
    overlayDiv.style.zIndex = "1000";
    overlayDiv.style.opacity = "0.8";

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