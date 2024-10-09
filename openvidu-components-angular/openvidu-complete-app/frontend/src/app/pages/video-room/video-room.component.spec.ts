import { ComponentFixture, TestBed } from '@angular/core/testing';
import { VideoRoomComponent } from './video-room.component';

describe('CallComponent', () => {
	let component: VideoRoomComponent;
	let fixture: ComponentFixture<VideoRoomComponent>;

	beforeEach(async () => {
		await TestBed.configureTestingModule({
    imports: [VideoRoomComponent]
}).compileComponents();
	});

	beforeEach(() => {
		fixture = TestBed.createComponent(VideoRoomComponent);
		component = fixture.componentInstance;
		fixture.detectChanges();
	});

	it('should create', () => {
		expect(component).toBeTruthy();
	});
});
