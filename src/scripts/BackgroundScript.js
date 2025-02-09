import * as browser from 'webextension-polyfill';

/**
 * ContentScript that can be called from anywhere within the extension
 */
const BackgroundScript = {
	dummy() {
		return Promise.resolve('dummy');
	},

	/**
	 * Returns the id of the tab that is visible to user
	 * @returns $.Deferred() integer
	 */
	getActiveTabId() {
		return new Promise((resolve, reject) => {
			browser.tabs
				.query({
					active: true,
					currentWindow: true,
				})
				.then(function (tabs) {
					if (tabs.length < 1) {
						// @TODO must be running within popup. maybe find another active window?
						reject("couldn't find the active tab");
					} else {
						const tabId = tabs[0].id;
						resolve(tabId);
					}
				});
		});
	},

	/**
	 * Execute a function within the active tab within content script
	 * @param request.fn	function to call
	 * @param request.request	request that will be passed to the function
	 */
	executeContentScript(request) {
		const reqToContentScript = {
			contentScriptCall: true,
			fn: request.fn,
			request: request.request,
		};
		return this.getActiveTabId().then(tabId =>
			browser.tabs.sendMessage(tabId, reqToContentScript)
		);
	},
};

/**
 * @param location	configure from where the content script is being accessed (ContentScript, BackgroundPage, DevTools)
 * @returns BackgroundScript
 */
export default function getBackgroundScript(location) {
	// Handle calls from different places
	if (location === 'BackgroundScript') {
		return BackgroundScript;
	}
	if (location === 'DevTools' || location === 'ContentScript') {
		// if called within background script proxy calls to content script
		const backgroundScript = {};

		Object.keys(BackgroundScript).forEach(attr => {
			if (typeof BackgroundScript[attr] === 'function') {
				backgroundScript[attr] = request => {
					const reqToBackgroundScript = {
						backgroundScriptCall: true,
						fn: attr,
						request,
					};
					return browser.runtime.sendMessage(reqToBackgroundScript);
				};
			} else {
				backgroundScript[attr] = BackgroundScript[attr];
			}
		});

		return backgroundScript;
	}
	throw `Invalid BackgroundScript initialization - ${location}`;
}
