import { expect } from 'chai';
import { Builder, WebDriver } from 'selenium-webdriver';
import { OpenViduCompleteAppConfig } from './selenium.conf';
import { OpenViduCompleteAppPO } from './utils.po.test';

const url = OpenViduCompleteAppConfig.appUrl;

describe('Testing recordings', () => {
	let browser: WebDriver;
	let utils: OpenViduCompleteAppPO;
	let randomRoomName = '';

	async function createChromeBrowser(): Promise<WebDriver> {
		return await new Builder()
			.forBrowser(OpenViduCompleteAppConfig.browserName)
			.withCapabilities(OpenViduCompleteAppConfig.browserCapabilities)
			.setChromeOptions(OpenViduCompleteAppConfig.browserOptions)
			.usingServer(OpenViduCompleteAppConfig.seleniumAddress)
			.build();
	}

	async function connectStartAndStopRecording() {
		await browser.get(`${url}${randomRoomName}`);

		await utils.checkPrejoinIsPresent();
		await utils.joinSession();

		await utils.checkToolbarIsPresent();

		await utils.startRecordingFromToolbar();
		await utils.checkRecordingIsStarting();
		await utils.checkRecordingIsStarted();

		await browser.sleep(2000);

		await utils.stopRecordingFromPanel();
		await utils.checkRecordingIsStopped();
	}

	beforeEach(async () => {
		browser = await createChromeBrowser();
		utils = new OpenViduCompleteAppPO(browser);
		randomRoomName = `Room-${Math.floor(Math.random() * 1000)}-${Math.floor(Math.random() * 1000)}`;
	});

	afterEach(async () => {
		await browser.quit();
	});

	it('should be able to record the session', async () => {
		await connectStartAndStopRecording();

		await utils.waitForElement('.recording-item');
		expect(await utils.getNumberOfElements('.recording-item')).equals(1);
	});

	// it('should be able to delete a recording', async () => {
	// 	await connectStartAndStopRecording();

	// 	await utils.waitForElement('.recording-item');
	// 	expect(await utils.getNumberOfElements('.recording-item')).equals(1);

	// 	await browser.sleep(2000);

	// 	await utils.deleteRecording();

	// 	await browser.sleep(500);
	// 	expect(await utils.getNumberOfElements('.recording-item')).equals(0);
	// });

	// it('should be able to play a recording', async () => {
	// 	await connectStartAndStopRecording();

	// 	await utils.waitForElement('.recording-item');
	// 	expect(await utils.getNumberOfElements('.recording-item')).equals(1);

	// 	await browser.sleep(2000);

	// 	await utils.playRecording();

	// 	await browser.sleep(1000);
	// 	await utils.waitForElement('app-recording-dialog');

	// 	await browser.sleep(1000);

	// 	expect(await utils.getNumberOfElements('video')).equals(2);
	// });

	// it('should be able to download a recording', async () => {});
});
