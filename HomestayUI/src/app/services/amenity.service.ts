import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface AmenityDto {
  id: number;
  name: string;
  iconUrl: string;
}

@Injectable({
  providedIn: 'root'
})
export class AmenityService {
  private apiUrl = 'http://localhost:9999/api';

  constructor(private http: HttpClient) {}

  getAllAmenities(): Observable<AmenityDto[]> {
    return this.http.get<AmenityDto[]>(`${this.apiUrl}/amenities`);
  }

  createAmenity(amenity: { name: string; iconUrl: string }): Observable<AmenityDto> {
    return this.http.post<AmenityDto>(`${this.apiUrl}/admin/amenities`, amenity);
  }

  deleteAmenity(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/admin/amenities/${id}`);
  }
}
