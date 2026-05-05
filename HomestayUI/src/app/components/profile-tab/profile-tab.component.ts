import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UserService, ProfileUpdateRequest, UserProfileDto } from '../../services/user.service';
import { NotificationService } from '../../services/notification.service';

@Component({
  selector: 'app-profile-tab',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './profile-tab.component.html',
  styleUrl: './profile-tab.component.css'
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
