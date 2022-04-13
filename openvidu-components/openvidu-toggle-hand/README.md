openvidu-toggle-hand is a tutorial sample which shows how to use efficiently the **openvidu-components** library. In this tutorial **we're going to add the raise the hand feature in a video room**, allowing to all users raise the hand and showing the properly notification to others.

For doing that, we're going to **openvidu-components-library** in our angular project. Go ahead.



1. First step to do is create a new Angular project. It must include Angular Material. After that, we need to install openvidu-components-library:


```bash
npm install openvidu-components-library
```

2. Once the library is installed, add `OpenviduComponentsLibraryModule` into your `app.module.ts`:

```typescript

@NgModule({
  ...

  imports: [
    ...
    OpenviduComponentsLibraryModule.forRoot(environment),

  ]

})

```
We need to add our angular environment as a library parameter.


3. Add the components you want to use in your application into the `providers` section of your `app.module.ts`. In this tutorial we're going to use all of them.

```typescript
@NgModule({
  ...

 providers: [
    UserSettingsComponent,
    ToolbarComponent,
    ChatComponent,
    RoomComponent,
    LayoutComponent
  ],

})

```
4. In our `app.component.html` we'll add the default previsualize user modal and we'll add a custom room component using **openvidu-components-library**:

```html
<div id="call-container" style="height: 100%">
	<div id="userSettings" *ngIf="(!joinSessionClicked && !closeClicked) || !isSessionAlive">
		<ov-user-settings (onJoinClicked)="onJoinClicked()"></ov-user-settings>
	</div>

	<div *ngIf="joinSessionClicked && isSessionAlive" style="height: 100%">

		<!-- Injecting custom room component-->
		<app-room-pro [tokens]="tokens"></app-room-pro>
	</div>
</div>

```
**[//AÑADIR DIAGRAMA QUE EXPLIQUE VISUALMENTE LA CUSTOMIZACION DE LA ROOM]**

As we need to add some features in the components, we're going to create our custom components and services for extending the basic components from openvidu library. In this tutorial, we'll add the hand raise feature so we need to customize 4 components and 1 service:

* `RoomProComponent` (_app-room-pro_) which extends from **RoomComponent**: We need to subscribe to toggle hand events and the room component is the perfect site to do that.

* `ToolbarProComponent` (_app-toolbar-pro_)  which extends from **ToolbarComponent**: We need to add a toggle hand button for raise our hand. We've decided include it on the toolbar component so we need to create a custom component to manage this change.

* `LayoutProComponent` (_app-layout-pro) which extends from **LayoutProComponent**: As we need to customize the participant component, showing a new notification on the video when a remote or local participant has raised the hand, we need to replace the default participant component by the customize one.

* `ParticipantProComponent` (_app-participant-pro_) which extends from **ParticipantComponent**: We need to add a new property in participant model object and we also have to show a new notification when a user raised the hand. As we have decided showing this notification in the user vide, we need to customize the default ParticipantComponent.




