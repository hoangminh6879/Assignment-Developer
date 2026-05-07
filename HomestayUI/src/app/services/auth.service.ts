import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = 'http://localhost:9999/api/auth';

  isAuthenticated = signal<boolean>(
    !!(localStorage.getItem('access_token') || sessionStorage.getItem('access_token'))
  );

  constructor(private http: HttpClient) {}

  // ─────────────────────────────────────────────
  //  Đăng ký — sau khi thành công cần xác thực email
  // ─────────────────────────────────────────────
  register(userData: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/register`, userData, { responseType: 'text' });
  }

  // ─────────────────────────────────────────────
  //  Đăng nhập — hỗ trợ email + rememberMe
  // ─────────────────────────────────────────────
  login(credentials: { username: string; password: string; remember_me?: boolean }): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/login`, credentials).pipe(
      tap(response => {
        if (response.access_token) {
          // Xóa hết storage cũ trước khi lưu mới
          this.clearStorage();

          const storage = credentials.remember_me ? localStorage : sessionStorage;
          storage.setItem('access_token', response.access_token);
          storage.setItem('refresh_token', response.refresh_token);
          this.isAuthenticated.set(true);
        }
      })
    );
  }

  // ─────────────────────────────────────────────
  //  Quên mật khẩu
  // ─────────────────────────────────────────────
  forgotPassword(email: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/forgot-password`, { email });
  }

  // ─────────────────────────────────────────────
  //  Gửi lại email xác thực (cho tài khoản cũ)
  // ─────────────────────────────────────────────
  resendVerification(usernameOrEmail: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/resend-verification`, { usernameOrEmail });
  }

  // ─────────────────────────────────────────────
  //  Làm mới token
  // ─────────────────────────────────────────────
  refreshToken(): Observable<any> {
    const refreshToken = this.getRefreshToken();
    return this.http.post<any>(`${this.apiUrl}/refresh`, { refresh_token: refreshToken }).pipe(
      tap(response => {
        if (response.access_token) {
          // Xác định storage đang chứa token để update
          const storage = localStorage.getItem('refresh_token') ? localStorage : sessionStorage;
          storage.setItem('access_token', response.access_token);
          if (response.refresh_token) {
            storage.setItem('refresh_token', response.refresh_token);
          }
          this.isAuthenticated.set(true);
        }
      })
    );
  }

  // ─────────────────────────────────────────────
  //  Đăng xuất — revoke token phía Keycloak
  // ─────────────────────────────────────────────
  logout(): Observable<any> {
    const refreshToken = this.getRefreshToken();
    return this.http.post(`${this.apiUrl}/logout`, { refresh_token: refreshToken }).pipe(
      tap(() => {
        this.clearStorage();
        this.isAuthenticated.set(false);
      })
    );
  }

  private clearStorage() {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    sessionStorage.removeItem('access_token');
    sessionStorage.removeItem('refresh_token');
  }

  // ─────────────────────────────────────────────
  //  Helpers
  // ─────────────────────────────────────────────
  getToken(): string | null {
    return localStorage.getItem('access_token') || sessionStorage.getItem('access_token');
  }

  getRefreshToken(): string | null {
    return localStorage.getItem('refresh_token') || sessionStorage.getItem('refresh_token');
  }

  getRoles(): string[] {
    const token = this.getToken();
    if (!token) return [];
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.realm_access?.roles || [];
    } catch (e) {
      return [];
    }
  }

  hasRole(role: string): boolean {
    return this.getRoles().includes(role);
  }

  getUsername(): string | null {
    const token = this.getToken();
    if (!token) return null;
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.preferred_username || payload.sub;
    } catch (e) {
      return null;
    }
  }

  getCurrentUser(): any {
    const token = this.getToken();
    if (!token) return null;
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return {
        id: payload.sub,
        username: payload.preferred_username || payload.sub,
        email: payload.email,
        emailVerified: payload.email_verified,
        roles: payload.realm_access?.roles || []
      };
    } catch (e) {
      return null;
    }
  }
}
