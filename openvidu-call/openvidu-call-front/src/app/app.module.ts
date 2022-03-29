import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { AppRoutingModule } from './app-routing.module';
import { environment } from 'src/environments/environment';

// Material
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatToolbarModule } from '@angular/material/toolbar';

// Application Components
import { AppComponent } from './app.component';
import { CallComponent } from './components/call/call.component';
import { HomeComponent } from './components/home/home.component';

// OpenVidu Angular
import { OpenViduAngularConfig, OpenViduAngularModule } from 'openvidu-angular';

// Services

const config: OpenViduAngularConfig = {
	production: environment.production
};


@NgModule({
	declarations: [AppComponent, HomeComponent, CallComponent],
	imports: [
		BrowserModule,
		BrowserAnimationsModule,
		FormsModule,
		ReactiveFormsModule,
		MatToolbarModule,
		OpenViduAngularModule.forRoot(config),
		AppRoutingModule // Order is important, AppRoutingModule must be the last import for useHash working
	],
	providers: [],
	bootstrap: [AppComponent]
})
export class AppModule {
	ngDoBootstrap() {}
}
