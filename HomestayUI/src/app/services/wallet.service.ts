import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface TransactionDto {
  id: number;
  amount: number;
  type: 'DEPOSIT' | 'WITHDRAWAL' | 'PAYMENT' | 'REFUND' | 'RECEIPT';
  description: string;
  createdAt: string;
  balanceAfter: number;
  vnpayTxnRef?: string;
}

export interface WalletDto {
  id: number;
  balance: number;
}

@Injectable({
  providedIn: 'root'
})
export class WalletService {
  private apiUrl = 'http://localhost:9999/api/wallets';

  constructor(private http: HttpClient) {}

  getMyWallet(): Observable<WalletDto> {
    return this.http.get<WalletDto>(`${this.apiUrl}/my-wallet`);
  }

  getMyTransactions(): Observable<TransactionDto[]> {
    return this.http.get<TransactionDto[]>(`${this.apiUrl}/transactions`);
  }

  createDepositUrl(amount: number): Observable<{ url: string }> {
    return this.http.post<{ url: string }>(`${this.apiUrl}/deposit`, null, {
      params: { amount: amount.toString() }
    });
  }
}
