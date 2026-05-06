import { Component, OnInit, Input, Output, EventEmitter, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BookingService, BookingDto } from '../../services/booking.service';
import { ReviewService } from '../../services/review.service';
import { NotificationService } from '../../services/notification.service';
import { ConfirmDialogService } from '../../services/confirm-dialog.service';
import { PaymentService } from '../../services/payment.service';

@Component({
  selector: 'app-booking-history-tab',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './booking-history-tab.component.html',
  styleUrls: ['./booking-history-tab.component.css']
})
export class BookingHistoryTabComponent implements OnInit {
  @Input() role: 'USER' | 'HOST' | 'ADMIN' = 'USER';
  @Output() chatRequested = new EventEmitter<any>();
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

  // Dropdown state for actions
  activeDropdownId: string | null = null;

  @HostListener('document:click')
  clickout() {
    this.activeDropdownId = null;
  }

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
    this.filteredBookings = this.bookings.filter(b => {
      let match = true;
      const created = new Date(b.createdAt);
      if (this.startDateFilter) {
        const start = new Date(this.startDateFilter);
        start.setHours(0, 0, 0, 0);
        if (created < start) match = false;
      }
      if (this.endDateFilter) {
        const end = new Date(this.endDateFilter);
        end.setHours(23, 59, 59, 999);
        if (created > end) match = false;
      }
      return match;
    });

    this.totalPages = Math.ceil(this.filteredBookings.length / this.pageSize);
    this.updatePaginated();
  }

  updatePaginated() {
    const start = (this.currentPage - 1) * this.pageSize;
    const end = start + this.pageSize;
    this.paginatedBookings = this.filteredBookings.slice(start, end);
  }

  changePage(page: number) {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.updatePaginated();
      window.scrollTo({ top: 0, behavior: 'smooth' });
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

  chatWithUser(booking: BookingDto) {
    if (this.role === 'USER') {
      this.chatRequested.emit({ id: booking.hostId, username: booking.hostName });
    } else if (this.role === 'HOST') {
      this.chatRequested.emit({ id: booking.userId, username: booking.userName });
    }
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

  toggleDropdown(id: string, event: Event) {
    event.stopPropagation();
    this.activeDropdownId = this.activeDropdownId === id ? null : id;
  }
}
