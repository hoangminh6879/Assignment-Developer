import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = 'http://localhost:9999/api/auth';
  
  isAuthenticated = signal<boolean>(!!localStorage.getItem('access_token'));

  constructor(private http: HttpClient) {
    console.log('AuthService initialized');
  }

  register(userData: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/register`, userData, { responseType: 'text' });
  }

  login(credentials: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/login`, credentials).pipe(
      tap(response => {
        if (response.access_token) {
          localStorage.setItem('access_token', response.access_token);
          localStorage.setItem('refresh_token', response.refresh_token);
          this.isAuthenticated.set(true);
        }
      })
    );
  }

  logout() {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    this.isAuthenticated.set(false);
  }

  getToken(): string | null {
    return localStorage.getItem('access_token');
  }
}
