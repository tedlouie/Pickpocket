var hc = safari.extension.globalPage.contentWindow;
console = hc.console;
window.onload = initialize;

function initialize() {
	document.getElementById('da0').checked = (localStorage.defaultAction == 'showlist');
	document.getElementById('da1').checked = (localStorage.defaultAction == 'opentabs');
	document.getElementById('da2').checked = (localStorage.defaultAction == 'showmenu');
	document.getElementById('dv0').checked = (localStorage.defaultPageView == 'normal');
	document.getElementById('dv1').checked = (localStorage.defaultPageView == 'reading');
	document.getElementById('at0').checked = (localStorage.archiveTrigger == 'focus');
	document.getElementById('at1').checked = (localStorage.archiveTrigger == 'leave');
	document.getElementById('at2').checked = (localStorage.archiveTrigger == 'none');
	document.getElementById('pm0').checked = (localStorage.pinMethod == 'fave');
	document.getElementById('pm1').checked = (localStorage.pinMethod == 'tag');
	document.getElementById('unw').checked = (localStorage.useNewWindow == 'yes');
	document.getElementById('car').checked = (localStorage.confirmArchive == 'true');
	document.getElementById('acm').checked = (localStorage.addContextMenuItem == 'yes');
	document.getElementById('net').checked = (localStorage.newExcludesTagged == 'yes');
	document.getElementById('rou').checked = (localStorage.reloadOnUpdate == 'yes');
	document.getElementById('urb').checked = (localStorage.unreadBadge == 'yes');
	document.getElementById('ci').value    = parseInt(localStorage.checkInterval) / 60;
	document.getElementById('ol').value    = parseInt(localStorage.openLimit);
	document.getElementById('dl').value    = parseInt(localStorage.downloadLimit);
		
	if (localStorage.defaultAction == 'opentabs') {
		document.getElementById('unw').disabled = false;
		document.getElementById('unw_label').className = '';
	}
	if (localStorage.unreadBadge == 'no') {
		document.getElementById('ci').disabled = true;
		document.getElementById('ci_label').className = 'disabled';
	}
	if (localStorage.archiveTrigger == 'leave') {
		document.getElementById('car').disabled = false;
		document.getElementById('car_label').className = '';
	}
	
	var inputs = document.querySelectorAll('input');
	for (var i = 0; i < inputs.length; i++) {
		if (inputs[i].type !== 'range' && inputs[i].name !== 'hotkey')
			inputs[i].addEventListener('change', savePref, false);
	}
	
	hkInput = document.getElementById('hki');
	hkInput.value = populateHotkeyInput();
	hkInput.addEventListener('focus', handleHotkeyFocus, false);
	hkInput.addEventListener('keydown', handleHotKeyDown, false);
	document.getElementById('hkrb').addEventListener('click', resetHotkey, false);
	
	var sliders = document.querySelectorAll('input[type=range]');
	for (var s, text, j = 0; j < sliders.length; j++) {
		s = sliders[j];
		text = (s.id == 'ol' && s.value == 0) ? 'all' : s.value;
		document.getElementById(s.id + 'i').textContent = text;
		s.addEventListener('change', function (e) {
			var text = (this.id == 'ol' && this.value == 0) ? 'all' : this.value;
			document.getElementById(this.id + 'i').textContent = text;
		}, false);
		s.addEventListener('mousedown', function (e) {
			this.oldValue = this.value;
		}, false);
		s.addEventListener('mouseup', savePref, false);
		s.addEventListener('keyup', savePref, false);
		document.getElementById(s.id + 'label').addEventListener('click', function (e) {
			this.querySelector('input').focus();
		}, false);
	}
	
	document.getElementById('reauth').onclick = function () {
		hc.resetItemCache();
		delete localStorage.oAuthAccessToken;
		hc.beginAuthProcess();
		safari.self.hide();
	};
}
function handleHotKeyDown(e) {
	e.stopPropagation();
	switch (e.which) {
		case 27:	// escape
			e.target.blur();
			break;
		case 37:	// left
		case 38:	// up
		case 39:	// right
		case 40:	// down
			e.preventDefault();
			break;
		case  9:	// tab
		case 16:	// shift
		case 17:	// ctrl
		case 18:	// option
		case 91:	// command-left
		case 93:	// command-right
			break;
		default:
			e.preventDefault();
			saveHotkey(e);
		break;
	}
}
function handleHotkeyFocus(e) {
	setTimeout(function (e) {
		hkInput.select();
	}, 10);
}
function passSettingsToAllPages(keys) {
	var message = {};
	var thisWindow = {};
	var thisTab = {};
	var copyKey = function (key) {
		try {
			message[key] = JSON.parse(localStorage[key]);
		} catch(e) {
			message[key] = localStorage[key];
		}
		console.log('Will pass setting "' + key + '" with value:', message[key]);
	}
	keys.forEach(copyKey);
	for (var i = 0; i < safari.application.browserWindows.length; i++) {
		thisWindow = safari.application.browserWindows[i];
		for (var j = 0; j < thisWindow.tabs.length; j++) {
			thisTab = thisWindow.tabs[j];
			if (thisTab.page != undefined) {
				console.log('Passing settings to page at ' + thisTab.url);
				thisTab.page.dispatchMessage('receiveSettings', message);
			}
		}
	}
}
function populateHotkeyInput() {
	var hotkey = JSON.parse(localStorage.hotkey);
	var cStr = String.fromCharCode(hotkey.keyCode);
	if (!/[0-9A-Z]/.test(cStr))
		cStr = String.fromCharCode(parseInt(hotkey.keyIdentifier.slice(2), 16));
	if (cStr === ' ')
		cStr = 'Space';
	var mStr = '';
	if (hotkey.ctrlKey)  mStr += '⌃';
	if (hotkey.altKey)   mStr += '⌥';
	if (hotkey.shiftKey) mStr += '⇧';
	if (hotkey.metaKey)  mStr += '⌘';
	return mStr + cStr;
}
function resetHotkey() {
	localStorage.hotkey = hc.defaults.hotkey;
	hkInput.value = populateHotkeyInput();
}
function saveHotkey(e) {
	e.target.blur();
	var hotkey = {};
	var props = ['which','keyCode','keyIdentifier','altKey','ctrlKey','metaKey','shiftKey'];
	for (var i = 0; i < props.length; i++)
		hotkey[props[i]] = e[props[i]];
	localStorage.hotkey = JSON.stringify(hotkey);
	e.target.value = populateHotkeyInput();
	passSettingsToAllPages(['hotkey']);
}
function savePref() {
	var control = event.target;
	switch (control.type) {
		case 'radio':
			localStorage[control.name] = control.value;
			var subrows = document.querySelector('#' + control.name).querySelectorAll('.sub');
			for (var i = 0; i < subrows.length; i++) {
				var subrow = subrows[i];
				if (control.id === subrow.getAttribute('parent')) {
					subrow.querySelector('input').disabled = false;
					subrow.querySelector('label').className = '';
				} else {
					subrow.querySelector('input').disabled = true;
					subrow.querySelector('label').className = 'disabled';
				}
			}
		break;
		case 'checkbox':
			localStorage[control.name] = control.checked ? 'yes' : 'no';
			if (control.name == 'unreadBadge') {
				document.getElementById('ci').disabled = !control.checked;
				document.getElementById('ci_label').className = control.checked ? '' : 'disabled';
			}
		break;
		case 'range':
			if (control.value === control.oldValue)
				break;
			if (event.type === 'keyup')
				if (event.which < 37 || event.which > 40)
					break;
			if (control.name === 'checkInterval') {
				localStorage[control.name] = JSON.stringify((control.value > 0) ? control.value * 60 : 0);
				hc.scheduleCheckForNewItems();
			} else
				localStorage[control.name] = control.value;
			console.log('Saved ' + control.name + ' value:', control.value);
		break;
	}
}
