
const foeLogger = new function () {
	var playerId;

	function findPlayerId(responses) {
		var i;
		for (i = 0; i < responses.length; i++) {
			var response = responses[i];
			if (response.requestClass == 'StartupService'
				&& response.requestMethod == 'getData') {
				playerId = response.responseData.user_data.player_id;
				break;
			}
		}
	}

	function dataToString(data) {
		if (data instanceof ArrayBuffer) {
			return String.fromCharCode.apply(null, new Uint8Array(data));
		}
		return data;
	}

	this.handleWebSocketMessage = function (wsmsg) {
		if (playerId && wsmsg && wsmsg.data && wsmsg.data != 'PONG') {
			var report = {
				url: wsmsg.currentTarget.url,
				request: {
					"__class__": "ServerRequest",
					"requestClass": "WebSocket",
					"requestMethod": "push",
				},
				response: JSON.parse(dataToString(wsmsg.data))
			};
			chrome.runtime.sendMessage(foeLoggerId, {
				'action': 'sendReport',
				'playerId': playerId,
				'world': window.gameVars.world_id,
				'report': report
			});
		}

	}.bind(this);

	this.handleAPICall = function (data) {

		if (data.url.indexOf("forgeofempires.com/game/json") > 0) {
			var report = {
				url: data.url,
				request: JSON.parse(dataToString(data.request)),
				response: JSON.parse(dataToString(data.response))
			};

			if (!playerId) {
				findPlayerId(report.response);
			}
			if (playerId) {
				chrome.runtime.sendMessage(foeLoggerId, {
					'action': 'sendReport',
					'playerId': playerId,
					'world': window.gameVars.world_id,
					'report': report
				});
			}
		}

	}.bind(this);
};

(function (foeLogger) {
	const xhr = XMLHttpRequest.prototype;
	const xhr_open = xhr.open;
	const xhr_send = xhr.send;

	function onXHRLoaded() {
		try {
			foeLogger.handleAPICall({
				url: this.interceptor_url,
				request: this.interceptor_request,
				response: this.response
			});
		} catch (err) {
			console.warn("Error in handleAPICall: ", err);
		}
	}

	xhr.open = function (method, url) {
		this.interceptor_request = null;
		this.interceptor_url = url;
		xhr_open.apply(this, arguments);
	};

	xhr.send = function (data) {
		this.interceptor_request = data;
		this.addEventListener('load', onXHRLoaded, { capture: false, passive: true });
		xhr_send.apply(this, arguments);
	};

	const observedWebsockets = new WeakSet();
	const ws = WebSocket.prototype;
	const ws_send = ws.send;

	function onWSReceive(wsmsg) {
		try {
			foeLogger.handleWebSocketMessage(wsmsg);
		} catch (err) {
			console.warn("Error in handleWebSocketMessage: ", err);
		}
	}

	ws.send = function (data) {
		ws_send.call(this, data);
		if (!observedWebsockets.has(this)) {
			observedWebsockets.add(this);
			this.addEventListener('message', onWSReceive, { capture: false, passive: true });
		}
	};

})(foeLogger);
