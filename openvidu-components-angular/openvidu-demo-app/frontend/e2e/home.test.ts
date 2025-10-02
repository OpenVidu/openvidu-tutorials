import { expect } from 'chai';
import { Builder, WebDriver } from 'selenium-webdriver';
import { OpenViduDemoAppConfig } from './selenium.conf';
import { OpenViduDemoAppPO } from './utils.po.test';

const url = OpenViduDemoAppConfig.appUrl;

describe('Testing Home page', () => {
	let browser: WebDriver;
	let utils: OpenViduDemoAppPO;
	let randomRoomName = '';

	async function createChromeBrowser(): Promise<WebDriver> {
		return await new Builder()
			.forBrowser(OpenViduDemoAppConfig.browserName)
			.withCapabilities(OpenViduDemoAppConfig.browserCapabilities)
			.setChromeOptions(OpenViduDemoAppConfig.browserOptions)
			.usingServer(OpenViduDemoAppConfig.seleniumAddress)
			.build();
	}

	beforeEach(async () => {
		browser = await createChromeBrowser();
		utils = new OpenViduDemoAppPO(browser);
		randomRoomName = `Room-${Math.floor(Math.random() * 1000)}-${Math.floor(Math.random() * 1000)}`;
	});

	afterEach(async () => {
		await browser.quit();
	});

	it('should show ONLY the ROOM NAME input', async () => {
		await browser.get(url);

		expect(await utils.isPresent('#login-username')).to.be.false;

		expect(await utils.isPresent('#login-password')).to.be.false;

		await utils.waitForElement('#room-name-input');
		expect(await utils.isPresent('#room-name-input')).to.be.true;

		const button = await utils.waitForElement('#join-btn');
		expect(await utils.isPresent('#join-btn')).to.be.true;
		expect(await button.isEnabled()).to.be.true;
	});

	it('should generate a random room name', async () => {
		await browser.get(`${url}`);

		const element = await utils.waitForElement('#room-name-input');
		expect(await utils.isPresent('#room-name-input')).to.be.true;

		const roomName = await element.getAttribute('value');

		await utils.clickOn('#room-name-generator-btn');

		expect(await element.getAttribute('value')).to.not.equal(roomName);
	});

	it('should show the prejoin page after inserting a room name', async () => {
		await browser.get(`${url}${randomRoomName}`);

		await utils.checkPrejoinIsPresent();
	});
});
