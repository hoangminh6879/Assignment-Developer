import { Routes } from '@angular/router';
import { HomeComponent } from './pages/home/home.component';
import { LoginComponent } from './pages/login/login.component';
import { RegisterComponent } from './pages/register/register.component';
import { UserDashboardComponent } from './pages/dashboard/user-dashboard/user-dashboard.component';
import { HostDashboardComponent } from './pages/dashboard/host-dashboard/host-dashboard.component';
import { AdminDashboardComponent } from './pages/dashboard/admin-dashboard/admin-dashboard.component';
import { AuthGuard } from './guards/auth.guard';

export const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  { 
    path: 'dashboard/user', 
    component: UserDashboardComponent, 
    canActivate: [AuthGuard] 
  },
  { 
    path: 'dashboard/host', 
    component: HostDashboardComponent, 
    canActivate: [AuthGuard], 
    data: { roles: ['HOST', 'ADMIN'] } 
  },
  { 
    path: 'dashboard/admin', 
    component: AdminDashboardComponent, 
    canActivate: [AuthGuard], 
    data: { roles: ['ADMIN'] } 
  },
  {
    path: 'booking/:homestayId',
    loadComponent: () => import('./pages/booking/booking.component').then(m => m.BookingComponent),
    canActivate: [AuthGuard]
  },
  { path: '**', redirectTo: '' }
];
