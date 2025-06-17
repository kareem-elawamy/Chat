import { Component, inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ChatServiceService } from '../../services/chat-service.service';
import { AuthService } from '../../services/auth.service';
import { DatePipe, NgClass, NgFor, NgIf } from '@angular/common';
import { User } from '../../Models/User';
import { MatIcon } from '@angular/material/icon';
import { VideoService } from '../../services/video.service';
import { MatDialog } from '@angular/material/dialog';
import { VideoComponent } from '../video/video.component';

@Component({
  selector: 'app-chat-window',
  standalone: true,
  imports: [MatIcon, FormsModule, NgClass, NgFor, DatePipe, NgIf],
  templateUrl: './chat-window.component.html',
  styles: []
})
export class ChatWindowComponent implements OnInit {
  ngOnInit(): void {
    console.log('RID:', this.chat.currentReceiverId)
  }
  dialig = inject(MatDialog)
  signalR = inject(VideoService)
  chat = inject(ChatServiceService);
  auth = inject(AuthService);
  messageContent: string = '';
  getImage(imgName: string | undefined): string {
    if (imgName == undefined) return `http://localhost:5000/notfound.png`;

    return `http://localhost:5000${imgName}`;
  }


  sendMessage() {
    if (this.messageContent.trim()) {
      this.chat.sendMessage(this.messageContent);
      this.messageContent = '';
      this.getmessages();
    }
  }
  getmessages() {
    this.chat.getMessages(this.chat.currentReceiverId);
  }
  display(id: string) {
    console.log('start call ID:', id); 
    this.signalR.remoteUser = id;

    this.dialig.open(VideoComponent, {
      width: '400px',
      height: '600px',
      disableClose: true,
      autoFocus: false
    });
  }

}
