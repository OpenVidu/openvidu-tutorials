import { Routes } from '@angular/router';
import { HomeComponent } from '@pages/home/home.component';
import { AdminDashboardComponent } from '@pages/admin-dashboard/admin-dashboard.component';
import { VideoRoomComponent } from '@pages/video-room/video-room.component';
import { roomGuard } from '@guards/room.guard';


export const routes: Routes = [
	{ path: '', redirectTo: 'home', pathMatch: 'full' },
	{ path: 'home', component: HomeComponent },
	{ path: 'admin', component: AdminDashboardComponent },
	{ path: ':roomName', component: VideoRoomComponent, canActivate: [roomGuard] }
];
