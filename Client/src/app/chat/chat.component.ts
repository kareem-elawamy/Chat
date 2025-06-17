import { Component } from '@angular/core';
import { ChatSidebarComponent } from "../components/chat-sidebar/chat-sidebar.component";
import { ChatWindowComponent } from "../components/chat-window/chat-window.component";
import { ChatRightSideberComponent } from "../components/chat-right-sideber/chat-right-sideber.component";

@Component({
  selector: 'app-chat',
  imports: [ChatSidebarComponent, ChatWindowComponent, ChatRightSideberComponent],
  templateUrl: './chat.component.html',
  styleUrl: './chat.component.css'
})
export class ChatComponent {

}
