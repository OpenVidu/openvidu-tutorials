import { HttpClientModule } from '@angular/common/http';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { BrowserModule } from '@angular/platform-browser';
import { RouteReuseStrategy } from '@angular/router';
import { AndroidPermissions } from '@ionic-native/android-permissions/ngx';
import { SplashScreen } from '@ionic-native/splash-screen/ngx';
import { StatusBar } from '@ionic-native/status-bar/ngx';
import { IonicModule, IonicRouteStrategy } from '@ionic/angular';
import { AppComponent } from './app.component';
import { OpenViduVideoComponent } from './ov-video.component';
import { UserVideoComponent } from './user-video.component';


@NgModule({
    declarations: [AppComponent, UserVideoComponent, OpenViduVideoComponent],
    entryComponents: [],
    imports: [BrowserModule, FormsModule, IonicModule.forRoot(), HttpClientModule],
    providers: [
        StatusBar,
        SplashScreen,
        { provide: RouteReuseStrategy, useClass: IonicRouteStrategy },
        AndroidPermissions
    ],
    bootstrap: [AppComponent]
})
export class AppModule { }
