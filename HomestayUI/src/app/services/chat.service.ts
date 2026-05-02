import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, Subject } from 'rxjs';
import { AuthService } from './auth.service';
import { Client, IMessage, Stomp } from '@stomp/stompjs';
import SockJS from 'sockjs-client';

export interface ChatMessage {
  id?: string;
  senderId: string;
  senderName: string;
  recipientId: string;
  recipientName: string;
  content: string;
  timestamp?: string;
  isRead?: boolean;
}

export interface ChatUser {
  id: string;
  username: string;
  firstName?: string;
  lastName?: string;
  avatarUrl?: string;
}

@Injectable({
  providedIn: 'root'
})
export class ChatService {
  private apiUrl = 'http://localhost:9999/api/chat';
  private stompClient: any;
  private messageSubject = new Subject<ChatMessage>();
  public messages$ = this.messageSubject.asObservable();

  constructor(private http: HttpClient, private authService: AuthService) {
    setTimeout(() => this.connect(), 1000); // Wait for auth to be ready
  }

  private connect() {
    const user = this.authService.getCurrentUser();
    if (!user) return;

    const socket = new SockJS('http://localhost:9999/ws');
    this.stompClient = Stomp.over(socket);

    this.stompClient.connect({}, (frame: any) => {
      console.log('Connected to WebSocket: ' + frame);
      
      // Subscribe to private queue (now using topic mapping to bypass missing STOMP auth Principal)
      this.stompClient.subscribe(`/topic/messages/${user.id}`, (message: IMessage) => {
        if (message.body) {
          this.messageSubject.next(JSON.parse(message.body));
        }
      });
    }, (error: any) => {
      console.error('STOMP error', error);
      // Reconnect after 5 seconds
      setTimeout(() => this.connect(), 5000);
    });
  }

  sendMessage(recipientId: string, content: string) {
    const user = this.authService.getCurrentUser();
    if (!user) return;

    const chatMsg: ChatMessage = {
      senderId: user.id,
      senderName: user.username,
      recipientId: recipientId,
      recipientName: '', // Backend will fill
      content: content
    };

    this.http.post<ChatMessage>(`${this.apiUrl}/send`, chatMsg).subscribe({
      next: (savedMsg) => {
        console.log('Message sent successfully via REST');
      },
      error: (err) => {
        console.error('Failed to send message via REST', err);
        alert('Lỗi gửi tin nhắn: ' + (err.error?.message || err.message || 'Lỗi hệ thống'));
      }
    });
  }

  getHistory(otherUserId: string): Observable<ChatMessage[]> {
    return this.http.get<ChatMessage[]>(`${this.apiUrl}/history/${otherUserId}`);
  }

  getContacts(): Observable<ChatUser[]> {
    return this.http.get<ChatUser[]>(`${this.apiUrl}/contacts`);
  }

  searchUsers(query: string): Observable<ChatUser[]> {
    return this.http.get<ChatUser[]>(`${this.apiUrl}/search?query=${query}`);
  }

  getAdminUser(): Observable<ChatUser> {
    return this.http.get<ChatUser>(`${this.apiUrl}/admin-user`);
  }
}
