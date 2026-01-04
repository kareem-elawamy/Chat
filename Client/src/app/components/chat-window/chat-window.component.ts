import { Component, inject, OnInit, AfterViewChecked, ElementRef, ViewChild, AfterViewInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ChatServiceService } from '../../services/chat-service.service';
import { AuthService } from '../../services/auth.service';
import { DatePipe, NgClass, NgFor, NgIf } from '@angular/common';
import { MatIcon } from '@angular/material/icon';
import { VideoService } from '../../services/video.service';
import { MatDialog } from '@angular/material/dialog';
import { VideoComponent } from '../video/video.component';
import gsap from 'gsap';

@Component({
  selector: 'app-chat-window',
  standalone: true,
  imports: [MatIcon, FormsModule, NgClass, NgFor, DatePipe, NgIf],
  templateUrl: './chat-window.component.html',
  styles: [`
    .glass-effect {
      background: rgba(17, 25, 40, 0.75);
      backdrop-filter: blur(16px) saturate(180%);
      border: 1px solid rgba(255, 255, 255, 0.125);
    }
    .gradient-text {
      background: linear-gradient(to right, #4facfe 0%, #00f2fe 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }
    /* أخفينا السكرول بار ليظهر التصميم أنظف */
    .no-scrollbar::-webkit-scrollbar { display: none; }
    .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
  `]
})
export class ChatWindowComponent implements OnInit, AfterViewInit, AfterViewChecked {

  dialig = inject(MatDialog);
  signalR = inject(VideoService);
  chat = inject(ChatServiceService);
  auth = inject(AuthService);

  messageContent: string = '';
  @ViewChild('scrollContainer') private scrollContainer!: ElementRef;
  @ViewChild('bgBlob1') private bgBlob1!: ElementRef;
  @ViewChild('bgBlob2') private bgBlob2!: ElementRef;

  ngOnInit(): void { }

  ngAfterViewInit(): void {
    // 1. تشغيل أنيميشن الخلفية (Floating Blobs)
    this.initBackgroundAnimation();

    // 2. أنيميشن ظهور الشات ككل
    gsap.from('.chat-container', { duration: 1, y: 50, opacity: 0, ease: 'power4.out' });
  }

  ngAfterViewChecked(): void {
    this.scrollToBottom();
  }

  initBackgroundAnimation() {
    // كرات ملونة تتحرك في الخلفية لتعطي حياة للصفحة
    if (this.bgBlob1 && this.bgBlob2) {
      gsap.to(this.bgBlob1.nativeElement, {
        x: 200, y: -100, duration: 8, repeat: -1, yoyo: true, ease: 'sine.inOut'
      });
      gsap.to(this.bgBlob2.nativeElement, {
        x: -150, y: 100, duration: 10, repeat: -1, yoyo: true, ease: 'sine.inOut'
      });
    }
  }

  scrollToBottom(): void {
    try {
      this.scrollContainer.nativeElement.scrollTop = this.scrollContainer.nativeElement.scrollHeight;
    } catch (err) { }
  }

  getImage(imgName: string | undefined): string {
    return imgName ? `http://localhost:5000${imgName}` : `http://localhost:5000/notfound.png`;
  }

  sendMessage() {
    if (this.messageContent.trim()) {
      this.chat.sendMessage(this.messageContent);

      // أنيميشن عند الإرسال (الزر ينبض + الرسالة الجديدة تدخل)
      gsap.fromTo('.send-icon', { rotation: -45, scale: 0.8 }, { rotation: 0, scale: 1, duration: 0.3, ease: 'back.out(2)' });

      this.messageContent = '';
      this.getmessages();
    }
  }

  getmessages() {
    this.chat.getMessages(this.chat.currentReceiverId);

    // خدعة: ننتظر قليلاً حتى يحمل الـ DOM ثم نحرك الرسائل الجديدة
    setTimeout(() => {
      // يحرك آخر رسالة فقط لتبدو وكأنها قفزت للشات
      const messages = document.querySelectorAll('.msg-row');
      if (messages.length > 0) {
        gsap.from(messages[messages.length - 1], {
          y: 20, opacity: 0, duration: 0.4, ease: 'back.out(1.2)'
        });
      }
    }, 100);
  }

  display(id: string) {
    // ... logic as before
    this.signalR.remoteUser = id;
    this.dialig.open(VideoComponent, { width: '800px', height: '600px' });
  }
}
