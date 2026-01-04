import { Component, inject, OnInit, AfterViewInit, ViewChildren, QueryList, ElementRef } from '@angular/core';
import { MatIcon, MatIconModule } from '@angular/material/icon';
import { MatMenu, MatMenuModule } from '@angular/material/menu';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';
import { NgClass, NgFor, NgIf, TitleCasePipe } from '@angular/common';
import { ChatServiceService } from '../../services/chat-service.service';
import { FormsModule } from '@angular/forms';
import { TypingIndicatorComponent } from '../typing-indicator/typing-indicator.component';
import { User } from '../../Models/User';
import gsap from 'gsap';

@Component({
  selector: 'app-chat-sidebar',
  standalone: true,
  imports: [MatIconModule, MatMenuModule, FormsModule, NgFor, NgClass, TypingIndicatorComponent, NgIf],
  templateUrl: './chat-sidebar.component.html',
  styles: [`
    /* Scrollbar styling for the sidebar */
    .custom-scroll::-webkit-scrollbar { width: 4px; }
    .custom-scroll::-webkit-scrollbar-track { background: transparent; }
    .custom-scroll::-webkit-scrollbar-thumb { background-color: rgba(255,255,255,0.1); border-radius: 10px; }

    .glass-input {
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid rgba(255, 255, 255, 0.1);
      backdrop-filter: blur(4px);
    }
  `]
})
export class ChatSidebarComponent implements OnInit, AfterViewInit {
  auth = inject(AuthService);
  router = inject(Router);
  chat = inject(ChatServiceService);

  userName = this.auth.currentLoggedUser?.fullName || 'Unknown';
  searchTerm = '';
  // نستخدم service للوصول للـ ID المختار لضمان التزامن
  get receiverId() { return this.chat.currentReceiverId; }

  @ViewChildren('userItem') userItems!: QueryList<ElementRef>;

  ngOnInit(): void {
    // عادة الـ connection يبدأ بالتوكن، الـ receiverId هنا قد لا يكون ضرورياً في البداية
    this.chat.startConnection(this.chat.currentReceiverId);
  }

  ngAfterViewInit() {
    // أنيميشن مبدئي للقائمة عند التحميل
    // ملاحظة: بما أن القائمة تعتمد على filteredUsers وتتغير،
    // يفضل استدعاء هذا الأنيميشن كلما تغيرت القائمة (يمكن إضافته لاحقاً)
    setTimeout(() => {
      gsap.from('.user-card-anim', {
        duration: 0.6,
        y: 20,
        opacity: 0,
        stagger: 0.1, // تأخير بين كل عنصر وآخر
        ease: 'power2.out'
      });
    }, 500); // تأخير بسيط لضمان تحميل البيانات
  }

  logout() {
    this.chat.stopConnection();
    this.auth.logout();
    this.router.navigate(['/login']);
  }

  filteredUsers(): User[] {
    const term = this.searchTerm.toLowerCase().trim();
    // ترتيب المستخدمين: الأونلاين أولاً، ثم حسب وجود رسائل غير مقروءة
    return this.chat.onlineUsers().filter(user =>
      user.fullName?.toLowerCase().includes(term) ||
      user.userName?.toLowerCase().includes(term) ||
      user.email?.toLowerCase().includes(term)
    ).sort((a, b) => (b.isOnline ? 1 : 0) - (a.isOnline ? 1 : 0));
  }

  getUserImage(imgName: string | undefined): string {
    return imgName ? `http://localhost:5000${imgName}` : `http://localhost:5000/notfound.png`;
  }

  getImage(imgName: string | undefined): string {
    return imgName ? `http://localhost:5000${imgName}` : `http://localhost:5000/notfound.png`;
  }

  selectUser(userId: string) {
    this.chat.currentReceiverId = userId;
    this.chat.getMessages(userId);
    this.chat.getReceiverDetails(userId);
  }
}
