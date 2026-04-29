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
                  [class.active]="selectedPaymentMethod === 'AT_COUNTER'"
                  (click)="selectedPaymentMethod = 'AT_COUNTER'">
                  <span class="pay-icon">💵</span>
                  <div class="pay-text">
                    <strong>Tại quầy</strong>
                    <p>Thanh toán khi nhận phòng</p>
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
              <div class="total-row">
                <span>Tổng cộng:</span>
                <span class="total-price">{{ totalPrice | number }}đ</span>
              </div>
            </div>
            <button 
              class="btn-confirm" 
              [disabled]="!canBook || bookingLoading" 
              (click)="confirmBooking()">
              {{ bookingLoading ? 'Đang xử lý...' : 'Xác nhận Đặt phòng' }}
            </button>
            <p class="disclaimer">Vui lòng kiểm tra kỹ thông tin trước khi đặt.</p>
          </div>
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

    .animate-fade-in { animation: fadeIn 0.5s ease-out; }
    @keyframes fadeIn { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }

    @media (max-width: 992px) {
      .booking-container { grid-template-columns: 1fr; }
      .summary-card { position: static; }
    }
  `]
})
export class BookingComponent implements OnInit {
  homestayId = '';
  homestay: HomestayDto | null = null;
  roomTypes: RoomTypeDto[] = [];
  availableRooms: RoomDto[] = [];
  
  checkInDate = '';
  checkOutDate = '';
  selectedRoomTypeId: number | null = null;
  selectedRoomId: string | null = null;
  
  today = new Date().toISOString().split('T')[0];
  minCheckOut = '';
  
  selectedPaymentMethod = 'VNPAY';
  bookingLoading = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    public authService: AuthService,
    private homestayService: HomestayService,
    private roomTypeService: RoomTypeService,
    private bookingService: BookingService,
    private notification: NotificationService
  ) {}

  ngOnInit() {
    this.homestayId = this.route.snapshot.params['homestayId'];
    if (!this.homestayId) {
      this.router.navigate(['/']);
      return;
    }

    this.loadData();
  }

  loadData() {
    // We need a getHomestayById. For now I'll use the existing getAll and filter, 
    // but I added getHomestayById to backend so I should update service.
    this.homestayService.getActiveHomestays().subscribe(data => {
      this.homestay = data.find(h => h.id === this.homestayId) || null;
    });

    this.roomTypeService.getAllRoomTypes().subscribe(data => {
      this.roomTypes = data;
    });
  }

  onDateChange() {
    if (this.checkInDate) {
      const nextDay = new Date(this.checkInDate);
      nextDay.setDate(nextDay.getDate() + 1);
      this.minCheckOut = nextDay.toISOString().split('T')[0];
      
      if (this.checkOutDate && this.checkOutDate <= this.checkInDate) {
        this.checkOutDate = this.minCheckOut;
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

  get totalPrice(): number {
    return this.pricePerNight * this.totalNights;
  }

  get canBook(): boolean {
    return !!(this.selectedRoomId && this.checkInDate && this.checkOutDate && this.totalNights > 0 && this.selectedPaymentMethod);
  }

  confirmBooking() {
    if (!this.canBook) return;

    if (!this.authService.hasRole('USER')) {
      this.notification.warning('Chỉ người dùng mới có thể đặt phòng.');
      return;
    }
    
    this.bookingLoading = true;
    const request: BookingRequestDto = {
      homestayId: this.homestayId,
      roomId: this.selectedRoomId!,
      checkInDate: this.checkInDate,
      checkOutDate: this.checkOutDate,
      paymentMethod: this.selectedPaymentMethod
    };

    this.bookingService.createBooking(request).subscribe({
      next: (res) => {
        this.notification.success('Đặt phòng thành công! Chúng tôi sẽ sớm liên hệ với bạn.');
        this.router.navigate(['/dashboard/user']);
        this.bookingLoading = false;
      },
      error: (err) => {
        this.notification.error(err.error?.message || 'Có lỗi xảy ra khi đặt phòng.');
        this.bookingLoading = false;
      }
    });
  }
}
