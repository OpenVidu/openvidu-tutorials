import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

import { AppComponent } from './app.component';

import { OpenviduSessionModule } from 'openvidu-angular';
import { FormsModule } from '@angular/forms';

@NgModule({
  declarations: [
    AppComponent
  ],
  imports: [
    BrowserModule,
    FormsModule,
    OpenviduSessionModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
