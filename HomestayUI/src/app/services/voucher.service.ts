import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export enum VoucherType {
  PERCENTAGE = 'PERCENTAGE',
  FIXED_AMOUNT = 'FIXED_AMOUNT'
}

export interface VoucherDto {
  id?: string;
  code: string;
  type: VoucherType;
  value: number;
  minBookingAmount?: number;
  maxDiscountAmount?: number;
  expiryDate?: string;
  usageLimit?: number;
  usedCount?: number;
  isGlobal: boolean;
  hostId?: string;
  hostName?: string;
  isActive: boolean;
  createdAt?: string;
}

@Injectable({
  providedIn: 'root'
})
export class VoucherService {
  private apiUrl = 'http://localhost:9999/api/vouchers';

  constructor(private http: HttpClient) {}

  getApplicableVouchers(hostId: string): Observable<VoucherDto[]> {
    return this.http.get<VoucherDto[]>(`${this.apiUrl}/applicable/${hostId}`);
  }

  validateVoucher(code: string, amount: number, hostId: string): Observable<{valid: boolean, discountAmount: number}> {
    return this.http.post<{valid: boolean, discountAmount: number}>(`${this.apiUrl}/validate`, { code, amount, hostId });
  }

  getHostVouchers(): Observable<VoucherDto[]> {
    return this.http.get<VoucherDto[]>(`${this.apiUrl}/host`);
  }

  getAdminVouchers(): Observable<VoucherDto[]> {
    return this.http.get<VoucherDto[]>(`${this.apiUrl}/admin`);
  }

  createVoucher(voucher: VoucherDto): Observable<VoucherDto> {
    return this.http.post<VoucherDto>(this.apiUrl, voucher);
  }

  toggleStatus(id: string): Observable<void> {
    return this.http.patch<void>(`${this.apiUrl}/${id}/toggle`, {});
  }

  updateVoucher(id: string, voucher: VoucherDto): Observable<VoucherDto> {
    return this.http.put<VoucherDto>(`${this.apiUrl}/${id}`, voucher);
  }

  deleteVoucher(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
