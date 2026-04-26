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
    firstName: '',
    lastName: '',
    phoneNumber: ''
  };
  isLoading = false;
  errorMessage = '';
  successMessage = '';

  constructor(private authService: AuthService, private router: Router) {
    console.log('RegisterComponent loaded!');
  }

  onRegister() {
    console.log('Register button clicked!', this.userData);
    
    // Kiểm tra dữ liệu đầu vào
    if (!this.userData.username || !this.userData.email || !this.userData.password) {
      this.errorMessage = 'Vui lòng điền đầy đủ Tên đăng nhập, Email và Mật khẩu!';
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';
    
    this.authService.register(this.userData).subscribe({
      next: (res) => {
        console.log('Registration success:', res);
        this.successMessage = 'Đăng ký thành công! Đang chuyển hướng...';
        setTimeout(() => {
          this.router.navigate(['/login']);
        }, 2000);
      },
      error: (err) => {
        console.error('Registration error:', err);
        this.errorMessage = 'Có lỗi xảy ra, vui lòng kiểm tra lại thông tin!';
        this.isLoading = false;
      }
    });
  }
}
