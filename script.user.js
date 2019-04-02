// ==UserScript==
// @name SAS
// @description Smotretanime-Ad-Skiper
// @version 0.1.2
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

(function updateCookie(is_initial) {
  const check_interval = 60; // seconds
  const wait_timeout = 12; // seconds
  const overlay_text = "Тут реклама братан, ща уберем подожди";

  let url = checkAndFixUrl(document.location.href);
  if (!url) {
    throw "url is bad";
  } else {
    GM_xmlhttpRequest({
      method: "GET",
      url: url,
      onload: (response) => {
        let code = response.responseText.match(/data:text\/javascript;base64,(.+?)"/);
        let is_skip_button = document.querySelector(".skip-button") !== null;
        if (code) {
          console.log("[ad-skiper] js code got");
          if (is_initial) showWaitOverlay(true);
          let decoded = atob(code[1]);
          let activation_code = decoded.match(/activateCodeTmp\s=\s"([A-z0-9]+)"/i);
          if (activation_code) {
            console.log("[ad-skiper] act code got");
            let url = "https://smotretanime.ru/translations/embedActivation?code=" + activation_code[1];
            console.log("[ad-skiper] wait " + wait_timeout + " sec...");
            setTimeout(() => {
              (function get(url) {
                console.log("[ad-skiper] get response");
                GM_xmlhttpRequest({
                  method: "GET",
                  url: url,
                  onload: (response) => {
                    let res = JSON.parse(response.responseText);
                    if (res.error) {
                      console.log("[ad-skiper] error, retry...");
                      setTimeout(() => {
                        get(url);
                      }, 1000);
                    } else {
                      console.log("[ad-skiper] set cookie");
                      setCookie("watchedPromoVideo", res.cookieValue);
                      if (is_initial) {
                        setTimeout(() => {
                          window.location.reload();
                        }, 500);
                      } else {
                        setTimeout(() => {
                          updateCookie(false);
                        }, check_interval * 1000);
                      }
                    }
                  }
                });
              })(url);
            }, wait_timeout * 1000);
          }
        } else if (is_skip_button) {
          console.log("[ad-skiper] finded hidden ad, reloading");
          showWaitOverlay(false);
          window.location.reload();
        } else {
          console.log("[ad-skiper] code is undefined, set timer...");
          setTimeout(() => {
            updateCookie(false);
          }, check_interval * 1000);
        }
      }
    });
  }

  function showWaitOverlay(is_main) {
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

  function checkAndFixUrl(url) {
    if (/smotretanime\.ru/.test(url)) {
      if (/\/embed/.test(url)) {
        return url;
      } else {
        let matched = url.match(/[0-9]+$/);
        if (matched) {
          return "https://smotretanime.ru/translations/embed/" + matched[0];
        } else {
          return null;
        }
      }
    } else {
      return null;
    }
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
})(true);