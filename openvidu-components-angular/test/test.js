const puppeteer = require('puppeteer');

(async () => {
	// Iniciar el navegador
	console.log('Iniciando navegador');
	const browser = await puppeteer.launch({
		args: [
			'--use-fake-ui-for-media-stream',
			'--use-fake-device-for-media-stream',
		],
	});
	const page = await browser.newPage();

	console.log('Navegando a la aplicación');

	// Navegar a la aplicación
	await page.goto('https://192-168-1-47.openvidu-local.dev:5443');

	// Esperar a que el elemento con el ID #join-button aparezca
	try {
		console.log('Esperando a que #join-button aparezca');
		await page.waitForSelector('#join-button', { timeout: 10000 });
		console.log('#join-button encontrado');
	} catch (error) {
		const screenshotPath = `screenshot-${Date.now()}.png`;
		await page.screenshot({ path: screenshotPath });
		console.error('Error: #join-button no encontrado');
		console.error('ERROR!! Test failed: #join-button not found');
   		process.exit(1); // Salir del script con un código de error
	}

	// Cerrar el navegador
	await browser.close();
})();
