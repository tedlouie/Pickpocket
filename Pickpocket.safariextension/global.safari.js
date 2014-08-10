function addAllTabsToService() {
	modifyItems(sa.activeBrowserWindow.tabs, 'add', ['title','url'], {}, function () {
		showReport('All open pages were added to Pocket.', null, 5000);
		runBackgroundUpdate();
	});
}
function addReadEventListener(eventType, item, tab) {
	tab.addEventListener(eventType, function onEvent(e) {
		if (item.markedAsRead) return;
		console.log('Read event "' + e.type + '" fired for item:', item);
		if (e.target.alreadyPrompted) return;
		if (eventType == 'close' && localStorage.confirmArchive == 'yes') {
			var theTab = e.target;
			var theWindow = theTab.browserWindow;
			setTimeout(function () {
				if (!theWindow.visible)
					return;
				getConfirmation(('Do you want to archive “' + item.title + '”?'), function (confirmed, dontAskAgain) {
					theTab.alreadyPrompted = true;
					if (confirmed) markItemRead(item);
					if (dontAskAgain) {
						if (confirmed) {
							localStorage.confirmArchive = 'no';
							console.log('Will archive on close without confirmation from now on.');
						} else {
							localStorage.archiveTrigger = 'none';
							console.log('Will not archive from now on.');
						}						
					}
				}, true);
			}, 100);
		} else markItemRead(item);
		e.target.removeEventListener(e.type, onEvent, false);
	}, false);
}
function animateButton(button, timerID, running) {
	if (!button) return;
	function incrementTimer() {
		if (button.image.match(/\/watch\d\.png$/)) {
			var i = button.image.split('/watch')[1].split('.')[0] * 1 + 1;
			if (i === 8) i = 0;
			setButtonIcon(button, 'watch' + (i));
		} else {
			setButtonIcon(button, 'watch0');
		}
	}
	if (running === true) {
		if (button !== waitingButton) {
			setButtonIcon(button, 'watch0');
		}
		waitTimers[timerID] = setInterval(incrementTimer, 500);
	} else {
		clearInterval(waitTimers[timerID]);
		delete waitTimers[timerID];
		if (countWaitTimers() == 0) {
			setButtonIcon(waitingButton, getButtonDefaultIcon(button));
			waitingButton = null;
		}
	}
}
function beginAuthProcess() {
	sa.activeBrowserWindow.openTab().url = se.baseURI + 'oauth.html';
}
function countWaitTimers() {
	var count = 0;
	for (var i in waitTimers) {
		count++;
	} return count;
}
function execDefaultAction() {
	if (!localStorage.oAuthAccessToken) {
		beginAuthProcess();
		return;
	}
	switch (localStorage.defaultAction) {
		case 'opentabs':
			runFilterSet(null, function () {
				showReport('You have no unread links.', null, 3000);
			});
			break;
		case 'showlist':
			showList();
			break;
		case 'showmenu':
			showActionMenu();
			break;
		default: break;
	}
}
function getAddButtonForActiveWindow() {
	return se.toolbarItems.filter(function (button) {
		return button.identifier == 'addbutton' && button.browserWindow == sa.activeBrowserWindow;
	})[0];
}
function getButtonDefaultIcon(button) {
	return (button.identifier == 'mainbutton') ? 'caret'      :
	       (button.identifier == 'addbutton')  ? 'caret-down' : '';
}
function getConfirmation(question, callback, showDontAskAgain) {
	var frontButton = getMainButtonForActiveWindow();
	if (frontButton.popover) frontButton.popover.hide();
	frontButton.popover = getPopover('confirmP');
	frontButton.popover.contentWindow.initialize(question, callback, showDontAskAgain);
	frontButton.showPopover();
}
function getMainButtonForActiveWindow() {
	return se.toolbarItems.filter(function (button) {
		return button.identifier === 'mainbutton' && button.browserWindow === sa.activeBrowserWindow;
	})[0];
}
function getPopover(id) {
	return se.popovers.filter(function (p) {
		return p.identifier === id;
	})[0];
}
function handleCommand(event) {
	switch (event.command) {
		case 'execDefaultAction':
			execDefaultAction();
			break;
		case 'openTabs':
			runFilterSet(null, function () {
				showReport('You have no unread links.', null, 3000);
			});
			break;
		case 'showList':
			showList();
			break;
		case 'showMenu':
			showActionMenu();
			break;
		case 'openSettings':
			showSettings();
			break;
		case 'addAllPages':
			addAllTabsToService();
			break;
		case 'addCurrentPage':
			addTabToService(sa.activeBrowserWindow.activeTab, function (success) {
				var button = getAddButtonForActiveWindow() || getMainButtonForActiveWindow();
				var report = {
					'true'  : 'Link added. Click OK if you want to edit it.',
					'false' : 'There was a problem. The page has not been added.'
				};
				showReport(report[success], button, 5000, null, function () { showAddForm(button) });
			});
			break;
		case 'addSelectedLink':
			addLinkToService(event.userInfo, function (success) {
				var button = getAddButtonForActiveWindow() || getMainButtonForActiveWindow();
				var report = {
					'true'  : 'Link added. Click OK if you want to edit it.',
					'false' : 'There was a problem. The page has not been added.'
				};
				showReport(report[success], button, 5000, null, function () { showAddForm(button) });
			});
			break;
		default: showReport('No code here.', null, 2000);
	}
}
function handleContextMenu(event) {
	if (localStorage.addContextMenuItem == 'yes') {
		if (event.userInfo) {
			event.contextMenu.appendContextMenuItem('addSelectedLink','Add Link to Pocket');
		} else {
			event.contextMenu.appendContextMenuItem('addCurrentPage','Add This Page to Pocket');
			event.contextMenu.appendContextMenuItem('addAllPages','Add All Open Pages to Pocket');
		}
	}
}
function handleMessage(event) {
	switch (event.name) {
		case 'passSettings':
			var settings = {};
			for (var key in defaults) {
				try {
					settings[key] = JSON.parse(localStorage[key]);
				} catch(e) {
					settings[key] = localStorage[key];
				}
			}
			event.target.page.dispatchMessage('receiveSettings', settings);
		break;
		case 'hotkeyWasPressed':
			switch (event.message) {
				case 'main':
					execDefaultAction();
				break;
				case 'add':
					addTabToService(event.target, function (success) {
						var button = getAddButtonForActiveWindow() || getMainButtonForActiveWindow();
						var report = {
							'true'  : 'Link added. Click OK if you want to edit it.',
							'false' : 'There was a problem. The page has not been added.'
						};
						showReport(report[success], button, 5000, null, function () { showAddForm(button) });
						_gaq.push(['_trackEvent', 'User Actions', 'Add Item By Hotkey']);
					});
				break;
				case 'archive':
					markItemRead(getItemByUrl(event.target.url));
					_gaq.push(['_trackEvent', 'User Actions', 'Archive Item By Hotkey']);
				break;
			}
		break;
		case 'saveAccessToken':
			localStorage.oAuthAccessToken = event.message;
		break;
		case 'reloadThyself':
			window.location.reload();
		break;
	}
}
function handleSettingChange(event) {
	if (event.key == 'openSettings') {
		showSettings();
	}
}
function handleValidate(event) {
	if (event.command === 'execDefaultAction') {
		setButtonTooltip(event.target);
	} else
	if (event.command === 'addCurrentPage') {
		var atu = sa.activeBrowserWindow.activeTab.url;
		event.target.disabled = (!atu || atu === 'about:blank');
	}
}
function initializeSettings() {
	var lastVersion = (localStorage.lastVersion * 1) || se.settings.lastVersion;
	for (var key in defaults) {
		if (localStorage[key] == undefined) {
			localStorage[key] = defaults[key];
		}
	}
	if (lastVersion < 6) {
		se.settings.defaultAction = 'opentabs';
	}
	if (lastVersion < 18) {
		se.settings.confirmArchive = (se.settings.archiveOnClose === 'ask');
		se.settings.archiveTrigger = (!se.settings.archiveOnClose) ? 'none' : 'leave';
		delete se.settings.archiveOnClose;
	}
	if (lastVersion < 21) {
		resetItemCache();
	}
	if (lastVersion < 22) {
		se.settings.addContextMenuItem = true;
	}
	if (lastVersion < 24) {
		se.settings.archiveTrigger = se.settings.archiveTrigger.replace(/'/g, '');
	}
	if (lastVersion < 25) {
		se.settings.checkInterval = 300;
	}
	if (lastVersion < 39) {
		se.settings.hotkey = defaultHotkey;
	}
	if (lastVersion < 55) {
		resetItemCache();
	}
	if (lastVersion < 61) {
		for (var key in se.settings) {
			if (se.settings.hasOwnProperty(key)) {
				if (typeof se.settings[key] == 'string') 
					localStorage[key] = se.settings[key];
				else {
					var jsonss = JSON.stringify(se.settings[key]);
					if (jsonss ==  'true') jsonss = 'yes';
					if (jsonss == 'false') jsonss = 'no';
					localStorage[key] = jsonss;
				}
			}
		}
		se.settings.clear();
		se.secureSettings.clear();
		localStorage.pinMethod = 'tag';
		resetItemCache();
	}
	if (lastVersion < 62) {
		localStorage.hotkey = defaults.hotkey;
		localStorage.addHotkey = defaults.addHotkey;
		localStorage.archiveHotkey = defaults.archiveHotkey;
	}
	if (lastVersion < 91) {
		if (parseInt(localStorage.checkInterval) == 0) {
			localStorage.unreadBadge = 'no';
		}
	}
	localStorage.lastVersion = 91;
}
function markItemRead(item, onSuccess, onFailure) {
	console.log('Archiving:', item.url);
	if (item.markedAsRead) return;
	modifyItem(item, 'archive', null, function (res) {
		item.state = '1';
		item.markedAsRead = true;
		if (localStorage.unreadBadge == 'yes')
			setBadge(getMainButtonForActiveWindow().badge - 1);
		onSuccess && onSuccess(res);
		console.log('Archive successful.');
	}, onFailure);
}
function markItemUnread(item, onSuccess, onFailure) {
	console.log('Unarchiving:', item.url);
	modifyItem(item, 'readd', null, function () {
		item.state = '0';
		if (localStorage.unreadBadge == 'yes')
			setBadge(getMainButtonForActiveWindow().badge + 1);
		onSuccess && onSuccess();
		console.log('Unarchive successful.');
	}, onFailure);
}
function openItem(item, background, altView, archiveOnTrigger) {
	var win = sa.activeBrowserWindow;
	var tab = win.activeTab;
	if (background || [undefined, '', 'about:blank'].indexOf(tab.url) == -1)
		tab = win.openTab(background ? 'background' : 'foreground');
	tab.url = (altView ^ (ls.defaultPageView == 'reading')) ? services['pocket'].endpoints['read'] + item.id : item.url;
	localStorage[item.id] = (localStorage[item.id] || 0) * 1 + 1;
	itemCache.forEach(incrementHitCount, item.id);
	if (archiveOnTrigger) {
		item.service = localStorage.defaultService;
		switch (localStorage.archiveTrigger) {
			case 'focus':
				addReadEventListener((background ? 'activate' : 'navigate'), item, tab);
			break;
			case 'leave':
				var addListeners = function () {
					addReadEventListener('close', item, tab);
					tab.addEventListener('navigate', function onNavigate(e) {
						addReadEventListener('navigate', item, tab);
						e.target.removeEventListener('navigate', onNavigate, false);
					}, false);
				};
				if (background) {
					tab.addEventListener('activate', function onActivate(e) {
						addListeners();
						e.target.removeEventListener('activate', onActivate, false);
					}, false);
				} else addListeners();
			break;
		}
	}
}
function openItems(items, filterSet) {
	var useNewWindow = (filterSet) ? filterSet.newWindow : (localStorage.useNewWindow == 'yes');
	var targetWindow = (useNewWindow) ? sa.openBrowserWindow() : sa.activeBrowserWindow;
	for (var i = items.length - 1; i >= 0; i--)
		openItem(items[i], true, false, true);
	if (useNewWindow) targetWindow.tabs[0].close();
}
function reportXhrError(xhr, callback) {
	var report = '\
		<p>' + services[localStorage.defaultService].name + ' returned the following error message:</p>\
		<blockquote>\
			<p><b><code>' + xhr.getResponseHeader('Status') + '</code></b></p>\
			<p><code>' + xhr.getResponseHeader('X-Error') + '</code></p>\
		</blockquote>';
	showReport(report, null, false, callback, callback);
}
function setBadge(num) {
	if (num === null)
		num = itemCache.filter(isUnread).length;
	se.toolbarItems.forEach(function (ti) {
		if (ti.identifier === 'mainbutton')
			ti.badge = num;
	});
}
function setButtonIcon(button, filename) {
	button.image = se.baseURI + filename + '.png';
	return button;
}
function setButtonTooltip(button, tooltip) {
	button.toolTip = tooltip || (
		(localStorage.defaultAction == 'opentabs') ? 'Open unread Pocket items in tabs.'      :
		(localStorage.defaultAction == 'showlist') ? 'Show unread Pocket items in a popover.' :
		(localStorage.defaultAction == 'showmenu') ? 'Show Pickpocket\'s action menu.'        : ''
	);
}
function showActionMenu() {
	var frontButton = getMainButtonForActiveWindow();
	frontButton.menu = se.menus[0];
	frontButton.showMenu();
}
function showAddForm(button) {
	console.log(button);
	if (button.popover)
		button.popover.hide();
	button.popover = getPopover('addP');
	setTimeout(function () {
		button.showPopover();
	}, 10);
	_gaq.push(['_trackPageview', '/add.html']);
}
function showList() {
	var frontButton = getMainButtonForActiveWindow();
	if (frontButton.popover) frontButton.popover.hide();
	frontButton.popover = getPopover('listP');
	frontButton.popover.contentWindow.initSafari();
	frontButton.showPopover();
	_gaq.push(['_trackPageview', '/list.html']);
}
function showReport(report, button, timeout, blurCallback, okCallback) {
	button = button || getMainButtonForActiveWindow();
	console.log('Showing report: ', report);
	if (button.popover)
		button.popover.hide();
	button.popover = getPopover('reportP');
	button.popover.contentWindow.initialize(report, blurCallback, okCallback);
	button.showPopover();
	if (timeout) setTimeout(function () {
		if (button.popover && button.popover.identifier === 'reportP')
			button.popover.hide();
	}, timeout);
}
function showSettings() {
	var frontButton = getMainButtonForActiveWindow();
	if (frontButton.popover) frontButton.popover.hide();
	frontButton.popover = getPopover('settingsP');
	setTimeout(function () {
		frontButton.showPopover();
	}, 10);
}

var chrome = false;
var sa = safari.application;
var se = safari.extension;
var checkTimer = null;
var waitTimers = [];
var waitingButton = null;

defaults.confirmArchive = 'no';
defaults.hotkey = JSON.stringify({
	keyCode       : 80,
	keyIdentifier : "U+0050",
	altKey        : false,
	ctrlKey       : false,
	metaKey       : true,
	shiftKey      : true
});
defaults.addHotkey = JSON.stringify({
	keyCode       : 80,
	keyIdentifier : "U+0050",
	altKey        : false,
	ctrlKey       : true,
	metaKey       : true,
	shiftKey      : false
});
defaults.archiveHotkey = JSON.stringify({
	keyCode       : 80,
	keyIdentifier : "U+0050",
	altKey        : true,
	ctrlKey       : false,
	metaKey       : false,
	shiftKey      : true
});

sa.addEventListener('command', handleCommand, false);
sa.addEventListener("contextmenu", handleContextMenu, false);
sa.addEventListener('message', handleMessage, false);
sa.addEventListener('validate', handleValidate, false);
se.settings.addEventListener("change", handleSettingChange, false);

var _gaq = _gaq || [];
_gaq.push(['_setAccount', 'UA-17748243-4']);
_gaq.push(['_trackPageview', '/global.html']);
(function() {
	var ga = document.createElement('script');
	ga.type = 'text/javascript';
	ga.async = true;
	ga.src = 'https://ssl.google-analytics.com/ga.js';
	var s = document.getElementsByTagName('script')[0];
	s.parentNode.insertBefore(ga, s);
	console.log('Google Analytics script loaded.');
})();

initialize();
