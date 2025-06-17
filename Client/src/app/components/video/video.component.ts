import { Component, ElementRef, Inject, inject, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import { VideoService } from '../../services/video.service';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { Subscription } from 'rxjs';
import { AuthService } from '../../services/auth.service';
import { NgIf } from '@angular/common';

@Component({
  selector: 'app-video',
  imports: [MatButtonModule, MatIcon, NgIf],
  templateUrl: './video.component.html',
  styles: ``
})
export class VideoComponent implements OnInit, OnDestroy {
  constructor(@Inject(MAT_DIALOG_DATA) public data: { remoteUserId: string }) { }

  auth = inject(AuthService);
  signalRService = inject(VideoService);
  private dialogRef: MatDialogRef<VideoComponent> = inject(MatDialogRef);

  @ViewChild('localVideo') localVideo!: ElementRef<HTMLVideoElement>;
  @ViewChild('remoteVideo') remoteVideo!: ElementRef<HTMLVideoElement>;

  private peerConnection!: RTCPeerConnection;
  private localStream: MediaStream | null = null;
  private remoteStream: MediaStream | null = null;

  private subscriptions: Subscription[] = [];
  private iceCandidateQueue: RTCIceCandidate[] = [];

  ngOnInit(): void {
    this.setupPeerConnection();
    this.startLocalVideo();
    this.setupSignalListeners();
  }


  ngOnDestroy(): void {
    this.cleanup();
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  private setupPeerConnection() {
    this.peerConnection = new RTCPeerConnection({
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun.service.mozilla.com' }
      ]
    });

    this.peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        this.signalRService.sendIceCandidate(this.signalRService.remoteUser, event.candidate);
      }
    };

    this.peerConnection.ontrack = (event) => {
      
      if (this.remoteVideo?.nativeElement) {
        this.remoteVideo.nativeElement.srcObject = event.streams[0];
      }
    };


    this.peerConnection.oniceconnectionstatechange = () => {
      const state = this.peerConnection.iceConnectionState;
      if (state === 'disconnected' || state === 'failed' || state === 'closed') {
        this.cleanup();
        this.dialogRef.close();
      }
    };
  }

  private setupSignalListeners() {
    this.subscriptions.push(
      this.signalRService.answer.subscribe(async (data) => {
        if (data) {
          try {
            await this.peerConnection.setRemoteDescription(new RTCSessionDescription(data.answer));

            for (const candidate of this.iceCandidateQueue) {
              try {
                await this.peerConnection.addIceCandidate(candidate);
              } catch (error) {
                console.error('Error ', error);
              }
            }
            this.iceCandidateQueue = [];
          } catch (error) {
            console.error('Error ', error);
          }
        }
      })
    );

    this.subscriptions.push(
      this.signalRService.ReceiveIceCandidate.subscribe(async (data) => {
        if (data) {
          const candidate = new RTCIceCandidate(data.iceCandidate);

          if (this.peerConnection.remoteDescription && this.peerConnection.remoteDescription.type) {
            try {
              await this.peerConnection.addIceCandidate(candidate);
            } catch (error) {
              console.error('E:', error);
            }
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
      }

      this.localStream.getTracks().forEach(track => {
        this.peerConnection.addTrack(track, this.localStream!);
      });
    } catch (error) {
      console.error('Error :', error);
      this.dialogRef.close();
    }
  }
  async startremoteVideo() {
    this.remoteStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });

    if (this.remoteVideo?.nativeElement) {
      this.remoteVideo.nativeElement.srcObject = this.remoteStream;
    }

    this.remoteStream.getTracks().forEach(track => {
      this.peerConnection.addTrack(track, this.remoteStream!);
    });
  }
  async acceptCall() {
    try {
      this.signalRService.incomingCall = false;
      this.signalRService.isCallActive = true;

      const offer = this.signalRService.offer.getValue()?.offer;
      if (offer) {
        await this.startLocalVideo();
        this.startremoteVideo();
        await this.peerConnection.setRemoteDescription(new RTCSessionDescription(offer));

        for (const candidate of this.iceCandidateQueue) {
          await this.peerConnection.addIceCandidate(candidate);
        }
        this.iceCandidateQueue = [];

        const answer = await this.peerConnection.createAnswer();
        await this.peerConnection.setLocalDescription(answer);
        this.signalRService.sendAnswer(this.signalRService.remoteUser, answer as RTCSessionDescription);
      }
    } catch (error) {
      console.error(' Error ', error);
      this.cleanup();
      this.dialogRef.close();
    }
  }

  async startCall() {


    try {
      await this.startLocalVideo(); 
      this.signalRService.isCallActive = true;

      const offer = await this.peerConnection.createOffer();
      await this.peerConnection.setLocalDescription(offer);
      this.signalRService.sendOffer(this.signalRService.remoteUser, offer);

      console.log('Call started with offer:', offer);
    } catch (error) {
      console.error('Error starting call:', error);
      this.cleanup();
      this.dialogRef.close();
    }
  }


  declineCall() {
    this.cleanup();
    this.signalRService.incomingCall = false;
    this.signalRService.isCallActive = false;
    this.signalRService.endCall(this.signalRService.remoteUser);
    this.dialogRef.close();
  }

  async endCall() {
    this.cleanup();
    this.signalRService.isCallActive = false;
    this.signalRService.incomingCall = false;
    this.signalRService.endCall(this.signalRService.remoteUser);
    this.dialogRef.close();
  }

  private cleanup() {
    if (this.peerConnection) {
      this.peerConnection.close();
    }

    if (this.localStream) {
      this.localStream.getTracks().forEach(track => track.stop());
      this.localStream = null;
    }

    if (this.localVideo?.nativeElement) {
      this.localVideo.nativeElement.srcObject = null;
    }

    if (this.remoteVideo?.nativeElement) {
      this.remoteVideo.nativeElement.srcObject = null;
    }
  }
}
