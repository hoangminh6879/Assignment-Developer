import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError } from 'rxjs/operators';
import { throwError } from 'rxjs';

export class AuthInterceptor {
  static intercept: HttpInterceptorFn = (req, next) => {
    const router = inject(Router);
    const token = localStorage.getItem('access_token');
    
    // Skip interceptor for auth endpoints
    if (req.url.includes('/api/auth/')) {
      return next(req);
    }
    
    let request = req;
    if (token) {
      request = req.clone({
        setHeaders: {
          Authorization: `Bearer ${token}`
        }
      });
    }
    
    return next(request).pipe(
      catchError((error: HttpErrorResponse) => {
        if (error.status === 401) {
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
          router.navigate(['/login']);
        }
        return throwError(() => error);
      })
    );
  };
}
