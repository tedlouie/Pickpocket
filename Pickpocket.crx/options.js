var hc = chrome.extension.getBackgroundPage();
console = hc.console;
window.onload = populatePrefs;

function populatePrefs() {
	document.getElementById('da0').checked = (localStorage.defaultAction == 'showlist');
	document.getElementById('da1').checked = (localStorage.defaultAction == 'opentabs');
	document.getElementById('dv0').checked = (localStorage.defaultPageView == 'normal');
	document.getElementById('dv1').checked = (localStorage.defaultPageView == 'reading');
	document.getElementById('at0').checked = (localStorage.archiveTrigger == 'focus');
	document.getElementById('at1').checked = (localStorage.archiveTrigger == 'leave');
	document.getElementById('at2').checked = (localStorage.archiveTrigger == 'none');
	document.getElementById('pm0').checked = (localStorage.pinMethod == 'fave');
	document.getElementById('pm1').checked = (localStorage.pinMethod == 'tag');
	document.getElementById('sd0').checked = (localStorage.showAddDialog == 'yes');
	document.getElementById('sd1').checked = (localStorage.showAddDialog == 'no');
	document.getElementById('unw').checked = (localStorage.useNewWindow == 'yes');
	document.getElementById('sof').checked = (localStorage.sortOldestFirst == 'yes');
	document.getElementById('clb').checked = (localStorage.colorizeButton == 'yes');
	document.getElementById('net').checked = (localStorage.newExcludesTagged == 'yes');
	document.getElementById('uai').checked = (localStorage.useAlternateIcon == 'yes');
	document.getElementById('acm').checked = (localStorage.addContextMenuItem == 'yes');
	document.getElementById('rou').checked = (localStorage.reloadOnUpdate == 'yes');
	document.getElementById('ci').value    = parseInt(localStorage.checkInterval) / 60;
	document.getElementById('ol').value    = parseInt(localStorage.openLimit);
	document.getElementById('dl').value    = parseInt(localStorage.downloadLimit);
	
	if (localStorage.defaultAction == 'opentabs') {
		document.getElementById('unw').disabled = false;
		document.getElementById('unw_label').className = '';
	}
	
	var inputs = document.querySelectorAll('input');
	for (var i = 0; i < inputs.length; i++) {
		if (inputs[i].type != 'range')
			inputs[i].addEventListener('change', savePref, false);
	}
	
	var setText = function (e) {
		var text = (this.id == 'ol' && this.value == 0) ? 'all' : this.value;
		document.getElementById(this.id + 'i').textContent = text;
	};
	var saveOldValue = function (e) {
		e.currentTarget.oldValue = e.currentTarget.value;
	};
	var focusInput = function (e) {
		e.currentTarget.querySelector('input').focus();
	};
	var sliders = document.querySelectorAll('input[type=range]');
	for (var s, text, j = 0; j < sliders.length; j++) {
		s = sliders[j];
		text = (s.id == 'ol' && s.value == 0) ? 'all' : s.value;
		document.getElementById(s.id + 'i').textContent = text;
		s.addEventListener('change', setText, false);
		s.addEventListener('mousedown', saveOldValue, false);
		s.addEventListener('mouseup', savePref, false);
		s.addEventListener('keyup', savePref, false);
		document.getElementById(s.id + 'label').addEventListener('click', focusInput, false);
	}
	
	document.getElementById('reauth').onclick = function () {
		hc.resetItemCache();
		delete localStorage.oAuthAccessToken;
		hc.beginAuthProcess();
		self.close();
	};
}
function savePref() {
	var control = event.target;
	switch (control.type) {
		case 'radio':
			localStorage[control.name] = control.value;
			if (control.name == 'defaultAction')
				hc.applyDefaultAction();
			var subrows = document.querySelector('#' + control.name).querySelectorAll('.sub');
			for (var i = 0; i < subrows.length; i++) {
				var subrow = subrows[i];
				if (control.id == subrow.getAttribute('parent')) {
					subrow.querySelector('input').disabled = false;
					subrow.querySelector('label').className = '';
				} else {
					subrow.querySelector('input').disabled = true;
					subrow.querySelector('label').className = 'disabled';
				}
			}
		break;
		case 'checkbox':
			localStorage[control.name] = (control.checked) ? 'yes' : 'no';
			if (control.name == 'addContextMenuItem') {
				hc.toggleContextMenuItems();
			} else
			if (control.name == 'colorizeButton') {
				hc.setButtonIcon(hc.defaultIcon);
			} else
			if (control.name == 'useAlternateIcon') {
				hc.defaultIcon = (localStorage.useAlternateIcon == 'yes') ? 'icon-pocket-19.png' : 'icon-19.png';
				hc.setButtonIcon(hc.defaultIcon);
			}
		break;
		case 'range':
			if (control.value == control.oldValue)
				break;
			if (event.type == 'keyup')
				if (event.which < 37 || event.which > 40)
					break;
			if (control.name == 'checkInterval') {
				localStorage[control.name] = (control.value > 0) ? control.value * 60 : '';
				hc.scheduleCheckForNewItems();
			} else
				localStorage[control.name] = control.value;
			console.log('Saved ' + control.name + ' value:', control.value);
		break;
	}
}
