
import { ApplicationConfig, importProvidersFrom, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';

import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { OpenViduComponentsModule, OpenViduComponentsConfig } from 'openvidu-components-angular';
import { environment } from '@environment/environment';
import { routes } from '@app/app.routes';

const ovComponentsconfig: OpenViduComponentsConfig = {
	production: environment.production
};

export const appConfig: ApplicationConfig = {
	providers: [
		importProvidersFrom(OpenViduComponentsModule.forRoot(ovComponentsconfig)),
		provideZoneChangeDetection({ eventCoalescing: true }),
		provideRouter(routes),
		provideAnimationsAsync()
	]
};