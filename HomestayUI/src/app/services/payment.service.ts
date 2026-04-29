import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface PaymentResponseDto {
  status: string;
  message: string;
  url: string;
}

@Injectable({
  providedIn: 'root'
})
export class PaymentService {
  private apiUrl = 'http://localhost:9999/api/payment';

  constructor(private http: HttpClient) {}

  createVNPayUrl(bookingId: string): Observable<PaymentResponseDto> {
    return this.http.get<PaymentResponseDto>(`${this.apiUrl}/create-vnpay?bookingId=${bookingId}`);
  }
}
