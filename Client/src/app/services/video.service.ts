import { inject, Injectable, OnDestroy } from '@angular/core';
import { HubConnection, HubConnectionBuilder } from '@microsoft/signalr';
import { BehaviorSubject } from 'rxjs';
import { AuthService } from './auth.service';
import { ChatServiceService } from './chat-service.service';

@Injectable({ providedIn: 'root' })
export class VideoService implements OnDestroy {
  private url = 'http://localhost:5000/hubs/vide';
  private auth = inject(AuthService);
  hubConnection!: HubConnection;
  public incomingCall = false;
  public isCallActive = false;
  public remoteUser = '';

  public peerConnection!: RTCPeerConnection;

  public offer = new BehaviorSubject<{ senderName: string, offer: RTCSessionDescription } | null>(null);
  public answer = new BehaviorSubject<{ senderName: string, answer: RTCSessionDescription } | null>(null);
  public ReceiveIceCandidate = new BehaviorSubject<{ senderName: string, iceCandidate: RTCIceCandidate } | null>(null);
  public callEnded = new BehaviorSubject<boolean>(false);
  private chat = inject(ChatServiceService);
  async startConnection() {
    const token = localStorage.getItem("token");
    try {
      console.log("Sending token video:", token);

      this.hubConnection = new HubConnectionBuilder()
        .withUrl(this.url, {
          accessTokenFactory: () => token ?? ''
        })
        .withAutomaticReconnect()
        .build();

      await this.hubConnection.start();
      console.log('Video connection started');

      this.setupHubListeners();
    } catch (err) {
      console.error('Error while starting video connection:', err);
      throw err;
    }
  }

  private setupHubListeners() {
    this.hubConnection.on('ReceiveOffer', (senderName, offer) => {
      console.log(offer);
      console.log(senderName);

      this.incomingCall = true;
      this.remoteUser = senderName;
      this.offer.next({ senderName, offer: JSON.parse(offer) });
    });

    this.hubConnection.on('ReceiveAnswer', (senderName, answer) => {
      this.answer.next({ senderName, answer: JSON.parse(answer) });
    });

    this.hubConnection.on('ReceiveIceCandidate', (senderName, candidate) => {
      this.ReceiveIceCandidate.next({ senderName, iceCandidate: JSON.parse(candidate) });
    });

    this.hubConnection.on('CallEnded', () => {
      this.incomingCall = false;
      this.isCallActive = false;
      this.remoteUser = '';
      this.callEnded.next(true);
    });

    this.hubConnection.onclose(() => {
      
      this.incomingCall = false;
      this.isCallActive = false;
      this.remoteUser = '';
    });
  }

  async sendOffer(receiverId: string, offer: RTCSessionDescriptionInit) {
    try {
      if (!this.hubConnection || this.hubConnection.state !== 'Connected') {
        throw new Error('Hub connection is not established');
      }
      console.log('Sending offer:', offer);
      console.log("userName:", this.auth.currentLoggedUser?.userName);

      await this.hubConnection.invoke('SendOffer', this.chat.receiverDetails?.userName, JSON.stringify(offer));
    } catch (err) {
      console.error('Error Of:', err);
      throw err;
    }
  }

  async sendAnswer(receiverId: string, answer: RTCSessionDescription) {
    try {
      if (!this.hubConnection || this.hubConnection.state !== 'Connected') {
        throw new Error('Hub connection is not established');
      }
      await this.hubConnection.invoke('SendAnswer', this.chat.receiverDetails?.userName, JSON.stringify(answer));
      console.log('Sending answer:', answer);

    } catch (err) {
      console.error('Error:', err);
      throw err;
    }
  }

  async sendIceCandidate(receiverId: string, candidate: RTCIceCandidate) {
    try {
      await this.hubConnection.invoke('SendIceCandidate', this.chat.receiverDetails?.userName, JSON.stringify(candidate));
    } catch (err) {
      console.error('Error', err);
      throw err;
    }
  }

  async endCall(receiverId: string) {
    try {
      await this.hubConnection.invoke('EndCall', this.chat.receiverDetails?.userName);
      this.incomingCall = false;
      this.isCallActive = false;
      this.remoteUser = '';
    } catch (err) {
      console.error('Error', err);
      throw err;
    }
  }

  ngOnDestroy() {
    if (this.hubConnection) {
      this.hubConnection.stop();
    }
  }
}
