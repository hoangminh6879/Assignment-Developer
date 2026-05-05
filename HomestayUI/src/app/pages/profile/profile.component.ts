import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UserService, ProfileUpdateRequest, UserProfileDto } from '../../services/user.service';
import { NotificationService } from '../../services/notification.service';
import { NavbarComponent } from '../../components/navbar/navbar.component';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, FormsModule, NavbarComponent],
  template: `
    <app-navbar></app-navbar>
    <div class="profile-page">
      <div class="profile-card animate-fade-in">
        <div class="profile-header">
          <div class="avatar-large">
            {{ (profile?.firstName?.charAt(0) || profile?.username?.charAt(0) || '?').toUpperCase() }}
          </div>
          <div class="header-info">
            <h2>Hồ Sơ Cá Nhân</h2>
            <p>Quản lý thông tin tài khoản của bạn</p>
          </div>
        </div>

        <div class="profile-body">
          <div class="form-grid">
            <div class="form-group">
              <label>Tên đăng nhập</label>
              <input type="text" [value]="profile?.username" class="input-field disabled" disabled />
            </div>
            <div class="form-group">
              <label>Email</label>
              <input type="email" [value]="profile?.email" class="input-field disabled" disabled />
            </div>
            <div class="form-group">
              <label>Họ</label>
              <input type="text" [(ngModel)]="editForm.firstName" class="input-field" placeholder="Nhập họ..." />
            </div>
            <div class="form-group">
              <label>Tên</label>
              <input type="text" [(ngModel)]="editForm.lastName" class="input-field" placeholder="Nhập tên..." />
            </div>
            <div class="form-group">
              <label>Số điện thoại</label>
              <input type="text" [(ngModel)]="editForm.phoneNumber" class="input-field" placeholder="Nhập số điện thoại..." />
            </div>
            <div class="form-group">
              <label>Số CCCD</label>
              <input type="text" [(ngModel)]="editForm.citizenId" class="input-field" placeholder="Nhập số căn cước..." />
            </div>
            <div class="form-group full-width">
              <label>Địa chỉ</label>
              <input type="text" [(ngModel)]="editForm.address" class="input-field" placeholder="Nhập địa chỉ của bạn..." />
            </div>
          </div>

          <div class="profile-actions">
            <button class="btn-save" (click)="saveProfile()" [disabled]="loading">
              {{ loading ? 'Đang lưu...' : 'Lưu Thay Đổi' }}
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .profile-page { min-height: 100vh; background: #f8fafc; padding: 120px 20px 40px; display: flex; justify-content: center; }
    .profile-card { background: white; border-radius: 24px; width: 100%; max-width: 800px; box-shadow: 0 10px 25px -5px rgba(0,0,0,0.1); overflow: hidden; }
    
    .profile-header { background: linear-gradient(135deg, #4f46e5 0%, #3b82f6 100%); padding: 40px; display: flex; align-items: center; gap: 30px; color: white; }
    .avatar-large { width: 100px; height: 100px; border-radius: 50%; background: rgba(255,255,255,0.2); backdrop-filter: blur(10px); display: flex; align-items: center; justify-content: center; font-size: 48px; font-weight: 700; border: 4px solid rgba(255,255,255,0.3); }
    .header-info h2 { margin: 0; font-size: 28px; font-weight: 700; }
    .header-info p { margin: 5px 0 0; opacity: 0.9; }

    .profile-body { padding: 40px; }
    .form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; }
    .full-width { grid-column: 1 / -1; }
    
    .form-group label { display: block; font-size: 14px; font-weight: 600; color: #64748b; margin-bottom: 8px; }
    .input-field { width: 100%; padding: 12px 16px; border: 1px solid #e2e8f0; border-radius: 12px; font-size: 15px; transition: all 0.2s; box-sizing: border-box; }
    .input-field:focus { outline: none; border-color: #4f46e5; box-shadow: 0 0 0 4px rgba(79, 70, 229, 0.1); }
    .input-field.disabled { background: #f1f5f9; color: #94a3b8; cursor: not-allowed; }

    .profile-actions { margin-top: 40px; display: flex; justify-content: flex-end; }
    .btn-save { background: #4f46e5; color: white; border: none; padding: 14px 32px; border-radius: 12px; font-size: 16px; font-weight: 600; cursor: pointer; transition: all 0.2s; }
    .btn-save:hover:not(:disabled) { background: #4338ca; transform: translateY(-2px); box-shadow: 0 4px 12px rgba(79, 70, 229, 0.3); }
    .btn-save:disabled { opacity: 0.7; cursor: not-allowed; }

    .animate-fade-in { animation: fadeIn 0.5s ease-out; }
    @keyframes fadeIn { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }

    @media (max-width: 640px) {
      .form-grid { grid-template-columns: 1fr; }
      .profile-header { flex-direction: column; text-align: center; padding: 30px; }
    }
  `]
})
export class ProfileComponent implements OnInit {
  profile: UserProfileDto | null = null;
  editForm: ProfileUpdateRequest = {
    firstName: '',
    lastName: '',
    phoneNumber: '',
    address: '',
    citizenId: ''
  };
  loading = false;

  constructor(
    private userService: UserService,
    private notification: NotificationService
  ) {}

  ngOnInit() {
    this.loadProfile();
  }

  loadProfile() {
    this.userService.getProfile().subscribe({
      next: (data) => {
        this.profile = data;
        this.editForm = {
          firstName: data.firstName || '',
          lastName: data.lastName || '',
          phoneNumber: data.phoneNumber || '',
          address: data.address || '',
          citizenId: data.citizenId || ''
        };
      },
      error: (err) => this.notification.error('Không thể tải thông tin cá nhân.')
    });
  }

  saveProfile() {
    this.loading = true;
    this.userService.updateProfile(this.editForm).subscribe({
      next: (data) => {
        this.profile = data;
        this.notification.success('Đã cập nhật hồ sơ thành công!');
        this.loading = false;
      },
      error: (err) => {
        this.notification.error('Cập nhật thất bại. Vui lòng thử lại.');
        this.loading = false;
      }
    });
  }
}
