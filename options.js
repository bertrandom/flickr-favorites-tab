function saveOptions() {
    var status = document.getElementById("status");

    var oldNsid = localStorage.getItem('nsid');
    var newNsid = document.getElementById('nsid').value;

    if (newNsid && newNsid != oldNsid) {
	    localStorage.setItem('nsid', document.getElementById('nsid').value);
	    expireCache();
    }

    status.textContent = "Options saved.", setTimeout(function() {
        status.textContent = ""
    }, 750)
}

function restoreOptions() {

	var nsid = localStorage.getItem('nsid');
	if (nsid) {
		document.getElementById('nsid').value = nsid;
	}
}

function expireCache() {
    localStorage.removeItem("photos"), localStorage.removeItem("rejected"), localStorage.removeItem("lastFetch")
}

document.addEventListener("DOMContentLoaded", restoreOptions), document.getElementById("save").addEventListener("click", saveOptions), document.getElementById("expire").addEventListener("click", expireCache);