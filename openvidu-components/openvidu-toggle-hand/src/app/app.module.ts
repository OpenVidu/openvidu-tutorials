import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

import { AppComponent } from './app.component';
import { OpenViduAngularConfig, OpenViduAngularModule, ParticipantProperties, StreamModel } from 'openvidu-angular';
import { environment } from 'src/environments/environment';
import { ParticipantAppModel } from './models/participant-app.model';

const config: OpenViduAngularConfig = {
	production: environment.production,
	participantFactory: (props: ParticipantProperties, streamModel: StreamModel) => new ParticipantAppModel(props, streamModel)
};

@NgModule({
	declarations: [AppComponent],
	imports: [BrowserModule, MatButtonModule, MatIconModule, BrowserAnimationsModule, OpenViduAngularModule.forRoot(config)],
	providers: [],
	bootstrap: [AppComponent]
})
export class AppModule {}
