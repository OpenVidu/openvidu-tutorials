require('chromedriver');
const assert = require('assert');
const webdriver = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');
const firefox = require('selenium-webdriver/firefox');
const { Builder, By, Key, promise, until } = require('selenium-webdriver');


const url = 'http://127.0.0.1:8080/#/';
const timeout = 5000;
const sleepTimeout = 500;

describe('Checkout localhost app', function () {
	let browser;
	let browser2;

	var chromeOptions = new chrome.Options();
	var chromeCapabilities = webdriver.Capabilities.chrome();
	chromeOptions.addArguments(['--headless','--use-fake-ui-for-media-stream', '--use-fake-device-for-media-stream']);
	chromeCapabilities.setAcceptInsecureCerts(true);

	// var firefoxOptions = new firefox.Options();
	// var firefoxCapabilities = webdriver.Capabilities.firefox();
	// firefoxOptions.addArguments('--headless');
	// firefoxOptions.setPreference('media.navigator.permission.disabled', true);
	// firefoxOptions.setPreference('media.navigator.streams.fake', true);
	// firefoxCapabilities.setAcceptInsecureCerts(true);

	async function createChromeBrowser() {
		return await new webdriver.Builder()
				.forBrowser('chrome')
				.withCapabilities(chromeCapabilities)
				.setChromeOptions(chromeOptions)
				.build();
	}

	async function createFirefoxBrowser() {

		// return await new Builder()
		// 	.forBrowser('firefox')
		// 	.withCapabilities(firefoxCapabilities)
		// 	.setFirefoxOptions(firefoxOptions)
		// 	.build();

		return await new webdriver.Builder()
				.forBrowser('chrome2')
				.withCapabilities(chromeCapabilities)
				.setChromeOptions(chromeOptions)
				.build();

	}

    beforeEach(async function() {
		browser = await createChromeBrowser();
		await browser.get(url);

	});

	// PUBLISHER EVENTS

	it('should receive publisherCreated event', async function() {
		try {


			await browser.wait(until.elementLocated(By.id('publisherCreated'), timeout));

			await browser.wait(until.elementLocated(By.id('navLeaveButton'), timeout)).click();
		} catch (error) {
			console.log(error);
		}finally {
			await browser.quit();
		}
	});

	it('should receive Publisher streamCreated event', async function () {
		try {
			// await browser.get(url);
			await browser.wait(until.elementLocated(By.id('publisherCreated'), timeout));

			await browser.wait(until.elementLocated(By.id('publisher-streamCreated'), timeout))
			await browser.wait(until.elementLocated(By.id('navLeaveButton'), timeout)).click();
		} catch (error) {
			console.log(error);
		}finally {
			await browser.quit();
		}
	});

	it('should receive Publisher streamPlaying event', async function() {
		try {
			// await browser.get(url);
			await browser.wait(until.elementLocated(By.id('publisherCreated'), timeout));

			await browser.wait(until.elementLocated(By.id('publisher-streamPlaying'), timeout))
			await browser.wait(until.elementLocated(By.id('navLeaveButton'), timeout)).click();

		} catch (error) {
			console.log(error);
		}finally {
			await browser.quit();
		}
	});

	// SESSION EVENTS

	it('should receive REMOTE connectionCreated event', async() => {
		try {
			// await browser.get(url);
			await browser.wait(until.elementLocated(By.id('publisherCreated'), timeout));

			browser2 = await createFirefoxBrowser();
			await browser2.get(url);
			await browser2.wait(until.elementLocated(By.id('publisherCreated'), timeout));
			await browser2.sleep(sleepTimeout);
			var user2 = await (await browser2.wait(until.elementLocated(By.id('nickname'), timeout))).getText();
			await browser.wait(until.elementLocated(By.id(user2 + '-connectionCreated'), timeout));
			await browser.wait(until.elementLocated(By.id('navLeaveButton'), timeout)).click();
			await browser2.wait(until.elementLocated(By.id('navLeaveButton'), timeout)).click();
		} catch (error) {
			console.log(error);
		}finally {
			await browser.quit();
			await browser2.quit();
		}
	});


	it('should receive REMOTE streamDestroyed event', async function() {
		try {
			// await browser.get(url);
			await browser.wait(until.elementLocated(By.id('publisherCreated'), timeout));

			browser2 = await createFirefoxBrowser();
			await browser2.get(url);
			await browser2.wait(until.elementLocated(By.id('publisherCreated'), timeout));
			await browser2.wait(until.elementLocated(By.id('publisher-streamPlaying'), timeout));

			await browser2.sleep(sleepTimeout);
			var user2 = await (await browser2.wait(until.elementLocated(By.id('nickname'), timeout))).getText();

			await browser2.wait(until.elementLocated(By.id('navLeaveButton'), timeout)).click();

			await browser.wait(until.elementLocated(By.id(user2 + '-streamDestroyed'), timeout));
			await browser.wait(until.elementLocated(By.id('navLeaveButton'), timeout)).click();
		} catch (error) {
			console.log(error);
		} finally {
			await browser.quit();
			await browser2.quit();
		}
	});

	it('should receive Session sessionDisconnected event', async function() {
		try {
			// await browser.get(url);
			await browser.wait(until.elementLocated(By.id('publisherCreated'), timeout));
			await browser.wait(until.elementLocated(By.id('publisher-streamPlaying'), timeout));

			await browser.sleep(sleepTimeout);
			var user = await (await browser.wait(until.elementLocated(By.id('nickname'), timeout))).getText();

			await browser.wait(until.elementLocated(By.id('navLeaveButton'), timeout)).click();

			await browser.wait(until.elementLocated(By.id(user + '-sessionDisconnected'), timeout));
		} catch (error) {
			console.log(error);
		}finally {
			await browser.quit();
		}
	});

	it('should receive REMOTE streamCreated event', async function() {
		try {
			// await browser.get(url);
			await browser.wait(until.elementLocated(By.id('publisherCreated'), timeout));

			browser2 = await createFirefoxBrowser();
			await browser2.get(url);
			await browser2.wait(until.elementLocated(By.id('publisherCreated'), timeout));
			await browser2.wait(until.elementLocated(By.id('publisher-streamPlaying'), timeout));

			await browser2.sleep(sleepTimeout);
			var user2 = await (await browser2.wait(until.elementLocated(By.id('nickname'), timeout))).getText();

			await browser.wait(until.elementLocated(By.id(user2 + '-streamCreated'), timeout));

			await browser2.wait(until.elementLocated(By.id('navLeaveButton'), timeout)).click();

			await browser.wait(until.elementLocated(By.id('navLeaveButton'), timeout)).click();
		} catch (error) {
			console.log(error);
		}finally {
			await browser.quit();
			await browser2.quit();
		}
	});

	// afterEach(async () => {
	// 	if(browser){
	// 		await browser.quit().catch(() => {});
	// 		browser = null;
	// 	}

	// 	if(browser2){
	// 		await browser2.quit().catch(() => {});
	// 		browser2 = null;
	// 	}

	// });
});

