function getDefaultIconUrl() {
	return chrome.extension.getURL('page-16.png');
}
function goAway() {
	self.close();
}
function google(query) {
	var tabProps = {
		url    : 'http://www.google.com/search?q=' + encodeURIComponent(query),
		active : true
	};
	chrome.tabs.getSelected(function (tab) {
		if (!tab.url || tab.url === 'about:blank') {
			chrome.tabs.update(tabProps, goAway);
		} else {
			chrome.tabs.create(tabProps, goAway);
		}
	});
}
function initChrome() {
	safari = false;
	hc = chrome.extension.getBackgroundPage();
	document.body.className = 'chrome';
	initialize();
}
function showAddForm() {
	window.location.href = 'add.html';
}
function showOptionsForm() {
	window.location.href = 'options.html';
}
function stdErrorHandler(xhr) {
	hc.setReportForXhrError(xhr);
	messageSpan.innerHTML = '<a href="error.html">Pocket error. Click for details.</a>';
}

window.onload = initChrome;
