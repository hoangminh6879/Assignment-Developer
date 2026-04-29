import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BookingService, BookingDto } from '../../services/booking.service';
import { AuthService } from '../../services/auth.service';
import { NotificationService } from '../../services/notification.service';
import { ConfirmDialogService } from '../../services/confirm-dialog.service';

@Component({
  selector: 'app-booking-history-tab',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="booking-history-container">
      <div class="tab-header">
        <h3>{{ title }}</h3>
        <p>{{ subtitle }}</p>
      </div>

      <div class="table-container" *ngIf="bookings.length > 0; else emptyState">
        <table class="modern-table">
          <thead>
            <tr>
              <th *ngIf="role !== 'USER'">Khách hàng</th>
              <th>Homestay / Phòng</th>
              <th>Thời gian</th>
              <th>Tổng tiền</th>
              <th>Thanh toán</th>
              <th>Trạng thái</th>
              <th class="actions-col">Hành động</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let b of bookings" class="table-row">
              <td *ngIf="role !== 'USER'">
                <div class="user-info">
                  <span class="user-name">{{ b.userName || 'N/A' }}</span>
                </div>
              </td>
              <td>
                <div class="homestay-info">
                  <strong>{{ b.homestayName }}</strong>
                  <span>{{ b.roomTypeName }} - {{ b.roomName }}</span>
                </div>
              </td>
              <td>
                <div class="date-info">
                  <div>{{ b.checkInDate | date:'dd/MM/yyyy' }} - {{ b.checkOutDate | date:'dd/MM/yyyy' }}</div>
                  <small class="created-at">Đặt lúc: {{ b.createdAt | date:'dd/MM/yyyy HH:mm' }}</small>
                </div>
              </td>
              <td>
                <div class="price-info">
                  <span class="price">{{ b.totalPrice | number }}đ</span>
                  <small class="method">{{ b.paymentMethod === 'VNPAY' ? 'VNPay' : 'Tại quầy' }}</small>
                </div>
              </td>
              <td>
                <span class="badge" [ngClass]="b.paymentStatus.toLowerCase()">
                  {{ b.paymentStatus === 'PAID' ? 'Đã trả' : 'Chưa trả' }}
                </span>
              </td>
              <td>
                <span class="badge status-badge" [ngClass]="b.status.toLowerCase()">
                  {{ b.status }}
                </span>
              </td>
              <td class="actions-col">
                <div class="action-buttons">
                  <button 
                    *ngIf="role === 'HOST' && b.status === 'PENDING'" 
                    class="btn-action btn-approve" 
                    (click)="approve(b.id)">
                    Duyệt
                  </button>
                  <button 
                    *ngIf="(role === 'USER' || role === 'HOST') && b.status !== 'CANCELLED'" 
                    class="btn-action btn-cancel" 
                    (click)="cancel(b.id)">
                    {{ role === 'USER' ? 'Hủy đặt' : 'Từ chối' }}
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <ng-template #emptyState>
        <div class="empty-state">
          <span class="icon">📅</span>
          <p>Chưa có đơn đặt phòng nào.</p>
        </div>
      </ng-template>
    </div>
  `,
  styles: [`
    .booking-history-container { animation: fadeIn 0.4s ease-out; }
    .tab-header { margin-bottom: 25px; border-bottom: 1px solid #f1f5f9; padding-bottom: 15px; }
    .tab-header h3 { font-size: 20px; color: #1e293b; margin: 0 0 5px 0; font-weight: 700; }
    .tab-header p { color: #64748b; font-size: 14px; margin: 0; }

    .table-container { overflow-x: auto; border: 1px solid #e2e8f0; border-radius: 12px; }
    .modern-table { width: 100%; border-collapse: collapse; text-align: left; }
    .modern-table th { background: #f8fafc; padding: 15px; font-size: 13px; font-weight: 600; color: #64748b; text-transform: uppercase; border-bottom: 1px solid #e2e8f0; }
    .modern-table td { padding: 15px; border-bottom: 1px solid #f1f5f9; vertical-align: middle; }
    
    .homestay-info strong { display: block; color: #1e293b; font-size: 14px; }
    .homestay-info span { font-size: 12px; color: #64748b; }
    
    .date-info { font-size: 13px; color: #334155; }
    .created-at { color: #94a3b8; font-size: 11px; }
    
    .price-info .price { display: block; font-weight: 700; color: #4f46e5; }
    .price-info .method { font-size: 11px; color: #64748b; }
    
    .badge { padding: 4px 10px; border-radius: 999px; font-size: 11px; font-weight: 700; text-transform: uppercase; }
    .paid { background: #dcfce7; color: #166534; }
    .unpaid { background: #fee2e2; color: #991b1b; }
    
    .status-badge.pending { background: #fffbeb; color: #92400e; }
    .status-badge.confirmed { background: #e0e7ff; color: #4338ca; }
    .status-badge.cancelled { background: #f1f5f9; color: #475569; }
    
    .actions-col { text-align: right; }
    .action-buttons { display: flex; gap: 8px; justify-content: flex-end; }
    .btn-action { padding: 6px 12px; border: none; border-radius: 6px; font-size: 12px; font-weight: 600; cursor: pointer; transition: all 0.2s; }
    .btn-approve { background: #10b981; color: white; }
    .btn-approve:hover { background: #059669; }
    .btn-cancel { background: #f1f5f9; color: #ef4444; border: 1px solid #fee2e2; }
    .btn-cancel:hover { background: #fee2e2; }

    .empty-state { text-align: center; padding: 60px; color: #94a3b8; }
    .empty-state .icon { font-size: 40px; display: block; margin-bottom: 10px; }

    @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
  `]
})
export class BookingHistoryTabComponent implements OnInit {
  @Input() role: 'USER' | 'HOST' | 'ADMIN' = 'USER';
  bookings: BookingDto[] = [];
  title = 'Lịch sử đặt phòng';
  subtitle = 'Xem danh sách các đơn đặt phòng của bạn';

  constructor(
    private bookingService: BookingService,
    private notification: NotificationService,
    private confirmDialog: ConfirmDialogService
  ) {}

  ngOnInit() {
    this.loadBookings();
    if (this.role === 'ADMIN') {
      this.title = 'Quản lý đơn hàng';
      this.subtitle = 'Theo dõi tất cả đơn đặt phòng trong hệ thống';
    } else if (this.role === 'HOST') {
      this.title = 'Quản lý đặt phòng';
      this.subtitle = 'Danh sách khách hàng đặt homestay của bạn';
    }
  }

  loadBookings() {
    let obs;
    if (this.role === 'ADMIN') obs = this.bookingService.getAllBookings();
    else if (this.role === 'HOST') obs = this.bookingService.getHostBookings();
    else obs = this.bookingService.getMyBookings();

    obs.subscribe(data => this.bookings = data);
  }

  async approve(id: string) {
    const ok = await this.confirmDialog.confirm({
      title: 'Xác nhận duyệt',
      message: 'Bạn có chắc chắn muốn duyệt đơn đặt phòng này?',
      type: 'info',
      confirmText: 'Duyệt ngay'
    });
    if (!ok) return;

    this.bookingService.approveBooking(id).subscribe({
      next: () => {
        this.notification.success('Đã duyệt đơn đặt phòng thành công!');
        this.loadBookings();
      },
      error: (err) => this.notification.error(err.error?.message || 'Có lỗi xảy ra')
    });
  }

  async cancel(id: string) {
    const isUser = this.role === 'USER';
    const ok = await this.confirmDialog.confirm({
      title: isUser ? 'Xác nhận hủy' : 'Xác nhận từ chối',
      message: isUser ? 'Bạn có chắc chắn muốn hủy đơn đặt phòng này?' : 'Bạn có chắc chắn muốn từ chối đơn đặt phòng này?',
      type: 'danger',
      confirmText: isUser ? 'Hủy đặt phòng' : 'Từ chối'
    });
    if (!ok) return;

    this.bookingService.cancelBooking(id).subscribe({
      next: () => {
        this.notification.success(isUser ? 'Đã hủy đơn thành công!' : 'Đã từ chối đơn đặt phòng!');
        this.loadBookings();
      },
      error: (err) => this.notification.error(err.error?.message || 'Có lỗi xảy ra')
    });
  }
}
