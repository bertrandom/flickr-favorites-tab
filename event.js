! function(window) {
    function shuffle(array) {
        for (var temporaryValue, randomIndex, currentIndex = array.length; 0 !== currentIndex;) randomIndex = Math.floor(Math.random() * currentIndex), currentIndex -= 1, temporaryValue = array[currentIndex], array[currentIndex] = array[randomIndex], array[randomIndex] = temporaryValue;
        return array
    }
    var DEBUG, LAST_FETCH, LAST_PHOTO, MAX_SEEN_LIST_SIZE, PHOTOS, REJECTED, SEEN_LIST, log;
    DEBUG = !0, MAX_SEEN_LIST_SIZE = 500, LAST_FETCH = "lastFetch", LAST_PHOTO = "lastPhoto", PHOTOS = "photos", REJECTED = "rejected", SEEN_LIST = "seenPhotos", window.FlickrTabEvents = {
        init: function() {
            localStorage.getItem(LAST_FETCH) || this.fetchInterestingPhotos(), chrome.runtime.onMessage.addListener(this.queueJob.bind(this))
        },
        queueJob: function(request, sender, sendResponse) {
            sender.tab && "chrome://newtab/" === sender.tab.url ? this[request.func] ? this[request.func].apply(this, request.args) : log("[QJ] unrecognized function:", request.func) : log("[QJ] unrecognized sender", sender.tab && sender.tab.url), sendResponse("ok")
        },
        cacheNextPhotos: function() {
            var cachedPhotos, img, index, nowPhotoIndex, photos;
            nowPhotoIndex = Number(localStorage.getItem(LAST_PHOTO)) || 0, cachedPhotos = localStorage.getItem(PHOTOS), photos = JSON.parse(cachedPhotos);
            for (var i = 0; 10 > i; i++) index = nowPhotoIndex + i, photo = photos[index % photos.length], img = new Image, img.src = photo.url_l || photo.url_m
        },
        fetchInterestingPhotos: function() {

            var i, 
            	url, 
                pageLists = {},
                triggeredPages = false,
                nsid;

            if (localStorage.getItem('nsid')) {
            	nsid = localStorage.getItem('nsid');
            } else {
            	nsid = '61091860@N00';
            }

            nsid = encodeURIComponent(nsid);
            
            var xmlhttp = new XMLHttpRequest;
            url = "https://api.flickr.com/services/rest/?method=flickr.favorites.getPublicList&api_key=3103129f7e79ace086511b6c18fa212f&format=json&nojsoncallback=1&user_id=" + nsid + "&extras=url_n,url_l,url_m,media&per_page=500";
        	xmlhttp.onreadystatechange = function() {

        		if (this.readyState === XMLHttpRequest.DONE && this.status >= 200 && this.status < 300) {

        			var apiResponseData = JSON.parse(this.response);

        			pageLists['page1'] = apiResponseData.photos.photo;
        			console.log(apiResponseData);

        			pages = apiResponseData.photos.pages;

        			if (!triggeredPages) {

	        			triggeredPages = true;

	        			for (var j = 2; j <= pages; j++) {

	        				(function(){

	        					var url;

	                			var xmlhttp = new XMLHttpRequest;
	                			url = "https://api.flickr.com/services/rest/?method=flickr.favorites.getPublicList&api_key=3103129f7e79ace086511b6c18fa212f&format=json&nojsoncallback=1&user_id=" + nsid + "&extras=url_n,url_l,url_m,media&per_page=500&page=" + j,
	                			xmlhttp.page = j, 
			                	xmlhttp.onreadystatechange = function() {
			                    	
			                    	if (this.readyState === XMLHttpRequest.DONE && this.status >= 200 && this.status < 300) {

			                    		pageLists['page' + this.page] = JSON.parse(this.response).photos.photo;

			                    		console.log(Object.keys(pageLists).length, pages, this.page);

			                    		if (Object.keys(pageLists).length === pages) {
			                    			FlickrTabEvents._cachePhotosData(pageLists);
			                    		}
			                    	}

			                	},
			                	xmlhttp.open("GET", url, !0),
			                	xmlhttp.send();

	        				})();


	        			}

        			}

        		}

        	};
        	xmlhttp.open("GET", url, !0);
        	xmlhttp.send();

        },
        markPhotoSeen: function(photoId) {
            var i, seenList;
            seenList = this._getSeenList();
            for (i in seenList)
                if (photoId === seenList[i]) return;
            for (; seenList.length > MAX_SEEN_LIST_SIZE;) seenList.shift();
            seenList.push(photoId), localStorage.setItem(SEEN_LIST, JSON.stringify(seenList))
        },
        _getSeenList: function() {
            var seenList = JSON.parse(localStorage.getItem(SEEN_LIST));
            return Array.isArray(seenList) || (seenList = []), seenList
        },
        _cachePhotosData: function(dailyLists) {
            var p, photo, pruned, ratio, cachedPhotos = [],
                dedupe = {},
                shuffled = [],
                rejectedPhotos = [];
            pruned = this._prune(dailyLists, this._getSeenList());
            for (p in pruned) shuffled = shuffled.concat(shuffle(pruned[p]));
            for (p in shuffled) photo = shuffled[p], ratio = photo.width_m / photo.height_m, "video" === photo.media || 1.4 > ratio || ratio > 1.85 ? rejectedPhotos.push(photo) : dedupe[photo.id] ? log("[_cPD] dupe id", photo.id) : (cachedPhotos.push(photo), dedupe[photo.id] = !0);
            localStorage.setItem(PHOTOS, JSON.stringify(cachedPhotos)), localStorage.setItem(REJECTED, JSON.stringify(rejectedPhotos)), localStorage.setItem(LAST_FETCH, Date.now()), localStorage.setItem(LAST_PHOTO, 0), this.cacheNextPhotos()
        },
        _prune: function(dailyLists, seenList) {
            var id, order, allPhotos = {},
                dedupeHash = {},
                inNewLists = {},
                newLists = [],
                seenButKept = [];
            for (var i in seenList) dedupeHash[seenList[i]] = !0;
            order = Object.keys(dailyLists).sort(function(a, b) {
                return b - a
            });
            for (var o in order) {
                var dayList, list, photo;
                list = dailyLists[order[o]], dayList = [];
                for (var p in list) photo = list[p], id = photo.id, allPhotos[id] = photo, dedupeHash[id] || (dayList.push(photo), dedupeHash[id] = !0, inNewLists[id] = !0);
                newLists.push(dayList)
            }
            for (id in allPhotos) inNewLists[id] || seenButKept.push(allPhotos[id]);
            return newLists.push(seenButKept), newLists
        }
    }, log = function() {}, DEBUG && (log = function() {
        var args, time;
        args = 1 <= arguments.length ? [].slice.call(arguments, 0) : [], time = (new Date % 6e4 / 1e3).toFixed(3), args.unshift(time), console.log.apply(console, args)
    }, log("begin page load"), "undefined" != typeof module && (console.log("module"), window.document = {
        createElement: function() {
            return {}
        }
    }, window.document.body = {
        appendChild: function() {}
    }, module.exports = window.FlickrTabEvents));
    var script = window.document.createElement("script");
    script.src = "moment.min.js", script.onload = function() {
        window.FlickrTabEvents.init()
    }, window.document.body.appendChild(script)
}(this);