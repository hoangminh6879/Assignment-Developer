import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NotificationService, Toast } from '../../services/notification.service';
import { ConfirmDialogService } from '../../services/confirm-dialog.service';

@Component({
  selector: 'app-ui-overlays',
  standalone: true,
  imports: [CommonModule],
  template: `
    <!-- TOAST CONTAINER -->
    <div class="toast-container">
      <div
        *ngFor="let toast of toasts"
        class="toast toast-{{ toast.type }}"
        (click)="notification.remove(toast.id)"
      >
        <div class="toast-icon">
          <span *ngIf="toast.type === 'success'">✅</span>
          <span *ngIf="toast.type === 'error'">❌</span>
          <span *ngIf="toast.type === 'warning'">⚠️</span>
          <span *ngIf="toast.type === 'info'">ℹ️</span>
        </div>
        <div class="toast-content">
          <div class="toast-title">{{ toast.title }}</div>
          <div class="toast-message">{{ toast.message }}</div>
        </div>
        <button class="toast-close" (click)="notification.remove(toast.id)">✕</button>
      </div>
    </div>

    <!-- CONFIRM DIALOG -->
    <div class="confirm-overlay" *ngIf="(confirmState$ | async)?.open" (click)="$event.stopPropagation()">
      <div class="confirm-box">
        <div class="confirm-icon" [ngClass]="(confirmState$ | async)?.options?.type || 'warning'">
          <span *ngIf="(confirmState$ | async)?.options?.type === 'danger'">🗑️</span>
          <span *ngIf="(confirmState$ | async)?.options?.type === 'info'">❓</span>
          <span *ngIf="!(confirmState$ | async)?.options?.type || (confirmState$ | async)?.options?.type === 'warning'">⚠️</span>
        </div>
        <h3 class="confirm-title">{{ (confirmState$ | async)?.options?.title || 'Xác nhận' }}</h3>
        <p class="confirm-message">{{ (confirmState$ | async)?.options?.message }}</p>
        <div class="confirm-actions">
          <button class="btn-cancel" (click)="confirm.respond(false)">
            {{ (confirmState$ | async)?.options?.cancelText || 'Hủy' }}
          </button>
          <button
            class="btn-confirm"
            [ngClass]="(confirmState$ | async)?.options?.type === 'danger' ? 'btn-danger' : 'btn-primary'"
            (click)="confirm.respond(true)"
          >
            {{ (confirmState$ | async)?.options?.confirmText || 'Xác nhận' }}
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    /* === TOAST === */
    .toast-container {
      position: fixed;
      top: 24px;
      right: 24px;
      z-index: 9999;
      display: flex;
      flex-direction: column;
      gap: 10px;
      max-width: 380px;
      pointer-events: none;
    }
    .toast {
      display: flex;
      align-items: flex-start;
      gap: 12px;
      padding: 14px 16px;
      border-radius: 14px;
      box-shadow: 0 8px 30px rgba(0,0,0,0.15);
      animation: slideInRight 0.35s ease;
      cursor: pointer;
      pointer-events: all;
      border-left: 5px solid;
      background: white;
      min-width: 300px;
      position: relative;
    }
    @keyframes slideInRight {
      from { transform: translateX(120%); opacity: 0; }
      to { transform: translateX(0); opacity: 1; }
    }
    .toast-success { border-color: #10b981; }
    .toast-error   { border-color: #ef4444; }
    .toast-warning { border-color: #f59e0b; }
    .toast-info    { border-color: #3b82f6; }
    .toast-icon { font-size: 18px; flex-shrink: 0; padding-top: 1px; }
    .toast-content { flex: 1; }
    .toast-title { font-weight: 700; font-size: 14px; color: #0f172a; margin-bottom: 2px; }
    .toast-message { font-size: 13px; color: #475569; line-height: 1.4; }
    .toast-close {
      background: none; border: none; cursor: pointer; color: #94a3b8;
      font-size: 14px; padding: 0; flex-shrink: 0;
      transition: color 0.2s;
    }
    .toast-close:hover { color: #ef4444; }

    /* === CONFIRM DIALOG === */
    .confirm-overlay {
      position: fixed;
      inset: 0;
      background: rgba(0,0,0,0.5);
      z-index: 10000;
      display: flex;
      align-items: center;
      justify-content: center;
      backdrop-filter: blur(4px);
      animation: fadeIn 0.2s ease;
    }
    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
    .confirm-box {
      background: white;
      border-radius: 20px;
      padding: 36px 40px;
      max-width: 420px;
      width: 90vw;
      text-align: center;
      box-shadow: 0 25px 60px rgba(0,0,0,0.2);
      animation: scaleIn 0.25s ease;
    }
    @keyframes scaleIn {
      from { transform: scale(0.85); opacity: 0; }
      to { transform: scale(1); opacity: 1; }
    }
    .confirm-icon { font-size: 44px; margin-bottom: 16px; }
    .confirm-title { font-size: 20px; font-weight: 700; color: #0f172a; margin: 0 0 10px; }
    .confirm-message { font-size: 15px; color: #64748b; line-height: 1.5; margin: 0 0 28px; }
    .confirm-actions { display: flex; gap: 12px; justify-content: center; }
    .btn-cancel {
      padding: 10px 24px; background: #f1f5f9; color: #475569;
      border: none; border-radius: 10px; cursor: pointer; font-weight: 600;
      font-size: 14px; transition: background 0.2s;
    }
    .btn-cancel:hover { background: #e2e8f0; }
    .btn-confirm {
      padding: 10px 24px; border: none; border-radius: 10px;
      cursor: pointer; font-weight: 600; font-size: 14px; transition: all 0.2s;
    }
    .btn-primary { background: #4f46e5; color: white; }
    .btn-primary:hover { background: #4338ca; }
    .btn-danger { background: #ef4444; color: white; }
    .btn-danger:hover { background: #dc2626; }
  `]
})
export class UiOverlaysComponent implements OnInit {
  toasts: Toast[] = [];
  confirmState$;

  constructor(
    public notification: NotificationService,
    public confirm: ConfirmDialogService
  ) {
    this.confirmState$ = this.confirm.state$;
  }

  ngOnInit() {
    this.notification.toasts$.subscribe(toasts => this.toasts = toasts);
  }
}
