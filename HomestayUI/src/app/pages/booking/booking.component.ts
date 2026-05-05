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

@Component({
  selector: 'app-booking',
  standalone: true,
  imports: [CommonModule, FormsModule, NavbarComponent],
  templateUrl: './booking.component.html',
  styleUrl: './booking.component.css'
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
    return true;
  }

  openConfirmationModal() {
    if (!this.canBook) return;

    if (!this.authService.hasRole('USER')) {
      this.notification.warning('Chỉ người dùng mới có thể đặt phòng.');
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
        } else {
          // If At Counter, just show success and go to dashboard
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
