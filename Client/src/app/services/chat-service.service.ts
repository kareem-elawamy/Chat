import { inject, Injectable, signal } from '@angular/core';
import { AuthService } from './auth.service';
import { ChatMessage } from '../Models/Chat-message';
import { User } from '../Models/User';
import * as signalR from '@microsoft/signalr';

@Injectable({
  providedIn: 'root'
})
export class ChatServiceService {
  currentReceiverId: string = '';
  public receiverDetails?: User;
  public onlineUsers = signal<User[]>([]);
  public messages: ChatMessage[] = [];
  public typingUsers: Set<string> = new Set();
  currentOpenedChat = signal<User | null>(null)
  searchTerm: string = '';

  private auth = inject(AuthService);
  private hubUrll = 'http://localhost:5000/hubs/chat';
  private hubConnection!: signalR.HubConnection;

  startConnection(receiverId?: string) {
    const token = localStorage.getItem("token");
    console.log("Sending token:", token);

    this.hubConnection = new signalR.HubConnectionBuilder()
      .withUrl(`${this.hubUrll}?receiverId=${receiverId}`, {
        accessTokenFactory: () => token ?? ''
      })
      .withAutomaticReconnect()
      .configureLogging(signalR.LogLevel.Information)
      .build();

    this.hubConnection.start()
      .then(() => console.log('Connection started'))
      .catch(err => console.log('Error while starting connection: ' + err));

    this.hubConnection.on('OnlineUsers', (users: User[]) => {

      this.onlineUsers.update(() =>
        users.filter((users) => users.userName !== this.auth.currentLoggedUser?.userName)
      )
    });

    this.hubConnection.on('ReceieveMessageList', (msgs: ChatMessage[]) => {
      this.messages = msgs;
    });

    this.hubConnection.on('ReceiveMessage', (message: ChatMessage) => {
      this.messages.push(message);
    });
    this.hubConnection.on('NotifyTyping', (userName: string) => {
      this.onlineUsers.update(users =>
        users.map((user) => {
          if (user.userName === userName) {
            user.isTyping = true;
          }
          return user;
        })
      )
      setTimeout(() => {
        this.onlineUsers.update((users) =>
          users.map((user) => {
            if (user.userName === userName) {
              user.isTyping = false;
            }
            return user;

          })
        )
      }, 3000)
    }
    )
    this.hubConnection.on('Notify', (User: User) => {
      Notification.requestPermission().then(permission => {
        if (permission === 'granted') {
          new Notification('Online...', {
            body: `${User.fullName} is online now`,
            icon: `http://localhost:5000${User.profileIamge}`
          });
        }
      }
      )
    });
    this.hubConnection.on('ReceieveMessageList', (messages: ChatMessage[]) => {
      this.messages = messages;
    });
    this.hubConnection.on('ReceiveUserDetails', (user: User) => {
      this.receiverDetails = user;
      console.log('User details:', user);
    });


  }

  getReceiverDetails(receiverId: string) {
    this.hubConnection?.invoke('GetUserDetails', receiverId)
      .catch(err => console.error('Error getting receiver details', err));
  }

  getMessages(receiverId: string) {
    this.hubConnection?.invoke('LoadMessages', receiverId)
      .catch(err => console.error('Error loading messages', err));
  }

  sendMessage(content: string) {
    if (!this.currentReceiverId || !content.trim()) return;

    const message: ChatMessage = {
      content,
      receiverId: this.currentReceiverId,
      senderId: this.auth.currentLoggedUser?.id,
      timeSent: new Date()
    };

    this.hubConnection.invoke('SendMessage', message);
  }

  notifyTyping() {
    this.hubConnection.invoke('NotifyTyping', this.currentOpenedChat()?.userName).then((x) => {
      console.log('Typing notification sent:', x);
    }).catch(err => console.error('Error sending typing notification:', err));
  }

  stopConnection() {
    if (this.hubConnection?.state === signalR.HubConnectionState.Connected) {
      this.hubConnection.stop().catch(err => console.error('Error stopping connection:', err));
    }
  }

}
