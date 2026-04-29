import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface Toast {
  id: number;
  type: ToastType;
  title: string;
  message: string;
}

@Injectable({ providedIn: 'root' })
export class NotificationService {
  private counter = 0;
  private toastsSubject = new BehaviorSubject<Toast[]>([]);
  toasts$ = this.toastsSubject.asObservable();

  private add(type: ToastType, title: string, message: string, duration = 4000) {
    const id = ++this.counter;
    const toast: Toast = { id, type, title, message };
    this.toastsSubject.next([...this.toastsSubject.value, toast]);
    setTimeout(() => this.remove(id), duration);
  }

  success(message: string, title = 'Thành công') { this.add('success', title, message); }
  error(message: string, title = 'Lỗi') { this.add('error', title, message, 6000); }
  warning(message: string, title = 'Cảnh báo') { this.add('warning', title, message); }
  info(message: string, title = 'Thông báo') { this.add('info', title, message); }

  remove(id: number) {
    this.toastsSubject.next(this.toastsSubject.value.filter(t => t.id !== id));
  }
}
