import { Component, inject } from '@angular/core';
import { ChatServiceService } from '../../services/chat-service.service';
import { TitleCasePipe } from '@angular/common';

@Component({
  selector: 'app-chat-right-sideber',
  imports: [TitleCasePipe],
  templateUrl: './chat-right-sideber.component.html',
  styles: ``
})
export class ChatRightSideberComponent {
  chat = inject(ChatServiceService)
  getImage(imgName: string | undefined): string {
    if (imgName == undefined) return `Select recipient`;

    return `http://localhost:5000${imgName}`;
  }
}
