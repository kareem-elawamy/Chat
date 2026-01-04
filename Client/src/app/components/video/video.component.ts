import { Component, ElementRef, Inject, inject, OnDestroy, OnInit, ViewChild, AfterViewInit } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import { VideoService } from '../../services/video.service';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { Subscription } from 'rxjs';
import { AuthService } from '../../services/auth.service';
import { NgIf, NgClass } from '@angular/common';
import gsap from 'gsap';

@Component({
  selector: 'app-video',
  standalone: true,
  imports: [MatButtonModule, MatIcon, NgIf, NgClass],
  templateUrl: './video.component.html',
  styles: [`
    .glass-controls {
      background: rgba(0, 0, 0, 0.4);
      backdrop-filter: blur(10px);
      border: 1px solid rgba(255, 255, 255, 0.1);
    }
    video {
      transform: scaleX(-1); /* Mirror effect for better UX */
    }
  `]
})
export class VideoComponent implements OnInit, OnDestroy, AfterViewInit {
  constructor(@Inject(MAT_DIALOG_DATA) public data: { remoteUserId: string }) { }

  auth = inject(AuthService);
  signalRService = inject(VideoService);
  private dialogRef: MatDialogRef<VideoComponent> = inject(MatDialogRef);

  @ViewChild('localVideo') localVideo!: ElementRef<HTMLVideoElement>;
  @ViewChild('remoteVideo') remoteVideo!: ElementRef<HTMLVideoElement>;
  @ViewChild('controlsBar') controlsBar!: ElementRef;

  private peerConnection!: RTCPeerConnection;
  private localStream: MediaStream | null = null;
  private subscriptions: Subscription[] = [];
  private iceCandidateQueue: RTCIceCandidate[] = [];

  // State for UI
  isMuted = false;
  isCameraOff = false;
  callStatus: 'calling' | 'ringing' | 'connected' = 'calling';

  ngOnInit(): void {
    if (this.signalRService.incomingCall) {
      this.callStatus = 'ringing';
    }

    this.setupPeerConnection();
    // نبدأ الكاميرا فوراً لنجهزها
    this.startLocalVideo();
    this.setupSignalListeners();
  }

  ngAfterViewInit() {
    // دخول ناعم لعناصر التحكم
    gsap.from(this.controlsBar.nativeElement, {
      y: 50, opacity: 0, duration: 1, delay: 0.5, ease: 'power3.out'
    });
  }

  ngOnDestroy(): void {
    this.cleanup();
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  // --- Toggle Features (Mute / Camera) ---
  toggleMute() {
    if (this.localStream) {
      this.localStream.getAudioTracks().forEach(track => {
        track.enabled = !track.enabled;
        this.isMuted = !track.enabled;
      });
    }
  }

  toggleCamera() {
    if (this.localStream) {
      this.localStream.getVideoTracks().forEach(track => {
        track.enabled = !track.enabled;
        this.isCameraOff = !track.enabled;
      });
    }
  }

  // --- WebRTC Logic ---
  private setupPeerConnection() {
    this.peerConnection = new RTCPeerConnection({
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' }
      ]
    });

    this.peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        this.signalRService.sendIceCandidate(this.signalRService.remoteUser, event.candidate);
      }
    };

    this.peerConnection.ontrack = (event) => {
      console.log('Remote Track Received');
      if (this.remoteVideo?.nativeElement) {
        this.remoteVideo.nativeElement.srcObject = event.streams[0];
        // تأثير بسيط عند وصول الفيديو
        gsap.from(this.remoteVideo.nativeElement, { opacity: 0, duration: 1 });
      }
    };

    this.peerConnection.oniceconnectionstatechange = () => {
      const state = this.peerConnection.iceConnectionState;
      if (state === 'connected') {
        this.callStatus = 'connected';
      }
      if (state === 'disconnected' || state === 'failed' || state === 'closed') {
        this.endCall();
      }
    };
  }

  private setupSignalListeners() {
    // Handling Answer
    this.subscriptions.push(
      this.signalRService.answer.subscribe(async (data) => {
        if (data) {
          try {
            await this.peerConnection.setRemoteDescription(new RTCSessionDescription(data.answer));
            // Process queued candidates
            for (const candidate of this.iceCandidateQueue) {
              await this.peerConnection.addIceCandidate(candidate);
            }
            this.iceCandidateQueue = [];
            this.callStatus = 'connected';
          } catch (error) { console.error(error); }
        }
      })
    );

    // Handling ICE Candidates
    this.subscriptions.push(
      this.signalRService.ReceiveIceCandidate.subscribe(async (data) => {
        if (data) {
          const candidate = new RTCIceCandidate(data.iceCandidate);
          if (this.peerConnection.remoteDescription && this.peerConnection.remoteDescription.type) {
            await this.peerConnection.addIceCandidate(candidate);
          } else {
            this.iceCandidateQueue.push(candidate);
          }
        }
      })
    );

    this.signalRService.hubConnection.on('CallEnded', () => {
      this.cleanup();
      this.dialogRef.close();
    });
  }

  private async startLocalVideo() {
    try {
      this.localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });

      if (this.localVideo?.nativeElement) {
        this.localVideo.nativeElement.srcObject = this.localStream;
        // تأثير ظهور الفيديو المحلي
        gsap.from(this.localVideo.nativeElement, { scale: 0, duration: 0.5, ease: 'back.out' });
      }

      this.localStream.getTracks().forEach(track => {
        this.peerConnection.addTrack(track, this.localStream!);
      });
    } catch (error) {
      console.error('Error accessing media:', error);
      this.dialogRef.close();
    }
  }

  // --- Call Actions ---

  async startCall() {
    try {
      this.signalRService.isCallActive = true;
      const offer = await this.peerConnection.createOffer();
      await this.peerConnection.setLocalDescription(offer);
      this.signalRService.sendOffer(this.signalRService.remoteUser, offer);
    } catch (error) {
      this.endCall();
    }
  }

  async acceptCall() {
    try {
      this.signalRService.incomingCall = false;
      this.signalRService.isCallActive = true;

      const offer = this.signalRService.offer.getValue()?.offer;
      if (offer) {
        // 1. Set Remote Description FIRST
        await this.peerConnection.setRemoteDescription(new RTCSessionDescription(offer));

        // 2. Add candidates
        for (const candidate of this.iceCandidateQueue) {
          await this.peerConnection.addIceCandidate(candidate);
        }
        this.iceCandidateQueue = [];

        // 3. Create Answer
        const answer = await this.peerConnection.createAnswer();
        await this.peerConnection.setLocalDescription(answer);
        this.signalRService.sendAnswer(this.signalRService.remoteUser, answer as RTCSessionDescription);

        this.callStatus = 'connected';
      }
    } catch (error) {
      console.error(error);
      this.endCall();
    }
  }

  declineCall() {
    this.signalRService.endCall(this.signalRService.remoteUser);
    this.cleanup();
    this.dialogRef.close();
  }

  endCall() {
    this.signalRService.endCall(this.signalRService.remoteUser);
    this.cleanup();
    this.dialogRef.close();
  }

  private cleanup() {
    if (this.peerConnection) this.peerConnection.close();
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => track.stop());
      this.localStream = null;
    }
    this.signalRService.isCallActive = false;
    this.signalRService.incomingCall = false;
  }
}
