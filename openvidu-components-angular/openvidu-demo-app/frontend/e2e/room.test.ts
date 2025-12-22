import { expect } from 'chai';
import { Builder, WebDriver, WebElement } from 'selenium-webdriver';
import { OpenViduDemoAppConfig } from './selenium.conf';
import { OpenViduDemoAppPO } from './utils.po.test';
import * as fs from 'fs';
import { PNG } from 'pngjs';
import pixelmatch from 'pixelmatch';

const url = OpenViduDemoAppConfig.appUrl;

describe('Testing Room', () => {
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

	async function saveScreenshot(filename: string, element: WebElement) {
		const image = await element.takeScreenshot();
		fs.writeFileSync(filename, image, 'base64');
	}

	it('should show the toolbar and media buttons', async () => {
		await browser.get(`${url}${randomRoomName}`);

		await utils.checkPrejoinIsPresent();
		await utils.joinSession();

		await utils.checkToolbarIsPresent();
	});

	it('should show error trying to join a room with the same name', async () => {
		const fixedUrl = `${url}${randomRoomName}`;
		await browser.get(fixedUrl);

		await utils.checkPrejoinIsPresent();
		await utils.clearInput('#participant-name-input');
		await utils.sendKeys('#participant-name-input', 'user');

		await utils.joinSession();

		await utils.checkToolbarIsPresent();

		const tabs = await utils.openTab(fixedUrl);
		await browser.switchTo().window(tabs[1]);

		await utils.checkPrejoinIsPresent();
		await utils.clearInput('#participant-name-input');
		await utils.sendKeys('#participant-name-input', 'user');

		await utils.joinSession();

		await utils.waitForElement('.error');
		expect(await utils.isPresent('.error')).to.be.true;
	});

	it('should start a videoconference and display the video elements', async () => {
		const fixedUrl = `${url}${randomRoomName}`;
		await browser.get(fixedUrl);

		await utils.checkPrejoinIsPresent();

		await utils.joinSession();

		await utils.waitForElement('.local_participant');
		const localVideo = await utils.waitForElement('.OV_video-element');
		expect(await utils.isPresent('.local_participant')).to.be.true;
		expect(await localVideo.isDisplayed()).to.be.true;

		const tabs = await utils.openTab(fixedUrl);

		await browser.switchTo().window(tabs[1]);
		await utils.checkPrejoinIsPresent();
		await utils.sendKeys('#participant-name-input', 'participant2');
		await utils.joinSession();

		// check if second tab received the remote video
		await utils.waitForElement('.local_participant');
		await utils.waitForElement('.OV_video-element');
		await utils.waitForElement('.remote-participant');
		expect(await utils.isPresent('.remote-participant')).to.be.true;
		expect(await utils.isPresent('.local_participant')).to.be.true;
		// check if first tab received the remote vide
		await browser.switchTo().window(tabs[0]);
		await utils.waitForElement('.remote-participant');
		expect(await utils.isPresent('.remote-participant')).to.be.true;
	});

	it('should be able to share the screen', async () => {
		await browser.get(`${url}${randomRoomName}`);
		await utils.checkPrejoinIsPresent();

		await utils.joinSession();

		await utils.checkToolbarIsPresent();
		await utils.checkLayoutIsPresent();

		// Clicking to screensharing button
		await utils.enableScreenShare();

		await utils.waitForElement('.OV_big');
		expect(await utils.getNumberOfElements('video')).equals(2);

		await utils.disableScreenShare();

		expect(await utils.getNumberOfElements('video')).equals(1);

		await utils.enableScreenShare();

		await utils.waitForElement('.OV_big');
		expect(await utils.getNumberOfElements('video')).equals(2);

		await utils.disableScreenShare();

		expect(await utils.getNumberOfElements('video')).equals(1);
	});

	it('should be able to leave the session', async () => {
		await browser.get(`${url}${randomRoomName}`);

		await utils.checkPrejoinIsPresent();
		await utils.joinSession();

		await utils.checkToolbarIsPresent();
		await utils.checkLayoutIsPresent();

		await utils.leaveRoom();

		await utils.waitForElement('#room-name-input');
		expect(await utils.isPresent('#room-name-input')).to.be.true;
	});

	it('should show the participants panel', async () => {
		await browser.get(`${url}${randomRoomName}`);

		await utils.checkPrejoinIsPresent();
		await utils.joinSession();

		await utils.checkToolbarIsPresent();

		await utils.waitForElement('#participants-panel-btn');
		await utils.clickOn('#participants-panel-btn');

		await utils.waitForElement('ov-participants-panel');
		expect(await utils.isPresent('ov-participants-panel')).to.be.true;
	});

	it('should show the settings panel', async () => {
		await browser.get(`${url}${randomRoomName}`);
		await utils.checkPrejoinIsPresent();
		await utils.joinSession();
		await utils.checkToolbarIsPresent();

		await utils.clickOn('#more-options-btn');

		await browser.sleep(500); // Wait for the menu to open
		await utils.clickOn('#toolbar-settings-btn');
		expect(await utils.isPresent('ov-settings-panel')).to.be.true;
	});

	it('should show the chat and send a message', async () => {
		await browser.get(`${url}${randomRoomName}`);

		await utils.checkPrejoinIsPresent();
		await utils.joinSession();

		await utils.waitForElement('#chat-panel-btn');
		await utils.clickOn('#chat-panel-btn');

		await browser.sleep(1000);
		await utils.waitForElement('#chat-input');
		await utils.sendKeys('#chat-input', 'Hello world');
		await utils.clickOn('#send-btn');

		await utils.waitForElement('.chat-message');
		expect(await utils.isPresent('.chat-message')).to.be.true;
	});

	it('should show the activities panel', async () => {
		await browser.get(`${url}${randomRoomName}`);

		await utils.checkPrejoinIsPresent();
		await utils.joinSession();

		await utils.waitForElement('#activities-panel-btn');
		await utils.clickOn('#activities-panel-btn');

		await utils.waitForElement('ov-activities-panel');
		expect(await utils.isPresent('ov-activities-panel')).to.be.true;
	});

	it('should apply a virtual background', async () => {
		await browser.get(`${url}${randomRoomName}`);

		await utils.checkPrejoinIsPresent();
		await utils.joinSession();

		await utils.checkToolbarIsPresent();

		let localVideo = await utils.waitForElement('.local_participant');

		await saveScreenshot('before.png', localVideo);

		// check if the virtual background is applied

		await utils.applyVirtualBackground('2');

		localVideo = await utils.waitForElement('.local_participant');
		await saveScreenshot('after.png', localVideo);

		const img1 = PNG.sync.read(fs.readFileSync('before.png'));
		const img2 = PNG.sync.read(fs.readFileSync('after.png'));
		const { width, height } = img1;
		const diff = new PNG({ width, height });

		const numDiffPixels = pixelmatch(img1.data, img2.data, diff.data, width, height, {
			threshold: 0.4
			// alpha: 0.5,
			// includeAA: false,
			// diffColor: [255, 0, 0]
		});
		const diffBuffer = PNG.sync.write(diff);
		fs.writeFileSync('diff.png', new Uint8Array(diffBuffer));
		expect(numDiffPixels).to.be.greaterThan(500, 'The virtual background was not applied correctly');
	});
});
