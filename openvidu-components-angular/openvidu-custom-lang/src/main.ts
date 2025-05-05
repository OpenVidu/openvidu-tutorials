import { enableProdMode, importProvidersFrom } from '@angular/core';
import { environment } from './environments/environment';
import { AppComponent } from './app/app.component';
import { provideAnimations } from '@angular/platform-browser/animations';
import { BrowserModule, bootstrapApplication } from '@angular/platform-browser';
import { OpenViduComponentsModule, OpenViduComponentsConfig } from 'openvidu-components-angular';

const config: OpenViduComponentsConfig = {
  production: environment.production,
};

if (environment.production) {
  enableProdMode();
}

bootstrapApplication(AppComponent, {
  providers: [
    importProvidersFrom(BrowserModule, OpenViduComponentsModule.forRoot(config)),
    provideAnimations(),
  ],
}).catch((err) => console.error(err));
