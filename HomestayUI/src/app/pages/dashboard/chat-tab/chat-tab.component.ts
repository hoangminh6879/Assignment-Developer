import { Component, OnInit, OnDestroy, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ChatService, ChatMessage, ChatUser } from '../../../services/chat.service';
import { AuthService } from '../../../services/auth.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-chat-tab',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './chat-tab.component.html',
  styleUrl: './chat-tab.component.css'
})
export class ChatTabComponent implements OnInit, OnDestroy {
  @Input() initialUser: any = null;
  
  contacts: ChatUser[] = [];
  selectedUser: ChatUser | null = null;
  messages: ChatMessage[] = [];
  newMessage: string = '';
  currentUser: any;
  isLoading = false;
  
  private messageSub?: Subscription;

  constructor(
    private chatService: ChatService,
    public authService: AuthService
  ) {
    this.currentUser = this.authService.getCurrentUser();
  }

  ngOnInit(): void {
    this.loadContacts();
    
    this.messageSub = this.chatService.messages$.subscribe((msg: ChatMessage) => {
      if (this.selectedUser && (msg.senderId === this.selectedUser.id || msg.recipientId === this.selectedUser.id)) {
        this.messages.push(msg);
        this.scrollToBottom();
      }
      // If not selected, maybe show notification or update unread count in contacts
      this.updateContactLastMessage(msg);
    });

    if (this.initialUser) {
      this.selectUser({
        id: this.initialUser.id,
        username: this.initialUser.username,
        firstName: this.initialUser.username // Fallback
      });
    }
  }

  ngOnDestroy(): void {
    this.messageSub?.unsubscribe();
  }

  loadContacts(): void {
    this.chatService.getContacts().subscribe((res: ChatUser[]) => {
      this.contacts = res;
      // For hosts, ensure Admin is in contacts
      if (this.authService.hasRole('HOST')) {
        this.ensureAdminInContacts();
      }
    });
  }

  ensureAdminInContacts(): void {
    this.chatService.getAdminUser().subscribe((admin: ChatUser) => {
      if (admin && !this.contacts.find(c => c.id === admin.id)) {
        this.contacts.unshift(admin);
      }
    });
  }

  selectUser(user: ChatUser): void {
    this.selectedUser = user;
    this.loadHistory();
  }

  loadHistory(): void {
    if (!this.selectedUser) return;
    this.isLoading = true;
    this.chatService.getHistory(this.selectedUser.id).subscribe({
      next: (res: ChatMessage[]) => {
        this.messages = res;
        this.isLoading = false;
        this.scrollToBottom();
      },
      error: () => this.isLoading = false
    });
  }

  sendMessage(): void {
    if (!this.newMessage.trim() || !this.selectedUser) return;
    
    this.chatService.sendMessage(this.selectedUser.id, this.newMessage);
    
    // Add to local list immediately (optimistic UI)
    const localMsg: ChatMessage = {
      senderId: this.currentUser.id,
      senderName: this.currentUser.username,
      recipientId: this.selectedUser.id,
      recipientName: this.selectedUser.username,
      content: this.newMessage,
      timestamp: new Date().toISOString()
    };
    this.messages.push(localMsg);
    
    this.newMessage = '';
    this.scrollToBottom();
  }

  private updateContactLastMessage(msg: ChatMessage): void {
    // Logic to move contact to top or update unread badge
  }

  private scrollToBottom(): void {
    setTimeout(() => {
      const chatBody = document.querySelector('.chat-messages');
      if (chatBody) {
        chatBody.scrollTop = chatBody.scrollHeight;
      }
    }, 100);
  }

  formatTime(dateStr?: string): string {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  chatWithAdmin(): void {
    this.chatService.getAdminUser().subscribe((admin: ChatUser) => {
      if (admin) {
        this.selectUser(admin);
      }
    });
  }
}
