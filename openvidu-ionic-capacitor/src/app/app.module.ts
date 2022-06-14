import { HttpClientModule } from '@angular/common/http';
import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { RouteReuseStrategy } from '@angular/router';

import { IonicModule, IonicRouteStrategy } from '@ionic/angular';
import { AndroidPermissions } from '@awesome-cordova-plugins/android-permissions/ngx';

import { AppComponent } from './app.component';
import { FormsModule } from '@angular/forms';
import { UserVideoComponent } from './user-video.component';
import { OpenViduVideoComponent } from './ov-video.component';

@NgModule({
	declarations: [AppComponent, UserVideoComponent, OpenViduVideoComponent],
	imports: [BrowserModule, FormsModule, IonicModule.forRoot(), HttpClientModule],
	providers: [{ provide: RouteReuseStrategy, useClass: IonicRouteStrategy }, AndroidPermissions],
	bootstrap: [AppComponent]
})
export class AppModule {}
