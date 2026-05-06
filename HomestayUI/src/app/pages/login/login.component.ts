import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent {
  loginData = {
    username: '',
    password: '',
    remember_me: false
  };

  isLoading = false;
  errorMessage = '';
  showPassword = false;
  emailNotVerified = false;   // true khi Keycloak trả lỗi chưa xác thực email
  resendSuccess = '';
  isResendLoading = false;

  // Forgot password state
  showForgotPassword = false;
  forgotEmail = '';
  forgotError = '';
  forgotSuccess = '';
  isForgotLoading = false;

  constructor(private authService: AuthService, private router: Router) {}

  onLogin() {
    this.isLoading = true;
    this.errorMessage = '';
    this.emailNotVerified = false;
    this.resendSuccess = '';

    this.authService.login(this.loginData).subscribe({
      next: () => {
        const roles = this.authService.getRoles();
        if (roles.includes('ADMIN')) {
          this.router.navigate(['/dashboard/admin']);
        } else if (roles.includes('HOST')) {
          this.router.navigate(['/dashboard/host']);
        } else {
          this.router.navigate(['/']);
        }
      },
      error: (err) => {
        if (err.error?.error_code === 'EMAIL_NOT_VERIFIED') {
          this.emailNotVerified = true;
        } else {
          this.errorMessage = err.error?.message || 'Tên đăng nhập/email hoặc mật khẩu không đúng!';
        }
        this.isLoading = false;
      }
    });
  }

  onResendVerification() {
    this.isResendLoading = true;
    this.resendSuccess = '';
    this.authService.resendVerification(this.loginData.username).subscribe({
      next: (res: any) => {
        this.resendSuccess = res.message || 'Email xác thực đã được gửi lại!';
        this.isResendLoading = false;
      },
      error: () => {
        this.resendSuccess = 'Email xác thực đã được gửi (nếu tài khoản tồn tại).';
        this.isResendLoading = false;
      }
    });
  }

  onForgotPassword() {
    this.isForgotLoading = true;
    this.forgotError = '';
    this.forgotSuccess = '';

    this.authService.forgotPassword(this.forgotEmail).subscribe({
      next: (res: any) => {
        this.forgotSuccess = res.message || 'Nếu email tồn tại, bạn sẽ nhận được hướng dẫn qua email.';
        this.isForgotLoading = false;
      },
      error: () => {
        // Backend luôn trả 200, lỗi ở đây là lỗi mạng
        this.forgotError = 'Không thể kết nối đến máy chủ. Vui lòng thử lại.';
        this.isForgotLoading = false;
      }
    });
  }

  toggleForgotPassword() {
    this.showForgotPassword = !this.showForgotPassword;
    this.forgotError = '';
    this.forgotSuccess = '';
    this.forgotEmail = '';
  }

  togglePassword() {
    this.showPassword = !this.showPassword;
  }
}
