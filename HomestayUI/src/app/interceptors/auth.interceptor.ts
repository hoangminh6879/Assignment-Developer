import { HttpInterceptorFn } from '@angular/common/http';

export class AuthInterceptor {
  static intercept: HttpInterceptorFn = (req, next) => {
    const token = localStorage.getItem('access_token');
    
    // Skip interceptor for auth endpoints
    if (req.url.includes('/api/auth/')) {
      return next(req);
    }
    
    if (token) {
      const cloned = req.clone({
        setHeaders: {
          Authorization: `Bearer ${token}`
        }
      });
      return next(cloned);
    }
    
    return next(req);
  };
}
