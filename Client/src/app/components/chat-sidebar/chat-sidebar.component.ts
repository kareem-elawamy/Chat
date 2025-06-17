import { Component, inject, OnInit } from '@angular/core';
import { MatIcon, MatIconModule } from '@angular/material/icon';
import { MatMenu, MatMenuModule } from '@angular/material/menu';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';
import { NgClass, NgFor, NgIf, TitleCasePipe } from '@angular/common';
import { ChatServiceService } from '../../services/chat-service.service';
import { FormsModule, NgModel } from '@angular/forms';
import { TypingIndicatorComponent } from '../typing-indicator/typing-indicator.component';
import { User } from '../../Models/User';
@Component({
  selector: 'app-chat-sidebar',
  imports: [MatIconModule, MatMenuModule, FormsModule, NgFor, NgClass, TypingIndicatorComponent],
  templateUrl: './chat-sidebar.component.html',
  styles: ``
})
export class ChatSidebarComponent implements OnInit {
  auth = inject(AuthService);
  router = inject(Router);
  chat = inject(ChatServiceService);
  userName = this.auth.currentLoggedUser?.fullName || 'Unknown';
  searchTerm = '';
  receiverId = '';
  messageContent = '';
  logout() {
    this.chat.stopConnection();
    this.auth.logout();
    this.router.navigate(['/login']);
    this.chat.stopConnection();
  }
  filteredUsers(): User[] {
    const term = this.searchTerm.toLowerCase().trim();
    return this.chat.onlineUsers().filter(user =>
      user.fullName?.toLowerCase().includes(term) ||
      user.userName?.toLowerCase().includes(term) ||
      user.email?.toLowerCase().includes(term)
    );
  }

  getUserImage(imgName: string | undefined): string {
    if (imgName == undefined) return `http://localhost:5000/notfound.png`;
    return `http://localhost:5000${imgName}`;
  }
  getImage(imgName: string | undefined): string {
    if (imgName == undefined) return `http://localhost:5000/notfound.png`;

    return `http://localhost:5000${imgName}`;
  }
  ngOnInit(): void {
    this.chat.startConnection(this.receiverId);

    ;
  }

  selectUser(userId: string) {
    this.chat.currentReceiverId = userId;
    this.chat.getMessages(userId);
    this.chat.getReceiverDetails(userId);

  }


}
