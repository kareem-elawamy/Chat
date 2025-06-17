import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { VideoService } from './services/video.service';
import { AuthService } from './services/auth.service';
import { MatDialog } from '@angular/material/dialog';
import { VideoComponent } from './components/video/video.component';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent implements OnInit, OnDestroy {
  private subscriptions: Subscription[] = [];
  private signalRService = inject(VideoService);
  private auth = inject(AuthService);
  private matDialog = inject(MatDialog);

  ngOnInit(): void {
    if (!this.auth.getAccessToken) return;
    this.signalRService.startConnection();
    this.setupVideoCallHandling();
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  private setupVideoCallHandling() {
    this.subscriptions.push(
      this.signalRService.offer.subscribe(async (data) => {
        if (data) {
          const dialogRef = this.matDialog.open(VideoComponent, {
            width: '400px',
            height: '600px',
            disableClose: true,
            data: { remoteUserId: data.senderName }
          });
          dialogRef.afterOpened().subscribe(() => {
            this.signalRService.incomingCall = true;
            this.signalRService.isCallActive = false;
            this.signalRService.remoteUser = data.senderName;

          });

          this.signalRService.remoteUser = data.senderName;
          this.signalRService.incomingCall = true;

          dialogRef.afterClosed().subscribe(() => {
            this.signalRService.incomingCall = false;
            this.signalRService.isCallActive = false;
            this.signalRService.remoteUser = '';
          });
        }
      })
    );
  }
}
