import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './register.component.html',
  styleUrl: './register.component.css'
})
export class RegisterComponent {
  userData = {
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
    phoneNumber: ''
  };
  isLoading = false;
  errorMessage = '';
  successMessage = '';
  showPassword = false;
  registered = false; // Sau khi đăng ký thành công, hiện panel chờ xác thực email

  constructor(private authService: AuthService, private router: Router) {}

  onRegister() {
    if (!this.userData.username || !this.userData.email || !this.userData.password) {
      this.errorMessage = 'Vui lòng điền đầy đủ Tên đăng nhập, Email và Mật khẩu!';
      return;
    }

    if (this.userData.password !== this.userData.confirmPassword) {
      this.errorMessage = 'Mật khẩu xác nhận không khớp!';
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    this.authService.register(this.userData).subscribe({
      next: (res) => {
        // Hiện panel thông báo xác thực email thay vì chuyển trang ngay
        this.registered = true;
        this.isLoading = false;
      },
      error: (err) => {
        this.errorMessage = err.error || 'Có lỗi xảy ra, vui lòng kiểm tra lại thông tin!';
        this.isLoading = false;
      }
    });
  }

  togglePassword() {
    this.showPassword = !this.showPassword;
  }

  goToLogin() {
    this.router.navigate(['/login']);
  }
}
