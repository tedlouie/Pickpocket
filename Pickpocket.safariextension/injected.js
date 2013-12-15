function eventMatchesHotkey(prop) {
	return this.hotkey[prop] === this.event[prop];
}
function handleKeyDown(e) {
	var props = ['keyCode','altKey','ctrlKey','metaKey','shiftKey'];
	if (props.every(eventMatchesHotkey, { event: e, hotkey: settings.hotkey })) {
		e.preventDefault();
		safari.self.tab.dispatchMessage('hotkeyWasPressed', 'main');
	} else
	if (props.every(eventMatchesHotkey, { event: e, hotkey: settings.addHotkey })) {
		e.preventDefault();
		safari.self.tab.dispatchMessage('hotkeyWasPressed', 'add');
	}
	if (props.every(eventMatchesHotkey, { event: e, hotkey: settings.archiveHotkey })) {
		e.preventDefault();
		safari.self.tab.dispatchMessage('hotkeyWasPressed', 'archive');
	}
}
function handleMessage(e) {
	switch (e.name) {
		case 'receiveSettings':
			for (var key in e.message)
				settings[key] = e.message[key];
			break;
		case 'loadUrl':
			window.location.href = e.message;
			break;
		default: break;
	}
}

if (window === window.top) {
	var settings = {};
	safari.self.addEventListener('message', handleMessage, false);
	safari.self.tab.dispatchMessage('passSettings');
	document.addEventListener('keydown', handleKeyDown, false);
}

window.addEventListener('contextmenu', function (e) {
	safari.self.tab.setContextMenuEventUserInfo(e, e.target.href);
}, false);
