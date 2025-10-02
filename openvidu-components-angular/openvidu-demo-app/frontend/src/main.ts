import { enableProdMode } from '@angular/core';
import { environment } from '@environment/environment';
import { AppComponent } from '@app/app.component';
import { appConfig } from '@app/app.config';
import { bootstrapApplication } from '@angular/platform-browser';

if (environment.production) {
	enableProdMode();
}

bootstrapApplication(AppComponent, appConfig).catch((err) => console.error(err));
