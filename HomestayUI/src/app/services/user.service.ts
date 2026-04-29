import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface UserProfileDto {
  id: string;
  username: string;
  email: string;
  firstName?: string;
  lastName?: string;
  phoneNumber?: string;
  address?: string;
  citizenId?: string;
  avatarUrl?: string;
}

export interface ProfileUpdateRequest {
  firstName: string;
  lastName: string;
  phoneNumber: string;
  address: string;
  citizenId: string;
}

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private apiUrl = 'http://localhost:9999/api/users';

  constructor(private http: HttpClient) {}

  getProfile(): Observable<UserProfileDto> {
    return this.http.get<UserProfileDto>(`${this.apiUrl}/profile`);
  }

  updateProfile(request: ProfileUpdateRequest): Observable<UserProfileDto> {
    return this.http.put<UserProfileDto>(`${this.apiUrl}/profile`, request);
  }
}
