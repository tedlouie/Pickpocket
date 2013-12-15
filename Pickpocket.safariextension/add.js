function initialize(firstTime) {
	if (firstTime) {
		sa = safari.application;
		se = safari.extension;
		hc = safari.extension.globalPage.contentWindow;
		console = hc.console;
		snowLeopard = /10_6/.test(navigator.appVersion);
		win = /^Win/.test(navigator.platform);
		amBox = document.querySelector('#am_div');
		amTitleField = document.querySelector('input#title');
		amTitleField.onblur = trimField;
		amTitleField.onkeypress = handleAddMarkKeyPress;
		amUrlField = document.querySelector('input#url');
		amUrlField.onblur = trimField;
		amUrlField.onkeypress = handleAddMarkKeyPress;
		amBlurbField = document.querySelector('textarea#blurb');
		amBlurbField.onblur = trimField;
		amTagsField = document.querySelector('input#tags');
		amTagsField.onblur = function () {
			this.value = this.value.trim()
				.replace(/^[,\s]+/,'').replace(/[,\s]+$/,'')
				.replace(/\s+/g,' ').replace(/\s,/g,',').replace(/,\s/g,',').replace(/,+/g,',');
		};
		amTagsField.onkeypress = handleAddMarkKeyPress;
		amSubmitButton = document.querySelector('button#submit');
		amSubmitButton.onclick = submitNewItem;
		amCancelButton = document.querySelector('button#cancel');
		amCancelButton.onclick = goAway;
		amCancelButton.onkeydown = function (e) {
			e.preventDefault();
			amCancelButton.onkeyup = function (e) {
				amCancelButton.onkeyup = null;
				if (e.which == 9) amTitleField.focus();
			};
		};
		window.onfocus = function () {
			var optionalFields = document.querySelectorAll('.opt');
			for (var i = 0; i < optionalFields.length; i++)
				optionalFields[i].style.display = (localStorage.defaultService === 'pocket') ? 'none' : '';
			populateAddItemForm();
		};
	}
}
function getMyButton() {
	return se.toolbarItems.filter(function (ti) {
		return (
			ti.browserWindow === sa.activeBrowserWindow && 
			ti.popover && ti.popover.identifier === safari.self.identifier
		);
	})[0];
}
function goAway() {
	if (snowLeopard)
		setTimeout('safari.self.hide()', 100);
	else
		safari.self.hide();
	var thisButton = getMyButton();
	if (thisButton.identifier === 'mainbutton')
		thisButton.popover = null;
}
function handleAddMarkKeyPress(e) {
	if (e.which == 13) {
		e.target.blur();
		submitNewItem();
	}
}
function populateAddItemForm(blurb) {
	amTitleField.value = sa.activeBrowserWindow.activeTab.title;
	amUrlField.value = sa.activeBrowserWindow.activeTab.url;
	amBlurbField.value = blurb || '';
	amTitleField.select();
}
function submitNewItem() {
	var data = {
		url   : amUrlField.value.trim(),
		title : amTitleField.value.trim(),
		blurb : (localStorage.defaultService === 'pocket') ? '' : amBlurbField.value.trim(),
		tags  : amTagsField.value.trim()
	};
	hc.submitItem(data, function onSuccess() {
		goAway();
		setTimeout(function () {
			hc.updateItems(JSON.parse(localStorage.cacheTime) || null);
		}, 1000);
	}, function onError(xhr) {
		goAway();
		setTimeout(function () {
			reportXhrError(xhr);
		}, 100);
	});
}
function trimField() {
	this.value = this.value.trim();
}
