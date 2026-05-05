import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UserService, ProfileUpdateRequest, UserProfileDto } from '../../services/user.service';
import { NotificationService } from '../../services/notification.service';

@Component({
  selector: 'app-profile-tab',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="profile-tab-content">
      <div class="tab-header">
        <h3>Thông tin cá nhân</h3>
        <p>Cập nhật thông tin tài khoản của bạn để phục vụ việc đặt phòng</p>
      </div>

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
          <input type="text" [(ngModel)]="editForm.address" class="input-field" placeholder="Nhập địa chỉ chi tiết..." />
        </div>
      </div>

      <div class="form-actions">
        <button class="btn-primary" (click)="saveProfile()" [disabled]="loading">
          {{ loading ? 'Đang lưu...' : 'Lưu thay đổi' }}
        </button>
      </div>
    </div>
  `,
  styles: [`
    .profile-tab-content { animation: fadeIn 0.4s ease-out; }
    .tab-header { margin-bottom: 30px; border-bottom: 1px solid #f1f5f9; padding-bottom: 15px; }
    .tab-header h3 { font-size: 20px; color: #1e293b; margin: 0 0 5px 0; font-weight: 700; }
    .tab-header p { color: #64748b; font-size: 14px; margin: 0; }

    .form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
    .full-width { grid-column: 1 / -1; }
    
    .form-group label { display: block; font-size: 13px; font-weight: 600; color: #475569; margin-bottom: 6px; }
    .input-field { width: 100%; padding: 12px; border: 1px solid #e2e8f0; border-radius: 10px; font-size: 14px; box-sizing: border-box; transition: all 0.2s; }
    .input-field:focus { border-color: #4f46e5; outline: none; box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.1); }
    .input-field.disabled { background: #f8fafc; color: #94a3b8; cursor: not-allowed; }

    .form-actions { margin-top: 30px; display: flex; justify-content: flex-end; }
    .btn-primary { 
      background: #4f46e5; color: white; border: none; padding: 12px 30px; 
      border-radius: 10px; font-weight: 600; cursor: pointer; transition: all 0.2s; 
    }
    .btn-primary:hover:not(:disabled) { background: #4338ca; transform: translateY(-1px); }
    .btn-primary:disabled { opacity: 0.7; cursor: not-allowed; }

    @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
    @media (max-width: 640px) { .form-grid { grid-template-columns: 1fr; } }
  `]
})
export class ProfileTabComponent implements OnInit {
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
      }
    });
  }

  saveProfile() {
    this.loading = true;
    this.userService.updateProfile(this.editForm).subscribe({
      next: (data) => {
        this.profile = data;
        this.notification.success('Đã cập nhật hồ sơ thành công!');
        this.loading = false;
        // Optional: emit an event to refresh navbar if needed
      },
      error: (err) => {
        this.notification.error('Cập nhật thất bại.');
        this.loading = false;
      }
    });
  }
}
