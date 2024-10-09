import { expect } from 'chai';
import { Builder, WebDriver, WebElement } from 'selenium-webdriver';
import { OpenViduCompleteAppConfig } from './selenium.conf';
import { OpenViduCompleteAppPO } from './utils.po.test';

const url = OpenViduCompleteAppConfig.appUrl;

describe('Testing AUTHENTICATION', () => {
	let browser: WebDriver;
	let utils: OpenViduCompleteAppPO;

	async function createChromeBrowser(): Promise<WebDriver> {
		return await new Builder()
			.forBrowser(OpenViduCompleteAppConfig.browserName)
			.withCapabilities(OpenViduCompleteAppConfig.browserCapabilities)
			.setChromeOptions(OpenViduCompleteAppConfig.browserOptions)
			.usingServer(OpenViduCompleteAppConfig.seleniumAddress)
			.build();
	}

	beforeEach(async () => {
		browser = await createChromeBrowser();
		utils = new OpenViduCompleteAppPO(browser);
	});

	afterEach(async () => {
		// console.log(`data:image/png;base64,${await browser.takeScreenshot()}`);
		await browser.quit();
	});

	it('should show the login form with join button disabled', async () => {
		await browser.get(url);

		let element: WebElement = await utils.waitForElement('#slogan-text');
		expect(await element.getText()).to.be.equal('Videoconference rooms in one click');

		await utils.checkLoginFormIsPresent();

		element = await utils.waitForElement('#join-btn');
		expect(await element.isEnabled()).to.be.false;
	});

	it('should show an error when login with WRONG CREDENTIALS', async () => {
		await browser.get(url);

		let element: WebElement = await utils.waitForElement('#slogan-text');
		expect(await element.getText()).to.be.equal('Videoconference rooms in one click');

		await utils.login('user-fail', 'user-fail');

		element = await utils.waitForElement('#login-error');
		expect(await element.getText()).to.be.equal('Authentication failed. Try again.');
	});

	it('should show be able to login', async () => {
		await browser.get(url);

		const element: WebElement = await utils.waitForElement('#slogan-text');
		expect(await element.getText()).to.be.equal('Videoconference rooms in one click');

		await utils.login('user', 'user');

		await utils.waitForElement('#form-room');

		expect(await utils.isPresent('prejoin-container')).to.be.false;

		await utils.waitForElement('#join-btn');
		expect(await utils.isPresent('#join-btn')).to.be.true;
	});

	it('should do LOGOUT and show the LOGIN FORM when logout button is clicked', async () => {
		await browser.get(url);

		await utils.waitForElement('#slogan-text');

		await utils.login('user', 'user');

		await utils.waitForElement('#form-room');

		const element = await utils.waitForElement('#logout-content span');
		expect(await element.getText()).equal('Hi user, do you want to logout?');

		await utils.clickOn('#logout-btn');

		await utils.checkLoginFormIsPresent();

		expect(await utils.isPresent('#logout-btn')).to.be.false;

		await browser.navigate().refresh();

		await utils.waitForElement('#slogan-text');

		expect(await utils.isPresent('#logout-btn')).to.be.false;
	});

	it('should be able to do login and join room', async () => {
		await browser.get(url);

		await utils.waitForElement('#slogan-text');
		await utils.waitForElement('#form-login');

		await utils.login('user', 'user');

		await utils.waitForElement('#form-room');

		expect(await utils.isPresent('#prejoin-container')).to.be.false;

		await utils.clickOn('#join-btn');

		await utils.checkPrejoinIsPresent();
	});

	it('should redirect to login page if try to force the url without be logged', async () => {
		await browser.get(`${url}testSession`);

		await utils.waitForElement('#slogan-text');

		await utils.waitForElement('#form-login');

		expect(await utils.isPresent('#form-room')).to.be.false;

		await utils.waitForElement('#login-username');

		await utils.waitForElement('#login-password');

		const element = await utils.waitForElement('#join-btn');
		expect(await element.isEnabled()).to.be.false;
	});

	it('should show the prejoin page when reloading the page', async () => {
		await browser.get(`${url}`);

		await utils.waitForElement('#slogan-text');
		await utils.waitForElement('#form-login');

		await utils.login('user', 'user');
		await utils.waitForElement('#form-room');

		expect(await utils.isPresent('#prejoin-container')).to.be.false;

		await utils.clickOn('#join-btn');

		await utils.checkPrejoinIsPresent();

		await browser.navigate().refresh();
		await utils.checkPrejoinIsPresent();
	});
});
