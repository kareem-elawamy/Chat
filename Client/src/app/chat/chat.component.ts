import { Component, inject } from '@angular/core';
import { ChatSidebarComponent } from "../components/chat-sidebar/chat-sidebar.component";
import { ChatWindowComponent } from "../components/chat-window/chat-window.component";
import { NgClass, NgIf } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { ChatServiceService } from '../services/chat-service.service';

@Component({
  selector: 'app-chat',
  imports: [RouterOutlet, ChatSidebarComponent, ChatWindowComponent, NgClass, NgIf], templateUrl: './chat.component.html',
  styleUrl: './chat.component.css'
})
export class ChatComponent {
  chatService = inject(ChatServiceService);
}
