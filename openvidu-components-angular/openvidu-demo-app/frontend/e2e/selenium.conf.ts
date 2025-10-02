import { Capabilities } from 'selenium-webdriver';
import * as chrome from 'selenium-webdriver/chrome.js';
import { DOWNLOADS_DIR, LAUNCH_MODE } from './config.js';

interface BrowserConfig {
	appUrl: string;
	seleniumAddress: string;
	browserCapabilities: Capabilities;
	browserOptions: chrome.Options;
	browserName: string;
	downloadsDir: string;
}

const chromeArguments = [
	'--window-size=1024,768',
	'--use-fake-ui-for-media-stream',
	'--use-fake-device-for-media-stream'
];
const chromeArgumentsCI = [
	'--window-size=1300,1000',
	'--headless',
	'--no-sandbox',
	'--disable-gpu',
	'--disable-popup-blocking',
	'--no-first-run',
	'--no-default-browser-check',
	'--disable-dev-shm-usage',
	'--disable-background-networking',
	'--disable-default-apps',
	'--use-fake-ui-for-media-stream',
	'--use-fake-device-for-media-stream'
];

const chromeOptions: chrome.Options = new chrome.Options();
chromeOptions.addArguments(...(LAUNCH_MODE === 'CI' ? chromeArgumentsCI : chromeArguments));
chromeOptions.setUserPreferences({
	'download.default_directory': DOWNLOADS_DIR,
	'download.prompt_for_download': false,
	'download.directory_upgrade': true,
	'safebrowsing.enabled': false,
	'profile.default_content_settings.popups': 0,
	'profile.content_settings.exceptions.automatic_downloads.*.setting': 1
});
export const OpenViduDemoAppConfig: BrowserConfig = {
	appUrl: LAUNCH_MODE === 'CI' ? 'http://localhost:6080/' : 'http://localhost:5080/',
	seleniumAddress: LAUNCH_MODE === 'CI' ? 'http://localhost:4444/wd/hub' : '',
	browserName: 'ChromeTest',
	browserCapabilities: Capabilities.chrome().set('acceptInsecureCerts', true),
	browserOptions: chromeOptions,
	downloadsDir: DOWNLOADS_DIR
};
