function cleanUp() {
	menu.hide();
	window.snoLabel && (snoLabel.style.display = 'none');
}
function getDefaultIconUrl() {
	return safari.extension.baseURI + 'page-16.png';
}
function getMyButton() {
	return safari.extension.toolbarItems.filter(function (ti) {
		return (
			ti.browserWindow == safari.application.activeBrowserWindow && 
			ti.popover && ti.popover.identifier == safari.self.identifier
		);
	})[0];
}
function goAway() {
	if (snowLeopard) {
		setTimeout('safari.self.hide()', 100);
	} else {
		safari.self.hide();
	}
}
function google(query) {
	goAway();
	var abw = safari.application.activeBrowserWindow;
	var aTab = abw.activeTab;
	var target = (!aTab.url || aTab.url === 'about:blank') ? aTab : abw.openTab();
	target.url = 'http://www.google.com/search?q=' + encodeURIComponent(query);
}
function initSafari() {
	chrome = false;
	hc = safari.extension.globalPage.contentWindow;
	console = hc.console;
	snowLeopard = /10_6/.test(navigator.appVersion);
	win = /^Win/.test(navigator.platform);
	document.body.className = 'safari';
	initialize();
}
function refresh() {
	console.log('Getting updated item list.')
	updateItems(JSON.parse(localStorage.cacheTime));
	// initMainBox();
	_gaq.push(['_trackPageview', '/list.html']);
}
function showAddForm() {
	goAway();
	hc.showAddForm(getMyButton());
}
function showOptionsForm() {
	goAway();
	hc.showSettings();
}
function stdErrorHandler(xhr) {
	messageSpan.innerHTML = '<a href="#">Pocket error. Click for details.</a>';
	messageSpan.onclick = function (e) {
		e.preventDefault();
		messageSpan.onclick = null;
		goAway();
		setTimeout(function () {
			hc.reportXhrError(xhr, function () { hc.beginAuthProcess() });
		}, 100);
	};
}

// window.onfocus = initSafari;
window.onblur = cleanUp;
