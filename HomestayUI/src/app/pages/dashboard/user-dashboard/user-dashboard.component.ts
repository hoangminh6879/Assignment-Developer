import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NavbarComponent } from '../../../components/navbar/navbar.component';
import { UpgradeRequestService, UpgradeRequestDto } from '../../../services/upgrade-request.service';

@Component({
  selector: 'app-user-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, NavbarComponent],
  template: `
    <app-navbar></app-navbar>
    <div class="dashboard-page">
      <div class="dashboard-container">
        <div class="header">
          <h2>Tài Khoản Của Tôi</h2>
          <p class="subtitle">Quản lý thông tin và cài đặt cá nhân của bạn</p>
        </div>

        <div class="card glass-card">
          <div class="card-header">
            <span class="icon">🚀</span>
            <h3>Trở thành Chủ Nhà (Host)</h3>
          </div>
          <p class="card-desc">Nâng cấp tài khoản để bắt đầu đăng tin cho thuê homestay của riêng bạn và kiếm thêm thu nhập!</p>
          
          <div *ngIf="requestStatus" class="status-box" [ngClass]="requestStatus.status.toLowerCase()">
            <div class="status-title">Trạng thái yêu cầu: <span class="badge">{{ requestStatus.status }}</span></div>
            <p *ngIf="requestStatus.adminNote" class="admin-note">Ghi chú từ Admin: <em>{{ requestStatus.adminNote }}</em></p>
          </div>

          <div *ngIf="!requestStatus || requestStatus.status === 'REJECTED'" class="upgrade-form">
            <div class="form-group">
              <label>Nội dung yêu cầu (Tuỳ chọn)</label>
              <textarea [(ngModel)]="userNote" placeholder="Ví dụ: Tôi đã có kinh nghiệm quản lý homestay..."></textarea>
            </div>
            <div class="form-group">
              <label>Minh chứng (Ảnh CCCD / Giấy phép kinh doanh)</label>
              <input type="file" (change)="onFileSelected($event)" accept="image/*,.pdf" />
              <small>Vui lòng đính kèm một tệp để admin xác thực dễ dàng hơn.</small>
            </div>
            
            <button (click)="requestUpgrade()" class="btn-primary" [disabled]="isLoading">
              {{ isLoading ? 'Đang gửi...' : 'Gửi Yêu Cầu Nâng Cấp' }}
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .dashboard-page { min-height: 100vh; background: #f0f4f8; padding-top: 40px; font-family: 'Inter', sans-serif; }
    .dashboard-container { max-width: 800px; margin: 0 auto; padding: 0 20px; }
    .header { margin-bottom: 30px; }
    .header h2 { font-size: 28px; color: #1a202c; margin-bottom: 8px; font-weight: 700; }
    .subtitle { color: #718096; font-size: 16px; }
    
    .glass-card {
      background: white; border-radius: 16px; padding: 30px;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05); border: 1px solid #e2e8f0;
    }
    .card-header { display: flex; align-items: center; margin-bottom: 15px; }
    .icon { font-size: 24px; margin-right: 12px; }
    .card-header h3 { font-size: 20px; color: #2d3748; margin: 0; font-weight: 600; }
    .card-desc { color: #4a5568; margin-bottom: 25px; line-height: 1.6; }
    
    .status-box { margin: 20px 0; padding: 16px 20px; border-radius: 12px; border-left: 4px solid transparent; }
    .status-title { font-weight: 600; display: flex; align-items: center; gap: 10px; }
    .badge { padding: 4px 12px; border-radius: 999px; font-size: 12px; font-weight: 700; }
    .pending { background: #fffbeb; border-left-color: #f59e0b; color: #92400e; }
    .approved { background: #f0fdf4; border-left-color: #22c55e; color: #166534; }
    .rejected { background: #fef2f2; border-left-color: #ef4444; color: #991b1b; }
    .admin-note { margin-top: 10px; font-size: 14px; opacity: 0.9; }

    .upgrade-form { margin-top: 25px; padding-top: 25px; border-top: 1px dashed #e2e8f0; }
    .form-group { margin-bottom: 20px; }
    .form-group label { display: block; font-weight: 600; color: #4a5568; margin-bottom: 8px; font-size: 14px; }
    .form-group textarea { width: 100%; padding: 12px; border: 1px solid #cbd5e0; border-radius: 8px; min-height: 100px; resize: vertical; font-family: inherit; }
    .form-group input[type="file"] { display: block; width: 100%; padding: 10px; border: 1px dashed #cbd5e0; border-radius: 8px; background: #f8fafc; cursor: pointer; }
    .form-group small { display: block; color: #a0aec0; margin-top: 5px; font-size: 12px; }
    
    .btn-primary { 
      padding: 12px 24px; background: linear-gradient(135deg, #4f46e5 0%, #3b82f6 100%); 
      color: white; border: none; border-radius: 8px; cursor: pointer; font-weight: 600;
    }
    .btn-primary:disabled { opacity: 0.6; cursor: not-allowed; }
  `]
})
export class UserDashboardComponent implements OnInit {
  requestStatus: UpgradeRequestDto | null = null;
  isLoading = false;
  
  userNote = '';
  selectedFile: File | null = null;

  constructor(private upgradeReqService: UpgradeRequestService) {}

  ngOnInit() {
    this.checkStatus();
  }

  checkStatus() {
    this.upgradeReqService.getMyRequestStatus().subscribe({
      next: (res) => { this.requestStatus = res; },
      error: () => { console.log('No pending request found'); }
    });
  }

  onFileSelected(event: any) {
    if (event.target.files && event.target.files.length > 0) {
      this.selectedFile = event.target.files[0];
    }
  }

  requestUpgrade() {
    this.isLoading = true;
    this.upgradeReqService.createUpgradeRequest(this.userNote, this.selectedFile).subscribe({
      next: (res) => {
        alert('Yêu cầu đã được gửi thành công!');
        this.requestStatus = res;
        this.isLoading = false;
        this.userNote = '';
        this.selectedFile = null;
      },
      error: (err) => {
        alert(err.error?.message || err.message || 'Có lỗi xảy ra khi gửi yêu cầu');
        this.isLoading = false;
      }
    });
  }
}
