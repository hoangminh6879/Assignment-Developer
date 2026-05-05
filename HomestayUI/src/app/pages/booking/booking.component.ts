import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { HomestayService, HomestayDto } from '../../services/homestay.service';
import { RoomTypeService, RoomTypeDto } from '../../services/room-type.service';
import { BookingService, BookingRequestDto } from '../../services/booking.service';
import { RoomDto } from '../../services/room.service';
import { NotificationService } from '../../services/notification.service';
import { NavbarComponent } from '../../components/navbar/navbar.component';
import { AuthService } from '../../services/auth.service';
import { PaymentService } from '../../services/payment.service';
import { UserService, UserProfileDto, ProfileUpdateRequest } from '../../services/user.service';
import { VoucherService, VoucherDto, VoucherType } from '../../services/voucher.service';
import { WalletService, WalletDto } from '../../services/wallet.service';

@Component({
  selector: 'app-booking',
  standalone: true,
  imports: [CommonModule, FormsModule, NavbarComponent],
  template: `
    <app-navbar></app-navbar>
    <div class="booking-page">
      <div class="booking-container animate-fade-in">
        
        <!-- LEFT: Homestay & Selection -->
        <div class="selection-section">
          <div class="homestay-info-card" *ngIf="homestay">
            <img [src]="'http://localhost:9999' + (homestay.images.length > 0 ? homestay.images[0].url : '')" class="h-img" alt="">
            <div class="h-details">
              <h1>{{ homestay.name }}</h1>
              <p>📍 {{ homestay.address }}, {{ homestay.city }}</p>
              <div class="price-base">Giá cơ bản: {{ homestay.pricePerNight | number }}đ / đêm</div>
            </div>
          </div>

          <div class="booking-form-card">
            <div class="step">
              <h3>1. Chọn thời gian</h3>
              <div class="date-inputs">
                <div class="date-group">
                  <label>Ngày nhận</label>
                  <input type="date" [(ngModel)]="checkInDate" (change)="onDateChange()" [min]="today" class="input-field">
                </div>
                <div class="date-group">
                  <label>Ngày trả</label>
                  <input type="date" [(ngModel)]="checkOutDate" (change)="onDateChange()" [min]="minCheckOut" class="input-field">
                </div>
              </div>
              <div class="date-error" *ngIf="dateError">
                ⚠️ {{ dateError }}
              </div>
            </div>

            <div class="step" *ngIf="checkInDate && checkOutDate">
              <h3>2. Chọn loại phòng</h3>
              <div class="room-types-list">
                <div 
                  *ngFor="let rt of roomTypes" 
                  class="rt-item" 
                  [class.active]="selectedRoomTypeId === rt.id"
                  (click)="selectRoomType(rt.id!)">
                  <span class="rt-name">{{ rt.name }}</span>
                  <span class="rt-icon">🛏️</span>
                </div>
              </div>
            </div>

            <div class="step" *ngIf="selectedRoomTypeId">
              <h3>3. Chọn phòng còn trống</h3>
              <div class="available-rooms" *ngIf="availableRooms.length > 0; else noRooms">
                <div 
                  *ngFor="let room of availableRooms" 
                  class="room-card" 
                  [class.selected]="selectedRoomId === room.id"
                  (click)="selectedRoomId = room.id!">
                  <div class="room-header">
                    <span class="room-name">{{ room.name }}</span>
                    <span class="room-price-extra">+{{ room.priceExtra | number }}đ</span>
                  </div>
                  <div class="room-meta">
                    <span>👥 Tối đa: {{ room.maxGuests }} khách</span>
                  </div>
                </div>
              </div>
              <ng-template #noRooms>
                <div class="empty-rooms">Không có phòng trống cho khoảng thời gian này.</div>
              </ng-template>
            </div>

            <div class="step" *ngIf="selectedRoomId">
              <h3>4. Phương thức thanh toán</h3>
              <div class="payment-methods">
                <div 
                  class="payment-item" 
                  [class.active]="selectedPaymentMethod === 'VNPAY'"
                  (click)="selectedPaymentMethod = 'VNPAY'">
                  <span class="pay-icon">💳</span>
                  <div class="pay-text">
                    <strong>VNPay</strong>
                    <p>Thanh toán qua cổng VNPay</p>
                  </div>
                </div>
                <div 
                  class="payment-item" 
                  [class.active]="selectedPaymentMethod === 'WALLET'"
                  (click)="selectedPaymentMethod = 'WALLET'">
                  <span class="pay-icon">👛</span>
                  <div class="pay-text">
                    <strong>Ví của tôi</strong>
                    <p>Số dư: {{ (wallet?.balance || 0) | number }}đ</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- RIGHT: Summary -->
        <div class="summary-section">
          <div class="summary-card sticky">
            <h2>Chi tiết thanh toán</h2>
            <div class="summary-list">
              <div class="summary-item">
                <span>Số đêm:</span>
                <span>{{ totalNights }} đêm</span>
              </div>
              <div class="summary-item" *ngIf="selectedRoomId">
                <span>Giá phòng (đã bao gồm homestay):</span>
                <span>{{ pricePerNight | number }}đ / đêm</span>
              </div>
              <hr>
              <!-- Redesigned Voucher Section -->
              <div class="voucher-wrapper">
                <div class="voucher-header">
                  <div class="v-title">
                    <span class="v-icon-main">🎟️</span>
                    <label>Ưu đãi & Giảm giá</label>
                  </div>
                  <button class="btn-browse-vouchers" (click)="openVoucherModal()" [disabled]="discountAmount > 0">
                    Chọn mã
                  </button>
                </div>
                
                <div class="voucher-input-group">
                  <input type="text" [(ngModel)]="voucherCode" placeholder="Hoặc nhập mã trực tiếp..." [disabled]="discountAmount > 0" class="input-field">
                  <button *ngIf="discountAmount === 0" (click)="applyVoucher()" [disabled]="!voucherCode" class="btn-apply-voucher">Áp dụng</button>
                  <button *ngIf="discountAmount > 0" (click)="removeVoucher()" class="btn-remove-voucher">
                    <i class="fas fa-times-circle"></i> Gỡ bỏ
                  </button>
                </div>
                
                <div class="active-voucher-badge animate-fade-in" *ngIf="discountAmount > 0">
                  <div class="v-badge-info">
                    <span class="v-sparkle">✨</span>
                    <span>Đã giảm <strong>{{ discountAmount | number }}đ</strong></span>
                  </div>
                </div>
                <p class="voucher-error" *ngIf="voucherError">❌ {{ voucherError }}</p>
              </div>
              <hr>
              <div class="total-row">
                <span>Tổng cộng:</span>
                <div class="price-stack">
                  <span class="original-price" *ngIf="discountAmount > 0">{{ rawTotalPrice | number }}đ</span>
                  <span class="total-price">{{ totalPrice | number }}đ</span>
                </div>
              </div>
            </div>
            <button 
              class="btn-confirm" 
              [disabled]="!canBook || bookingLoading" 
              (click)="openConfirmationModal()">
              {{ bookingLoading ? 'Đang xử lý...' : 'Tiếp tục' }}
            </button>
            <p class="disclaimer">Bạn sẽ có thể kiểm tra thông tin trước khi hoàn tất.</p>
          </div>
        </div>

      </div>
    </div>

    <!-- Confirmation Modal -->
    <div class="modal-overlay" *ngIf="showConfirmModal">
      <div class="modal-content animate-fade-in">
        <button class="close-btn" (click)="closeConfirmationModal()">×</button>
        <h2>Xác nhận Đặt phòng</h2>
        
        <div class="modal-body">
          <div class="booking-summary-modal">
            <h3>Chi tiết phòng</h3>
            <p><strong>Homestay:</strong> {{ homestay?.name }}</p>
            <p><strong>Ngày nhận:</strong> {{ checkInDate | date:'dd/MM/yyyy' }}</p>
            <p><strong>Ngày trả:</strong> {{ checkOutDate | date:'dd/MM/yyyy' }}</p>
            <p *ngIf="discountAmount > 0"><strong>Giảm giá:</strong> <span class="discount-price">-{{ discountAmount | number }}đ</span></p>
            <p><strong>Tổng tiền:</strong> <span class="total-price-modal">{{ totalPrice | number }}đ</span></p>
            <p><strong>Thanh toán:</strong> {{ selectedPaymentMethod === 'VNPAY' ? 'VNPay' : 'Ví điện tử' }}</p>
          </div>

          <div class="user-info-form">
            <h3>Thông tin người đặt</h3>
            <p class="info-note">Vui lòng kiểm tra và cập nhật thông tin chính xác. Thông tin này sẽ được lưu vào hồ sơ của bạn.</p>
            
            <div class="form-grid">
              <div class="form-group">
                <label>Họ</label>
                <input type="text" [(ngModel)]="userProfile.lastName" class="input-field" placeholder="Nguyễn Văn">
              </div>
              <div class="form-group">
                <label>Tên</label>
                <input type="text" [(ngModel)]="userProfile.firstName" class="input-field" placeholder="A">
              </div>
              <div class="form-group">
                <label>Số điện thoại</label>
                <input type="text" [(ngModel)]="userProfile.phoneNumber" class="input-field" placeholder="0901234567">
              </div>
              <div class="form-group">
                <label>CCCD/CMND</label>
                <input type="text" [(ngModel)]="userProfile.citizenId" class="input-field" placeholder="0123456789">
              </div>
              <div class="form-group full-width">
                <label>Địa chỉ</label>
                <input type="text" [(ngModel)]="userProfile.address" class="input-field" placeholder="Địa chỉ hiện tại">
              </div>
            </div>
          </div>
        </div>

        <div class="modal-footer">
          <button class="btn-cancel" (click)="closeConfirmationModal()">Hủy</button>
          <button class="btn-confirm-final" [disabled]="isSubmitting" (click)="submitBooking()">
            {{ isSubmitting ? 'Đang xử lý...' : 'Xác nhận và Thanh toán' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Voucher Selection Modal -->
    <div class="modal-overlay" *ngIf="showVoucherModal" (click)="closeVoucherModal()">
      <div class="voucher-modal-content animate-fade-in" (click)="$event.stopPropagation()">
        <div class="v-modal-header">
          <h2>Chọn mã giảm giá</h2>
          <button class="close-btn" (click)="closeVoucherModal()">×</button>
        </div>
        
        <div class="v-modal-body">
          <div class="v-list-container" *ngIf="applicableVouchers.length > 0; else noVouchers">
            <div class="v-option-card" *ngFor="let v of applicableVouchers" 
                 [class.disabled]="rawTotalPrice < (v.minBookingAmount || 0)"
                 (click)="selectVoucherFromList(v)">
              <div class="v-side-accent" [class.global]="v.isGlobal"></div>
              <div class="v-main-info">
                <div class="v-code-tag">{{ v.code }}</div>
                <div class="v-desc">
                  Giảm {{ v.type === 'PERCENTAGE' ? v.value + '%' : (v.value | number) + 'đ' }}
                  <span class="v-min-text" *ngIf="v.minBookingAmount">cho đơn từ {{ v.minBookingAmount | number }}đ</span>
                </div>
                <div class="v-expiry" *ngIf="v.expiryDate">HSD: {{ v.expiryDate | date:'dd/MM/yyyy' }}</div>
              </div>
              <div class="v-status-indicator">
                <span class="v-check" *ngIf="rawTotalPrice >= (v.minBookingAmount || 0)">Sử dụng</span>
                <span class="v-lock" *ngIf="rawTotalPrice < (v.minBookingAmount || 0)">Chưa đủ điều kiện</span>
              </div>
            </div>
          </div>
          <ng-template #noVouchers>
            <div class="empty-vouchers">
              <span class="icon">🎟️</span>
              <p>Không có mã giảm giá nào khả dụng lúc này.</p>
            </div>
          </ng-template>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .booking-page { min-height: 100vh; background: #f1f5f9; padding: 100px 20px 40px; }
    .booking-container { max-width: 1200px; margin: 0 auto; display: grid; grid-template-columns: 1fr 380px; gap: 30px; }
    
    .selection-section { display: flex; flex-direction: column; gap: 24px; }
    .homestay-info-card { background: white; border-radius: 20px; overflow: hidden; display: flex; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); }
    .h-img { width: 200px; height: 150px; object-fit: cover; }
    .h-details { padding: 20px; flex: 1; }
    .h-details h1 { margin: 0 0 10px; font-size: 24px; color: #1e293b; }
    .h-details p { margin: 0; color: #64748b; font-size: 15px; }
    .price-base { margin-top: 15px; font-weight: 700; color: #10b981; }

    .booking-form-card { background: white; border-radius: 20px; padding: 30px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); }
    .step { margin-bottom: 40px; }
    .step h3 { margin-bottom: 20px; color: #0f172a; font-size: 18px; display: flex; align-items: center; gap: 10px; }
    
    .date-inputs { display: flex; gap: 20px; }
    .date-group { flex: 1; }
    .date-group label { display: block; font-size: 13px; font-weight: 600; color: #64748b; margin-bottom: 6px; }
    .input-field { width: 100%; padding: 12px; border: 1px solid #e2e8f0; border-radius: 10px; font-family: inherit; }
    .date-error { margin-top: 10px; padding: 10px 14px; background: #fff7ed; border: 1px solid #fed7aa; border-radius: 8px; color: #c2410c; font-size: 13px; font-weight: 500; }

    .room-types-list { display: flex; gap: 12px; flex-wrap: wrap; }
    .rt-item { padding: 15px 25px; border: 2px solid #e2e8f0; border-radius: 12px; cursor: pointer; transition: all 0.2s; display: flex; align-items: center; gap: 10px; font-weight: 600; }
    .rt-item:hover { border-color: #cbd5e1; background: #f8fafc; }
    .rt-item.active { border-color: #4f46e5; background: #eef2ff; color: #4f46e5; }

    .available-rooms { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; }
    .room-card { padding: 20px; border: 2px solid #e2e8f0; border-radius: 16px; cursor: pointer; transition: all 0.2s; }
    .room-card:hover { border-color: #cbd5e1; }
    .room-card.selected { border-color: #10b981; background: #f0fdf4; }
    .room-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; }
    .room-name { font-weight: 700; font-size: 16px; }
    .room-price-extra { color: #10b981; font-weight: 600; }
    .room-meta { font-size: 14px; color: #64748b; }
    .empty-rooms { padding: 20px; background: #fffbeb; border-radius: 10px; color: #92400e; text-align: center; }

    .payment-methods { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; }
    .payment-item { padding: 15px; border: 2px solid #e2e8f0; border-radius: 16px; cursor: pointer; display: flex; align-items: center; gap: 15px; transition: all 0.2s; }
    .payment-item:hover { border-color: #cbd5e1; }
    .payment-item.active { border-color: #4f46e5; background: #eef2ff; }
    .pay-icon { font-size: 24px; }
    .pay-text strong { display: block; font-size: 15px; color: #1e293b; }
    .pay-text p { margin: 2px 0 0; font-size: 12px; color: #64748b; }

    .summary-section { }
    .summary-card { background: white; border-radius: 24px; padding: 30px; box-shadow: 0 10px 25px -5px rgba(0,0,0,0.1); }
    .sticky { position: sticky; top: 100px; }
    .summary-card h2 { margin: 0 0 25px; font-size: 20px; }
    .summary-list { display: flex; flex-direction: column; gap: 15px; }
    .summary-item { display: flex; justify-content: space-between; color: #64748b; font-size: 15px; }
    .total-row { display: flex; justify-content: space-between; align-items: center; margin-top: 10px; }
    .total-row span { font-weight: 600; color: #0f172a; }
    .total-price { font-size: 24px; font-weight: 800; color: #4f46e5; }
    .btn-confirm { width: 100%; margin-top: 30px; background: #4f46e5; color: white; border: none; padding: 16px; border-radius: 14px; font-size: 16px; font-weight: 700; cursor: pointer; transition: all 0.2s; }
    .btn-confirm:hover:not(:disabled) { background: #4338ca; transform: translateY(-2px); box-shadow: 0 8px 16px rgba(79, 70, 229, 0.3); }
    .btn-confirm:disabled { opacity: 0.6; cursor: not-allowed; }
    .disclaimer { margin-top: 15px; text-align: center; font-size: 12px; color: #94a3b8; }

    /* Voucher Styles */
    .voucher-section { margin: 20px 0; padding: 18px; background: #f8fafc; border-radius: 16px; border: 1px dashed #cbd5e1; }
    .voucher-section label { display: block; font-size: 13px; font-weight: 700; color: #475569; margin-bottom: 10px; text-transform: uppercase; letter-spacing: 0.5px; }
    .voucher-input-group { display: flex; gap: 10px; }
    .voucher-input-group .input-field { background: white; }
    .btn-apply-voucher { padding: 10px 20px; background: linear-gradient(135deg, #4f46e5 0%, #3b82f6 100%); color: white; border: none; border-radius: 10px; font-weight: 700; cursor: pointer; transition: all 0.2s; white-space: nowrap; }
    .btn-apply-voucher:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 4px 12px rgba(79, 70, 229, 0.3); }
    .btn-apply-voucher:disabled { opacity: 0.5; cursor: not-allowed; }
    .btn-remove-voucher { padding: 10px 20px; background: #fee2e2; color: #ef4444; border: 1px solid #fecaca; border-radius: 10px; font-weight: 700; cursor: pointer; transition: all 0.2s; white-space: nowrap; }
    .btn-remove-voucher:hover { background: #fef2f2; transform: translateY(-1px); }
    .voucher-success { color: #059669; font-size: 13px; font-weight: 700; margin-top: 10px; display: flex; align-items: center; gap: 6px; }
    .voucher-error { color: #dc2626; font-size: 13px; font-weight: 600; margin-top: 10px; display: flex; align-items: center; gap: 6px; }
    .price-stack { display: flex; flex-direction: column; align-items: flex-end; }
    .original-price { font-size: 15px; text-decoration: line-through; color: #94a3b8; font-weight: 500; }
    .discount-price { color: #059669; font-weight: 700; font-size: 14px; }

    /* New Premium Voucher Styles */
    .voucher-wrapper { margin: 25px 0; padding: 20px; background: #fdfdfd; border: 1px solid #eef2ff; border-radius: 20px; box-shadow: inset 0 2px 4px rgba(0,0,0,0.02); }
    .voucher-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px; }
    .v-title { display: flex; align-items: center; gap: 8px; }
    .v-icon-main { font-size: 18px; }
    .v-title label { font-size: 14px; font-weight: 800; color: #1e293b; letter-spacing: -0.2px; }
    .btn-browse-vouchers { background: none; border: none; color: #4f46e5; font-size: 13px; font-weight: 700; cursor: pointer; padding: 4px 8px; border-radius: 8px; transition: all 0.2s; }
    .btn-browse-vouchers:hover { background: #eef2ff; }
    
    .active-voucher-badge { margin-top: 15px; background: #ecfdf5; border: 1px solid #d1fae5; padding: 10px 15px; border-radius: 12px; }
    .v-badge-info { display: flex; align-items: center; gap: 10px; color: #065f46; font-size: 13px; font-weight: 600; }
    .v-sparkle { font-size: 16px; }
    .v-badge-info strong { font-weight: 800; font-size: 15px; }

    /* Voucher Modal Styles */
    .voucher-modal-content { background: #f8fafc; border-radius: 32px; padding: 0; width: 500px; max-height: 80vh; overflow: hidden; display: flex; flex-direction: column; position: relative; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.25); }
    .v-modal-header { padding: 25px 30px; background: white; border-bottom: 1px solid #e2e8f0; display: flex; justify-content: space-between; align-items: center; }
    .v-modal-header h2 { margin: 0; font-size: 20px; font-weight: 800; color: #0f172a; }
    .v-modal-body { padding: 20px; overflow-y: auto; flex: 1; }
    .v-list-container { display: flex; flex-direction: column; gap: 12px; }
    
    .v-option-card { background: white; border: 1px solid #e2e8f0; border-radius: 18px; display: flex; overflow: hidden; cursor: pointer; transition: all 0.2s; }
    .v-option-card:not(.disabled):hover { border-color: #4f46e5; transform: scale(1.02); box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1); }
    .v-option-card.disabled { opacity: 0.6; cursor: not-allowed; background: #f1f5f9; }
    
    .v-side-accent { width: 8px; }
    .v-side-accent.global { background: #4f46e5; }
    .v-side-accent:not(.global) { background: #10b981; }
    
    .v-main-info { flex: 1; padding: 15px 20px; }
    .v-code-tag { font-family: 'JetBrains Mono', monospace; font-weight: 800; color: #4f46e5; font-size: 14px; margin-bottom: 4px; }
    .v-desc { font-size: 14px; font-weight: 700; color: #1e293b; }
    .v-min-text { font-size: 12px; font-weight: 500; color: #64748b; display: block; }
    .v-expiry { font-size: 11px; color: #94a3b8; margin-top: 6px; }
    
    .v-status-indicator { padding: 15px; display: flex; align-items: center; font-size: 11px; font-weight: 800; text-transform: uppercase; border-left: 1px dashed #e2e8f0; }
    .v-check { color: #10b981; }
    .v-lock { color: #ef4444; text-align: center; width: 80px; line-height: 1.2; }
    
    .empty-vouchers { text-align: center; padding: 40px; color: #94a3b8; }
    .empty-vouchers .icon { font-size: 48px; display: block; margin-bottom: 10px; opacity: 0.5; }

    .animate-fade-in { animation: fadeIn 0.5s ease-out; }
    @keyframes fadeIn { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }

    /* Modal Styles */
    .modal-overlay { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); z-index: 1000; display: flex; align-items: center; justify-content: center; backdrop-filter: blur(4px); }
    .modal-content { background: white; border-radius: 24px; padding: 30px; width: 90%; max-width: 800px; max-height: 90vh; overflow-y: auto; position: relative; box-shadow: 0 20px 25px -5px rgba(0,0,0,0.1); }
    .close-btn { position: absolute; top: 20px; right: 20px; background: none; border: none; font-size: 28px; cursor: pointer; color: #64748b; line-height: 1; transition: color 0.2s; }
    .close-btn:hover { color: #0f172a; }
    .modal-content h2 { margin: 0 0 20px; font-size: 24px; color: #0f172a; }
    .modal-body { display: grid; grid-template-columns: 1fr 1.5fr; gap: 30px; }
    .booking-summary-modal { background: #f8fafc; padding: 20px; border-radius: 16px; border: 1px solid #e2e8f0; }
    .booking-summary-modal h3 { margin: 0 0 15px; font-size: 16px; color: #1e293b; }
    .booking-summary-modal p { margin: 0 0 10px; color: #475569; font-size: 14px; }
    .booking-summary-modal strong { color: #0f172a; }
    .total-price-modal { font-size: 18px; font-weight: 800; color: #4f46e5; }
    .user-info-form h3 { margin: 0 0 10px; font-size: 16px; color: #1e293b; }
    .info-note { font-size: 13px; color: #64748b; margin-bottom: 20px; }
    .form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; }
    .form-group { display: flex; flex-direction: column; gap: 6px; }
    .full-width { grid-column: span 2; }
    .form-group label { font-size: 13px; font-weight: 600; color: #475569; }
    .modal-footer { margin-top: 30px; display: flex; justify-content: flex-end; gap: 15px; padding-top: 20px; border-top: 1px solid #e2e8f0; }
    .btn-cancel { padding: 12px 24px; border-radius: 12px; background: #f1f5f9; color: #475569; font-weight: 600; border: none; cursor: pointer; transition: all 0.2s; }
    .btn-cancel:hover { background: #e2e8f0; }
    .btn-confirm-final { padding: 12px 30px; border-radius: 12px; background: #4f46e5; color: white; font-weight: 600; border: none; cursor: pointer; transition: all 0.2s; }
    .btn-confirm-final:hover:not(:disabled) { background: #4338ca; transform: translateY(-2px); box-shadow: 0 8px 16px rgba(79, 70, 229, 0.3); }
    .btn-confirm-final:disabled { opacity: 0.6; cursor: not-allowed; }

    @media (max-width: 992px) {
      .booking-container { grid-template-columns: 1fr; }
      .summary-card { position: static; }
      .modal-body { grid-template-columns: 1fr; }
    }
  `]
})
export class BookingComponent implements OnInit {
  homestayId = '';
  homestay: HomestayDto | null = null;
  roomTypes: RoomTypeDto[] = [];
  availableRooms: RoomDto[] = [];
  wallet: any = null;
  
  checkInDate = '';
  checkOutDate = '';
  selectedRoomTypeId: number | null = null;
  selectedRoomId: string | null = null;
  
  today = new Date().toISOString().split('T')[0];
  minCheckOut = '';
  dateError = '';
  
  selectedPaymentMethod = 'VNPAY';
  bookingLoading = false;

  showConfirmModal = false;
  isSubmitting = false;
  userProfile: any = {};

  voucherCode = '';
  discountAmount = 0;
  voucherError = '';
  applicableVouchers: VoucherDto[] = [];
  showVoucherModal = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    public authService: AuthService,
    private homestayService: HomestayService,
    private roomTypeService: RoomTypeService,
    private bookingService: BookingService,
    private paymentService: PaymentService,
    private userService: UserService,
    private voucherService: VoucherService,
    private walletService: WalletService,
    private notification: NotificationService
  ) {}

  ngOnInit() {
    this.homestayId = this.route.snapshot.params['homestayId'];
    if (!this.homestayId) {
      this.router.navigate(['/']);
      return;
    }

    if (this.authService.hasRole('USER')) {
      this.userService.getProfile().subscribe({
        next: (profile) => {
          this.userProfile = profile;
        },
        error: (err) => {
          console.error('Lỗi khi lấy profile', err);
        }
      });

      this.walletService.getMyWallet().subscribe({
        next: (w: WalletDto) => this.wallet = w,
        error: (err: any) => console.error('Lỗi khi lấy ví', err)
      });
    }

    this.loadData();
  }

  loadData() {
    // We need a getHomestayById. For now I'll use the existing getAll and filter, 
    // but I added getHomestayById to backend so I should update service.
    this.homestayService.getActiveHomestays().subscribe(data => {
      this.homestay = data.find(h => h.id === this.homestayId) || null;
      if (this.homestay) {
        this.loadApplicableVouchers(this.homestay.hostId!);
      }
    });

    this.roomTypeService.getAllRoomTypes().subscribe(data => {
      this.roomTypes = data;
    });
  }

  onDateChange() {
    this.dateError = '';
    if (this.checkInDate) {
      const nextDay = new Date(this.checkInDate);
      nextDay.setDate(nextDay.getDate() + 1);
      this.minCheckOut = nextDay.toISOString().split('T')[0];

      if (this.checkOutDate) {
        if (this.checkOutDate <= this.checkInDate) {
          this.checkOutDate = this.minCheckOut;
          this.dateError = 'Ngày trả phòng phải sau ngày nhận phòng ít nhất 1 ngày.';
        }
      }
    }

    this.loadAvailableRooms();
  }

  selectRoomType(id: number) {
    this.selectedRoomTypeId = id;
    this.selectedRoomId = null;
    this.loadAvailableRooms();
  }

  loadAvailableRooms() {
    if (this.homestayId && this.selectedRoomTypeId && this.checkInDate && this.checkOutDate) {
      this.bookingService.getAvailableRooms(this.homestayId, this.selectedRoomTypeId, this.checkInDate, this.checkOutDate)
        .subscribe(data => {
          this.availableRooms = data;
        });
    }
  }

  get totalNights(): number {
    if (!this.checkInDate || !this.checkOutDate) return 0;
    const start = new Date(this.checkInDate);
    const end = new Date(this.checkOutDate);
    const diff = end.getTime() - start.getTime();
    return Math.max(0, Math.floor(diff / (1000 * 60 * 60 * 24)));
  }

  get pricePerNight(): number {
    if (!this.homestay || !this.selectedRoomId) return 0;
    const room = this.availableRooms.find(r => r.id === this.selectedRoomId);
    return (this.homestay.pricePerNight || 0) + (room?.priceExtra || 0);
  }

  get rawTotalPrice(): number {
    return this.pricePerNight * this.totalNights;
  }

  get totalPrice(): number {
    return Math.max(0, this.rawTotalPrice - this.discountAmount);
  }

  applyVoucher() {
    this.voucherError = '';
    if (!this.voucherCode || !this.homestay) return;

    this.voucherService.validateVoucher(this.voucherCode, this.rawTotalPrice, this.homestay.hostId!)
      .subscribe({
        next: (res) => {
          if (res.valid) {
            this.discountAmount = res.discountAmount;
            this.notification.success('Áp dụng mã giảm giá thành công!');
          } else {
            this.voucherError = 'Mã không hợp lệ';
          }
        },
        error: (err) => {
          this.voucherError = err.error?.message || 'Lỗi khi kiểm tra mã';
          this.discountAmount = 0;
        }
      });
  }

  removeVoucher() {
    this.discountAmount = 0;
    this.voucherError = '';
    this.voucherCode = '';
  }

  loadApplicableVouchers(hostId: string) {
    this.voucherService.getApplicableVouchers(hostId).subscribe(data => {
      this.applicableVouchers = data;
    });
  }

  openVoucherModal() {
    this.showVoucherModal = true;
  }

  closeVoucherModal() {
    this.showVoucherModal = false;
  }

  selectVoucherFromList(v: any) {
    if (this.rawTotalPrice < (v.minBookingAmount || 0)) {
      this.notification.warning('Đơn hàng chưa đủ giá trị tối thiểu để sử dụng mã này.');
      return;
    }
    this.voucherCode = v.code;
    this.applyVoucher();
    this.closeVoucherModal();
  }

  get canBook(): boolean {
    if (!this.selectedRoomId || !this.checkInDate || !this.checkOutDate || !this.selectedPaymentMethod) return false;
    if (this.totalNights <= 0) return false;
    if (new Date(this.checkOutDate) <= new Date(this.checkInDate)) return false;
    
    if (this.selectedPaymentMethod === 'WALLET' && this.wallet && this.wallet.balance < this.totalPrice) {
      return false;
    }
    
    return true;
  }

  openConfirmationModal() {
    if (!this.canBook) return;

    if (!this.authService.hasRole('USER')) {
      this.notification.warning('Chỉ người dùng mới có thể đặt phòng.');
      return;
    }

    if (this.selectedPaymentMethod === 'WALLET' && (!this.wallet || this.wallet.balance < this.totalPrice)) {
      this.notification.error('Số dư ví không đủ. Vui lòng nạp thêm tiền!');
      return;
    }
    
    this.showConfirmModal = true;
  }

  closeConfirmationModal() {
    this.showConfirmModal = false;
  }

  submitBooking() {
    this.isSubmitting = true;
    
    // 1. Update Profile
    const profileReq: ProfileUpdateRequest = {
      firstName: this.userProfile.firstName || '',
      lastName: this.userProfile.lastName || '',
      phoneNumber: this.userProfile.phoneNumber || '',
      address: this.userProfile.address || '',
      citizenId: this.userProfile.citizenId || ''
    };

    this.userService.updateProfile(profileReq).subscribe({
      next: () => {
        // 2. Create Booking
        this.processBooking();
      },
      error: (err) => {
        this.notification.error('Có lỗi xảy ra khi cập nhật thông tin cá nhân. Vui lòng thử lại.');
        this.isSubmitting = false;
      }
    });
  }

  private processBooking() {
    const request: BookingRequestDto = {
      homestayId: this.homestayId,
      roomId: this.selectedRoomId!,
      checkInDate: this.checkInDate,
      checkOutDate: this.checkOutDate,
      paymentMethod: this.selectedPaymentMethod,
      voucherCode: this.discountAmount > 0 ? this.voucherCode : undefined
    };

    this.bookingService.createBooking(request).subscribe({
      next: (res) => {
        if (this.selectedPaymentMethod === 'VNPAY') {
          // If VNPay, get URL and redirect
          this.paymentService.createVNPayUrl(res.id!).subscribe({
            next: (paymentRes) => {
              if (paymentRes.url) {
                window.location.href = paymentRes.url;
              } else {
                this.notification.error('Không thể tạo URL thanh toán VNPay.');
                this.isSubmitting = false;
              }
            },
            error: (err) => {
              this.notification.error('Có lỗi xảy ra khi tạo thanh toán VNPay.');
              this.isSubmitting = false;
            }
          });
        } else if (this.selectedPaymentMethod === 'WALLET') {
          this.notification.success('Thanh toán bằng ví thành công! Vui lòng chờ chủ nhà xác nhận.');
          this.closeConfirmationModal();
          this.router.navigate(['/dashboard/user']);
          this.isSubmitting = false;
        } else {
          this.notification.success('Đặt phòng thành công! Chúng tôi sẽ sớm liên hệ với bạn.');
          this.closeConfirmationModal();
          this.router.navigate(['/dashboard/user']);
          this.isSubmitting = false;
        }
      },
      error: (err) => {
        this.notification.error(err.error?.message || 'Có lỗi xảy ra khi đặt phòng.');
        this.isSubmitting = false;
      }
    });
  }
}
