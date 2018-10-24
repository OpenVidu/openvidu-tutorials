import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { RouterModule, RouteReuseStrategy, Routes } from '@angular/router';

import { IonicModule, IonicRouteStrategy } from '@ionic/angular';
import { SplashScreen } from '@ionic-native/splash-screen/ngx';
import { StatusBar } from '@ionic-native/status-bar/ngx';

import { AppComponent } from './app.component';
import { FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { UserVideoComponent } from './user-video.component';
import { OpenViduVideoComponent } from './ov-video.component';

import { AndroidPermissions } from '@ionic-native/android-permissions/ngx';

@NgModule({
    declarations: [AppComponent, UserVideoComponent, OpenViduVideoComponent],
    entryComponents: [],
    imports: [BrowserModule, FormsModule, IonicModule.forRoot(), HttpClientModule],
    providers: [
        StatusBar,
        SplashScreen,
        { provide: RouteReuseStrategy, useClass: IonicRouteStrategy },
        AndroidPermissions,
    ],
    bootstrap: [AppComponent],
})
export class AppModule {}
