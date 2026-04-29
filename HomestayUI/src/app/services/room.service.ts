import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface RoomDto {
  id: string;
  name: string;
  roomTypeId: number;
  roomTypeName?: string;
  priceExtra: number;
  maxGuests: number;
  status: 'AVAILABLE' | 'BOOKED' | 'UNAVAILABLE';
  homestayId: string;
  images: any[];
}

@Injectable({
  providedIn: 'root'
})
export class RoomService {
  private apiUrl = 'http://localhost:9999/api/host';

  constructor(private http: HttpClient) {}

  private getHeaders() {
    const token = localStorage.getItem('token');
    return new HttpHeaders().set('Authorization', `Bearer ${token}`);
  }

  getRoomsByHomestay(homestayId: string): Observable<RoomDto[]> {
    return this.http.get<RoomDto[]>(`${this.apiUrl}/homestays/${homestayId}/rooms`, { headers: this.getHeaders() });
  }

  createRoom(homestayId: string, formData: FormData): Observable<RoomDto> {
    return this.http.post<RoomDto>(`${this.apiUrl}/homestays/${homestayId}/rooms`, formData, { headers: this.getHeaders() });
  }

  updateRoom(roomId: string, formData: FormData): Observable<RoomDto> {
    return this.http.put<RoomDto>(`${this.apiUrl}/rooms/${roomId}`, formData, { headers: this.getHeaders() });
  }

  deleteRoom(roomId: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/rooms/${roomId}`, { headers: this.getHeaders() });
  }
}
