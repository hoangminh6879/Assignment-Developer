import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NavbarComponent } from '../../../components/navbar/navbar.component';
import { UpgradeRequestService, UpgradeRequestDto } from '../../../services/upgrade-request.service';
import { NotificationService } from '../../../services/notification.service';
import { ProfileTabComponent } from '../../../components/profile-tab/profile-tab.component';
import { BookingHistoryTabComponent } from '../../../components/booking-history-tab/booking-history-tab.component';
import { ChatTabComponent } from '../chat-tab/chat-tab.component';
import { WalletTabComponent } from '../../../components/wallet-tab/wallet-tab.component';

@Component({
  selector: 'app-user-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, NavbarComponent, ProfileTabComponent, BookingHistoryTabComponent, ChatTabComponent, WalletTabComponent],
  template: `
    <app-navbar></app-navbar>
    <div class="dashboard-page">
      <div class="dashboard-layout">
        
        <!-- SIDEBAR -->
        <aside class="sidebar">
          <div class="sidebar-header">
            <h2>Cá Nhân</h2>
            <p class="subtitle">Trung tâm tài khoản</p>
          </div>
          <ul class="sidebar-menu">
            <li [class.active]="activeTab === 'profile'" (click)="activeTab = 'profile'">
              <span class="menu-icon"><i class="fa-solid fa-user-shield"></i></span> Hồ sơ của tôi
            </li>
            <li [class.active]="activeTab === 'bookings'" (click)="activeTab = 'bookings'; notificationService.markTypeAsRead('BOOKING')">
              <span class="menu-icon"><i class="fa-solid fa-calendar-check"></i></span> Lịch sử đặt phòng
              <span class="nav-dot" *ngIf="notificationService.hasUnreadOfType('BOOKING') | async"></span>
            </li>
            <li [class.active]="activeTab === 'wallet'" (click)="activeTab = 'wallet'">
              <span class="menu-icon"><i class="fa-solid fa-wallet"></i></span> Ví của tôi
            </li>
            <li [class.active]="activeTab === 'chat'" (click)="activeTab = 'chat'; notificationService.markTypeAsRead('CHAT')">
              <span class="menu-icon"><i class="fa-solid fa-comments"></i></span> Tin nhắn
              <span class="nav-dot" *ngIf="notificationService.hasUnreadOfType('CHAT') | async"></span>
            </li>
            <li [class.active]="activeTab === 'upgrades'" (click)="activeTab = 'upgrades'">
              <span class="menu-icon"><i class="fa-solid fa-rocket"></i></span> Trở thành Host
            </li>
          </ul>
        </aside>

        <!-- MAIN CONTENT -->
        <main class="main-content">
        
        <!-- PROFILE TAB -->
        <div class="card glass-card" *ngIf="activeTab === 'profile'">
          <app-profile-tab></app-profile-tab>
        </div>

        <!-- BOOKINGS TAB -->
        <div class="card glass-card" *ngIf="activeTab === 'bookings'">
          <div class="card-header">
            <h3><i class="fa-solid fa-clock-rotate-left"></i> Lịch sử đặt phòng của bạn</h3>
          </div>
          <app-booking-history-tab role="USER" (chatRequested)="onChatRequested($event)"></app-booking-history-tab>
        </div>

        <!-- WALLET TAB -->
        <div class="card glass-card" *ngIf="activeTab === 'wallet'">
          <app-wallet-tab></app-wallet-tab>
        </div>

        <!-- UPGRADES TAB -->
        <div class="card glass-card" *ngIf="activeTab === 'upgrades'">
          <div class="card-header">
            <h3><i class="fa-solid fa-house-medical"></i> Trở thành Đối tác Chủ nhà</h3>
          </div>
          <p class="card-desc">Nâng cấp tài khoản để bắt đầu đăng tin cho thuê homestay của riêng bạn và kiếm thêm thu nhập từ không gian trống!</p>
          
          <div *ngIf="requestStatus" class="status-box-premium" [ngClass]="requestStatus.status.toLowerCase()">
            <div class="status-icon-wrap">
              <i class="fa-solid" [ngClass]="{
                'fa-hourglass-half': requestStatus.status === 'PENDING',
                'fa-circle-check': requestStatus.status === 'APPROVED',
                'fa-circle-xmark': requestStatus.status === 'REJECTED'
              }"></i>
            </div>
            <div class="status-text">
               <p class="status-label">Trạng thái yêu cầu:</p>
               <span class="badge-premium">{{ requestStatus.status }}</span>
               <p *ngIf="requestStatus.adminNote" class="admin-note-premium">
                 <strong>Phản hồi từ Admin:</strong> {{ requestStatus.adminNote }}
               </p>
            </div>
          </div>

          <div *ngIf="!requestStatus || requestStatus.status === 'REJECTED'" class="upgrade-form-premium">
            <div class="form-group-premium">
              <label><i class="fa-solid fa-pen-nib"></i> Nội dung yêu cầu (Tuỳ chọn)</label>
              <textarea [(ngModel)]="userNote" class="premium-textarea" placeholder="Ví dụ: Tôi đã có kinh nghiệm quản lý homestay, tôi muốn đăng ký kinh doanh tại TP.HCM..."></textarea>
            </div>
            <div class="form-group-premium">
              <label><i class="fa-solid fa-cloud-arrow-up"></i> Minh chứng (Ảnh CCCD / Giấy phép kinh doanh)</label>
              <div class="file-drop-area-premium">
                <input type="file" (change)="onFileSelected($event)" accept="image/*,.pdf" id="proofFile" class="hidden-input" />
                <label for="proofFile" class="file-label-premium">
                  <i class="fa-solid fa-image"></i>
                  <span>{{ selectedFile ? selectedFile.name : 'Nhấn để chọn ảnh hoặc kéo thả vào đây' }}</span>
                </label>
              </div>
              <small class="help-text">Vui lòng đính kèm một tệp ảnh để admin xác thực dễ dàng hơn.</small>
            </div>
            
            <button (click)="requestUpgrade()" class="btn-upgrade-premium" [disabled]="isLoading">
               <span *ngIf="!isLoading"><i class="fa-solid fa-paper-plane"></i> Gửi Yêu Cầu Nâng Cấp</span>
               <span *ngIf="isLoading"><i class="fa-solid fa-spinner fa-spin"></i> Đang xử lý...</span>
            </button>
          </div>
        </div>

        <!-- CHAT TAB -->
        <div class="card glass-card no-padding" *ngIf="activeTab === 'chat'">
          <app-chat-tab [initialUser]="chatRecipientUser"></app-chat-tab>
        </div>
        </main>
      </div>
    </div>
  `,
  styles: [`
    .dashboard-page { min-height: 100vh; background: #f8fafc; padding-top: 80px; font-family: 'Inter', sans-serif; display: flex; flex-direction: column; }
    .dashboard-layout { display: flex; flex: 1; max-width: 1400px; margin: 0 auto; width: 100%; padding: 30px 20px; gap: 30px; }
    
    .sidebar { width: 280px; background: white; border-radius: 24px; padding: 30px 20px; box-shadow: 0 10px 25px rgba(0, 0, 0, 0.03); border: 1px solid #e2e8f0; height: fit-content; flex-shrink: 0; position: sticky; top: 110px; max-height: calc(100vh - 140px); overflow-y: auto; scrollbar-width: none; }
    .sidebar::-webkit-scrollbar { display: none; }
    .sidebar-header { margin-bottom: 35px; border-bottom: 1px solid #f1f5f9; padding-bottom: 20px; text-align: center;}
    .sidebar-header h2 { font-size: 24px; color: #0f172a; margin: 0 0 5px 0; font-weight: 800; letter-spacing: -0.5px; }
    .subtitle { color: #64748b; font-size: 14px; margin: 0; font-weight: 500; }
    
    .sidebar-menu { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 6px; }
    .sidebar-menu li { padding: 14px 18px; border-radius: 14px; color: #64748b; font-weight: 600; cursor: pointer; transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); display: flex; align-items: center; gap: 14px; font-size: 15px; position: relative; }
    .sidebar-menu li:hover { background: #f8fafc; color: #0f172a; transform: translateX(5px); }
    .sidebar-menu li.active { background: #0f172a; color: white; box-shadow: 0 10px 20px rgba(15, 23, 42, 0.2); }
    .menu-icon { font-size: 18px; color: #94a3b8; width: 24px; text-align: center; transition: color 0.3s; }
    .sidebar-menu li.active .menu-icon { color: white; }
    .nav-dot { position: absolute; top: 12px; right: 12px; width: 8px; height: 8px; background: #ef4444; border-radius: 50%; box-shadow: 0 0 0 2px white; }

    .main-content { flex: 1; min-width: 0; }
    
    .glass-card { background: white; border-radius: 24px; padding: 35px; box-shadow: 0 15px 35px rgba(0, 0, 0, 0.03); border: 1px solid #e2e8f0; margin-bottom: 30px; }
    .no-padding { padding: 0; overflow: hidden; }
    
    .card-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 25px; border-bottom: 1px solid #f1f5f9; padding-bottom: 20px; }
    .card-header h3 { font-size: 20px; color: #0f172a; margin: 0; font-weight: 800; display: flex; align-items: center; gap: 12px; }
    .card-header h3 i { color: #0f172a; }
    .card-desc { color: #64748b; margin-bottom: 30px; line-height: 1.8; font-size: 15px; font-weight: 500; }
    
    /* STATUS BOX PREMIUM */
    .status-box-premium { display: flex; align-items: center; gap: 20px; padding: 25px; border-radius: 20px; margin-bottom: 35px; border: 1px solid transparent; }
    .status-box-premium.pending { background: #fffbeb; border-color: #fef3c7; color: #92400e; }
    .status-box-premium.approved { background: #ecfdf5; border-color: #d1fae5; color: #065f46; }
    .status-box-premium.rejected { background: #fef2f2; border-color: #fee2e2; color: #991b1b; }
    
    .status-icon-wrap { width: 50px; height: 50px; border-radius: 15px; display: flex; align-items: center; justify-content: center; font-size: 24px; background: white; box-shadow: 0 4px 10px rgba(0,0,0,0.05); }
    .status-label { font-size: 13px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; margin: 0 0 5px 0; opacity: 0.8; }
    .badge-premium { padding: 6px 14px; border-radius: 10px; font-size: 14px; font-weight: 800; background: white; box-shadow: 0 2px 5px rgba(0,0,0,0.05); }
    .admin-note-premium { margin-top: 15px; font-size: 14px; background: rgba(255,255,255,0.5); padding: 12px 18px; border-radius: 12px; line-height: 1.5; }

    /* UPGRADE FORM PREMIUM */
    .upgrade-form-premium { background: #f8fafc; padding: 35px; border-radius: 24px; border: 1px solid #f1f5f9; }
    .form-group-premium { margin-bottom: 25px; }
    .form-group-premium label { display: block; font-size: 14px; font-weight: 700; color: #334155; margin-bottom: 12px; display: flex; align-items: center; gap: 10px; }
    .form-group-premium label i { color: #0f172a; }
    
    .premium-textarea { width: 100%; border: 2px solid #e2e8f0; border-radius: 16px; padding: 15px; font-size: 15px; background: white; transition: all 0.3s; min-height: 140px; outline: none; font-family: inherit; }
    .premium-textarea:focus { border-color: #0f172a; box-shadow: 0 10px 25px rgba(0,0,0,0.05); }

    .file-drop-area-premium { position: relative; border: 2px dashed #e2e8f0; border-radius: 20px; background: white; transition: all 0.3s; overflow: hidden; }
    .file-drop-area-premium:hover { border-color: #0f172a; background: #fcfdfe; }
    .hidden-input { display: none; }
    .file-label-premium { display: flex; flex-direction: column; align-items: center; gap: 12px; padding: 40px 20px; cursor: pointer; color: #64748b; font-weight: 600; font-size: 14px; text-align: center; }
    .file-label-premium i { font-size: 36px; color: #cbd5e0; transition: color 0.3s; }
    .file-drop-area-premium:hover .file-label-premium i { color: #0f172a; }
    .help-text { display: block; color: #94a3b8; margin-top: 10px; font-size: 12px; font-weight: 500; }

    .btn-upgrade-premium { width: 100%; height: 56px; background: #0f172a; color: white; border: none; border-radius: 16px; font-size: 16px; font-weight: 800; cursor: pointer; transition: all 0.3s; box-shadow: 0 10px 25px rgba(0,0,0,0.1); margin-top: 15px; display: flex; align-items: center; justify-content: center; gap: 12px; }
    .btn-upgrade-premium:hover:not(:disabled) { background: #1e293b; transform: translateY(-3px); box-shadow: 0 15px 35px rgba(0,0,0,0.2); }
    .btn-upgrade-premium:disabled { opacity: 0.6; cursor: not-allowed; }
  `]
})
export class UserDashboardComponent implements OnInit {
  activeTab = 'profile'; // Default to profile as requested
  chatRecipientUser: any = null;
  requestStatus: UpgradeRequestDto | null = null;
  isLoading = false;

  userNote = '';
  selectedFile: File | null = null;

  constructor(
    private route: ActivatedRoute,
    private upgradeReqService: UpgradeRequestService,
    private notification: NotificationService,
    public notificationService: NotificationService
  ) { }

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      if (params['tab']) {
        this.activeTab = params['tab'];
      }
    });
    this.checkStatus();
  }

  checkStatus() {
    this.upgradeReqService.getMyRequestStatus().subscribe({
      next: (res: UpgradeRequestDto) => { this.requestStatus = res; },
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
      next: (res: UpgradeRequestDto) => {
        this.notification.success('Yêu cầu đã được gửi thành công!');
        this.requestStatus = res;
        this.isLoading = false;
        this.userNote = '';
        this.selectedFile = null;
      },
      error: (err: any) => {
        this.notification.error(err.error?.message || err.message || 'Có lỗi xảy ra khi gửi yêu cầu');
        this.isLoading = false;
      }
    });
  }

  onChatRequested(user: any) {
    this.chatRecipientUser = user;
    this.activeTab = 'chat';
  }
}
