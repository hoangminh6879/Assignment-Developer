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
        
        <!-- LEFT COLUMN: Main Selection Flow -->
        <div class="selection-section">
          <!-- Homestay Hero Mini -->
          <div class="homestay-hero-mini" *ngIf="homestay">
            <div class="hero-image-wrap">
              <img [src]="'http://localhost:9999' + (homestay.images.length > 0 ? homestay.images[0].url : '')" class="h-img" alt="">
              <div class="hero-overlay"></div>
            </div>
            <div class="h-details">
              <div class="h-header">
                <h1>{{ homestay.name }}</h1>
                <div class="h-rating"><i class="fa-solid fa-star"></i> {{ homestay.averageRating || 0 | number:'1.1-1' }}</div>
              </div>
              <p class="h-address"><i class="fa-solid fa-location-dot"></i> {{ homestay.address }}, {{ homestay.city }}</p>
              <div class="h-price-tag">
                <span class="label">Giá cơ sở:</span>
                <span class="value">{{ homestay.pricePerNight | number }}đ</span>
                <span class="unit">/ đêm</span>
              </div>
            </div>
          </div>

          <!-- STEP 1: Date Selection -->
          <div class="booking-step-card">
            <div class="step-header">
              <div class="step-num">01</div>
              <div class="step-title">
                <h3>Chọn thời gian lưu trú</h3>
                <p>Hãy chọn ngày bạn muốn đến và đi</p>
              </div>
            </div>
            
            <div class="step-body">
              <div class="date-picker-grid">
                <div class="date-field">
                  <label><i class="fa-solid fa-calendar-plus"></i> Ngày nhận phòng</label>
                  <input type="date" [(ngModel)]="checkInDate" (change)="onDateChange()" [min]="today" class="premium-input">
                </div>
                <div class="date-arrow">
                  <i class="fa-solid fa-arrow-right-long"></i>
                </div>
                <div class="date-field">
                  <label><i class="fa-solid fa-calendar-minus"></i> Ngày trả phòng</label>
                  <input type="date" [(ngModel)]="checkOutDate" (change)="onDateChange()" [min]="minCheckOut" class="premium-input">
                </div>
              </div>
              <div class="alert-error" *ngIf="dateError">
                <i class="fa-solid fa-circle-exclamation"></i> {{ dateError }}
              </div>
            </div>
          </div>

          <!-- STEP 2: Room Type Selection -->
          <div class="booking-step-card" *ngIf="checkInDate && checkOutDate">
            <div class="step-header">
              <div class="step-num">02</div>
              <div class="step-title">
                <h3>Loại phòng mong muốn</h3>
                <p>Chọn phân khúc phòng phù hợp với bạn</p>
              </div>
            </div>
            <div class="step-body">
              <div class="room-types-grid">
                <div 
                  *ngFor="let rt of roomTypes" 
                  class="rt-card-premium" 
                  [class.active]="selectedRoomTypeId === rt.id"
                  (click)="selectRoomType(rt.id!)">
                  <div class="rt-icon-wrap"><i class="fa-solid fa-bed"></i></div>
                  <div class="rt-info">
                    <span class="rt-name">{{ rt.name }}</span>
                    <span class="rt-desc">{{ rt.description || 'Tiêu chuẩn' }}</span>
                  </div>
                  <div class="rt-check" *ngIf="selectedRoomTypeId === rt.id">
                    <i class="fa-solid fa-circle-check"></i>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- STEP 3: Specific Room Selection -->
          <div class="booking-step-card" *ngIf="selectedRoomTypeId">
            <div class="step-header">
              <div class="step-num">03</div>
              <div class="step-title">
                <h3>Danh sách phòng trống</h3>
                <p>Chọn một căn phòng cụ thể cho kỳ nghỉ này</p>
              </div>
            </div>
            <div class="step-body">
              <div class="available-rooms-grid" *ngIf="availableRooms.length > 0; else noRooms">
                <div 
                  *ngFor="let room of availableRooms" 
                  class="room-card-premium" 
                  [class.selected]="selectedRoomId === room.id"
                  (click)="selectedRoomId = room.id!">
                  <div class="room-indicator"></div>
                  <div class="room-content">
                    <div class="room-main">
                      <span class="room-name">{{ room.name }}</span>
                      <span class="room-capacity"><i class="fa-solid fa-users"></i> {{ room.maxGuests }} khách</span>
                    </div>
                    <div class="room-pricing">
                      <span class="price-extra" *ngIf="room.priceExtra > 0">+{{ room.priceExtra | number }}đ</span>
                      <span class="price-final">{{ (homestay?.pricePerNight || 0) + room.priceExtra | number }}đ</span>
                    </div>
                  </div>
                </div>
              </div>
              <ng-template #noRooms>
                <div class="empty-rooms-alert">
                  <i class="fa-solid fa-calendar-xmark"></i>
                  <p>Rất tiếc! Hiện không còn phòng trống thuộc loại này trong khoảng thời gian đã chọn.</p>
                </div>
              </ng-template>
            </div>
          </div>

          <!-- STEP 4: Payment Method Selection -->
          <div class="booking-step-card" *ngIf="selectedRoomId">
            <div class="step-header">
              <div class="step-num">04</div>
              <div class="step-title">
                <h3>Phương thức thanh toán</h3>
                <p>An toàn & Bảo mật tuyệt đối</p>
              </div>
            </div>
            <div class="step-body">
              <div class="payment-methods-grid">
                <div 
                  class="pay-card-premium" 
                  [class.active]="selectedPaymentMethod === 'VNPAY'"
                  (click)="selectedPaymentMethod = 'VNPAY'">
                  <div class="pay-icon-box vnpay"><i class="fa-solid fa-credit-card"></i></div>
                  <div class="pay-info">
                    <strong>Thanh toán VNPay</strong>
                    <span>Chuyển khoản / Thẻ ngân hàng</span>
                  </div>
                  <div class="pay-radio"></div>
                </div>
                <div 
                  class="pay-card-premium" 
                  [class.active]="selectedPaymentMethod === 'WALLET'"
                  (click)="selectedPaymentMethod = 'WALLET'">
                  <div class="pay-icon-box wallet"><i class="fa-solid fa-wallet"></i></div>
                  <div class="pay-info">
                    <strong>Số dư Ví điện tử</strong>
                    <span>Khả dụng: {{ (wallet?.balance || 0) | number }}đ</span>
                  </div>
                  <div class="pay-radio"></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- RIGHT COLUMN: Order Summary -->
        <div class="summary-section">
          <div class="summary-card-premium sticky">
            <div class="summary-header">
              <h3>Tóm tắt đơn hàng</h3>
            </div>
            
            <div class="summary-body">
              <div class="summary-rows">
                <div class="s-row">
                  <span class="s-label">Đơn giá dự kiến</span>
                  <span class="s-value">{{ pricePerNight | number }}đ</span>
                </div>
                <div class="s-row">
                  <span class="s-label">Số đêm lưu trú</span>
                  <span class="s-value">{{ totalNights }} đêm</span>
                </div>
                <div class="s-row subtotal">
                  <span class="s-label">Tạm tính</span>
                  <span class="s-value">{{ rawTotalPrice | number }}đ</span>
                </div>
              </div>

              <!-- VOUCHER SECTION -->
              <div class="voucher-box-premium">
                <div class="v-header-mini">
                  <label><i class="fa-solid fa-ticket"></i> Mã ưu đãi</label>
                  <button class="v-browse-btn" (click)="openVoucherModal()" [disabled]="discountAmount > 0">Khám phá mã</button>
                </div>
                <div class="v-input-wrap">
                  <input type="text" [(ngModel)]="voucherCode" placeholder="Nhập mã giảm giá..." [disabled]="discountAmount > 0">
                  <button class="v-apply-btn" *ngIf="discountAmount === 0" (click)="applyVoucher()" [disabled]="!voucherCode">Áp dụng</button>
                  <button class="v-remove-btn" *ngIf="discountAmount > 0" (click)="removeVoucher()"><i class="fa-solid fa-xmark"></i></button>
                </div>
                <div class="v-success-badge animate-scale-in" *ngIf="discountAmount > 0">
                  <i class="fa-solid fa-circle-check"></i>
                  <span>Tiết kiệm được <strong>{{ discountAmount | number }}đ</strong></span>
                </div>
                <p class="v-error-text" *ngIf="voucherError"><i class="fa-solid fa-circle-info"></i> {{ voucherError }}</p>
              </div>

              <div class="final-total">
                <div class="total-label">
                  <strong>Tổng cộng</strong>
                  <span>(Đã bao gồm thuế & phí)</span>
                </div>
                <div class="total-amount">
                  <span class="old-price" *ngIf="discountAmount > 0">{{ rawTotalPrice | number }}đ</span>
                  <span class="new-price">{{ totalPrice | number }}đ</span>
                </div>
              </div>
            </div>

            <div class="summary-footer">
              <button 
                class="btn-book-premium" 
                [disabled]="!canBook || bookingLoading" 
                (click)="openConfirmationModal()">
                <span *ngIf="!bookingLoading">Tiến hành thanh toán</span>
                <span *ngIf="bookingLoading"><i class="fa-solid fa-spinner fa-spin"></i> Đang xử lý...</span>
              </button>
              <div class="trust-badges">
                <i class="fa-solid fa-shield-halved"></i>
                <span>Thanh toán an toàn 100%</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- PREMUM CONFIRMATION MODAL -->
    <div class="modal-overlay-premium" *ngIf="showConfirmModal" (click)="closeConfirmationModal()">
      <div class="modal-card-premium animate-fade-in" (click)="$event.stopPropagation()">
        <div class="modal-header-banner">
          <div class="header-icon-circle"><i class="fa-solid fa-file-invoice-dollar"></i></div>
          <div class="header-text">
            <h2>Xác nhận Đặt phòng</h2>
            <p>Vui lòng kiểm tra lại thông tin trước khi hoàn tất</p>
          </div>
          <button class="modal-close" (click)="closeConfirmationModal()">&times;</button>
        </div>
        
        <div class="modal-body-premium">
          <!-- Order Summary Mini -->
          <div class="mini-order-card">
            <div class="mini-row">
              <span class="m-label">Homestay</span>
              <span class="m-value">{{ homestay?.name }}</span>
            </div>
            <div class="mini-row">
              <span class="m-label">Thời gian</span>
              <span class="m-value">{{ checkInDate | date:'dd/MM' }} - {{ checkOutDate | date:'dd/MM/yyyy' }}</span>
            </div>
            <div class="mini-row total">
              <span class="m-label">Tổng thanh toán</span>
              <span class="m-value">{{ totalPrice | number }}đ</span>
            </div>
          </div>

          <!-- User Info Update Form -->
          <div class="info-update-section">
            <div class="section-title">
              <i class="fa-solid fa-user-pen"></i>
              <h3>Thông tin người nhận phòng</h3>
            </div>
            <div class="info-grid">
              <div class="info-group">
                <label>Họ & Tên lót</label>
                <input type="text" [(ngModel)]="userProfile.lastName" placeholder="Ví dụ: Nguyễn Văn">
              </div>
              <div class="info-group">
                <label>Tên</label>
                <input type="text" [(ngModel)]="userProfile.firstName" placeholder="Ví dụ: A">
              </div>
              <div class="info-group">
                <label>Số điện thoại</label>
                <input type="text" [(ngModel)]="userProfile.phoneNumber" placeholder="09xx xxx xxx">
              </div>
              <div class="info-group">
                <label>CCCD / Passport</label>
                <input type="text" [(ngModel)]="userProfile.citizenId" placeholder="Nhập số định danh">
              </div>
              <div class="info-group full">
                <label>Địa chỉ thường trú</label>
                <input type="text" [(ngModel)]="userProfile.address" placeholder="Nhập địa chỉ của bạn">
              </div>
            </div>
          </div>
        </div>

        <div class="modal-footer-premium">
          <button class="btn-cancel-modal" (click)="closeConfirmationModal()">Quay lại</button>
          <button class="btn-confirm-modal" [disabled]="isSubmitting" (click)="submitBooking()">
            <span *ngIf="!isSubmitting">Xác nhận & Thanh toán ngay</span>
            <span *ngIf="isSubmitting"><i class="fa-solid fa-circle-notch fa-spin"></i> Đang khởi tạo...</span>
          </button>
        </div>
      </div>
    </div>

    <!-- VOUCHER SELECTION MODAL -->
    <div class="modal-overlay-premium" *ngIf="showVoucherModal" (click)="closeVoucherModal()">
      <div class="voucher-modal-premium animate-fade-in" (click)="$event.stopPropagation()">
        <div class="v-modal-header">
          <div class="v-modal-title">
            <i class="fa-solid fa-ticket"></i>
            <h3>Kho Voucher Của Bạn</h3>
          </div>
          <button class="v-modal-close" (click)="closeVoucherModal()">&times;</button>
        </div>
        
        <div class="v-modal-body">
          <div class="v-list-modern" *ngIf="applicableVouchers.length > 0; else noVouchers">
            <div 
              class="v-card-modern" 
              *ngFor="let v of applicableVouchers" 
              [class.disabled]="rawTotalPrice < (v.minBookingAmount || 0)"
              (click)="selectVoucherFromList(v)">
              <div class="v-card-accent" [ngClass]="v.isGlobal ? 'global' : 'host'">
                <i class="fa-solid" [ngClass]="v.isGlobal ? 'fa-globe' : 'fa-house-user'"></i>
              </div>
              <div class="v-card-main">
                <div class="v-card-top">
                  <span class="v-code">{{ v.code }}</span>
                  <span class="v-type-tag" *ngIf="v.isGlobal">Hệ thống</span>
                </div>
                <div class="v-card-desc">
                  Giảm {{ v.type === 'PERCENTAGE' ? v.value + '%' : (v.value | number) + 'đ' }}
                  <small *ngIf="v.minBookingAmount">Đơn tối thiểu {{ v.minBookingAmount | number }}đ</small>
                </div>
                <div class="v-card-footer">
                  <span>Hết hạn: {{ v.expiryDate | date:'dd/MM/yyyy' }}</span>
                </div>
              </div>
              <div class="v-card-action">
                <button [disabled]="rawTotalPrice < (v.minBookingAmount || 0)">Sử dụng</button>
              </div>
            </div>
          </div>
          <ng-template #noVouchers>
            <div class="v-empty-state">
              <i class="fa-solid fa-ticket-simple"></i>
              <p>Hiện không có mã giảm giá nào phù hợp với homestay này.</p>
            </div>
          </ng-template>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .booking-page { min-height: 100vh; background: #f8fafc; padding: 120px 20px 60px; font-family: 'Inter', sans-serif; }
    .booking-container { max-width: 1300px; margin: 0 auto; display: grid; grid-template-columns: 1fr 420px; gap: 40px; }
    
    /* LEFT SECTION */
    .selection-section { display: flex; flex-direction: column; gap: 30px; }
    
    .homestay-hero-mini { background: white; border-radius: 28px; overflow: hidden; display: flex; box-shadow: 0 10px 30px rgba(0,0,0,0.04); border: 1px solid #e2e8f0; height: 180px; }
    .hero-image-wrap { width: 300px; position: relative; flex-shrink: 0; }
    .h-img { width: 100%; height: 100%; object-fit: cover; }
    .hero-overlay { position: absolute; inset: 0; background: linear-gradient(to right, transparent, rgba(0,0,0,0.1)); }
    .h-details { padding: 30px; flex: 1; display: flex; flex-direction: column; justify-content: center; }
    .h-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; }
    .h-header h1 { font-size: 26px; font-weight: 900; color: #0f172a; margin: 0; letter-spacing: -0.5px; }
    .h-rating { background: #fef9c3; color: #854d0e; padding: 4px 12px; border-radius: 50px; font-size: 13px; font-weight: 800; display: flex; align-items: center; gap: 6px; }
    .h-rating i { color: #eab308; }
    .h-address { color: #64748b; font-size: 15px; margin: 0 0 15px; font-weight: 500; }
    .h-price-tag { display: flex; align-items: center; gap: 10px; }
    .h-price-tag .label { font-size: 13px; color: #94a3b8; font-weight: 700; text-transform: uppercase; }
    .h-price-tag .value { font-size: 20px; font-weight: 800; color: #10b981; }
    .h-price-tag .unit { color: #94a3b8; font-size: 14px; }

    .booking-step-card { background: white; border-radius: 28px; padding: 35px; border: 1px solid #e2e8f0; box-shadow: 0 10px 30px rgba(0,0,0,0.03); }
    .step-header { display: flex; gap: 20px; align-items: center; margin-bottom: 30px; }
    .step-num { width: 44px; height: 44px; background: #4f46e5; color: white; border-radius: 14px; display: flex; align-items: center; justify-content: center; font-weight: 900; font-size: 18px; box-shadow: 0 8px 15px rgba(79, 70, 229, 0.2); }
    .step-title h3 { margin: 0; font-size: 19px; font-weight: 800; color: #0f172a; }
    .step-title p { margin: 4px 0 0; font-size: 14px; color: #64748b; font-weight: 500; }
    
    .date-picker-grid { display: flex; align-items: center; gap: 20px; background: #f8fafc; padding: 25px; border-radius: 20px; border: 1.5px solid #f1f5f9; }
    .date-field { flex: 1; }
    .date-field label { display: block; font-size: 12px; font-weight: 800; color: #475569; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 10px; }
    .premium-input { width: 100%; padding: 14px 18px; background: white; border: 1.5px solid #e2e8f0; border-radius: 14px; font-family: inherit; font-weight: 600; color: #1e293b; transition: all 0.3s; }
    .premium-input:focus { border-color: #4f46e5; box-shadow: 0 0 0 4px rgba(79, 70, 229, 0.1); outline: none; }
    .date-arrow { color: #cbd5e1; font-size: 20px; margin-top: 25px; }
    .alert-error { margin-top: 15px; padding: 12px 20px; background: #fef2f2; border-left: 4px solid #ef4444; border-radius: 10px; color: #b91c1c; font-size: 14px; font-weight: 600; display: flex; align-items: center; gap: 10px; }

    .room-types-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 16px; }
    .rt-card-premium { background: white; border: 2px solid #f1f5f9; border-radius: 22px; padding: 20px; cursor: pointer; transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); display: flex; align-items: center; gap: 18px; position: relative; }
    .rt-card-premium:hover { border-color: #e2e8f0; transform: translateY(-3px); box-shadow: 0 10px 20px rgba(0,0,0,0.03); }
    .rt-card-premium.active { border-color: #4f46e5; background: #f5f3ff; }
    .rt-icon-wrap { width: 50px; height: 50px; background: #f8fafc; color: #64748b; border-radius: 14px; display: flex; align-items: center; justify-content: center; font-size: 20px; transition: all 0.3s; }
    .rt-card-premium.active .rt-icon-wrap { background: #4f46e5; color: white; }
    .rt-info { display: flex; flex-direction: column; gap: 2px; }
    .rt-name { font-weight: 800; color: #0f172a; font-size: 16px; }
    .rt-desc { font-size: 12px; color: #94a3b8; font-weight: 500; }
    .rt-check { position: absolute; top: -10px; right: -10px; color: #4f46e5; font-size: 22px; background: white; border-radius: 50%; }

    .available-rooms-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); gap: 16px; }
    .room-card-premium { background: white; border: 2px solid #f1f5f9; border-radius: 22px; padding: 22px; cursor: pointer; transition: all 0.3s; position: relative; overflow: hidden; display: flex; }
    .room-indicator { position: absolute; left: 0; top: 0; bottom: 0; width: 6px; background: #e2e8f0; transition: all 0.3s; }
    .room-card-premium:hover { border-color: #e2e8f0; transform: scale(1.02); }
    .room-card-premium.selected { border-color: #10b981; }
    .room-card-premium.selected .room-indicator { background: #10b981; }
    .room-content { flex: 1; display: flex; flex-direction: column; gap: 15px; }
    .room-main { display: flex; flex-direction: column; gap: 4px; }
    .room-name { font-size: 18px; font-weight: 900; color: #0f172a; }
    .room-capacity { font-size: 13px; color: #64748b; font-weight: 600; }
    .room-pricing { display: flex; flex-direction: column; align-items: flex-end; }
    .price-extra { font-size: 12px; color: #10b981; font-weight: 800; margin-bottom: 2px; }
    .price-final { font-size: 18px; font-weight: 900; color: #1e293b; }
    .empty-rooms-alert { padding: 40px; text-align: center; color: #94a3b8; background: #f8fafc; border-radius: 24px; border: 2px dashed #e2e8f0; }
    .empty-rooms-alert i { font-size: 32px; margin-bottom: 12px; opacity: 0.5; }

    .payment-methods-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
    .pay-card-premium { background: white; border: 2px solid #f1f5f9; border-radius: 22px; padding: 25px; cursor: pointer; display: flex; align-items: center; gap: 20px; transition: all 0.3s; position: relative; }
    .pay-card-premium:hover { border-color: #e2e8f0; background: #fafafa; }
    .pay-card-premium.active { border-color: #4f46e5; background: #f5f3ff; }
    .pay-icon-box { width: 60px; height: 60px; border-radius: 18px; display: flex; align-items: center; justify-content: center; font-size: 24px; }
    .pay-icon-box.vnpay { background: #eef2ff; color: #4f46e5; }
    .pay-icon-box.wallet { background: #ecfdf5; color: #10b981; }
    .pay-info { display: flex; flex-direction: column; gap: 4px; flex: 1; }
    .pay-info strong { font-size: 17px; font-weight: 800; color: #0f172a; }
    .pay-info span { font-size: 13px; color: #64748b; font-weight: 500; }
    .pay-radio { width: 20px; height: 20px; border: 2px solid #cbd5e1; border-radius: 50%; position: relative; }
    .pay-card-premium.active .pay-radio { border-color: #4f46e5; }
    .pay-card-premium.active .pay-radio::after { content: ''; position: absolute; inset: 4px; background: #4f46e5; border-radius: 50%; }

    /* SUMMARY SECTION */
    .summary-card-premium { background: white; border-radius: 32px; padding: 40px; box-shadow: 0 20px 50px rgba(0,0,0,0.06); border: 1px solid #e2e8f0; }
    .sticky { position: sticky; top: 120px; }
    .summary-header { margin-bottom: 30px; border-bottom: 1.5px solid #f1f5f9; padding-bottom: 15px; }
    .summary-header h3 { margin: 0; font-size: 22px; font-weight: 900; color: #0f172a; }
    .summary-rows { display: flex; flex-direction: column; gap: 16px; margin-bottom: 30px; }
    .s-row { display: flex; justify-content: space-between; align-items: center; font-size: 15px; color: #64748b; font-weight: 500; }
    .s-value { color: #1e293b; font-weight: 700; }
    .s-row.subtotal { margin-top: 10px; padding-top: 15px; border-top: 1px dashed #e2e8f0; }

    .voucher-box-premium { margin: 25px 0; padding: 22px; background: #f8fafc; border-radius: 24px; border: 1.5px solid #f1f5f9; }
    .v-header-mini { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; }
    .v-header-mini label { font-size: 12px; font-weight: 800; color: #475569; text-transform: uppercase; letter-spacing: 0.5px; }
    .v-browse-btn { background: none; border: none; color: #4f46e5; font-size: 12px; font-weight: 700; cursor: pointer; padding: 4px 8px; border-radius: 6px; }
    .v-browse-btn:hover:not(:disabled) { background: #eef2ff; }
    .v-input-wrap { display: flex; gap: 8px; }
    .v-input-wrap input { flex: 1; padding: 12px 15px; border: 1.5px solid #e2e8f0; border-radius: 12px; font-size: 14px; font-family: inherit; font-weight: 600; }
    .v-apply-btn { background: #0f172a; color: white; border: none; padding: 0 20px; border-radius: 12px; font-weight: 700; cursor: pointer; transition: all 0.2s; font-size: 13px; }
    .v-apply-btn:hover:not(:disabled) { background: #1e293b; transform: translateY(-1px); }
    .v-remove-btn { background: #fee2e2; color: #ef4444; border: none; padding: 0 15px; border-radius: 12px; cursor: pointer; transition: all 0.2s; }
    .v-success-badge { margin-top: 12px; display: flex; align-items: center; gap: 8px; color: #059669; font-size: 13px; font-weight: 700; }
    .v-error-text { margin-top: 8px; color: #dc2626; font-size: 12px; font-weight: 600; display: flex; align-items: center; gap: 6px; }

    .final-total { display: flex; justify-content: space-between; align-items: flex-end; margin-top: 30px; padding-top: 25px; border-top: 2px solid #f1f5f9; }
    .total-label { display: flex; flex-direction: column; gap: 4px; }
    .total-label strong { font-size: 18px; color: #0f172a; font-weight: 900; }
    .total-label span { font-size: 12px; color: #94a3b8; font-weight: 500; }
    .total-amount { display: flex; flex-direction: column; align-items: flex-end; gap: 2px; }
    .old-price { font-size: 15px; color: #94a3b8; text-decoration: line-through; font-weight: 600; }
    .new-price { font-size: 32px; font-weight: 900; color: #4f46e5; letter-spacing: -1px; }

    .summary-footer { margin-top: 35px; }
    .btn-book-premium { width: 100%; padding: 20px; background: linear-gradient(135deg, #4f46e5 0%, #3b82f6 100%); color: white; border: none; border-radius: 20px; font-size: 17px; font-weight: 800; cursor: pointer; transition: all 0.3s; box-shadow: 0 10px 25px rgba(79, 70, 229, 0.3); }
    .btn-book-premium:hover:not(:disabled) { transform: translateY(-3px); box-shadow: 0 15px 35px rgba(79, 70, 229, 0.4); }
    .btn-book-premium:disabled { opacity: 0.6; cursor: not-allowed; box-shadow: none; }
    .trust-badges { margin-top: 20px; display: flex; align-items: center; justify-content: center; gap: 8px; color: #94a3b8; font-size: 13px; font-weight: 600; }

    /* MODAL STYLES */
    .modal-overlay-premium { position: fixed; inset: 0; background: rgba(15, 23, 42, 0.6); z-index: 2000; display: flex; align-items: center; justify-content: center; backdrop-filter: blur(8px); padding: 20px; }
    .modal-card-premium { background: white; width: 100%; max-width: 850px; border-radius: 32px; overflow: hidden; box-shadow: 0 40px 100px rgba(0,0,0,0.3); position: relative; }
    .modal-header-banner { background: #0f172a; padding: 40px; color: white; display: flex; align-items: center; gap: 30px; position: relative; }
    .header-icon-circle { width: 70px; height: 70px; background: rgba(255,255,255,0.1); border-radius: 22px; display: flex; align-items: center; justify-content: center; font-size: 32px; }
    .header-text h2 { margin: 0; font-size: 28px; font-weight: 900; letter-spacing: -0.5px; }
    .header-text p { margin: 6px 0 0; font-size: 15px; opacity: 0.7; font-weight: 500; }
    .modal-close { position: absolute; top: 25px; right: 25px; background: none; border: none; color: white; font-size: 32px; cursor: pointer; opacity: 0.5; transition: 0.2s; }
    .modal-close:hover { opacity: 1; transform: rotate(90deg); }

    .modal-body-premium { padding: 40px; display: grid; grid-template-columns: 1fr 1.5fr; gap: 40px; }
    .mini-order-card { background: #f8fafc; border-radius: 24px; padding: 25px; border: 1.5px solid #f1f5f9; display: flex; flex-direction: column; gap: 15px; height: fit-content; }
    .mini-row { display: flex; justify-content: space-between; font-size: 14px; color: #64748b; font-weight: 600; }
    .m-value { color: #1e293b; font-weight: 800; }
    .mini-row.total { padding-top: 15px; border-top: 2px solid #e2e8f0; margin-top: 5px; }
    .mini-row.total .m-value { font-size: 20px; color: #4f46e5; }

    .info-update-section { display: flex; flex-direction: column; gap: 25px; }
    .section-title { display: flex; align-items: center; gap: 12px; color: #0f172a; }
    .section-title i { font-size: 20px; color: #4f46e5; }
    .section-title h3 { margin: 0; font-size: 18px; font-weight: 800; }
    .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
    .info-group { display: flex; flex-direction: column; gap: 8px; }
    .info-group.full { grid-column: span 2; }
    .info-group label { font-size: 13px; font-weight: 800; color: #475569; text-transform: uppercase; letter-spacing: 0.5px; }
    .info-group input { padding: 14px 18px; border: 2px solid #f1f5f9; border-radius: 14px; font-family: inherit; font-weight: 600; color: #1e293b; transition: all 0.3s; background: #fcfdfe; }
    .info-group input:focus { border-color: #4f46e5; background: white; box-shadow: 0 0 0 4px rgba(79, 70, 229, 0.05); outline: none; }

    .modal-footer-premium { padding: 30px 40px; background: #f8fafc; border-top: 1px solid #f1f5f9; display: flex; justify-content: flex-end; gap: 15px; }
    .btn-cancel-modal { padding: 16px 30px; border-radius: 16px; background: #e2e8f0; color: #475569; font-weight: 700; border: none; cursor: pointer; transition: 0.2s; }
    .btn-confirm-modal { padding: 16px 40px; border-radius: 16px; background: #4f46e5; color: white; font-weight: 800; border: none; cursor: pointer; transition: all 0.3s; box-shadow: 0 8px 15px rgba(79, 70, 229, 0.2); }
    .btn-confirm-modal:hover:not(:disabled) { background: #4338ca; transform: translateY(-2px); box-shadow: 0 12px 25px rgba(79, 70, 229, 0.3); }

    /* VOUCHER MODAL */
    .voucher-modal-premium { background: white; width: 100%; max-width: 550px; border-radius: 32px; overflow: hidden; box-shadow: 0 30px 60px rgba(0,0,0,0.2); display: flex; flex-direction: column; max-height: 85vh; }
    .v-modal-header { padding: 30px; border-bottom: 1.5px solid #f1f5f9; display: flex; justify-content: space-between; align-items: center; }
    .v-modal-title { display: flex; align-items: center; gap: 12px; }
    .v-modal-title i { font-size: 22px; color: #4f46e5; }
    .v-modal-title h3 { margin: 0; font-size: 20px; font-weight: 800; color: #0f172a; }
    .v-modal-close { background: none; border: none; font-size: 28px; cursor: pointer; color: #94a3b8; }
    .v-modal-body { padding: 20px; overflow-y: auto; }
    .v-list-modern { display: flex; flex-direction: column; gap: 15px; }
    .v-card-modern { display: flex; border: 2px solid #f1f5f9; border-radius: 20px; overflow: hidden; cursor: pointer; transition: all 0.3s; }
    .v-card-modern:hover:not(.disabled) { border-color: #4f46e5; transform: scale(1.02); }
    .v-card-modern.disabled { opacity: 0.5; cursor: not-allowed; grayscale: 1; }
    .v-card-accent { width: 80px; display: flex; align-items: center; justify-content: center; font-size: 24px; color: white; }
    .v-card-accent.global { background: linear-gradient(135deg, #4f46e5 0%, #3b82f6 100%); }
    .v-card-accent.host { background: linear-gradient(135deg, #10b981 0%, #059669 100%); }
    .v-card-main { flex: 1; padding: 15px 20px; display: flex; flex-direction: column; gap: 5px; }
    .v-card-top { display: flex; justify-content: space-between; align-items: center; }
    .v-code { font-family: 'JetBrains Mono', monospace; font-weight: 800; color: #4f46e5; font-size: 15px; }
    .v-type-tag { font-size: 10px; font-weight: 800; text-transform: uppercase; padding: 2px 8px; background: #eef2ff; color: #4f46e5; border-radius: 4px; }
    .v-card-desc { font-size: 15px; font-weight: 800; color: #0f172a; }
    .v-card-desc small { display: block; font-size: 12px; color: #64748b; font-weight: 500; margin-top: 2px; }
    .v-card-footer { font-size: 11px; color: #94a3b8; font-weight: 600; }
    .v-card-action { padding: 15px; display: flex; align-items: center; border-left: 1px dashed #e2e8f0; }
    .v-card-action button { background: #0f172a; color: white; border: none; padding: 8px 15px; border-radius: 10px; font-size: 12px; font-weight: 700; cursor: pointer; }
    
    .animate-fade-in { animation: modalFadeIn 0.5s cubic-bezier(0.16, 1, 0.3, 1); }
    @keyframes modalFadeIn { from { opacity: 0; transform: translateY(30px) scale(0.98); } to { opacity: 1; transform: translateY(0) scale(1); } }
    .animate-scale-in { animation: scaleIn 0.3s ease-out; }
    @keyframes scaleIn { from { opacity: 0; transform: scale(0.9); } to { opacity: 1; transform: scale(1); } }

    @media (max-width: 1024px) {
      .booking-container { grid-template-columns: 1fr; }
      .summary-card-premium { position: static; }
      .modal-body-premium { grid-template-columns: 1fr; }
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
