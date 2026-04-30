import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface MonthlyRevenue {
  month: string;
  revenue: number;
}

export interface HomestayStats {
  homestayName: string;
  bookingCount: number;
  totalRevenue: number;
}

export interface AdminStatistics {
  totalRevenue: number;
  totalBookings: number;
  totalHomestays: number;
  totalUsers: number;
  monthlyRevenue: MonthlyRevenue[];
  bookingsByStatus: { [key: string]: number };
  topHomestays: HomestayStats[];
}

export interface HostStatistics {
  totalRevenue: number;
  totalBookings: number;
  totalHomestays: number;
  monthlyRevenue: MonthlyRevenue[];
  homestayStats: HomestayStats[];
}

@Injectable({
  providedIn: 'root'
})
export class StatisticsService {
  private apiUrl = 'http://localhost:9999/api/statistics';

  constructor(private http: HttpClient) {}

  getAdminStats(): Observable<AdminStatistics> {
    return this.http.get<AdminStatistics>(`${this.apiUrl}/admin`);
  }

  getHostStats(): Observable<HostStatistics> {
    return this.http.get<HostStatistics>(`${this.apiUrl}/host`);
  }
}
