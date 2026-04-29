import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface RoomTypeDto {
  id?: number;
  name: string;
  description: string;
}

@Injectable({
  providedIn: 'root'
})
export class RoomTypeService {
  private apiUrl = 'http://localhost:9999/api/room-types';
  private adminApiUrl = 'http://localhost:9999/api/admin/room-types';

  constructor(private http: HttpClient) {}

  private getHeaders() {
    const token = localStorage.getItem('token');
    return new HttpHeaders().set('Authorization', `Bearer ${token}`);
  }

  getAllRoomTypes(): Observable<RoomTypeDto[]> {
    return this.http.get<RoomTypeDto[]>(this.apiUrl);
  }

  createRoomType(dto: RoomTypeDto): Observable<RoomTypeDto> {
    return this.http.post<RoomTypeDto>(this.adminApiUrl, dto, { headers: this.getHeaders() });
  }

  updateRoomType(id: number, dto: RoomTypeDto): Observable<RoomTypeDto> {
    return this.http.put<RoomTypeDto>(`${this.adminApiUrl}/${id}`, dto, { headers: this.getHeaders() });
  }

  deleteRoomType(id: number): Observable<void> {
    return this.http.delete<void>(`${this.adminApiUrl}/${id}`, { headers: this.getHeaders() });
  }
}
