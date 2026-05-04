import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { UserService, UserProfileDto } from '../../services/user.service';
import { OnInit } from '@angular/core';
import { NotificationService, NotificationDto } from '../../services/notification.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.css'
})
export class NavbarComponent implements OnInit {
  profile: UserProfileDto | null = null;

  notifications: NotificationDto[] = [];
  showNotifications = false;

  constructor(
    public authService: AuthService, 
    private userService: UserService,
    private router: Router,
    public notificationService: NotificationService
  ) {}

  ngOnInit() {
    if (this.authService.isAuthenticated()) {
      this.loadProfile();
      this.notificationService.refresh();
    }
  }

  loadProfile() {
    this.userService.getProfile().subscribe({
      next: (data) => this.profile = data,
      error: () => this.profile = null
    });
  }

  onLogout() {
    this.authService.logout();
    this.router.navigate(['/']);
  }

  toggleNotifications() {
    this.showNotifications = !this.showNotifications;
    if (this.showNotifications) {
      this.loadNotifications();
    }
  }

  loadNotifications() {
    this.notificationService.getNotifications().subscribe(data => {
      this.notifications = data;
    });
  }

  markAsRead(n: NotificationDto) {
    if (!n.isRead) {
      this.notificationService.markAsRead(n.id).subscribe(() => {
        n.isRead = true;
        this.notificationService.refresh();
      });
    }
    // Handle navigation based on type if needed
    this.showNotifications = false;
  }

  markAllAsRead(event: Event) {
    event.stopPropagation();
    this.notificationService.markAllAsRead().subscribe(() => {
      this.notificationService.refresh();
      this.loadNotifications();
    });
  }
}
