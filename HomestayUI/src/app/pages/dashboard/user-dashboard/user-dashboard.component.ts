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

@Component({
  selector: 'app-user-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, NavbarComponent, ProfileTabComponent, BookingHistoryTabComponent, ChatTabComponent],
  templateUrl: './user-dashboard.component.html',
  styleUrl: './user-dashboard.component.css'
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
  ) {}

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
