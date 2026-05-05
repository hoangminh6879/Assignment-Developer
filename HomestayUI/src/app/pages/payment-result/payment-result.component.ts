import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { NavbarComponent } from '../../components/navbar/navbar.component';

@Component({
  selector: 'app-payment-result',
  standalone: true,
  imports: [CommonModule, NavbarComponent],
  template: `
    <app-navbar></app-navbar>
    <div class="result-page">
      <div class="result-card animate-scale-in" [ngClass]="status === 'success' ? 'success' : 'error'">
        <div class="icon">
          <i *ngIf="status === 'success'" class="fas fa-check-circle">✅</i>
          <i *ngIf="status !== 'success'" class="fas fa-times-circle">❌</i>
        </div>
        <h1>{{ status === 'success' ? 'Thanh toán thành công!' : 'Thanh toán thất bại' }}</h1>
        <p *ngIf="status === 'success'">
          Cảm ơn bạn đã đặt phòng. Giao dịch của bạn đã được xử lý thành công.
          Homestay sẽ sớm liên hệ với bạn để xác nhận.
        </p>
        <p *ngIf="status !== 'success'">
          Rất tiếc, giao dịch của bạn không thể hoàn tất hoặc đã bị hủy.
          Vui lòng thử lại hoặc chọn phương thức thanh toán khác.
        </p>
        
        <div class="actions">
          <button class="btn btn-primary" (click)="goToDashboard()">
            Về trang quản lý
          </button>
          <button class="btn btn-outline" (click)="goToHome()">
            Về trang chủ
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .result-page {
      min-height: 100vh;
      background: #f1f5f9;
      display: flex;
      align-items: center;
      justify-content: center;
      padding-top: 80px;
    }
    .result-card {
      background: white;
      padding: 50px 40px;
      border-radius: 24px;
      box-shadow: 0 10px 25px -5px rgba(0,0,0,0.1);
      text-align: center;
      max-width: 500px;
      width: 90%;
    }
    .icon {
      font-size: 80px;
      margin-bottom: 20px;
    }
    .success .icon {
      color: #10b981;
    }
    .error .icon {
      color: #ef4444;
    }
    h1 {
      margin: 0 0 15px;
      color: #1e293b;
      font-size: 28px;
    }
    p {
      color: #64748b;
      margin-bottom: 30px;
      line-height: 1.6;
    }
    .actions {
      display: flex;
      gap: 15px;
      justify-content: center;
    }
    .btn {
      padding: 12px 24px;
      border-radius: 12px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s;
      border: none;
    }
    .btn-primary {
      background: #4f46e5;
      color: white;
    }
    .btn-primary:hover {
      background: #4338ca;
      transform: translateY(-2px);
    }
    .btn-outline {
      background: white;
      color: #4f46e5;
      border: 2px solid #e0e7ff;
    }
    .btn-outline:hover {
      background: #eef2ff;
      border-color: #c7d2fe;
    }
    .animate-scale-in {
      animation: scaleIn 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
    }
    @keyframes scaleIn {
      from { opacity: 0; transform: scale(0.8); }
      to { opacity: 1; transform: scale(1); }
    }
  `]
})
export class PaymentResultComponent implements OnInit {
  status: string = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      this.status = params['status'] || 'error';
    });
  }

  goToDashboard() {
    this.router.navigate(['/dashboard/user']);
  }

  goToHome() {
    this.router.navigate(['/']);
  }
}
