import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface UpgradeRequestDto {
  id: string;
  userId: string;
  username: string;
  email: string;
  status: string;
  userNote?: string;
  proofUrl?: string;
  adminNote?: string;
  createdAt: string;
  updatedAt: string;
}

@Injectable({
  providedIn: 'root'
})
export class UpgradeRequestService {
  private apiUrl = 'http://localhost:9999/api';

  constructor(private http: HttpClient) {}

  createUpgradeRequest(userNote: string, file: File | null): Observable<UpgradeRequestDto> {
    const formData = new FormData();
    if (userNote) {
      formData.append('userNote', userNote);
    }
    if (file) {
      formData.append('file', file);
    }
    return this.http.post<UpgradeRequestDto>(`${this.apiUrl}/user/upgrade-request`, formData);
  }

  getMyRequestStatus(): Observable<UpgradeRequestDto> {
    return this.http.get<UpgradeRequestDto>(`${this.apiUrl}/user/upgrade-request/status`);
  }

  getPendingRequests(): Observable<UpgradeRequestDto[]> {
    return this.http.get<UpgradeRequestDto[]>(`${this.apiUrl}/admin/upgrade-requests`);
  }

  approveRequest(id: string, adminNote: string): Observable<UpgradeRequestDto> {
    return this.http.post<UpgradeRequestDto>(`${this.apiUrl}/admin/upgrade-requests/${id}/approve`, { adminNote });
  }

  rejectRequest(id: string, adminNote: string): Observable<UpgradeRequestDto> {
    return this.http.post<UpgradeRequestDto>(`${this.apiUrl}/admin/upgrade-requests/${id}/reject`, { adminNote });
  }
}
