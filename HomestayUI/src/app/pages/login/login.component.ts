import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent implements OnInit {
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

  constructor(
    public authService: AuthService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit() {
    // Kiểm tra xem có code từ Keycloak redirect về không
    const code = this.route.snapshot.queryParamMap.get('code');
    console.log('LoginComponent ngOnInit, code:', code);
    if (code) {
      this.handleGoogleLogin(code);
    }
  }

  private handleGoogleLogin(code: string) {
    console.log('Handling Google login with code:', code);
    this.isLoading = true;
    this.authService.loginWithCode(code).subscribe({
      next: (res) => {
        console.log('Google login success:', res);
        this.navigateToDashboard();
      },
      error: (err) => {
        console.error('Google login error:', err);
        this.errorMessage = err.error?.message || 'Đăng nhập bằng Google thất bại.';
        this.isLoading = false;
      }
    });
  }

  async onLoginWithGoogle() {
    this.isLoading = true;
    try {
      const url = await this.authService.getGoogleLoginUrl();
      console.log('Redirecting to Google login URL (PKCE):', url);
      window.location.href = url;
    } catch (error) {
      console.error('Failed to generate Google login URL:', error);
      this.errorMessage = 'Không thể khởi tạo đăng nhập Google.';
      this.isLoading = false;
    }
  }

  private navigateToDashboard() {
    const roles = this.authService.getRoles();
    if (roles.includes('ADMIN')) {
      this.router.navigate(['/dashboard/admin']);
    } else if (roles.includes('HOST')) {
      this.router.navigate(['/dashboard/host']);
    } else {
      this.router.navigate(['/']);
    }
  }

  onLogin() {
    this.isLoading = true;
    this.errorMessage = '';
    this.emailNotVerified = false;
    this.resendSuccess = '';

    this.authService.login(this.loginData).subscribe({
      next: () => {
        this.navigateToDashboard();
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
