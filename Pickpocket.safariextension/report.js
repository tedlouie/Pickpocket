function getMyButton() {
	return safari.extension.toolbarItems.filter(function (ti) {
		return (
			ti.browserWindow === safari.application.activeBrowserWindow && 
			ti.popover && 
			ti.popover.identifier === safari.self.identifier
		);
	})[0];
}
function initialize(report, blurCallback, okCallback) {
	document.querySelector('#report').innerHTML = report;
	safari.self.height = document.body.offsetHeight + 80;
	document.querySelector('button').onclick = function (e) {
		if (okCallback) {
			window.onblur = null;
			safari.self.hide();
			getMyButton().popover = null;
			okCallback();
		} else safari.self.hide();
	};
	document.querySelector('button').focus();
	window.onblur = function () {
		getMyButton().popover = null;
		if (blurCallback) blurCallback();
	};
}