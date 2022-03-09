import { OpenViduCall } from './call.po';
import { browser, by, ProtractorBrowser, Key, WebElement } from 'protractor';
import { protractor } from 'protractor/built/ptor';

describe('Connect to the room', () => {
	const OVC = new OpenViduCall();

	beforeEach(() => {
		browser.waitForAngularEnabled(false);
		browser.get('#/');
	});

	it('should navigate to OpenVidu room', () => {
		const input = OVC.getRoomInput(browser);
		input.clear();
		input.sendKeys('OpenVidu');
		OVC.getRoomJoinButton(browser).click();
		expect(browser.getCurrentUrl()).toMatch('#/OpenVidu');
	});

	it('should show a short room name error', () => {
		const input = OVC.getRoomInput(browser);
		input.clear();
		input.sendKeys('OV');
		const shortError = OVC.getShortRoomNameError(browser);
		expect(shortError.isDisplayed()).toBeTruthy();
		OVC.getRoomJoinButton(browser).click();
		expect(browser.getCurrentUrl()).toMatch('#/');
	});

	it('should show a required name room error', async () => {
		const input = OVC.getRoomInput(browser);
		await input.sendKeys(Key.CONTROL, 'a');
		await input.sendKeys(Key.DELETE);
		expect(OVC.getRequiredRoomNameError(browser).isDisplayed()).toBeTruthy();
		OVC.getRoomJoinButton(browser).click();
		expect(browser.getCurrentUrl()).toMatch('#/');
	});
});

describe('Testing config card', () => {
	const OVC = new OpenViduCall();
	const EC = protractor.ExpectedConditions;

	beforeEach(() => {
		browser.waitForAngularEnabled(false);
		browser.get('#/OpenVidu');
	});

	it('should show the config card', () => {
		const configCard = OVC.getConfigCard(browser);
		browser.wait(EC.visibilityOf(configCard), 3000);
		expect(configCard.isDisplayed()).toBeTruthy();
	});

	it('should close the config card and go to home', () => {
		browser.wait(EC.visibilityOf(OVC.getConfigCard(browser)), 3000);
		expect(OVC.getConfigCard(browser).isDisplayed()).toBeTruthy();

		browser.wait(EC.elementToBeClickable(OVC.getCloseButtonConfigCard(browser)), 5000);
		OVC.getCloseButtonConfigCard(browser).click();
		expect(browser.getCurrentUrl()).toMatch('#/');

		// browser.wait(EC.elementToBeClickable(OVC.getCamButton(browser)), 5000);
		// OVC.getCamButton(browser).click();
		// browser.wait(EC.visibilityOf(OVC.getCamIcon(browser)), 5000);
		// expect(OVC.getCamIcon(browser).isDisplayed()).toBeTruthy();
	});

	it('should be able to mute the camera', async () => {
		let isVideoEnabled: boolean;
		const videoEnableScript =
			'const videoTrack = document.getElementsByTagName("video")[0].srcObject.getVideoTracks()[0]; return videoTrack.enabled;';

		browser.wait(EC.elementToBeClickable(OVC.getConfigCardCameraButton(browser)), 5000);

		OVC.getAllVideos(browser).then((videos) => {
			expect(videos.length).toEqual(1);
		});

		isVideoEnabled = await browser.executeScript(videoEnableScript);
		expect(isVideoEnabled).toBe(true);

		OVC.getConfigCardCameraButton(browser).click();
		isVideoEnabled = await browser.executeScript(videoEnableScript);
		expect(isVideoEnabled).toBe(false);
	});

	it('should be able to mute the microphone', async () => {
		let isAudioEnabled: boolean;
		const audioEnableScript =
			'const audioTrack = document.getElementsByTagName("video")[0].srcObject.getAudioTracks()[0]; return audioTrack.enabled;';

		browser.wait(EC.elementToBeClickable(OVC.getConfigCardMicrophoneButton(browser)), 5000);

		OVC.getAllVideos(browser).then((videos) => {
			expect(videos.length).toEqual(1);
		});

		isAudioEnabled = await browser.executeScript(audioEnableScript);
		expect(isAudioEnabled).toBe(true);

		OVC.getConfigCardMicrophoneButton(browser).click();
		isAudioEnabled = await browser.executeScript(audioEnableScript);
		expect(isAudioEnabled).toBe(false);
	});

	it('should be able to share the screen', async () => {
		browser.wait(EC.elementToBeClickable(OVC.getConfigCardScreenShareButton(browser)), 5000);

		OVC.getAllVideos(browser).then((videos) => {
			expect(videos.length).toEqual(1);
		});

		OVC.getConfigCardScreenShareButton(browser).click();

		OVC.getAllVideos(browser).then((videos) => {
			expect(videos.length).toEqual(2);
		});
	});

	it('should be able to share the screen and remove the camera video if it is muted', () => {
		browser.wait(EC.elementToBeClickable(OVC.getConfigCardScreenShareButton(browser)), 5000);
		browser.wait(EC.elementToBeClickable(OVC.getConfigCardCameraButton(browser)), 5000);

		OVC.getAllVideos(browser).then((videos) => {
			expect(videos.length).toEqual(1);
		});

		OVC.getConfigCardCameraButton(browser).click();

		OVC.getAllVideos(browser).then((videos) => {
			expect(videos.length).toEqual(1);
		});

		OVC.getConfigCardScreenShareButton(browser).click();

		OVC.getAllVideos(browser).then((videos) => {
			expect(videos.length).toEqual(1);
		});
	});

	it('should be able to add the camera video when the screen is active clicking on camera button', () => {
		browser.wait(EC.elementToBeClickable(OVC.getConfigCardScreenShareButton(browser)), 5000);
		browser.wait(EC.elementToBeClickable(OVC.getConfigCardCameraButton(browser)), 5000);

		OVC.getAllVideos(browser).then((videos) => {
			expect(videos.length).toEqual(1);
		});

		OVC.getConfigCardCameraButton(browser).click();

		OVC.getAllVideos(browser).then((videos) => {
			expect(videos.length).toEqual(1);
		});

		OVC.getConfigCardScreenShareButton(browser).click();

		OVC.getAllVideos(browser).then((videos) => {
			expect(videos.length).toEqual(1);
		});

		OVC.getConfigCardCameraButton(browser).click();

		OVC.getAllVideos(browser).then((videos) => {
			expect(videos.length).toEqual(2);
		});
	});

	it('should be able to add the camera video disabling screen share', () => {
		browser.wait(EC.elementToBeClickable(OVC.getConfigCardScreenShareButton(browser)), 5000);
		browser.wait(EC.elementToBeClickable(OVC.getConfigCardCameraButton(browser)), 5000);

		OVC.getAllVideos(browser).then((videos) => {
			expect(videos.length).toEqual(1);
		});

		OVC.getConfigCardCameraButton(browser).click();

		OVC.getAllVideos(browser).then((videos) => {
			expect(videos.length).toEqual(1);
		});
		OVC.getConfigCardScreenShareButton(browser).click();

		OVC.getAllVideos(browser).then((videos) => {
			expect(videos.length).toEqual(1);
		});

		OVC.getConfigCardScreenShareButton(browser).click();

		OVC.getAllVideos(browser).then((videos) => {
			expect(videos.length).toEqual(1);
		});
	});

	it('should be able to join to room', async () => {
		browser.wait(EC.elementToBeClickable(OVC.getRoomJoinButton(browser)), 5000);
		OVC.getRoomJoinButton(browser).click();
		expect(OVC.getRoomContainer(browser).isDisplayed()).toBeTruthy();
	});
});

describe('Testing room', () => {
	const OVC = new OpenViduCall();
	const EC = protractor.ExpectedConditions;

	beforeEach(() => {
		browser.waitForAngularEnabled(false);
		browser.get('#/');
		browser.wait(EC.elementToBeClickable(OVC.getRoomJoinButton(browser)), 5000);
		OVC.getRoomJoinButton(browser).click();
		browser.sleep(1000);

		browser.wait(EC.elementToBeClickable(OVC.getRoomJoinButton(browser)), 5000);
		OVC.getRoomJoinButton(browser).click();
		browser.sleep(1000);
	});

	afterEach(() => {
		browser.wait(EC.elementToBeClickable(OVC.getLeaveButton(browser)), 5000);
		OVC.getLeaveButton(browser).click();
		expect(expect(browser.getCurrentUrl()).toMatch('#/'));
	});

	it('should be able to mute the camera', async () => {
		let isVideoEnabled: boolean;
		const videoEnableScript =
			'const videoTrack = document.getElementsByTagName("video")[0].srcObject.getVideoTracks()[0]; return videoTrack.enabled;';

		browser.wait(EC.elementToBeClickable(OVC.getRoomCameraButton(browser)), 5000);

		OVC.getAllVideos(browser).then((videos) => {
			expect(videos.length).toEqual(1);
		});

		isVideoEnabled = await browser.executeScript(videoEnableScript);
		expect(isVideoEnabled).toBe(true);

		OVC.getRoomCameraButton(browser).click();
		isVideoEnabled = await browser.executeScript(videoEnableScript);

		expect(isVideoEnabled).toBe(false);

		// Uncomment when muted video is shown
		// expect(OVC.getCameraStatusDisabled(browser).isDisplayed()).toBe(true);
	});

	it('should be able to mute the microphone', async () => {
		let isAudioEnabled: boolean;
		const audioEnableScript =
			'const audioTrack = document.getElementsByTagName("video")[0].srcObject.getAudioTracks()[0]; return audioTrack.enabled;';

		browser.wait(EC.elementToBeClickable(OVC.getRoomMicrophoneButton(browser)), 5000);

		OVC.getAllVideos(browser).then((videos) => {
			expect(videos.length).toEqual(1);
		});

		isAudioEnabled = await browser.executeScript(audioEnableScript);
		expect(isAudioEnabled).toBe(true);

		OVC.getRoomMicrophoneButton(browser).click();
		isAudioEnabled = await browser.executeScript(audioEnableScript);
		expect(isAudioEnabled).toBe(false);
		expect(OVC.getMicrophoneStatusDisabled(browser).isDisplayed()).toBe(true);
	});

	it('should be able to share the screen', () => {
		browser.wait(EC.elementToBeClickable(OVC.getRoomScreenButton(browser)), 5000);

		OVC.getAllVideos(browser).then((videos) => {
			expect(videos.length).toEqual(1);
		});

		browser.sleep(3000);
		OVC.getRoomScreenButton(browser).click();

		OVC.getAllVideos(browser).then((videos) => {
			expect(videos.length).toEqual(2);
		});
	});

	it('should be able to share the screen and remove the camera video if it is muted', () => {
		browser.wait(EC.elementToBeClickable(OVC.getRoomScreenButton(browser)), 5000);
		browser.wait(EC.elementToBeClickable(OVC.getRoomCameraButton(browser)), 5000);

		OVC.getAllVideos(browser).then((videos) => {
			expect(videos.length).toEqual(1);
		});

		OVC.getRoomCameraButton(browser).click();

		OVC.getAllVideos(browser).then((videos) => {
			expect(videos.length).toEqual(1);
		});

		OVC.getRoomScreenButton(browser).click();

		OVC.getAllVideos(browser).then((videos) => {
			expect(videos.length).toEqual(1);
		});
	});

	it('should be able to add the camera video when the screen is active clicking on camera button', () => {
		browser.wait(EC.elementToBeClickable(OVC.getRoomScreenButton(browser)), 5000);
		browser.wait(EC.elementToBeClickable(OVC.getRoomCameraButton(browser)), 5000);

		OVC.getAllVideos(browser).then((videos) => {
			expect(videos.length).toEqual(1);
		});

		OVC.getRoomCameraButton(browser).click();
		OVC.getAllVideos(browser).then((videos) => {
			expect(videos.length).toEqual(1);
		});

		OVC.getRoomScreenButton(browser).click();

		OVC.getAllVideos(browser).then((videos) => {
			expect(videos.length).toEqual(1);
		});

		browser.sleep(5000);
		OVC.getRoomCameraButton(browser).click();
		browser.sleep(1000);

		OVC.getAllVideos(browser).then((videos) => {
			expect(videos.length).toEqual(2);
		});
	});

	it('should be able to add the camera video disabling screen share', () => {
		browser.wait(EC.elementToBeClickable(OVC.getRoomScreenButton(browser)), 5000);
		browser.wait(EC.elementToBeClickable(OVC.getRoomCameraButton(browser)), 5000);

		OVC.getAllVideos(browser).then((videos) => {
			expect(videos.length).toEqual(1);
		});

		OVC.getRoomCameraButton(browser).click();

		OVC.getAllVideos(browser).then((videos) => {
			expect(videos.length).toEqual(1);
		});

		OVC.getRoomScreenButton(browser).click();
		OVC.getAllVideos(browser).then((videos) => {
			expect(videos.length).toEqual(1);
		});

		OVC.getRoomScreenButton(browser).click();
		OVC.getAllVideos(browser).then((videos) => {
			expect(videos.length).toEqual(1);
		});
	});

	it('should enable and disable fullscreen', () => {
		browser.wait(EC.elementToBeClickable(OVC.getFullscreenButton(browser)), 5000);
		const button = OVC.getFullscreenButton(browser);
		button.click();
		browser.sleep(1000);
		browser.driver
			.manage()
			.window()
			.getSize()
			.then((value) => {
				expect(value.width === OVC.getVideo(browser).width && value.height === OVC.getVideo(browser).height);
				button.click();
				browser.driver
					.manage()
					.window()
					.getSize()
					.then((value2) => {
						expect(value2.width !== OVC.getVideo(browser).width && value2.height !== OVC.getVideo(browser).height);
					});
			});
	});
});

// describe('Test room ', () => {
// 	const OVC = new OpenViduCall();
// 	const EC = protractor.ExpectedConditions;

// 	beforeEach(() => {
// 		browser.waitForAngularEnabled(false);
// 		browser.get('#/codeURJC');
// 	});

// 	it('should set disabled the webcam and show the icon', () => {
// 		browser.sleep(3000);
// 		browser.wait(EC.elementToBeClickable(OVC.getCamButton(browser)), 5000);
// 		OVC.getCamButton(browser).click();
// 		browser.wait(EC.visibilityOf(OVC.getCamIcon(browser)), 5000);
// 		expect(OVC.getCamIcon(browser).isDisplayed()).toBeTruthy();
// 	});

// 	it('should set disabled the microphone and show the icon', () => {
// 		browser.sleep(3000);
// 		browser.wait(EC.elementToBeClickable(OVC.getMicButton(browser)), 5000);
// 		OVC.getMicButton(browser).click();
// 		browser.wait(EC.visibilityOf(OVC.getMicIcon(browser)), 5000);
// 		expect(OVC.getMicIcon(browser).isDisplayed()).toBeTruthy();
// 	});

// 	it('should show the screen share dialog', () => {
// 		browser.wait(EC.elementToBeClickable(OVC.getShareScreenButton(browser)), 5000);
// 		OVC.getShareScreenButton(browser).click();
// 		browser.wait(EC.presenceOf(OVC.getDialogExtension(browser)), 5000);
// 		expect(OVC.getDialogExtension(browser).isDisplayed()).toBeTruthy();
// 		const button = OVC.getDialogCancelButton(browser);
// 		button.click();
// 	});

// 	it('should change the username', () => {
// 		browser.wait(EC.elementToBeClickable(OVC.getLocalNickname(browser)), 5000);
// 		OVC.getLocalNickname(browser).click();
// 		expect(OVC.getDialogNickname(browser).isDisplayed()).toBeTruthy();
// 		const inputDialog = OVC.getDialogNickname(browser).element(by.css('input'));
// 		inputDialog.clear();
// 		OVC.typeWithDelay(inputDialog, 'C');
// 		OVC.pressEnter(browser);
// 		browser.sleep(1000);
// 		expect(OVC.getLocalNickname(browser).getText()).toBe('C');
// 	});
// });

// describe('Chat component', () => {
// 	const OVC = new OpenViduCall();
// 	const EC = protractor.ExpectedConditions;

// 	beforeEach(() => {
// 		browser.waitForAngularEnabled(false);
// 		return browser.get('#/codeURJC');
// 	});

// 	it('should send a message', () => {
// 		browser.wait(EC.elementToBeClickable(OVC.getChatButton(browser)), 5000);
// 		OVC.getChatButton(browser).click();
// 		browser.sleep(1500);
// 		OVC.getChatInput(browser).sendKeys('Message 1');
// 		browser.actions().sendKeys(protractor.Key.ENTER).perform();
// 		expect(OVC.getMessageList(browser).count()).toEqual(1);
// 		OVC.getChatButton(browser).click();
// 	});
// });

// describe('Two browsers: ', () => {
// 	const OVC = new OpenViduCall();
// 	const EC = protractor.ExpectedConditions;
// 	let browser2: ProtractorBrowser;

// 	beforeEach(() => {
// 		browser.waitForAngularEnabled(false);
// 		browser.get('#/codeURJC');
// 	});

// 	it('should connect a new user', () => {
// 		browser2 = OVC.openNewBrowserInTheSameRoom(browser);

// 		// avoid timeout waiting angular
// 		browser2.waitForAngularEnabled(false);

// 		browser.sleep(4000);
// 		expect(OVC.getVideoList(browser).count()).toEqual(2);
// 		OVC.closeSession(browser2);
// 	});

// 	it('a user should disconnect his WEBCAM and to be identified by other ', () => {
// 		browser2 = OVC.openNewBrowserInTheSameRoom(browser);

// 		// avoid timeout waiting angular
// 		browser2.ignoreSynchronization = true;
// 		browser.wait(EC.elementToBeClickable(OVC.getCamButton(browser)), 10000);
// 		OVC.getCamButton(browser).click();
// 		expect(OVC.getCamIcon(browser).isDisplayed()).toBeTruthy();
// 		expect(OVC.getCamIcon(browser2).isDisplayed()).toBeTruthy();
// 		OVC.closeSession(browser2);
// 	});

// 	it('a user should disconnect his MICROPHONE and to be identified by other ', () => {
// 		browser2 = OVC.openNewBrowserInTheSameRoom(browser);

// 		// avoid timeout waiting angular
// 		browser2.waitForAngularEnabled(false);

// 		browser.wait(EC.elementToBeClickable(OVC.getMicButton(browser)), 5000);
// 		OVC.getMicButton(browser).click();
// 		expect(OVC.getMicIcon(browser).isDisplayed()).toBeTruthy();
// 		expect(OVC.getMicIcon(browser2).isDisplayed()).toBeTruthy();
// 		OVC.closeSession(browser2);
// 	});

// 	it('a user should send a MESSAGE and to be identified by other ', () => {
// 		browser2 = OVC.openNewBrowserInTheSameRoom(browser);
// 		// avoid timeout waiting angular
// 		browser2.waitForAngularEnabled(false);

// 		browser.sleep(3000);
// 		browser.wait(EC.elementToBeClickable(OVC.getChatButton(browser)), 5000);
// 		OVC.getChatButton(browser).click();
// 		browser.wait(EC.visibilityOf(OVC.getChatContent(browser)), 5000);
// 		expect(OVC.getChatContent(browser).isDisplayed).toBeTruthy();
// 		browser.sleep(5000);
// 		OVC.getChatInput(browser).click();
// 		OVC.getChatInput(browser).sendKeys('New Message');
// 		OVC.pressEnter(browser);
// 		OVC.getChatButton(browser).click();
// 		expect(OVC.getNewMessagePoint(browser2).getText()).toBe('1');
// 		OVC.closeSession(browser2);
// 	});

// 	it('both users should can type messages and reveive its', () => {
// 		browser2 = OVC.openNewBrowserInTheSameRoom(browser);

// 		browser2.waitForAngularEnabled(false);

// 		OVC.getChatButton(browser).click();
// 		const input = OVC.getChatInput(browser);
// 		browser.sleep(2000);
// 		input.click();
// 		input.sendKeys('New Message User 1');
// 		OVC.pressEnter(browser);
// 		// OVC.getChatButton(browser).click();
// 		OVC.getChatButton(browser2).click();

// 		expect(OVC.getMessageList(browser2).count()).toEqual(1);
// 		const input2 = OVC.getChatInput(browser2);
// 		browser2.sleep(2000);
// 		input2.click();
// 		input2.sendKeys('Message User 2');
// 		OVC.pressEnter(browser2);
// 		expect(OVC.getMessageList(browser).count()).toEqual(4);
// 		OVC.closeSession(browser2);
// 	});

// 	it('user should can change his nickname and to be checked by other', () => {
// 		browser2 = OVC.openNewBrowserInTheSameRoom(browser);

// 		browser2.waitForAngularEnabled(false);
// 		browser.sleep(4000);
// 		OVC.getLocalNickname(browser).click();
// 		expect(OVC.getDialogNickname(browser).isDisplayed()).toBeTruthy();
// 		const inputDialog = OVC.getDialogNickname(browser).element(by.css('input'));
// 		inputDialog.click();
// 		inputDialog.clear();
// 		OVC.typeWithDelay(inputDialog, 'C');
// 		OVC.pressEnter(browser);
// 		browser.sleep(2000);
// 		expect(OVC.getRemoteNickname(browser2).getText()).toBe('C');
// 		OVC.closeSession(browser2);
// 	});
// });
