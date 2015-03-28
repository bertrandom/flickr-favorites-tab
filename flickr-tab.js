
(function() {
    "use strict";
    if (!window.FlickrTab) {
        var CACHE_HIT, CACHE_MISS, CACHE_STALE, DEBUG, DEBUG_OFFLINE, ONE_HOUR, FORCE_OFFLINE, LAST_FETCH, LAST_PHOTO, PHOTOS, PRELOADS, REJECTED, randInt, hasPhotoToDisplay, log;
        DEBUG = !0, ONE_HOUR = 36e5, CACHE_MISS = 0, CACHE_HIT = 1, CACHE_STALE = 2, FORCE_OFFLINE = !1, LAST_FETCH = "lastFetch", PHOTOS = "photos", REJECTED = "rejected", LAST_PHOTO = "lastPhoto", DEBUG_OFFLINE = "forceOffline", PRELOADS = [{
            by: "Andrés Nieto Porras",
            title: "Svartifoss",
            link: "https://www.flickr.com/photos/anieto2k/15687195488/"
        }, {
            by: "Digo_Souza",
            title: "Flower (Macro Photography)",
            link: "https://www.flickr.com/photos/caochopp/6765007193/"
        }, {
            by: "Roger Nelson",
            title: "Admiring the view",
            link: "https://www.flickr.com/photos/25646954@N00/1097698638/"
        }, {
            by: "Julien Belli",
            title: "Arrow",
            link: "https://www.flickr.com/photos/julienbelli/14694799896/"
        }, {
            by: "Rita Willaert",
            title: "Danmark O, Fohn Fjord,  Renodde.70°N/26°W",
            link: "https://www.flickr.com/photos/14417999@N00/76566707/"
        }], hasPhotoToDisplay = !1, DEBUG && (FORCE_OFFLINE = localStorage.getItem(DEBUG_OFFLINE)), window.FlickrTab = {
            ywaParams: "?src=ctab",
            numberOfExploreCalls: 0,
            init: function() {
                if (this.setTitle(), this.setYWAParams(), !navigator.onLine || FORCE_OFFLINE) return void this.showOfflinePage();
                var cachedPhotos, photos;
                switch (this.photoDiv = document.getElementById("photo"), this.bgDiv = document.getElementById("bg"), this.cacheState()) {
                    case CACHE_MISS:
                        return log("[cache] MISS!"), this.showOfflinePage(), void this.queueJob("fetchInterestingPhotos");
                    case CACHE_STALE:
                        log("[cache] STALE!"), this.queueJob("fetchInterestingPhotos")
                }
                try {
                    cachedPhotos = localStorage.getItem(PHOTOS), photos = JSON.parse(cachedPhotos), this.renderLiveTab(photos, this.selectRandomPhoto.bind(this))
                } catch (error) {
                    log(error), this.showOfflinePage()
                }
            },
            setTitle: function() {
                var title = document.getElementsByTagName("title")[0];
                title.innerText = chrome.i18n.getMessage("newTabTitle")
            },
            showOfflinePage: function() {
                log("offline mode");
                var img, id, link, fTitle, photo;
                id = randInt(PRELOADS.length), photo = PRELOADS[id], log(id, photo), img = document.getElementById("thumbnail-image"), img.src = "/preload-" + id + ".jpg", link = document.getElementById("thumbnail-link"), link.href = photo.link, link.style.backgroundImage = "url(/preload-" + id + ".jpg)", link.style.backgroundSize = "cover", fTitle = document.getElementsByClassName("title-link")[0], fTitle.className = "title-link", fTitle.href = link.href, fTitle.innerText = photo.title
            },
            cacheState: function() {
                var cachedLastFetch, lastFetch;
                return (cachedLastFetch = Number(localStorage.getItem(LAST_FETCH))) ? Date.now() - cachedLastFetch > ONE_HOUR ? CACHE_STALE : (lastFetch = new Date(cachedLastFetch), log({
                    lastFetch: lastFetch,
                    cachedLastFetch: cachedLastFetch
                }), CACHE_HIT) : CACHE_MISS
            },
            renderLiveTab: function(photos, callback) {
                chrome.tabs.getCurrent(function(tab) {
                    callback(tab, photos)
                })
            },
            selectRandomPhoto: function(tab, photos) {
                function showIframe() {
                    if (slowNetwork) return void iframe.remove();
                    if ("ready" != iframe.className) {
                        var footer = document.getElementsByClassName("footer")[0],
                            flogo = document.querySelector(".flickr-logo");
                        iframe.className = "ready", setTimeout(function() {
                            link.className = "hide", footer.className = "hide", flogo.className = "hide"
                        }, 500)
                    }
                }

                function receiveMessage(event) {
                    var data = event.data.split(",");
                    event.origin.match(/\/www.flickr.com$/) && data[0] === photo.id && "loaded" === data[1] && (log("received data from iframe", event.data), counter += 1, 2 == counter && showIframe())
                }
                var fTitle, iframe, img, link, nowPhotoIndex, offlineCheck, photo, photoUrl, photoRatio, tabRatio, slowNetwork = !1;
                if (!hasPhotoToDisplay) {
                    if (!photos || 0 === photos.length) return void FlickrTab.showOfflinePage();
                    nowPhotoIndex = Number(localStorage.getItem(LAST_PHOTO)) || 0, nowPhotoIndex = nowPhotoIndex || 0, nowPhotoIndex %= photos.length, localStorage.setItem(LAST_PHOTO, (nowPhotoIndex + 1) % photos.length), this.queueJob("cacheNextPhotos"), photo = photos[nowPhotoIndex], log(nowPhotoIndex, photo), offlineCheck = setTimeout(function() {
                        log("slow connection, force offline mode"), slowNetwork = !0, fTitle.className = "title-link", FlickrTab.showOfflinePage()
                    }, 3e3), photoUrl = photo.url_l || photo.url_m, photoRatio = photo.width_m / photo.height_m, tabRatio = tab.width / tab.height, img = document.getElementById("thumbnail-image"), img.onload = function() {
                        fTitle.className = "title-link", clearTimeout(offlineCheck), FlickrTab.queueJob("markPhotoSeen", photo.id)
                    }, img.src = photoUrl, link = document.getElementById("thumbnail-link"), link.href = "https://www.flickr.com/" + photo.owner + "/" + photo.id, tabRatio > photoRatio && (link.style.backgroundPosition = "top center"), link.style.backgroundImage = "url(" + photoUrl + ")", fTitle = document.getElementsByClassName("title-link")[0], fTitle.href = link.href, fTitle.innerText = photo.title, iframe = document.createElement("iframe"), iframe.src = "https://www.flickr.com/photo/" + photo.id + "/embedded/" + this.ywaParams, iframe.frameBorder = 0, iframe.allowFullscreen = "", iframe.scrolling = "no", iframe.style = "overflow: hidden; padding: 0px; max-width: none; display: inline; position: static;opacity:0;", window.addEventListener("message", receiveMessage, !1);
                    var counter = 0;
                    this.photoDiv.insertBefore(iframe, link), hasPhotoToDisplay = !0, log("iframe url set")
                }
            },
            queueJob: function(func) {
                var args = Array.prototype.slice.call(arguments);
                args.shift(), chrome.runtime.sendMessage({
                    func: func,
                    args: args
                }, function(response) {
                    log("[Q]", response)
                })
            },
            setYWAParams: function() {
                if (chrome && chrome.runtime && chrome.runtime.getManifest) {
                    var manifest = chrome.runtime.getManifest();
                    this.ywaParams = this.ywaParams + "&v=" + manifest.version
                }
            }
        }, randInt = function(max) {
            return Math.floor(Math.random() * max)
        }, log = function() {}, DEBUG && (log = function() {
            var args, time;
            args = 1 <= arguments.length ? [].slice.call(arguments, 0) : [], time = (new Date % 6e4 / 1e3).toFixed(3), args.unshift(time), console.log.apply(console, args)
        })("begin page load")
    }
}).call(this);