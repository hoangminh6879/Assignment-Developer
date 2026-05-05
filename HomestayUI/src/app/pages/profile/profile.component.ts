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
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.css'
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
