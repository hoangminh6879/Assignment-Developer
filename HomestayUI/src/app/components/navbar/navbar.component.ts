import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { UserService, UserProfileDto } from '../../services/user.service';
import { OnInit } from '@angular/core';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.css'
})
export class NavbarComponent implements OnInit {
  profile: UserProfileDto | null = null;

  constructor(
    public authService: AuthService, 
    private userService: UserService,
    private router: Router
  ) {}

  ngOnInit() {
    if (this.authService.isAuthenticated()) {
      this.loadProfile();
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
}
