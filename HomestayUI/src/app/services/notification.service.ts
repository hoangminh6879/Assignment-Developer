import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, timer, switchMap, map } from 'rxjs';

export interface NotificationDto {
  id: string;
  message: string;
  type: string;
  isRead: boolean;
  createdAt: string;
  targetId: string;
}

export interface Toast {
  id: number;
  title: string;
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
}

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private apiUrl = 'http://localhost:9999/api/notifications';
  
  private unreadCountSubject = new BehaviorSubject<number>(0);
  unreadCount$ = this.unreadCountSubject.asObservable();

  private notificationsSubject = new BehaviorSubject<NotificationDto[]>([]);
  notifications$ = this.notificationsSubject.asObservable();

  // Toast System
  private toasts: Toast[] = [];
  private toastsSubject = new BehaviorSubject<Toast[]>([]);
  toasts$ = this.toastsSubject.asObservable();
  private nextId = 0;

  constructor(private http: HttpClient) {
    // Poll for notifications every 30 seconds
    timer(0, 30000).pipe(
      switchMap(() => this.getUnreadCount())
    ).subscribe(count => this.unreadCountSubject.next(count));
  }

  // --- System Notifications (Backend) ---
  getNotifications(): Observable<NotificationDto[]> {
    return this.http.get<NotificationDto[]>(this.apiUrl);
  }

  getUnreadCount(): Observable<number> {
    return this.http.get<number>(`${this.apiUrl}/unread-count`);
  }

  markAsRead(id: string): Observable<void> {
    return this.http.patch<void>(`${this.apiUrl}/${id}/read`, {});
  }

  hasUnreadOfType(type: string): Observable<boolean> {
    return this.notifications$.pipe(
      map(list => list.some(n => !n.isRead && n.type === type))
    );
  }

  markTypeAsRead(type: string) {
    const unreadOfType = this.notificationsSubject.value.filter(n => !n.isRead && n.type === type);
    unreadOfType.forEach(n => {
      this.markAsRead(n.id).subscribe();
    });
    // Optimistic update
    const newList = this.notificationsSubject.value.map(n => n.type === type ? { ...n, isRead: true } : n);
    this.notificationsSubject.next(newList);
    this.unreadCountSubject.next(newList.filter(n => !n.isRead).length);
  }

  markAllAsRead(): Observable<void> {
    return this.http.patch<void>(`${this.apiUrl}/read-all`, {});
  }

  refresh() {
    this.getUnreadCount().subscribe(count => this.unreadCountSubject.next(count));
    this.getNotifications().subscribe(list => this.notificationsSubject.next(list));
  }

  // --- Toast Logic ---
  success(message: string) {
    this.show('Thành công', message, 'success');
  }

  error(message: string) {
    this.show('Lỗi', message, 'error');
  }

  warning(message: string) {
    this.show('Cảnh báo', message, 'warning');
  }

  info(message: string) {
    this.show('Thông báo', message, 'info');
  }

  private show(title: string, message: string, type: 'success' | 'error' | 'warning' | 'info') {
    const toast: Toast = { id: this.nextId++, title, message, type };
    this.toasts.push(toast);
    this.toastsSubject.next([...this.toasts]);

    setTimeout(() => {
      this.remove(toast.id);
    }, 5000);
  }

  remove(id: number) {
    this.toasts = this.toasts.filter(t => t.id !== id);
    this.toastsSubject.next([...this.toasts]);
  }
}
