function AddDialog() {
	var add = document.createElement('iframe');
	var closeOnEvent = function (e) {
		(e.target != add) && add.remove();
	};
	add.id = 'pickpocket-add-frame';
	add.src = chrome.extension.getURL('add.html');
	add.setAttribute('style', '\
		position: fixed !important;\
		right: 20px !important;\
		top: 20px !important;\
		z-index: 2147483647 !important;\
		width: 600px !important;\
		height: 320px !important;\
		margin: 0 !important;\
		border: 1px solid #aaa !important;\
		padding: 0 !important;\
		box-shadow: 0 5px 30px rgba(0,0,0,0.5) !important;\
		opacity: 0;\
		-webkit-transition: opacity 0.5s;\
	');
	add.show = function (data) {
		add.name = add.id + ':|:' 
			+ encodeURIComponent(data.title) + ':|:' 
			+ encodeURIComponent(data.url) + ':|:' 
			+ (data.tags ? encodeURIComponent(JSON.stringify(data.tags)) : '');
		document.documentElement.appendChild(this);
		this.style.opacity = '1';
		document.addEventListener('click', closeOnEvent, false);
	};
	add.remove = function () {
		document.removeEventListener('click', closeOnEvent, false);
		this.style.opacity = '0';
		this.addEventListener('webkitTransitionEnd', function () {
			document.documentElement.removeChild(document.getElementById('pickpocket-add-frame'));
		}, false);
	};
	return add;
}
function MessageBox() {
	var mb = document.createElement('iframe');
	var closeOnEvent = function (e) {
		if (e.type == 'click') {
			(e.target != mb) && mb.remove();
		} else 
		if (e.type == 'keyup') {
			(e.which == 27) && mb.remove();
		}
	};
	mb.id = 'pickpocket-msgbox';
	mb.src = chrome.extension.getURL('report.html');
	mb.setAttribute('style', '\
		position: fixed !important;\
		right: 20px !important;\
		top: 20px !important;\
		z-index: 2147483647 !important;\
		width: 400px !important;\
		height: 120px !important;\
		margin: 0 !important;\
		border: 1px solid #aaa !important;\
		border-radius: 5px !important;\
		padding: 0 !important;\
		box-shadow: 0 5px 30px rgba(0,0,0,0.5) !important;\
		opacity: 0;\
		-webkit-transition: opacity 0.5s;\
	');
	mb.show = function (data) {
		this.name = this.id + '::' + data.action + '::' + (data.success ? 'success' : 'error') + '::' + data.text;
		document.documentElement.appendChild(this);
		this.style.opacity = '1';
		document.addEventListener('click', closeOnEvent, false);
		document.addEventListener('keyup', closeOnEvent, false);
	};
	mb.remove = function () {
		document.removeEventListener('click', closeOnEvent, false);
		document.removeEventListener('keyup', closeOnEvent, false);
		this.style.opacity = '0';
		this.addEventListener('webkitTransitionEnd', function () {
			document.documentElement.removeChild(document.getElementById('pickpocket-msgbox'));
		}, false);
	};
	return mb;
}
function eventMatchesHotkey(prop) {
	return this.hotkey[prop] == this.event[prop];
}
function handleKeyDown(e) {
	var props = ['keyCode','altKey','ctrlKey','metaKey','shiftKey'];
	if (props.every(eventMatchesHotkey, { event: e, hotkey: my.hotkeyAdd })) {
		e.preventDefault();
		cr.sendMessage({ name: 'addOrArchivePage' });
	}
}
function handleMessage(message, sender, callback) {
	switch (message.name) {
		case 'addResult':
		case 'archiveResult':
			if (message.data.success != null) {
				my.messageBox = new MessageBox();
				my.messageBox.show(message.data);
			} break;
		case 'openAddDialog':
			my.addDialog = new AddDialog();
			my.addDialog.show(message.data);
			break;
		case 'closeAddDialog':
			my.addDialog.remove();
			break;
		case 'closeMessageBox':
			my.messageBox.remove();
			break;
		default: break;
	}
}

var my = {};
var cr = chrome.runtime;

/*cr.sendMessage({ name: 'passStoredValues', data: ['hotkeyAdd'] }, function (response) {
	for (var key in response)
		my[key] = response[key];
	document.addEventListener('keydown', handleKeyDown, false);
});*/
cr.onMessage.addListener(handleMessage);
