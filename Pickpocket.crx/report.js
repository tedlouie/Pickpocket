document.addEventListener('DOMContentLoaded', initialize, false);

function initialize() {
	console.log(window.name);
	var action  = window.name.split('::')[1];
	var result  = window.name.split('::')[2];
	var message = window.name.split('::')[3];
	document.body.className = result;
	document.querySelector('#report').innerHTML = message;
	if (action == 'add' && result == 'success') {
		document.querySelector('#click-prompt').style.display = 'block';
		timespan = document.querySelector('#timeout');
		timespan.textContent = '5';
		document.addEventListener('click', requestAddDialog, false);
		setTimeout(requestSelfClose, 5000);
		window.timer = setInterval(decrementTimer, 1000);
	} else {
		setTimeout(requestSelfClose, 3000);
	}
}
function decrementTimer() {
	timespan.textContent = (timespan.textContent * 1) - 1;
}
function requestAddDialog() {
	requestSelfClose();
	chrome.runtime.sendMessage({ name: 'openEditDialog' });
}
function requestSelfClose() {
	clearInterval(window.timer);
	chrome.runtime.sendMessage({ name: 'closeMessageBox' });
}
