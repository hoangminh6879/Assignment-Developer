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
  templateUrl: './host-checkin-tab.component.html',
  styleUrl: './host-checkin-tab.component.css'
})
export class HostCheckinTabComponent implements OnInit {
  activeSubTab: 'search' | 'list' = 'search';

  // Tab 1: Search & Check-in
  searchMode: 'CODE' | 'CCCD' = 'CODE';
  searchQuery = '';
  foundBookings: BookingDto[] = [];
  isLoading = false;
  searched = false;
  confirmingId: string | null = null;

  // Tab 2: Checked-in list & Checkout
  checkedInBookings: BookingDto[] = [];
  listFilterQuery = '';
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
    this.listFilterQuery = '';
    this.loadCheckedInBookings();
  }

  get filteredCheckedInBookings(): BookingDto[] {
    if (!this.listFilterQuery.trim()) return this.checkedInBookings;
    const query = this.listFilterQuery.toLowerCase();
    return this.checkedInBookings.filter(b => 
      (b.userName?.toLowerCase().includes(query)) || 
      (b.checkInCode?.toLowerCase().includes(query)) ||
      (b.roomName?.toLowerCase().includes(query))
    );
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
  onSearch() {
    if (this.searchMode === 'CODE') this.searchByCode();
    else this.searchByCitizenId();
  }

  searchByCode() {
    if (!this.searchQuery.trim()) return;
    this.isLoading = true;
    this.searched = false;
    this.foundBookings = [];

    this.bookingService.getBookingByCheckInCode(this.searchQuery.trim()).subscribe({
      next: (booking: BookingDto) => {
        this.foundBookings = [booking];
        this.searched = true;
        this.isLoading = false;
      },
      error: (err: any) => {
        this.isLoading = false;
        this.searched = true;
        this.notification.error(err.error?.message || 'Không tìm thấy đơn đặt phòng với mã này.');
      }
    });
  }

  searchByCitizenId() {
    if (!this.searchQuery.trim()) return;
    this.isLoading = true;
    this.searched = false;
    this.foundBookings = [];

    this.bookingService.getBookingsByCitizenId(this.searchQuery.trim()).subscribe({
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
}
