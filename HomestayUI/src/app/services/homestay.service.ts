import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AmenityDto } from './amenity.service';

export interface HomestayImageDto {
  id: string;
  url: string;
  isPrimary: boolean;
}

export interface HomestayDto {
  id: string;
  name: string;
  description: string;
  address: string;
  city: string;
  pricePerNight: number;
  maxGuests: number;
  status: string;
  adminReason?: string;
  createdAt: string;
  hostId: string;
  hostName: string;
  images: HomestayImageDto[];
  amenities: AmenityDto[];
  roomTypeNames: string[];
  viewCount?: number;
  averageRating?: number;
  reviewCount?: number;
}

@Injectable({
  providedIn: 'root'
})
export class HomestayService {
  private apiUrl = 'http://localhost:9999/api';

  constructor(private http: HttpClient) {}

  getActiveHomestays(): Observable<HomestayDto[]> {
    return this.http.get<HomestayDto[]>(`${this.apiUrl}/homestays`);
  }

  getHostHomestays(): Observable<HomestayDto[]> {
    return this.http.get<HomestayDto[]>(`${this.apiUrl}/host/homestays`);
  }

  createHomestay(formData: FormData): Observable<HomestayDto> {
    return this.http.post<HomestayDto>(`${this.apiUrl}/host/homestays`, formData);
  }

  updateHomestay(id: string, formData: FormData): Observable<HomestayDto> {
    return this.http.put<HomestayDto>(`${this.apiUrl}/host/homestays/${id}`, formData);
  }

  deleteHomestay(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/host/homestays/${id}`);
  }

  getAllHomestaysAdmin(): Observable<HomestayDto[]> {
    return this.http.get<HomestayDto[]>(`${this.apiUrl}/admin/homestays`);
  }

  updateHomestayStatus(id: string, status: string, adminReason: string = ''): Observable<HomestayDto> {
    return this.http.put<HomestayDto>(`${this.apiUrl}/admin/homestays/${id}/status`, { status, adminReason });
  }

  incrementViewCount(id: string): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/homestays/${id}/view`, null);
  }
}
