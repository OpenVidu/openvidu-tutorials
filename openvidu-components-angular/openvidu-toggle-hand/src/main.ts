import { enableProdMode, importProvidersFrom } from '@angular/core';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';

import { environment } from './environments/environment';
import { AppComponent } from './app/app.component';
import { ParticipantAppModel } from './app/models/participant-app.model';
import { environment as environment_1 } from 'src/environments/environment';
import { OpenViduComponentsModule, OpenViduComponentsConfig, ParticipantProperties } from 'openvidu-components-angular';
import { provideAnimations } from '@angular/platform-browser/animations';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { BrowserModule, bootstrapApplication } from '@angular/platform-browser';

const config: OpenViduComponentsConfig = {
	production: environment.production,
	participantFactory: (props: ParticipantProperties) => new ParticipantAppModel(props)
};

if (environment.production) {
	enableProdMode();
}

bootstrapApplication(AppComponent, {
	providers: [
		importProvidersFrom(BrowserModule, OpenViduComponentsModule.forRoot(config)),
		provideAnimations()
	]
}).catch((err) => console.error(err));
