const puppeteer = require('puppeteer');

(async () => {
	const args = process.argv.slice(2);
	const project = args[0];
	const port = args[1] || '5080'; // Get port from arguments or default to 5080
	let selector;

	// Determine the correct selector based on the project
	if (project.includes('openvidu-admin-dashboard')) {
		selector = 'ov-admin-login';
	} else {
		selector = '#join-button';
	}

	const browser = await puppeteer.launch({
		args: [
			'--use-fake-ui-for-media-stream',
			'--use-fake-device-for-media-stream',
			'--no-sandbox',
			'--disable-setuid-sandbox',
		],
	});
	const page = await browser.newPage();
	const url = `http://localhost:${port}`;

	console.log(`Navigating to ${url}`);
	await page.goto(url);

	try {
		console.log(`Waiting for ${selector} to appear in the DOM...`);
		await page.waitForSelector(selector, { timeout: 10000 });
		console.log(`${selector} found!`);
	} catch (error) {
		const screenshotPath = `screenshot-${Date.now()}.png`;
		await page.screenshot({ path: screenshotPath });
		console.error(`Error: ${selector} not found`);
		console.error(
			`ERROR!! Test failed: ${selector} not found on ${url}`,
			error
		);
		process.exit(1);
	} finally {
		await browser.close();
	}
})();
