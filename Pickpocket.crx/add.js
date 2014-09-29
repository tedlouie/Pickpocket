document.addEventListener('DOMContentLoaded', initialize, false);

function initialize() {
	iframed = (/pickpocket-add-frame/.test(window.name));
	(mac = /^Mac/.test(navigator.platform));
	(win = /^Win/.test(navigator.platform)) && (document.body.className += ' win');
	(xp = /^Windows NT 5/.test(navigator.userAgent)) && (document.body.className += ' xp');;
	
	if (iframed) {
		cr = chrome.runtime;
		cr.sendMessage({name:'passTagCollection'}, function (response) {
			tagCollection = response;
		});
		window.focus();
	} else {
		hc = chrome.extension.getBackgroundPage();
		console = hc.console;
		tagCollection = hc.getAllTags();
		hc._gaq.push(['_trackPageview', '/add.html']);
	}
	
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
		this.value = this.value.trim().replace(/^[,\s]+/,'').replace(/[,\s]+$/,'')
			.replace(/\s+/g,' ').replace(/\s,/g,',').replace(/,\s/g,',').replace(/,+/g,',');
	};
	amTagsField.onkeypress = handleAddMarkKeyPress;
	amSubmitButton = document.querySelector('button#submit');
	amSubmitButton.onclick = submitItem;
	amCancelButton = document.querySelector('button#cancel');
	amCancelButton.onclick = goAway;
	amCancelButton.onkeydown = function (e) {
		e.preventDefault();
		amCancelButton.onkeyup = function (e) {
			amCancelButton.onkeyup = null;
			if (e.which == 9) amTitleField.focus();
		};
	};
	
	document.addEventListener('keydown', function (e) {
		if (e.which === 27) {
			e.stopPropagation();
			goAway();
		}
	}, true);
	
	var optionalFields = document.querySelectorAll('.opt');
	for (var i = 0; i < optionalFields.length; i++) {
		optionalFields[i].style.display = (localStorage.defaultService === 'pocket') ? 'none' : '';
	}
	if (iframed) {
		console.log(window.name);
		var data = {};
		data.title = decodeURIComponent(window.name.split(':|:')[1]);
		data.url   = decodeURIComponent(window.name.split(':|:')[2]);
		var part3 = window.name.split(':|:')[3];
		if (part3)
			data.tags = JSON.parse(decodeURIComponent(part3));
		populateAddItemForm(data);
		// cr.sendMessage({name:'passTabInfo'}, populateAddItemForm);
	} else {
		chrome.tabs.getSelected(function (tab) {
			var item = hc.getItemByUrl(tab.url);
			populateAddItemForm({
				title : tab.title,
				url   : tab.url,
				tags  : item ? item.tags : null
			});
		});
	}
}
function goAway() {
	if (iframed) {
		cr.sendMessage({name:'closeAddDialog'});
	} else {
		self.close();
	}
}
function handleAddMarkKeyPress(e) {
	if (e.which == 13) {
		e.target.blur();
		submitItem();
	}
}
function populateAddItemForm(data) {
	console.log(data);
	amTitleField.value = data.title;
	amUrlField.value = data.url;
	if (data.tags) {
		amTagsField.value = data.tags.join(', ');
	}
	amTitleField.select();
}
function submitItem() {
	var data = {
		url   : amUrlField.value.trim(),
		title : amTitleField.value.trim(),
		tags  : amTagsField.value
	};
	if (iframed) {
		cr.sendMessage({ name:'addTabToService', data: data });
		cr.sendMessage({ name:'closeAddDialog' });
	} else {
		hc.submitItem(data, function onSuccess() {
			location.href = 'list.html';
		}, function onError(xhr) {
			hc.setReportForXhrError(xhr);
			location.href = 'error.html';
		});
	}
}
function trimField() {
	this.value = this.value.trim();
}
