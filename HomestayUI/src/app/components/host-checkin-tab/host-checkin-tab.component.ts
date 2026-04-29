import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BookingService, BookingDto } from '../../services/booking.service';
import { NotificationService } from '../../services/notification.service';

interface CheckoutState {
  showForm: boolean;
  citizenIdInput: string;
  confirmPayment: boolean;
  isProcessing: boolean;
}

@Component({
  selector: 'app-host-checkin-tab',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="checkin-container animate-fade-in">

      <!-- Sub-tabs -->
      <div class="sub-tabs">
        <button class="sub-tab" [class.active]="activeSubTab === 'search'" (click)="activeSubTab = 'search'">
          🔍 Tìm kiếm & Check-in
        </button>
        <button class="sub-tab" [class.active]="activeSubTab === 'list'" (click)="switchToList()">
          📋 Danh sách đã nhận phòng
          <span class="badge-count" *ngIf="checkedInBookings.length > 0">{{ checkedInBookings.length }}</span>
        </button>
      </div>

      <!-- ===== TAB 1: SEARCH & CHECK-IN ===== -->
      <div *ngIf="activeSubTab === 'search'">
        <div class="header-section">
          <div class="icon-wrapper">🔑</div>
          <div class="text-wrapper">
            <h2>Xác nhận nhận phòng (Check-in)</h2>
            <p>Nhập số CCCD/CMND của khách để tìm đơn đặt phòng và xác nhận check-in.</p>
          </div>
        </div>

        <div class="search-card">
          <div class="input-group">
            <input type="text" [(ngModel)]="citizenIdInput" placeholder="Nhập số CCCD/CMND của khách hàng" class="main-input" (keyup.enter)="searchByCitizenId()">
            <button class="btn-search" (click)="searchByCitizenId()" [disabled]="!citizenIdInput || isLoading">
              {{ isLoading ? '⏳ Đang tìm...' : '🔍 Tìm kiếm' }}
            </button>
          </div>
        </div>

        <div *ngIf="searched">
          <div *ngIf="foundBookings.length === 0" class="empty-result">
            <span class="empty-icon">🔎</span>
            <p>Không tìm thấy đơn đặt phòng hợp lệ cho số CCCD/CMND này.</p>
            <small>Chỉ hiển thị đơn đang chờ duyệt hoặc đã xác nhận tại Homestay của bạn.</small>
          </div>

          <div *ngFor="let b of foundBookings" class="result-card">
            <div class="result-card-header">
              <div>
                <div class="guest-name">👤 {{ b.userName }}</div>
                <div class="booking-code">Mã: {{ b.checkInCode }}</div>
              </div>
              <span class="status-pill" [ngClass]="b.status.toLowerCase()">
                {{ b.status === 'CONFIRMED' ? 'Đã xác nhận' : 'Chờ duyệt' }}
              </span>
            </div>
            <div class="result-card-body">
              <div class="info-row"><span>🏠 Homestay</span><strong>{{ b.homestayName }}</strong></div>
              <div class="info-row"><span>🛏️ Phòng</span><strong>{{ b.roomTypeName }} - {{ b.roomName }}</strong></div>
              <div class="info-row"><span>📅 Ngày</span><strong>{{ b.checkInDate | date:'dd/MM/yyyy' }} → {{ b.checkOutDate | date:'dd/MM/yyyy' }}</strong></div>
              <div class="info-row"><span>💰 Tổng tiền</span><strong class="price">{{ b.totalPrice | number }}đ</strong></div>
            </div>
            <div class="result-card-footer">
              <button class="btn-checkin" (click)="confirmCheckIn(b)" [disabled]="confirmingId === b.id.toString()">
                {{ confirmingId === b.id.toString() ? '⏳ Đang xử lý...' : '✅ Xác nhận đã nhận phòng' }}
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- ===== TAB 2: CHECKED-IN LIST & CHECKOUT ===== -->
      <div *ngIf="activeSubTab === 'list'">
        <div class="header-section" style="background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);">
          <div class="icon-wrapper">🏨</div>
          <div class="text-wrapper">
            <h2>Danh sách đang lưu trú</h2>
            <p>Các khách đã check-in, nhấn Checkout khi khách trả phòng.</p>
          </div>
        </div>

        <div *ngIf="listLoading" class="loading-state">
          <div class="spinner"></div>
          <p>Đang tải danh sách...</p>
        </div>

        <div *ngIf="!listLoading && checkedInBookings.length === 0" class="empty-result">
          <span class="empty-icon">🏖️</span>
          <p>Hiện không có khách nào đang lưu trú.</p>
        </div>

        <div *ngFor="let b of checkedInBookings" class="checkout-card">
          <div class="checkout-card-header">
            <div class="guest-info">
              <div class="guest-name">👤 {{ b.userName }}</div>
              <div class="booking-code">Mã: {{ b.checkInCode }}</div>
            </div>
            <div class="payment-info">
              <span class="payment-pill" [ngClass]="b.paymentStatus === 'PAID' ? 'paid' : 'unpaid'">
                {{ b.paymentStatus === 'PAID' ? '✅ Đã thanh toán' : '⚠️ Chưa thanh toán' }}
              </span>
            </div>
          </div>

          <div class="checkout-card-body">
            <div class="info-row"><span>🏠 Homestay</span><strong>{{ b.homestayName }}</strong></div>
            <div class="info-row"><span>🛏️ Phòng</span><strong>{{ b.roomTypeName }} - {{ b.roomName }}</strong></div>
            <div class="info-row"><span>📅 Ngày</span><strong>{{ b.checkInDate | date:'dd/MM/yyyy' }} → {{ b.checkOutDate | date:'dd/MM/yyyy' }}</strong></div>
            <div class="info-row"><span>💰 Tổng tiền</span><strong class="price">{{ b.totalPrice | number }}đ</strong></div>
          </div>

          <!-- Checkout Form (inline) -->
          <div *ngIf="!getCheckoutState(b.id.toString()).showForm" class="checkout-card-footer">
            <button class="btn-checkout" (click)="openCheckoutForm(b.id.toString())">
              🚪 Checkout
            </button>
          </div>

          <div *ngIf="getCheckoutState(b.id.toString()).showForm" class="checkout-form">
            <h4>Xác minh danh tính khách hàng</h4>
            <div class="form-row">
              <input 
                type="text" 
                [(ngModel)]="getCheckoutState(b.id.toString()).citizenIdInput" 
                placeholder="Nhập số CCCD/CMND của khách"
                class="cccd-input">
            </div>
            <div class="form-row payment-confirm" *ngIf="b.paymentStatus === 'UNPAID'">
              <label class="checkbox-label">
                <input type="checkbox" [(ngModel)]="getCheckoutState(b.id.toString()).confirmPayment">
                <span>Xác nhận khách đã thanh toán tiền mặt ({{ b.totalPrice | number }}đ)</span>
              </label>
            </div>
            <div class="form-actions">
              <button class="btn-cancel-form" (click)="cancelCheckout(b.id.toString())">Hủy</button>
              <button 
                class="btn-confirm-checkout"
                [class.needs-payment]="b.paymentStatus === 'UNPAID'"
                (click)="performCheckout(b)"
                [disabled]="getCheckoutState(b.id.toString()).isProcessing || !getCheckoutState(b.id.toString()).citizenIdInput">
                <span *ngIf="!getCheckoutState(b.id.toString()).isProcessing">
                  {{ b.paymentStatus === 'UNPAID' ? '💵 Xác nhận TT & Checkout' : '✅ Xác nhận Checkout' }}
                </span>
                <span *ngIf="getCheckoutState(b.id.toString()).isProcessing">⏳ Đang xử lý...</span>
              </button>
            </div>
          </div>
        </div>
      </div>

    </div>
  `,
  styles: [`
    .animate-fade-in { animation: fadeIn 0.3s ease-out; }
    @keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }

    .checkin-container { max-width: 860px; margin: 0 auto; padding: 10px 0; }

    /* Sub tabs */
    .sub-tabs { display: flex; gap: 8px; margin-bottom: 24px; background: #f1f5f9; padding: 6px; border-radius: 12px; }
    .sub-tab { flex: 1; padding: 12px 20px; border: none; background: none; border-radius: 8px; font-size: 14px; font-weight: 600; cursor: pointer; color: #64748b; transition: all 0.2s; display: flex; align-items: center; justify-content: center; gap: 8px; }
    .sub-tab.active { background: white; color: #4f46e5; box-shadow: 0 2px 8px rgba(0,0,0,0.08); }
    .badge-count { background: #ef4444; color: white; border-radius: 999px; padding: 2px 7px; font-size: 11px; }

    /* Header */
    .header-section { display: flex; align-items: center; gap: 20px; margin-bottom: 24px; background: linear-gradient(135deg, #4f46e5 0%, #3b82f6 100%); padding: 24px; border-radius: 16px; color: white; box-shadow: 0 8px 20px -5px rgba(79,70,229,0.3); }
    .icon-wrapper { font-size: 40px; background: rgba(255,255,255,0.2); padding: 12px; border-radius: 12px; }
    .text-wrapper h2 { margin: 0 0 4px; font-size: 20px; font-weight: 700; }
    .text-wrapper p { margin: 0; font-size: 14px; opacity: 0.9; }

    /* Search section */
    .search-card { background: white; border-radius: 14px; padding: 24px; border: 1px solid #e2e8f0; margin-bottom: 20px; box-shadow: 0 2px 8px rgba(0,0,0,0.04); }
    .input-group { display: flex; gap: 12px; }
    .main-input { flex: 1; padding: 14px 18px; font-size: 15px; border: 2px solid #e2e8f0; border-radius: 10px; outline: none; transition: all 0.2s; }
    .main-input:focus { border-color: #4f46e5; box-shadow: 0 0 0 3px rgba(79,70,229,0.1); }
    .btn-search { background: #4f46e5; color: white; border: none; padding: 0 24px; border-radius: 10px; font-size: 14px; font-weight: 600; cursor: pointer; transition: all 0.2s; white-space: nowrap; }
    .btn-search:hover:not(:disabled) { background: #4338ca; transform: translateY(-1px); }
    .btn-search:disabled { opacity: 0.6; cursor: not-allowed; }

    /* Empty / Loading */
    .empty-result { text-align: center; padding: 50px 20px; background: white; border-radius: 14px; border: 1px dashed #e2e8f0; color: #94a3b8; }
    .empty-icon { font-size: 48px; display: block; margin-bottom: 12px; }
    .loading-state { text-align: center; padding: 50px; color: #94a3b8; }
    .spinner { width: 40px; height: 40px; border: 4px solid #e2e8f0; border-top-color: #4f46e5; border-radius: 50%; animation: spin 0.8s linear infinite; margin: 0 auto 12px; }
    @keyframes spin { to { transform: rotate(360deg); } }

    /* Result card (check-in search result) */
    .result-card { background: white; border-radius: 14px; border: 1px solid #e2e8f0; margin-bottom: 16px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.04); }
    .result-card-header { display: flex; justify-content: space-between; align-items: center; padding: 18px 20px; background: #f8fafc; border-bottom: 1px solid #f1f5f9; }
    .result-card-body { padding: 18px 20px; }
    .result-card-footer { padding: 16px 20px; background: #f8fafc; border-top: 1px solid #f1f5f9; }

    /* Checkout card */
    .checkout-card { background: white; border-radius: 14px; border: 1px solid #e2e8f0; margin-bottom: 16px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.04); transition: box-shadow 0.2s; }
    .checkout-card:hover { box-shadow: 0 4px 16px rgba(0,0,0,0.08); }
    .checkout-card-header { display: flex; justify-content: space-between; align-items: center; padding: 18px 20px; background: linear-gradient(135deg, #f8fafc, #f1f5f9); border-bottom: 1px solid #e2e8f0; }
    .checkout-card-body { padding: 18px 20px; display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
    .checkout-card-footer { padding: 16px 20px; background: #f8fafc; border-top: 1px solid #f1f5f9; }

    /* Shared info rows */
    .guest-name { font-size: 16px; font-weight: 700; color: #0f172a; }
    .booking-code { font-family: monospace; font-size: 13px; color: #4f46e5; background: #eef2ff; padding: 2px 8px; border-radius: 4px; display: inline-block; margin-top: 4px; }
    .info-row { display: flex; justify-content: space-between; align-items: center; padding: 8px 0; border-bottom: 1px solid #f1f5f9; font-size: 14px; color: #64748b; }
    .info-row:last-child { border-bottom: none; }
    .info-row strong { color: #1e293b; }
    .info-row .price { color: #4f46e5; font-size: 16px; }

    /* Pills */
    .status-pill, .payment-pill { padding: 5px 12px; border-radius: 999px; font-size: 12px; font-weight: 600; }
    .status-pill.confirmed { background: #e0e7ff; color: #4338ca; }
    .status-pill.pending { background: #fffbeb; color: #92400e; }
    .payment-pill.paid { background: #dcfce7; color: #166534; }
    .payment-pill.unpaid { background: #fef3c7; color: #92400e; border: 1px solid #fde68a; }

    /* Buttons */
    .btn-checkin { width: 100%; background: #10b981; color: white; border: none; padding: 13px; font-size: 15px; font-weight: 600; border-radius: 10px; cursor: pointer; transition: all 0.2s; }
    .btn-checkin:hover:not(:disabled) { background: #059669; transform: translateY(-1px); }
    .btn-checkin:disabled { opacity: 0.6; cursor: not-allowed; }

    .btn-checkout { background: #1e293b; color: white; border: none; padding: 11px 24px; border-radius: 10px; font-weight: 600; font-size: 14px; cursor: pointer; transition: all 0.2s; }
    .btn-checkout:hover { background: #0f172a; transform: translateY(-1px); }

    /* Checkout form */
    .checkout-form { padding: 20px; border-top: 2px dashed #e2e8f0; background: #fafafa; }
    .checkout-form h4 { margin: 0 0 16px; font-size: 15px; color: #0f172a; }
    .form-row { margin-bottom: 14px; }
    .cccd-input { width: 100%; padding: 12px 16px; border: 2px solid #e2e8f0; border-radius: 10px; font-size: 15px; outline: none; transition: all 0.2s; box-sizing: border-box; }
    .cccd-input:focus { border-color: #4f46e5; }
    .payment-confirm { background: #fef9c3; border: 1px solid #fde047; border-radius: 10px; padding: 14px; }
    .checkbox-label { display: flex; align-items: center; gap: 10px; cursor: pointer; font-size: 14px; color: #713f12; font-weight: 500; }
    .checkbox-label input { width: 18px; height: 18px; cursor: pointer; }
    .form-actions { display: flex; gap: 10px; }
    .btn-cancel-form { background: #f1f5f9; color: #64748b; border: none; padding: 11px 20px; border-radius: 10px; font-weight: 600; cursor: pointer; transition: all 0.2s; }
    .btn-cancel-form:hover { background: #e2e8f0; }
    .btn-confirm-checkout { flex: 1; background: #10b981; color: white; border: none; padding: 12px; border-radius: 10px; font-size: 14px; font-weight: 600; cursor: pointer; transition: all 0.2s; }
    .btn-confirm-checkout.needs-payment { background: #f59e0b; }
    .btn-confirm-checkout:hover:not(:disabled) { filter: brightness(1.05); transform: translateY(-1px); }
    .btn-confirm-checkout:disabled { opacity: 0.6; cursor: not-allowed; transform: none; }

    @media (max-width: 640px) {
      .input-group, .form-actions { flex-direction: column; }
      .checkout-card-body { grid-template-columns: 1fr; }
    }
  `]
})
export class HostCheckinTabComponent implements OnInit {
  activeSubTab: 'search' | 'list' = 'search';

  // Tab 1: Search & Check-in
  citizenIdInput = '';
  foundBookings: BookingDto[] = [];
  isLoading = false;
  searched = false;
  confirmingId: string | null = null;

  // Tab 2: Checked-in list & Checkout
  checkedInBookings: BookingDto[] = [];
  listLoading = false;
  private checkoutStates = new Map<string, CheckoutState>();

  constructor(
    private bookingService: BookingService,
    private notification: NotificationService
  ) {}

  ngOnInit() {
    this.loadCheckedInBookings();
  }

  switchToList() {
    this.activeSubTab = 'list';
    this.loadCheckedInBookings();
  }

  loadCheckedInBookings() {
    this.listLoading = true;
    this.bookingService.getCheckedInBookings().subscribe({
      next: (bookings: BookingDto[]) => {
        this.checkedInBookings = bookings;
        this.listLoading = false;
      },
      error: (err: any) => {
        this.listLoading = false;
        this.notification.error(err.error?.message || 'Không thể tải danh sách đã nhận phòng.');
      }
    });
  }

  // === TAB 1 METHODS ===
  searchByCitizenId() {
    if (!this.citizenIdInput.trim()) return;
    this.isLoading = true;
    this.searched = false;
    this.foundBookings = [];

    this.bookingService.getBookingsByCitizenId(this.citizenIdInput.trim()).subscribe({
      next: (bookings: BookingDto[]) => {
        this.foundBookings = bookings;
        this.searched = true;
        this.isLoading = false;
      },
      error: (err: any) => {
        this.isLoading = false;
        this.searched = true;
        this.notification.error(err.error?.message || 'Có lỗi xảy ra khi tìm kiếm.');
      }
    });
  }

  confirmCheckIn(booking: BookingDto) {
    this.confirmingId = booking.id.toString();
    this.bookingService.confirmCheckIn(booking.id.toString()).subscribe({
      next: () => {
        this.notification.success(`✅ Check-in thành công cho khách: ${booking.userName}`);
        this.foundBookings = this.foundBookings.filter(b => b.id !== booking.id);
        this.confirmingId = null;
        this.loadCheckedInBookings();
      },
      error: (err: any) => {
        this.notification.error(err.error?.message || 'Có lỗi xảy ra khi xác nhận.');
        this.confirmingId = null;
      }
    });
  }

  // === TAB 2 METHODS ===
  getCheckoutState(bookingId: string): CheckoutState {
    if (!this.checkoutStates.has(bookingId)) {
      this.checkoutStates.set(bookingId, {
        showForm: false,
        citizenIdInput: '',
        confirmPayment: false,
        isProcessing: false
      });
    }
    return this.checkoutStates.get(bookingId)!;
  }

  openCheckoutForm(bookingId: string) {
    const state = this.getCheckoutState(bookingId);
    state.showForm = true;
    state.citizenIdInput = '';
    state.confirmPayment = false;
  }

  cancelCheckout(bookingId: string) {
    const state = this.getCheckoutState(bookingId);
    state.showForm = false;
  }

  performCheckout(booking: BookingDto) {
    const state = this.getCheckoutState(booking.id.toString());
    if (!state.citizenIdInput.trim()) {
      this.notification.error('Vui lòng nhập số CCCD/CMND của khách.');
      return;
    }
    state.isProcessing = true;
    this.bookingService.checkout(
      booking.id.toString(),
      state.citizenIdInput.trim(),
      state.confirmPayment
    ).subscribe({
      next: () => {
        this.notification.success(`🎉 Checkout thành công cho khách: ${booking.userName}`);
        this.checkedInBookings = this.checkedInBookings.filter(b => b.id !== booking.id);
        this.checkoutStates.delete(booking.id.toString());
      },
      error: (err: any) => {
        this.notification.error(err.error?.message || 'Có lỗi xảy ra khi checkout.');
        state.isProcessing = false;
      }
    });
  }
}
