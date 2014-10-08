var itemList = {
	selectedLi: null,
	itemHeight: 0,
	lastScrollTop: 0,
	clear: function () {
		this.el.innerHTML = '';
		this.el.style.height = 'auto';
		messageSpan.innerHTML = '';
	},
	createListItem: function (item) {
		var itemHtml = itemTemplate.replace(/^\w+/, '')
			.replace('{{age}}'    , getAge(item.time))
			.replace('{{name}}'   , item.title)
			.replace('{{blurb}}'  , item.blurb || item.url)
			.replace('{{tags}}'   , item.tags.join(', '))
			.replace('{{pin}}'    , isPinned(item) ? 'Unpin' : 'Pin')
			.replace('{{arc}}'    , isArchived(item) ? "Unarchive" : "Archive")
			.replace('{{url}}'    , item.url);
		var itemLI = document.createElement('li');
		itemLI.id = item.id;
		itemLI.className = 'item' + (isPinned(item) ? ' pinned' : '') + (isArchived(item) ? ' archived' : ' queued');
		itemLI.innerHTML = itemHtml;
		itemLI.onclick = handleItemClick;
		itemLI.onmouseenter = handleItemMouseEnter;
		return itemLI; // itemHtml;
	},
	getSelectedIndex: function () {
		return [].slice.call(this.el.children).indexOf(this.selectedLi);
	},
	select: function (li, index) {
		if (this.urlRevealTimer) {
			clearTimeout(this.urlRevealTimer);
			delete this.urlRevealTimer;
		}
		if (this.selectedLi) {
			this.selectedLi.className = this.selectedLi.className.replace(' selected', '');
			this.selectedLi.className = this.selectedLi.className.replace(' showurl', '');
		}
		this.selectedLi = li || this.el.children[index];
		if (this.selectedLi) {
			this.selectedLi.className += ' selected';
			this.selectedLi.scrollIntoViewIfNeeded(false);
			this.urlRevealTimer = setTimeout(function () {
				itemList.selectedLi.className += ' showurl';
				// itemList.selectedLi.querySelector('.blurb').innerHTML = getItemFromId(itemList.selectedLi.id).url;
				delete itemList.urlRevealTimer;
			}, 1000);
		}
	},
	showFavicon: function (li) {
		if (li.iconFetched) return;
		var scrollTop = this.el.scrollTop;
		var scrollBottom = scrollTop + this.el.offsetHeight;
		if (li.offsetTop >= scrollTop && li.offsetTop <= scrollBottom) {
			var item = getItemFromId(li.id);
			item && hc.getFavicon(item.url, function (iconUrl) {
				li.querySelector('.favicon').src = iconUrl || getDefaultIconUrl();
				li.iconFetched = true;
			});
		}
	},
	showFavicons: function () {
		[].slice.call(this.el.children).forEach(this.showFavicon, this);
	},
	toggleArchivedUI: function (li) {
		if (/ archived/.test(this.selectedLi.className)) {
			li.className = li.className.replace(' archived', ' queued');
		} else {
			li.className = li.className.replace(' queued', ' archived');
		}
	},
	togglePinnedUI: function (li) {
		if (/ pinned/.test(li.className)) {
			li.className = li.className.replace(' pinned', '');
		} else {
			li.className += ' pinned';
		}
	},
	updateHeight: function (itemCount) {
		var listHeight;
		if (itemCount == 0) {
			listHeight = 24;
		} else {
			this.itemHeight = this.el.firstElementChild.offsetHeight;
			listHeight = this.itemHeight * itemCount;
			if (listHeight + upperdivHeight + 16 > maxWinHeight)
				listHeight = this.itemHeight * Math.floor((maxWinHeight - upperdivHeight - 16) / this.itemHeight);
		}
		this.el.style.height = listHeight + 'px';
		if (safari) {
			safari.self.height = listHeight + (itemCount == 0 ? 72 : 56);
		}
		// if (this.scrollTop) this.el.scrollTop = this.scrollTop;
	},
	updateList: function (items, listType, isInitial, selectedIndex) {
		this.listType = listType = (listType || this.listType);
		this.clear();
		openAllButton.style.display = 'none';
		archiveAllButton.style.display = 'none';
		if (items.length == 0) {
			this.selectedLi = null;
			messageSpan.innerHTML = 'No ' + listType + ' links.';
			if (inputField.value) {
				this.el.innerHTML = '<li id="searchprompt">No matches.' 
					+ ' Press Enter to google it or ' + (mac ? 'Option' : 'Alt') + '-Enter to add a new link.</li>';
			} else {
				this.el.innerHTML = '<li id="searchprompt">No unread links.' 
					+ ' Press Backspace to view your archive or ' + (mac ? 'Option' : 'Alt') 
					+ '-Enter to add a new link.</li>';
			}
			this.updateHeight(0);
			if (listType == 'matching')
				snoLabel.style.display = 'inline';
			return;
		}
		console.time('updateList');
		var newListEl = this.el.cloneNode(false);
		items.forEach(function (item) {
			newListEl.appendChild(this.createListItem(item));
		}, this);
		document.querySelector('#lowerdiv').replaceChild(newListEl, this.el);
		this.el = newListEl;
		this.el.offsetHeight; // this is to flush the render queue
		console.timeEnd('updateList');
		if (typeof selectedIndex != 'number' || selectedIndex < 0)
			selectedIndex = 0;
		if (selectedIndex >= this.el.children.length)
			selectedIndex = this.el.children.length - 1;
		this.select(null, selectedIndex);
		if (listType == 'new or pinned') {
			var unreadLength = items.filter(isUnread).length;
			if (items.length > 0) {
				if (unreadLength > 0) {
					messageSpan.innerHTML = '<b>' + unreadLength + ' new link' 
						+ (unreadLength > 1 ? 's' : '') + '</b>';
				} else {
					messageSpan.innerHTML = 'No new links';
				}
				if (unreadLength) {
					archiveAllButton.style.display = 'inline-block';
					openAllButton.style.display = 'inline-block';
					if (openLimit && openLimit < unreadLength) {
						openAllButton.title = 'Open first ' + openLimit + ' unread links';
					} else {
						openAllButton.title = 'Open all unread links';
					}
				}
			}
		} else 
		if (listType == 'matching') {
			messageSpan.innerHTML = items.length + ' ' + listType + ' link' + (items.length > 1 ? 's' : '');
			snoLabel.style.display = 'inline';
		} else {
			messageSpan.innerHTML = items.length + ' link' + (items.length > 1 ? 's' : '');
			snoLabel.style.display = 'none';
		}
		if (isInitial) {
			setTimeout(function () {
				itemList.itemHeight = itemList.el.firstElementChild.offsetHeight;
				itemList.updateHeight(items.length);
				itemList.showFavicons();
			}, 1);
		} else {
			this.updateHeight(items.length);
			this.showFavicons();
		}
	},
};

function initialize() {
	itemList.el = document.querySelector('#itemlist');
	
	itemTemplate    = document.getElementById('li_tmpl').innerHTML;
	allItems        = hc.itemCache;
	processing      = false;
	searchWaiter    = null;
	maxWinHeight    = 600;
	sortOldestFirst = (localStorage.sortOldestFirst == 'yes');
	usingFave       = localStorage.pinMethod == 'fave';
	openLimit       = parseInt(localStorage.openLimit);
	defaultListType = 'new or pinned';
	defaultFilter   = getDefaultFilter();
	
	lin = /^Linux/.test(navigator.platform);
	mac = /^Mac/.test(navigator.platform);
	win = /^Win/.test(navigator.platform);
	xp  = /^Windows NT 5/.test(navigator.userAgent);
	
	if (lin) document.body.className += ' lin';
	if (mac) document.body.className += ' mac';
	if (win) document.body.className += ' win';
	if (xp)  document.body.className += ' xp';
	
	inputField       = document.querySelector('#inputfield');
	messageSpan      = document.querySelector('#messagespan');
	snoLabel         = document.querySelector('#snolabel');
	snoCheckbox      = document.querySelector('#snocheck');
	openAllButton    = document.querySelector('#openallbutton');
	archiveAllButton = document.querySelector('#archiveallbutton');
	addButton        = document.querySelector('#addbutton');
	menuButton       = document.querySelector('#menubutton');
	menu             = document.querySelector('#menu');
	
	menu.show = function () {
		menuButton.className += ' active';
		menu.style.display = 'block';
	};
	menu.hide = function () {
		menu.style.display = '';
		menuButton.className = menuButton.className.replace(' active', '');
	};
	
	inputField.onkeydown     = handleInputKeyDown;
	inputField.onkeyup       = handleInputKeyUp;
	openAllButton.onclick    = openAllUnread;
	archiveAllButton.onclick = archiveAllUnread;
	addButton.onclick        = showAddForm;
	menu.onclick             = menu.hide;
	
	document.querySelector('#settingsbutton').onclick = showOptionsForm;
	
	snoCheckbox.onchange = function (e) {
		localStorage.searchNewOnly = e.currentTarget.checked;
		showMatchingItems();
	};
	menuButton.onclick = function (e) {
		if (menu.style.display == 'block') {
			menu.hide();
		} else {
			menu.show();
		}
	};
	menuButton.onfocus = menuButton.blur;
	document.querySelector('#reloadbutton').onclick = function (e) {
		allItems = null;
		updateItems(null);
	};
	document.onclick = function (e) {
		inputField.focus();
		if (e.target == menuButton) return;
		if ([e.target, e.target.parentElement].indexOf(menu) == -1) {
			menu.hide();
		}
	};
	document.onkeydown = function (e) {
		if (e.which == 27) {
			e.stopPropagation();
			goAway();
		}
	};
	
	window.setInterval(function () {
		if (itemList.el.scrollTop != itemList.lastScrollTop)
			itemList.showFavicons();
		itemList.lastScrollTop = itemList.el.scrollTop;
	}, 250);
	
	initMainBox();
	updateItems(JSON.parse(localStorage.cacheTime));
	_gaq = hc._gaq; _gaq.push(['_trackPageview', '/list.html']);
}
function archiveAllUnread(arg) {
	var filterFunc = (localStorage.newExcludesTagged == 'yes') ? isUnreadAndUntagged : isUnread;
	var unreadItems = allItems.filter(filterFunc);
	if (arg == 'confirmed' || unreadItems.length < 10) {
		messageSpan.innerHTML = ''; // '<i class="waiting"></i>';
		hc.archiveItems(unreadItems, showMatchingItems);
		_gaq.push(['_trackEvent', 'User Actions', 'Archive All New From Popup']);
	} else {
		confirmAction('Really archive ' + unreadItems.length + ' links?', archiveAllUnread);
	}
}
function confirmAction(prompt, callback) {
	var oldMessage = messageSpan.innerHTML;
	var buttonSpan = document.querySelector('#buttonspan');
	var confirmLink = document.createElement('a');
	var cancelLink = document.createElement('a');
	buttonSpan.style.display = 'none';
	messageSpan.innerHTML = prompt;
	confirmLink.href = '#';
	confirmLink.textContent = 'Yes';
	confirmLink.style.margin = '0 1em';
	confirmLink.onclick = function (e) {
		e.preventDefault();
		callback('confirmed');
	};
	cancelLink.href = '#';
	cancelLink.textContent = 'No';
	cancelLink.onclick = function (e) {
		e.preventDefault();
		messageSpan.innerHTML = oldMessage;
		buttonSpan.style.display = '';
	};
	messageSpan.appendChild(confirmLink);
	messageSpan.appendChild(cancelLink);
}
function deleteItem(item) {
	var delendumId = item.id;
	hc.deleteItem(item, function onSuccess() {
		allItems = hc.itemCache;
		var delendumLi = document.getElementById(delendumId);
		console.log('delendumLi:', delendumLi);
		itemList.select(delendumLi.nextElementSibling || itemList.el.firstElementChild);
		itemList.el.removeChild(delendumLi);
	}, stdErrorHandler);
}
function getAge(itemDate) {
	itemDate = new Date(itemDate);
	var diffSecs = ((new Date()) - itemDate) / 1000;
	var age = '';
	if (diffSecs < 120) age = Math.round(diffSecs) + ' seconds'; else
	if (diffSecs < 7200) age = Math.round(diffSecs/60) + ' minutes'; else
	if (diffSecs < 172800) age = Math.round(diffSecs/3600) + ' hours'; else
	if (diffSecs < 1209600) age = Math.round(diffSecs/86400) + ' days'; else
	if (diffSecs < 5184000) age = Math.round(diffSecs/604800) + ' weeks'; else
	if (diffSecs < 63072000) age = Math.round(diffSecs/2592000) + ' months'; else
	age = Math.round(diffSecs/31536000) + ' years';
	return age;
}
function getDefaultFilter() {
	if (localStorage.newExcludesTagged == 'yes')
		return isUnreadOrPinnedAndUntagged;
	else return isUnreadOrPinned;
}
function getItemFromId(id) {
	for (var item, i = 0; i < allItems.length; i++) {
		item = allItems[i];
		if (item.id == id) {
			return item;
		}
	} return null;
}
function handleInputKeyDown(e) {
	e.stopPropagation();
	var keycode = e.which;
	var modkeys = e.shiftKey * 1 + e.ctrlKey * 2 + e.altKey * 4 + e.metaKey * 8;
	switch (keycode) {
		case   8:    // delete
			if (modkeys == (mac ? 8 : 2)) {
				e.preventDefault();
				var item = getItemFromId(itemList.selectedLi.id);
				toggleArchived(item, function () {
					if (itemList.listType == 'new or pinned') {
						showMatchingItems(itemList.getSelectedIndex());
					} else {
						itemList.toggleArchivedUI(itemList.selectedLi);
					}
				});
			} else
			if (modkeys == (mac ? 9 : 3)) {
				e.preventDefault();
				deleteItem(getItemFromId(itemList.selectedLi.id));
			} break;
		case  13:    // return
			e.preventDefault();
			var regexResult = /^setPref\( *['"](\w+)['"] *, *['"]?(\w+)['"]? *\)/.exec(e.target.value);
			if (regexResult) {
				setPref(regexResult[1], regexResult[2]);
				e.target.value = '';
				break;
			}			
			if (modkeys == (mac ? 8 : 6)) {
				openAllUnread();
				break;
			}
			if (modkeys == 4) {
				showAddForm();
				break;
			}
			if (itemList.selectedLi) {
				var id = itemList.selectedLi.id;
				var item = getItemFromId(id);
				openItem(item, e.shiftKey || e.ctrlKey, e.altKey, isUnread(item));
			} else
			if (e.target.value) {
				google(e.target.value);
			} break;
		case  27:    // escape
			goAway();
			break;
		case  33:    // pageup
			e.preventDefault();
			if (itemList.selectedLi) {
				for (var i = 0; i < itemList.el.children.length; i++) {
					if (itemList.el.children[i] === itemList.selectedLi) {
						var sbIndex = i;
						break;
					}
				}
				var vil = itemList.el.offsetHeight / itemList.selectedLi.offsetHeight;
				var newIndex = sbIndex - vil + 1;
				if (newIndex < 0) newIndex = 0;
				itemList.select(null, newIndex);
				// itemList.showFavicons();
			} break;
		case  34:    // pagedown
			e.preventDefault();
			if (itemList.selectedLi) {
				for (var i = 0; i < itemList.el.children.length; i++) {
					if (itemList.el.children[i] === itemList.selectedLi) {
						var sbIndex = i;
						break;
					}
				}
				var vil = itemList.el.offsetHeight / itemList.selectedLi.offsetHeight;
				var newIndex = sbIndex + vil - 1;
				if (newIndex >= itemList.el.children.length)
					newIndex = itemList.el.children.length - 1;
				itemList.select(null, newIndex);
				// itemList.showFavicons();
			} break;
		case  38:    // up
			e.preventDefault();
			if (itemList.selectedLi) {
				itemList.select(itemList.selectedLi.previousSibling || itemList.el.lastChild);
				itemList.showFavicon(itemList.selectedLi);
			} break;
		case   9:    // tab
		case  40:    // down
			e.preventDefault();
			if (itemList.selectedLi) {
				itemList.select(itemList.selectedLi.nextSibling || itemList.el.firstChild);
				itemList.showFavicon(itemList.selectedLi);
			} break;
		case 187:    // =
			if (modkeys === (mac ? 8 : 2)) {
				e.preventDefault();
				showAddForm();
			} break;
		default: break;
	}
}
function handleInputKeyUp(e) {
	e.stopPropagation();
	var modkeys = e.shiftKey * 1 + e.ctrlKey * 2 + e.altKey * 4 + e.metaKey * 8;
	if (e.which == 8) {
		if (modkeys == 0) {
			if (e.target.value == '') {
				if (itemList.listType == 'all') {
					itemList.updateList(allItems.filter(defaultFilter), defaultListType);
				} else {
					itemList.updateList(allItems, 'all');
				}
			} else {
				showMatchingItems();
			}
		}
	} else
	if (e.which == 127 || e.which == 186 || e.which == 191) {
		if (modkeys == 0) {
			showMatchingItems();
		}
	} else {
		var c = String.fromCharCode(e.which);
		var re = /[0-9 A-Z\.]/;
		if (re.test(c)) {
			searchWaiter = searchWaiter || setTimeout(function () {
				clearTimeout(searchWaiter);
				searchWaiter = null;
				showMatchingItems();
			}, 250);
		}
	}
}
function handleItemClick(e) {
	e.stopPropagation();
	e.preventDefault();
	if (e.shiftKey) {
		window.getSelection().empty();
		inputField.focus();
	}
	var itemLI = e.currentTarget;
	var action = e.target.getAttribute('data-action');
	if (action) {
		performItemAction(action, itemLI);
	} else {
		var item = getItemFromId(itemLI.id);
		openItem(item, e.shiftKey || e.ctrlKey, e.altKey, isUnread(item));
	}
}
function handleItemMouseEnter(e) {
	itemList.select(e.currentTarget);
}
function initMainBox() {
	if (allItems == null) {
		inputField.blur();
		inputField.className = 'waiting';
		inputField.value = 'Retrieving links.';
		return;
	}
	inputField.value = '';
	inputField.className = '';
	inputField.focus();
	snoCheckbox.checked = (localStorage.searchNewOnly == 'yes');
	upperdivHeight = document.querySelector('#upperdiv').offsetHeight;
	if (allItems.length > 0) {
		var itemsToShow = allItems.filter(defaultFilter);
		var si = 0;
		itemList.updateList(itemsToShow, defaultListType, true, si);
	} else {
		itemList.clear();
		messageSpan.innerHTML = 'No links.';
	}
}
function isArchived(item) {
	return item.state == '1';
}
function isPinned(item) {
	if (usingFave) {
		return (item.faved == '1');
	} else return item.tags.indexOf('pinned') > -1;
}
function isTagged(item) {
	return item.tags && item.tags.length;
}
function isUnread(item) {
	return item.state == '0';
}
function isUnreadAndUnpinned(item) {
	return item.state == '0' && !isPinned(item);
}
function isUnreadAndUntagged(item) {
	return isUnread(item) && isUntagged(item);
}
function isUnreadOrPinned(item) {
	return isUnread(item) || isPinned(item);
}
function isUnreadOrPinnedAndUntagged(item) {
	return isUnreadOrPinned(item) && isUntagged(item);
}
function isUntagged(item) {
	return !item.tags || !item.tags.length;
}
function openAllUnread(arg) {
	var filterFunc = (localStorage.newExcludesTagged == 'yes') ? isUnreadAndUntagged : isUnread;
	var unreadItems = allItems.filter(filterFunc);
	if (openLimit) {
		unreadItems = unreadItems.slice(0, openLimit);
	}
	if (arg == 'confirmed' || openLimit || unreadItems.length < 10) {
		hc.openItems(unreadItems);
		_gaq.push(['_trackEvent', 'User Actions', 'Open All New From Popup']);
		goAway();
	} else {
		confirmAction('Really open ' + unreadItems.length + ' links?', openAllUnread);
	}
}
function openItem(item, background, altView, archiveOnTrigger) {
	hc.openItem(item, background, altView, archiveOnTrigger);
	_gaq.push(['_trackEvent', 'User Actions', 'Open Item From Popup']);
	background || goAway();
}
function performItemAction(action, itemLI) {
	var item = getItemFromId(itemLI.id);
	switch (action) {
		case 'pin':
			togglePinned(item, function () {
				if (itemList.listType == 'new or pinned') {
					showMatchingItems(itemList.getSelectedIndex());
				} else {
					itemList.togglePinnedUI(itemLI);
				}
			});
			_gaq.push(['_trackEvent', 'User Actions', 'Pin Item By Click']);
		break;
		case 'archive':
			toggleArchived(item, function () {
				if (itemList.listType == 'new or pinned') {
					showMatchingItems(itemList.getSelectedIndex());
				} else {
					itemList.toggleArchivedUI(itemLI);
				}
			});
			_gaq.push(['_trackEvent', 'User Actions', 'Archive Item By Click']);
		break;
		case 'delete':
			deleteItem(item);
			_gaq.push(['_trackEvent', 'User Actions', 'Delete Item By Click']);
		break;
	}
	inputField.focus();
}
function returnMatchingItems(keys, newOnly) {
	var matches = [];
	for (var item, i = allItems.length - 1; i >= 0; i--) {
		item = allItems[i];
		if (newOnly && item.state == 1)
			continue;
		var cItem = {
			title : item.title,
			url   : (item.url||'').replace(/https?:\/\/(www\.)?/g,'').split('?',1)[0].split('javascript:',1)[0],
			blurb : item.blurb,
			tags  : item.tags.join(',')
		};
		var allKeysMatch = true;
		item.rank = item.hits;
		for (var key, j = 0; j < keys.length; j++) {
			key = keys[j];
			if (key.charAt(1) === '/' || key.charAt(1) === ':') {
				if (key.length > 2) {
					switch (key.charAt(0)) {
						case 'd': var keyScope = 'blurb'; break;
						case 'n': var keyScope = 'title'; break;
						case 't': var keyScope = 'tags' ; break;
						case 'u': var keyScope = 'url'  ; break;
						default : var keyScope = null;
					}
					var keyRe = new RegExp(key.slice(2),'i');
				} else {
					var keyRe = '';
				}
			} else {
				var keyScope = null;
				var keyRe = new RegExp(key,'i');
			}
			if (keyScope) {
				var itemString = cItem[keyScope].toLowerCase();
			} else {
				var pad = '                                                                              ';
				var itemString = (cItem.title + pad + cItem.blurb + pad + cItem.url + pad + cItem.tags).toLowerCase();
			}
			var matchIndex = itemString.search(keyRe);
			if (matchIndex >= 0) {
				allKeysMatch = allKeysMatch && true;
				item.rank += 1/(matchIndex+1) + 1/(j+1);
				if (j === 0) {
					var queryIndex = itemString.indexOf(keys.join(' '));
					item.rank += (queryIndex === 0) ? 3 : (queryIndex > 0) ? 2 : 0;
				}
			} else {
				allKeysMatch = false;
			}
		}
		if (allKeysMatch) {
			matches.push(item);
		}
	}
	return matches;
}
function setPref(key, value) {
	console.log('Setting pref "' + key + '" to:', value);
	localStorage[key] = value;
}
function showMatchingItems(selectedIndex) {
	var input = inputField.value.replace(/\/\s+/,'/').replace(/\:\s+/,':');
	var t = []; t[0] = new Date();
	processing = true;
	setTimeout(function () {
		if (input == '') {
			var itemsToShow = (itemList.listType == 'all') ? allItems : allItems.filter(defaultFilter);
			itemList.updateList(itemsToShow, null, false, selectedIndex);
		} else {
			var keys = input.trim().split(' ');
			var matchingItems = returnMatchingItems(keys, snoCheckbox.checked);
			matchingItems.sort(function (a,b) { return b.rank - a.rank });
			itemList.updateList(matchingItems, 'matching', false, selectedIndex);
			processing = false;
		}
	}, 1);
}
function toggleArchived(item, callback) {
	var method = isUnread(item) ? 'markItemRead' : 'markItemUnread';
	hc[method](item, callback, stdErrorHandler);
}
function togglePinned(item, callback) {
	var action, data = null;
	if (usingFave) {
		action = (item.faved == '1') ? 'unfavorite' : 'favorite';
		item.faved = (item.faved == '1') ? '0' : '1';
	} else {
		if (isPinned(item)) {
			item.tags = item.tags.filter(function (tag) { return tag != 'pinned' });
			action = 'tags_remove';
		} else {
			item.tags.push('pinned');
			action = 'tags_add';
		}
		data = { tags: ['pinned'] };
	}
	hc.modifyItem(item, action, data, callback, stdErrorHandler);
}
function updateItems(since) {
	messageSpan.innerHTML = ''; // '<i class="waiting"></i>';
	hc.updateItems((since || null), function onSuccess() {
		allItems = hc.itemCache;
		itemList.updateList(allItems.filter(defaultFilter), defaultListType, false);
	}, stdErrorHandler);
}
