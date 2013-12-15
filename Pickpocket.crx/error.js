function handleKeyDown() {
	switch (event.which) {
		case  9:	// tab
			event.preventDefault();
			if (event.target.id === 'yesbutton') {
				noButton.focus();
			} else if (event.target.id === 'nobutton') {
				yesButton.focus();
			} break;
		case 78:	// n
			noButton.click();
			break;
		case 89:	// y
			yesButton.click();
			break;
		default: return;
	}
}
function handleAnswer(answer) {
	event.preventDefault();
	window.onunload = null;
	if (callback)
		callback(answer);
	self.close();
}
function handleWinUnload(e) {
	if (hc.reportObject.forceOK)
		handleAnswer(true);
	else handleAnswer(false);
}
function initialize() {/*
	if (location.search !== "?foo") {
		location.search = "?foo";
		throw new Error;
	}*/
	document.body.style.width = '400px';
	callback = hc.reportObject.callback;
	window.onunload = handleWinUnload;
	window.onkeydown = handleKeyDown;
	yesButton = document.querySelector('#yesbutton');
	yesButton.onclick = function () { handleAnswer(true) };
	if (hc.reportObject.binary && !hc.reportObject.forceOK) {
		noButton = document.querySelector('#nobutton');
		noButton.className = noButton.className.replace(' hidden','');
		noButton.onclick = function () { handleAnswer(false) };
	}
	document.querySelector('#report').innerHTML = hc.reportObject.message || 'Unknown error.';
	yesButton.focus();
}

var ce = chrome.extension;
var hc = ce.getBackgroundPage();

window.onload = initialize;
