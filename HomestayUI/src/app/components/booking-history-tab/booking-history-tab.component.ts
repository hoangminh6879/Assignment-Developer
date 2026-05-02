import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BookingService, BookingDto } from '../../services/booking.service';
import { AuthService } from '../../services/auth.service';
import { NotificationService } from '../../services/notification.service';
import { ConfirmDialogService } from '../../services/confirm-dialog.service';
import { PaymentService } from '../../services/payment.service';
import { ReviewService, ReviewDto } from '../../services/review.service';

@Component({
  selector: 'app-booking-history-tab',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="booking-history-container">
      <div class="tab-header">
        <div class="header-text">
          <h3>{{ title }}</h3>
          <p>{{ subtitle }}</p>
        </div>
        
        <div class="filter-bar">
          <div class="filter-group">
            <label>Từ ngày</label>
            <input type="date" [(ngModel)]="startDateFilter" (change)="onFilterChange()">
          </div>
          <div class="filter-group">
            <label>Đến ngày</label>
            <input type="date" [(ngModel)]="endDateFilter" (change)="onFilterChange()">
          </div>
          <button class="btn-reset" (click)="resetFilters()" *ngIf="startDateFilter || endDateFilter">Đặt lại</button>
        </div>
      </div>

      <!-- Booking Details Modal -->
      <div class="modal-overlay" *ngIf="selectedBookingDetails">
        <div class="modal-content animate-fade-in">
          <button class="close-btn" (click)="closeDetails()">×</button>
          <h2>Chi tiết đơn đặt phòng</h2>
          <div class="modal-body">
            <div class="booking-summary-modal">
              <h3>Thông tin cơ bản</h3>
              <p><strong>Khách hàng:</strong> {{ selectedBookingDetails.userName || 'N/A' }}</p>
              <p><strong>Homestay:</strong> {{ selectedBookingDetails.homestayName }}</p>
              <p><strong>Phòng:</strong> {{ selectedBookingDetails.roomTypeName }} - {{ selectedBookingDetails.roomName }}</p>
              <p><strong>Thời gian:</strong> {{ selectedBookingDetails.checkInDate | date:'dd/MM/yyyy' }} - {{ selectedBookingDetails.checkOutDate | date:'dd/MM/yyyy' }}</p>
              <p><strong>Đặt lúc:</strong> {{ selectedBookingDetails.createdAt | date:'dd/MM/yyyy HH:mm' }}</p>
            </div>
            
            <div class="booking-summary-modal" style="margin-top: 20px;">
              <h3>Thông tin thanh toán & Trạng thái</h3>
              <p><strong>Tổng tiền:</strong> <span class="total-price-modal">{{ selectedBookingDetails.totalPrice | number }}đ</span></p>
              <p><strong>Hình thức thanh toán:</strong> {{ selectedBookingDetails.paymentMethod === 'VNPAY' ? 'VNPay' : 'Tại quầy' }}</p>
              <p>
                <strong>Trạng thái thanh toán:</strong> 
                <span class="badge" [ngClass]="selectedBookingDetails.paymentStatus.toLowerCase()">
                  {{ selectedBookingDetails.paymentStatus === 'PAID' ? 'Đã trả' : 'Chưa trả' }}
                </span>
                <button 
                  *ngIf="selectedBookingDetails.paymentMethod === 'VNPAY' && selectedBookingDetails.paymentStatus === 'UNPAID' && selectedBookingDetails.status === 'PENDING' && role === 'USER'"
                  class="btn-pay-now"
                  (click)="payNow(selectedBookingDetails.id)"
                  [disabled]="isPaying">
                  {{ isPaying ? 'Đang chuyển hướng...' : 'Thanh toán ngay' }}
                </button>
              </p>
              <p>
                <strong>Trạng thái đặt phòng:</strong> 
                <span class="badge status-badge" [ngClass]="selectedBookingDetails.status.toLowerCase()">
                  {{ selectedBookingDetails.status === 'CHECKED_IN' ? 'Đã nhận phòng' : selectedBookingDetails.status }}
                </span>
              </p>
            </div>

            <div class="booking-summary-modal" style="margin-top: 20px; text-align: center;" *ngIf="selectedBookingDetails.checkInCode">
              <p style="margin: 0 0 10px; color: #64748b; font-size: 13px; text-transform: uppercase; font-weight: 600;">Mã Đặt Phòng</p>
              <div style="display: inline-block; padding: 15px 30px; border-radius: 12px; background: linear-gradient(135deg, #e0e7ff 0%, #ede9fe 100%); border: 2px dashed #6366f1;">
                <span style="color: #4f46e5; font-size: 28px; font-weight: 800; letter-spacing: 4px;">{{ selectedBookingDetails.checkInCode }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="table-container" *ngIf="paginatedBookings.length > 0; else emptyState">
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
            <tr *ngFor="let b of paginatedBookings" class="table-row">
              <td *ngIf="role !== 'USER'">
                <div class="user-info">
                  <span class="user-name">{{ b.userName || 'N/A' }}</span>
                </div>
              </td>
              <td>
                <div class="homestay-info">
                  <div class="h-name-row">
                    <strong>{{ b.homestayName }}</strong>
                  </div>
                  <div class="room-row">
                    <span>🛏️ {{ b.roomTypeName }} - {{ b.roomName }}</span>
                  </div>
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
                  {{ translateStatus(b.status) }}
                </span>
              </td>
              <td class="actions-col">
                <div class="action-buttons">
                  <button class="btn-action btn-view" (click)="viewDetails(b)">Chi tiết</button>
                  <button 
                    *ngIf="role === 'HOST' && b.status === 'PENDING'" 
                    class="btn-action btn-approve" 
                    (click)="approve(b.id)">
                    Duyệt
                  </button>
                  <button 
                    *ngIf="(role === 'USER' || role === 'HOST') && b.status !== 'CANCELLED' && b.status !== 'COMPLETED' && b.status !== 'CHECKED_IN'" 
                    class="btn-action btn-cancel" 
                    (click)="cancel(b.id)">
                    {{ role === 'USER' ? 'Hủy đặt' : 'Từ chối' }}
                  </button>
                  
                  <!-- Review Button for User -->
                  <button 
                    *ngIf="role === 'USER' && b.status === 'COMPLETED' && !b.review" 
                    class="btn-action btn-review" 
                    (click)="openReviewModal(b)">
                    Đánh giá
                  </button>

                  <!-- Response Button for Host -->
                  <button 
                    *ngIf="role === 'HOST' && b.status === 'COMPLETED' && b.review && !b.review.response" 
                    class="btn-action btn-response" 
                    (click)="openResponseModal(b)">
                    Phản hồi
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Review Modal (User) -->
      <div class="modal-overlay" *ngIf="showReviewModal">
        <div class="modal-content animate-fade-in" style="max-width: 500px;">
          <button class="close-btn" (click)="closeReviewModal()">×</button>
          <h2>Đánh giá Homestay</h2>
          <div class="review-form">
            <div class="form-group">
              <label>Xếp hạng sao</label>
              <div class="star-rating">
                <span *ngFor="let s of [1,2,3,4,5]" (click)="reviewRating = s" [class.active]="reviewRating >= s">★</span>
              </div>
            </div>
            <div class="form-group">
              <label>Bình luận</label>
              <textarea [(ngModel)]="reviewComment" placeholder="Chia sẻ trải nghiệm của bạn..." class="review-textarea"></textarea>
            </div>
            <div class="form-group">
              <label>Hình ảnh đi kèm</label>
              <input type="file" (change)="onReviewFilesSelected($event)" multiple accept="image/*" class="review-file-input">
              <div class="image-preview-list" *ngIf="reviewImagePreviews.length > 0">
                <img *ngFor="let p of reviewImagePreviews" [src]="p" alt="Preview">
              </div>
            </div>
            <div class="modal-footer" style="margin-top: 20px;">
              <button class="btn-cancel" (click)="closeReviewModal()">Hủy</button>
              <button class="btn-confirm-final" [disabled]="!reviewRating || isSubmittingReview" (click)="submitReview()">
                {{ isSubmittingReview ? 'Đang gửi...' : 'Gửi đánh giá' }}
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Response Modal (Host) -->
      <div class="modal-overlay" *ngIf="showResponseModal">
        <div class="modal-content animate-fade-in" style="max-width: 500px;">
          <button class="close-btn" (click)="closeResponseModal()">×</button>
          <h2>Phản hồi khách hàng</h2>
          <div class="response-form">
            <div class="review-summary-card" *ngIf="selectedBookingForReview?.review">
              <div class="q-header">
                <strong>{{ selectedBookingForReview?.userName }}</strong>
                <span>★ {{ selectedBookingForReview?.review?.rating }}</span>
              </div>
              <p>"{{ selectedBookingForReview?.review?.comment }}"</p>
            </div>
            <div class="form-group" style="margin-top: 20px;">
              <label>Nội dung phản hồi</label>
              <textarea [(ngModel)]="hostResponse" placeholder="Cảm ơn khách hàng hoặc phản hồi góp ý..." class="review-textarea"></textarea>
            </div>
            <div class="modal-footer" style="margin-top: 20px;">
              <button class="btn-cancel" (click)="closeResponseModal()">Hủy</button>
              <button class="btn-confirm-final" [disabled]="!hostResponse || isSubmittingResponse" (click)="submitResponse()">
                {{ isSubmittingResponse ? 'Đang gửi...' : 'Gửi phản hồi' }}
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Pagination Controls -->
      <div class="pagination-controls" *ngIf="totalPages > 1">
        <button class="page-btn" [disabled]="currentPage === 1" (click)="changePage(currentPage - 1)">Trang trước</button>
        <span class="page-info">Trang {{ currentPage }} / {{ totalPages }}</span>
        <button class="page-btn" [disabled]="currentPage === totalPages" (click)="changePage(currentPage + 1)">Trang sau</button>
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
    .tab-header { margin-bottom: 25px; border-bottom: 1px solid #f1f5f9; padding-bottom: 20px; display: flex; justify-content: space-between; align-items: flex-end; flex-wrap: wrap; gap: 20px; }
    .header-text h3 { font-size: 22px; color: #0f172a; margin: 0 0 5px 0; font-weight: 800; }
    .header-text p { color: #64748b; font-size: 14px; margin: 0; }

    .filter-bar { display: flex; gap: 15px; align-items: flex-end; background: #f8fafc; padding: 12px 20px; border-radius: 12px; border: 1px solid #e2e8f0; }
    .filter-group { display: flex; flex-direction: column; gap: 5px; }
    .filter-group label { font-size: 11px; font-weight: 700; color: #64748b; text-transform: uppercase; }
    .filter-group input { padding: 8px 12px; border: 1px solid #cbd5e1; border-radius: 8px; font-size: 13px; color: #1e293b; outline: none; }
    .filter-group input:focus { border-color: #4f46e5; box-shadow: 0 0 0 3px rgba(79,70,229,0.1); }
    .btn-reset { background: none; border: none; color: #ef4444; font-size: 13px; font-weight: 600; cursor: pointer; padding: 8px; }

    .table-container { background: white; border-radius: 16px; border: 1px solid #e2e8f0; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); overflow: hidden; }
    .modern-table { width: 100%; border-collapse: collapse; }
    .modern-table th { background: #f8fafc; padding: 18px 20px; font-size: 12px; font-weight: 700; color: #475569; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 1px solid #e2e8f0; }
    .modern-table td { padding: 20px; border-bottom: 1px solid #f1f5f9; vertical-align: middle; }
    
    .homestay-info { display: flex; flex-direction: column; gap: 8px; }
    .h-name-row { display: flex; align-items: flex-start; justify-content: space-between; gap: 10px; }
    .h-name-row strong { color: #0f172a; font-size: 15px; font-weight: 700; line-height: 1.4; }
    .room-row { font-size: 13px; color: #64748b; font-weight: 500; }
    
    .date-info { font-size: 13px; color: #334155; }
    .created-at { color: #94a3b8; font-size: 11px; }
    
    .price-info .price { display: block; font-weight: 700; color: #4f46e5; }
    .price-info .method { font-size: 11px; color: #64748b; }
    
    .badge { padding: 4px 12px; border-radius: 999px; font-size: 11px; font-weight: 700; text-transform: uppercase; white-space: nowrap; display: inline-block; }
    .paid { background: #dcfce7; color: #166534; }
    .unpaid { background: #fee2e2; color: #991b1b; }
    
    .status-badge.pending { background: #fffbeb; color: #92400e; }
    .status-badge.confirmed { background: #e0e7ff; color: #4338ca; }
    .status-badge.cancelled { background: #f1f5f9; color: #475569; }
    
    .actions-col { text-align: right; }
    .action-buttons { display: flex; gap: 8px; justify-content: flex-end; }
    .btn-action { padding: 6px 12px; border: none; border-radius: 6px; font-size: 12px; font-weight: 600; cursor: pointer; transition: all 0.2s; }
    .btn-view { background: #e0e7ff; color: #4f46e5; }
    .btn-view:hover { background: #c7d2fe; }
    .btn-approve { background: #10b981; color: white; }
    .btn-approve:hover { background: #059669; }
    .btn-cancel { background: #f1f5f9; color: #ef4444; border: 1px solid #fee2e2; }
    .btn-cancel:hover { background: #fee2e2; }

    .code-badge { background: #eef2ff; color: #4f46e5; border: 1px solid #c7d2fe; padding: 3px 8px; border-radius: 6px; font-size: 11px; font-family: 'JetBrains Mono', monospace; font-weight: 700; white-space: nowrap; }
    
    .status-badge { min-width: 100px; text-align: center; }
    .status-badge.pending { background: #fff7ed; color: #c2410c; border: 1px solid #ffedd5; }
    .status-badge.confirmed { background: #eff6ff; color: #1d4ed8; border: 1px solid #dbeafe; }
    .status-badge.cancelled { background: #fef2f2; color: #991b1b; border: 1px solid #fee2e2; }
    .status-badge.completed { background: #f0fdf4; color: #15803d; border: 1px solid #dcfce7; }
    .status-badge.checked_in { background: #fdf4ff; color: #701a75; border: 1px solid #fae8ff; }

    /* Pagination */
    .pagination-controls { display: flex; justify-content: center; align-items: center; gap: 15px; margin-top: 25px; }
    .page-btn { padding: 8px 16px; background: white; border: 1px solid #e2e8f0; border-radius: 8px; color: #475569; font-weight: 600; cursor: pointer; transition: all 0.2s; }
    .page-btn:hover:not(:disabled) { background: #f8fafc; border-color: #cbd5e1; }
    .page-btn:disabled { opacity: 0.5; cursor: not-allowed; }
    .page-info { font-size: 14px; font-weight: 600; color: #1e293b; }

    .empty-state { text-align: center; padding: 60px; color: #94a3b8; }
    .empty-state .icon { font-size: 40px; display: block; margin-bottom: 10px; }

    /* Modal Styles */
    .modal-overlay { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); z-index: 1000; display: flex; align-items: flex-start; justify-content: center; backdrop-filter: blur(4px); padding-top: 50px; overflow-y: auto; }
    .modal-content { background: white; border-radius: 24px; padding: 30px; width: 90%; max-width: 600px; max-height: 90vh; overflow-y: auto; position: relative; box-shadow: 0 20px 25px -5px rgba(0,0,0,0.1); }
    .close-btn { position: absolute; top: 20px; right: 20px; background: none; border: none; font-size: 28px; cursor: pointer; color: #64748b; line-height: 1; transition: color 0.2s; }
    .close-btn:hover { color: #0f172a; }
    .modal-content h2 { margin: 0 0 20px; font-size: 20px; color: #0f172a; border-bottom: 1px solid #e2e8f0; padding-bottom: 15px;}
    .booking-summary-modal { background: #f8fafc; padding: 20px; border-radius: 16px; border: 1px solid #e2e8f0; }
    .booking-summary-modal h3 { margin: 0 0 15px; font-size: 15px; color: #1e293b; text-transform: uppercase; letter-spacing: 0.5px;}
    .booking-summary-modal p { margin: 0 0 10px; color: #475569; font-size: 14px; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 10px;}
    .booking-summary-modal strong { color: #0f172a; }
    .total-price-modal { font-size: 18px; font-weight: 800; color: #ef4444; }

    .btn-pay-now { background: #ef4444; color: white; border: none; padding: 6px 12px; border-radius: 6px; font-weight: 600; cursor: pointer; transition: all 0.2s; font-size: 12px; margin-left: 10px;}
    .btn-pay-now:hover:not(:disabled) { background: #dc2626; transform: translateY(-1px); box-shadow: 0 2px 4px rgba(239,68,68,0.2); }
    .btn-pay-now:disabled { opacity: 0.7; cursor: not-allowed; }

    .btn-review { background: #10b981; color: white; }
    .btn-review:hover { background: #059669; }
    .btn-response { background: #4f46e5; color: white; }
    .btn-response:hover { background: #4338ca; }

    .star-rating { display: flex; gap: 10px; font-size: 32px; color: #e2e8f0; cursor: pointer; margin: 10px 0; }
    .star-rating span.active { color: #f39c12; }
    .review-textarea { width: 100%; min-height: 120px; padding: 15px; border: 1px solid #e2e8f0; border-radius: 12px; font-family: inherit; resize: vertical; box-sizing: border-box;}
    .review-textarea:focus { outline: none; border-color: #4f46e5; }
    .review-file-input { margin-top: 10px; }
    .image-preview-list { display: flex; gap: 10px; flex-wrap: wrap; margin-top: 15px; }
    .image-preview-list img { width: 80px; height: 80px; object-fit: cover; border-radius: 10px; border: 2px solid #f1f5f9; }
    
    .review-summary-card { background: #f8fafc; padding: 15px; border-radius: 12px; border-left: 4px solid #f39c12; }
    .q-header { display: flex; justify-content: space-between; margin-bottom: 8px; }
    .q-header strong { color: #1e293b; }
    .q-header span { color: #d97706; font-weight: 700; }
    .review-summary-card p { margin: 0; font-style: italic; color: #475569; font-size: 14px; }

    @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
  `]
})
export class BookingHistoryTabComponent implements OnInit {
  @Input() role: 'USER' | 'HOST' | 'ADMIN' = 'USER';
  bookings: BookingDto[] = [];
  paginatedBookings: BookingDto[] = [];
  title = 'Lịch sử đặt phòng';
  subtitle = 'Xem danh sách các đơn đặt phòng của bạn';

  // Pagination state
  currentPage = 1;
  pageSize = 5;
  totalPages = 1;

  // Details Modal state
  selectedBookingDetails: BookingDto | null = null;
  isPaying = false;

  // Filters
  startDateFilter = '';
  endDateFilter = '';
  filteredBookings: BookingDto[] = [];

  // Review state
  showReviewModal = false;
  selectedBookingForReview: BookingDto | null = null;
  reviewRating = 0;
  reviewComment = '';
  reviewImages: File[] = [];
  reviewImagePreviews: string[] = [];
  isSubmittingReview = false;

  // Response state
  showResponseModal = false;
  hostResponse = '';
  isSubmittingResponse = false;

  constructor(
    private bookingService: BookingService,
    private reviewService: ReviewService,
    private notification: NotificationService,
    private confirmDialog: ConfirmDialogService,
    private paymentService: PaymentService
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

    obs.subscribe(data => {
      // Sort by newest first
      this.bookings = data.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      this.applyFilters();
    });
  }

  onFilterChange() {
    this.currentPage = 1;
    this.applyFilters();
  }

  resetFilters() {
    this.startDateFilter = '';
    this.endDateFilter = '';
    this.onFilterChange();
  }

  applyFilters() {
    let result = [...this.bookings];

    if (this.startDateFilter) {
      const start = new Date(this.startDateFilter);
      start.setHours(0, 0, 0, 0);
      result = result.filter(b => new Date(b.checkInDate) >= start);
    }

    if (this.endDateFilter) {
      const end = new Date(this.endDateFilter);
      end.setHours(23, 59, 59, 999);
      result = result.filter(b => new Date(b.checkInDate) <= end);
    }

    this.filteredBookings = result;
    this.updatePagination();
  }

  updatePagination() {
    this.totalPages = Math.ceil(this.filteredBookings.length / this.pageSize);
    if (this.totalPages === 0) this.totalPages = 1;
    if (this.currentPage > this.totalPages) this.currentPage = this.totalPages;
    
    const start = (this.currentPage - 1) * this.pageSize;
    const end = start + this.pageSize;
    this.paginatedBookings = this.filteredBookings.slice(start, end);
  }

  translateStatus(status: string): string {
    const map: any = {
      'PENDING': 'Chờ duyệt',
      'CONFIRMED': 'Đã xác nhận',
      'CANCELLED': 'Đã hủy',
      'COMPLETED': 'Hoàn thành',
      'REFUNDED': 'Đã hoàn tiền',
      'CHECKED_IN': 'Đã nhận phòng'
    };
    return map[status] || status;
  }

  changePage(page: number) {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.updatePagination();
    }
  }

  viewDetails(booking: BookingDto) {
    this.selectedBookingDetails = booking;
  }

  closeDetails() {
    this.selectedBookingDetails = null;
  }

  payNow(bookingId: string) {
    this.isPaying = true;
    this.paymentService.createVNPayUrl(bookingId).subscribe({
      next: (res) => {
        if (res.url) {
          window.location.href = res.url;
        } else {
          this.notification.error('Không lấy được URL thanh toán');
          this.isPaying = false;
        }
      },
      error: (err) => {
        this.notification.error(err.error?.message || 'Có lỗi xảy ra khi tạo link thanh toán');
        this.isPaying = false;
      }
    });
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

  // REVIEW LOGIC
  openReviewModal(booking: BookingDto) {
    this.selectedBookingForReview = booking;
    this.showReviewModal = true;
    this.reviewRating = 0;
    this.reviewComment = '';
    this.reviewImages = [];
    this.reviewImagePreviews = [];
  }

  closeReviewModal() {
    this.showReviewModal = false;
    this.selectedBookingForReview = null;
  }

  onReviewFilesSelected(event: any) {
    if (event.target.files) {
      this.reviewImages = Array.from(event.target.files);
      this.reviewImagePreviews = [];
      this.reviewImages.forEach(file => {
        const reader = new FileReader();
        reader.onload = (e: any) => this.reviewImagePreviews.push(e.target.result);
        reader.readAsDataURL(file);
      });
    }
  }

  submitReview() {
    if (!this.selectedBookingForReview) return;
    this.isSubmittingReview = true;
    
    const formData = new FormData();
    formData.append('bookingId', this.selectedBookingForReview.id);
    formData.append('rating', this.reviewRating.toString());
    formData.append('comment', this.reviewComment);
    this.reviewImages.forEach(file => formData.append('images', file));

    this.reviewService.createReview(formData).subscribe({
      next: () => {
        this.notification.success('Đã gửi đánh giá thành công!');
        this.closeReviewModal();
        this.loadBookings();
        this.isSubmittingReview = false;
      },
      error: (err) => {
        this.notification.error(err.error?.message || 'Có lỗi xảy ra khi gửi đánh giá');
        this.isSubmittingReview = false;
      }
    });
  }

  // RESPONSE LOGIC
  openResponseModal(booking: BookingDto) {
    this.selectedBookingForReview = booking;
    this.showResponseModal = true;
    this.hostResponse = '';
  }

  closeResponseModal() {
    this.showResponseModal = false;
    this.selectedBookingForReview = null;
  }

  submitResponse() {
    if (!this.selectedBookingForReview?.review) return;
    this.isSubmittingResponse = true;

    this.reviewService.respondToReview(this.selectedBookingForReview.review.id, this.hostResponse).subscribe({
      next: () => {
        this.notification.success('Đã gửi phản hồi thành công!');
        this.closeResponseModal();
        this.loadBookings();
        this.isSubmittingResponse = false;
      },
      error: (err) => {
        this.notification.error(err.error?.message || 'Có lỗi xảy ra khi gửi phản hồi');
        this.isSubmittingResponse = false;
      }
    });
  }
}
