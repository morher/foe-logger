(function (parent) {
	var script = document.createElement('script');
	script.textContent = "window.foeLoggerId = " + JSON.stringify(chrome.runtime.id);
	(document.head || document.documentElement).appendChild(script);
	script.parentNode.removeChild(script);

	script = document.createElement('script');
	script.src = chrome.extension.getURL('interceptor.js');
	script.onload = function () {
		script.parentNode.removeChild(script);
	}
	parent.appendChild(script);

})(document.documentElement);
