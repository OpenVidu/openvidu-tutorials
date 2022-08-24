import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';

import { AppComponent } from './app.component';
import { UserVideoComponent } from './user-video.component';
import { OpenViduVideoComponent } from './ov-video.component';

@NgModule({
  declarations: [
    AppComponent,
    UserVideoComponent,
    OpenViduVideoComponent
  ],
  imports: [
    BrowserModule,
    FormsModule,
    HttpClientModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
