import { expect } from 'chai';
import { By, until, WebDriver, WebElement } from 'selenium-webdriver';

export class OpenViduCompleteAppPO {
	private TIMEOUT = 30 * 1000;
	private POLL_TIMEOUT = 1 * 1000;

	constructor(private browser: WebDriver) {}

	async waitForElement(selector: string): Promise<WebElement> {
		return await this.browser.wait(
			until.elementLocated(By.css(selector)),
			this.TIMEOUT,
			`Time out waiting for ${selector}`,
			this.POLL_TIMEOUT
		);
	}

	async isPresent(selector: string): Promise<boolean> {
		const elements = await this.browser.findElements(By.css(selector));
		return elements.length > 0;
	}

	async checkPrejoinIsPresent(): Promise<void> {
		await this.waitForElement('#prejoin-container');
		expect(await this.isPresent('#prejoin-container')).to.be.true;
	}

	async clickOn(selector: string): Promise<void> {
		const element = await this.waitForElement(selector);
		await element.click();
	}

	async checkToolbarIsPresent(): Promise<void> {
		await this.waitForElement('#toolbar');
		await this.waitForElement('#media-buttons-container');
		expect(await this.isPresent('#media-buttons-container')).to.be.true;
	}

	async checkLayoutIsPresent(): Promise<void> {
		await this.waitForElement('#layout-container');
		expect(await this.isPresent('#layout-container')).to.be.true;

		await this.waitForElement('#layout');
		expect(await this.isPresent('#layout')).to.be.true;
	}

	async enableScreenShare(): Promise<void> {
		await this.waitForElement('#screenshare-btn');
		await this.clickOn('#screenshare-btn');
		await this.browser.sleep(500);
	}

	async disableScreenShare(): Promise<void> {
		await this.waitForElement('#screenshare-btn');
		await this.clickOn('#screenshare-btn');
		await this.browser.sleep(500);
		await this.waitForElement('#screenshare-menu');
		await this.clickOn('#disable-screen-button');
		await this.browser.sleep(1000);
	}

	async checkLoginFormIsPresent(): Promise<void> {
		await this.waitForElement('#form-login');

		expect(await this.isPresent('#form-room')).to.be.false;

		await this.waitForElement('#login-username');

		await this.waitForElement('#login-password');
	}

	async login(username: string, password: string): Promise<void> {
		await this.waitForElement('#form-login');

		let element = await this.waitForElement('#login-username input');
		await element.sendKeys(username);

		element = await this.waitForElement('#login-password input');
		await element.sendKeys(password);

		await this.clickOn('#join-btn');
	}

	async joinSession(): Promise<void> {
		await this.waitForElement('#join-button');
		await this.clickOn('#join-button');
	}

	async leaveRoom(): Promise<void> {
		await this.waitForElement('#leave-btn');
		await this.clickOn('#leave-btn');
	}

	async openTab(url: string): Promise<string[]> {
		const newTabScript = `window.open("${url}")`;
		await this.browser.executeScript(newTabScript);
		return this.browser.getAllWindowHandles();
	}

	async sendKeys(selector: string, keys: string): Promise<void> {
		const element = await this.waitForElement(selector);
		await element.sendKeys(keys);
	}

	async applyVirtualBackground(bgId: string): Promise<void> {
		await this.waitForElement('#more-options-btn');
		await this.clickOn('#more-options-btn');

		await this.waitForElement('#virtual-bg-btn');
		await this.clickOn('#virtual-bg-btn');

		await this.waitForElement('ov-background-effects-panel');
		await this.browser.sleep(1000);
		await this.waitForElement(`#effect-${bgId}`);

		await this.clickOn(`#effect-${bgId}`);
		await this.clickOn('.panel-close-button');
		await this.browser.sleep(2000);
	}

	async getNumberOfElements(selector: string): Promise<number> {
		return (await this.browser.findElements(By.css(selector))).length;
	}

	async startRecordingFromToolbar(): Promise<void> {
		await this.waitForElement('#more-options-btn');
		await this.clickOn('#more-options-btn');

		await this.waitForElement('#recording-btn');
		await this.clickOn('#recording-btn');
	}

	async stopRecordingFromToolbar(): Promise<void> {
		await this.waitForElement('#more-options-btn');
		await this.clickOn('#more-options-btn');
		await this.waitForElement('#recording-btn');
		await this.clickOn('#recording-btn');
	}

	async stopRecordingFromPanel(): Promise<void> {
		await this.waitForElement('ov-activities-panel');
		await this.waitForElement('#stop-recording-btn');
		await this.clickOn('#stop-recording-btn');
	}

	async deleteRecording(): Promise<void> {
		await this.waitForElement('.recording-item');
		await this.waitForElement('#delete-recording-btn');
		await this.clickOn('#delete-recording-btn');

		await this.waitForElement('app-delete-dialog');
		await this.waitForElement('#delete-recording-confirm-btn');
		await this.clickOn('#delete-recording-confirm-btn');
	}

	async playRecording() {
		await this.waitForElement('.recording-item');
		await this.waitForElement('#play-recording-btn');
		await this.clickOn('#play-recording-btn');
	}

	async checkRecordingIsStopped(): Promise<void> {
		await this.waitForElement('#recording-status.stopped');
	}

	async checkRecordingIsStarting(): Promise<void> {
		await this.waitForElement('ov-activities-panel');
		await this.waitForElement('#recording-status.starting');
	}

	async checkRecordingIsStopping(): Promise<void> {
		await this.waitForElement('ov-activities-panel');
		await this.waitForElement('#recording-status.stopping');
	}

	async checkRecordingIsStarted(): Promise<void> {
		await this.waitForElement('#recording-status.started');
		await this.waitForElement('#recording-tag');
	}
}
