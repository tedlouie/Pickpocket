var chrome = chrome || null;
var safari = safari || null;
var consumerKey = apiKeys.pocket;

window.onload = initialize;

function doXHRPost(url, data, successHandler, errorHandler) {
	if (arguments.callee && arguments.callee.caller)
		console.log('doXHRPost called from ' + arguments.callee.caller.name + ' with data:', data);
	console.log('Endpoint: "' + url + '"');
	var xhr = new XMLHttpRequest();
	xhr.onreadystatechange = function () {
		if (this.readyState === 4) {
			clearTimeout(xhr.timeout);
			if (xhr.waiting) {
				clearTimeout(xhr.waiting);
				xhr.waiting = null;
				showStatus('finished');
			}
			if (this.status === 200) {
				console.log('Response headers:', this.getAllResponseHeaders());
				if (successHandler) {
					successHandler(this);
				} else {
					console.log((function () {
						try {
							return JSON.parse(this.responseText);
						} catch (e) {
							return this.responseText;
						}
					})());
				}
			} else {
				console.log(this.status, this.statusText, this.responseText);
				console.log('Response headers:', this.getAllResponseHeaders());
				if (errorHandler) {
					errorHandler(this);
				} else {
					showReport(
						"<p>I'm sorry. There seems to be a problem. Pocket returned the following error message:</p>" +
						"<p class='error'>Error code " + this.getResponseHeader('X-Error-Code') + ": " +
						this.getResponseHeader('X-Error') + "</p>"
					);
				}
			}
		}
	};
	xhr.open('POST', url, true);
	xhr.setRequestHeader("Content-type", "application/json; charset=UTF8");
	xhr.setRequestHeader("X-Accept", "application/json");
	xhr.send(data || null);
	xhr.waiting = setTimeout(function () {
		showStatus('waiting');
	}, 2000);
	xhr.timeout = setTimeout(function () {
		xhr.abort();
		if (errorHandler) {
			errorHandler(xhr);
		} else {
			showReport("I'm very sorry. Pickpocket could not connect to your Pocket account.");
		}
	}, 15000);
}
function getRequestToken() {
	try {
		doXHRPost(
			'https://getpocket.com/v3/oauth/request', 
			JSON.stringify({
				'consumer_key' : consumerKey,
				'redirect_uri' : location.href + '?status=done'
			}),
			function (xhr) {
				var response = JSON.parse(xhr.responseText);
				localStorage.oAuthRequestToken = response.code;
				getAuthorization(response.code);
			}
		);
	} catch (e) {
		alert(JSON.stringify(e));
	}
}
function getAuthorization(requestToken) {
	try {
		window.location = [
			'https://getpocket.com/auth/authorize?request_token=',
			requestToken,
			'&redirect_uri=',
			location.href + '?status=done'
		].join('');
	} catch (e) {
		alert(JSON.stringify(e));
	}
}
function getAccessToken(callback) {
	try {
		doXHRPost(
			'https://getpocket.com/v3/oauth/authorize',
			JSON.stringify({
				'consumer_key' : consumerKey,
				'code'         : localStorage.oAuthRequestToken
			}),
			function (xhr) {
				var response = JSON.parse(xhr.responseText);
				if (chrome)
					localStorage.oAuthAccessToken = response.access_token; else
				if (safari)
					safari.self.tab.dispatchMessage('saveAccessToken', response.access_token);
				console.log('Got access token:', response.access_token);
				if (callback) callback();
			}
		);
	} catch (e) {
		alert(JSON.stringify(e));
	}
}
function initialize() {
	try {
		messageDiv = document.querySelector('#message');
		statusDiv = document.querySelector('#status');
		if (location.search == '?status=done') {
			if (localStorage.oAuthRequestToken) {
				showReport('Please wait a moment.');
				getAccessToken(function () {
					showReport(
						"<p><strong>Success!</strong> You can start using Pickpocket now. " +
						"Click the toolbar button to see your unread bookmarks.</p>"
					);
					if (chrome) {
						chrome.extension.getBackgroundPage().location.reload();
					} else
					if (safari) {
						safari.self.tab.dispatchMessage('reloadThyself');
					}
				});
			} else {
				showReport(
					"<p class='centered'>Hmmm&mdash;something went wrong. " + 
					"<a id='solink' href='#'>Please click here to start over.</a></p>"
				);
				document.querySelector('#solink').onclick = startOver;
			}
		} else {
			document.querySelector('#startbutton').onclick = getRequestToken;
			document.querySelector('#start').style.display = 'block';
			document.querySelector('.newusers').style.display = 'block';
		}
	} catch (e) {
		alert(JSON.stringify(e));
	}
}
function showReport(report) {
	messageDiv.innerHTML = report;
}
function showStatus(status) {
	switch (status) {
		case 'waiting':
			statusDiv.style.display = 'block';
		break;
		case 'finished':
			statusDiv.style.display = 'none';
		break;
	}
}
function startOver() {
	window.location = location.href.split('?')[0];
}
