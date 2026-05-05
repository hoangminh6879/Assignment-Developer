import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { WalletService, WalletDto, TransactionDto } from '../../services/wallet.service';
import { NotificationService } from '../../services/notification.service';

@Component({
  selector: 'app-wallet-tab',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './wallet-tab.component.html',
  styleUrls: ['./wallet-tab.component.css']
})
export class WalletTabComponent implements OnInit {
  wallet: WalletDto | null = null;
  transactions: TransactionDto[] = [];
  depositAmount: number = 50000;
  isLoading = false;

  constructor(
    private walletService: WalletService,
    private notification: NotificationService
  ) { }

  ngOnInit() {
    this.loadData();
  }

  loadData() {
    this.walletService.getMyWallet().subscribe({
      next: (data) => this.wallet = data,
      error: (err) => console.error('Failed to load wallet', err)
    });

    this.walletService.getMyTransactions().subscribe({
      next: (data) => this.transactions = data,
      error: (err) => console.error('Failed to load transactions', err)
    });
  }

  onDeposit() {
    if (this.depositAmount < 10000) {
      this.notification.error('Số tiền nạp tối thiểu là 10.000đ');
      return;
    }

    this.isLoading = true;
    this.walletService.createDepositUrl(this.depositAmount).subscribe({
      next: (res) => {
        window.location.href = res.url;
      },
      error: (err) => {
        this.notification.error('Không thể tạo yêu cầu nạp tiền');
        this.isLoading = false;
      }
    });
  }
}
