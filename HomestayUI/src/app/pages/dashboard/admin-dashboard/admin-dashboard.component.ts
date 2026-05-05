import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NavbarComponent } from '../../../components/navbar/navbar.component';
import { UpgradeRequestService, UpgradeRequestDto } from '../../../services/upgrade-request.service';
import { AmenityService, AmenityDto } from '../../../services/amenity.service';
import { HomestayService, HomestayDto } from '../../../services/homestay.service';
import { RoomTypeService, RoomTypeDto } from '../../../services/room-type.service';
import { NotificationService } from '../../../services/notification.service';
import { ConfirmDialogService } from '../../../services/confirm-dialog.service';
import { ProfileTabComponent } from '../../../components/profile-tab/profile-tab.component';
import { BookingHistoryTabComponent } from '../../../components/booking-history-tab/booking-history-tab.component';
import { StatisticsService, AdminStatistics } from '../../../services/statistics.service';
import { ReportService } from '../../../services/report.service';
import { ChatTabComponent } from '../chat-tab/chat-tab.component';
import { AdminVoucherTabComponent } from '../../../components/admin-voucher-tab/admin-voucher-tab.component';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, NavbarComponent, ProfileTabComponent, BookingHistoryTabComponent, ChatTabComponent, AdminVoucherTabComponent],
  templateUrl: './admin-dashboard.component.html',
  styleUrl: './admin-dashboard.component.css'
})
export class AdminDashboardComponent implements OnInit {
  activeTab = 'statistics';
  pendingRequests: UpgradeRequestDto[] = [];

  amenities: AmenityDto[] = [];
  newAmenityName = '';
  newAmenityIcon = '';

  homestays: HomestayDto[] = [];
  filterStatus = 'ALL';
  selectedHomestay: HomestayDto | null = null;

  roomTypes: RoomTypeDto[] = [];
  newRoomTypeName = '';
  newRoomTypeDesc = '';
  editingRoomType: RoomTypeDto | null = null;
  editRoomTypeForm = { name: '', description: '' };

  // REASON MODAL STATE
  showReasonModal = false;
  reasonTitle = '';
  reasonLabel = '';
  reasonValue = '';
  reasonTarget: any = null;

  adminStats: AdminStatistics | null = null;

  constructor(
    private upgradeReqService: UpgradeRequestService,
    private amenityService: AmenityService,
    private homestayService: HomestayService,
    private roomTypeService: RoomTypeService,
    private notification: NotificationService,
    public notificationService: NotificationService,
    private confirmDialog: ConfirmDialogService,
    private statsService: StatisticsService,
    public reportService: ReportService
  ) { }

  ngOnInit() {
    this.loadAdminStats();
    this.loadRequests();
    this.loadAmenities();
    this.loadHomestays();
    this.loadRoomTypes();
  }

  loadAdminStats() {
    this.statsService.getAdminStats().subscribe({
      next: (res) => this.adminStats = res,
      error: (err) => console.error('Failed to load admin stats', err)
    });
  }

  getRevenuePercentage(rev: number): number {
    if (!this.adminStats || !this.adminStats.monthlyRevenue.length) return 0;
    const max = Math.max(...this.adminStats.monthlyRevenue.map(m => m.revenue));
    return max === 0 ? 0 : (rev / max) * 100;
  }

  getStatusPercentage(count: number): number {
    if (!this.adminStats || !this.adminStats.totalBookings) return 0;
    return (count / this.adminStats.totalBookings) * 100;
  }

  formatMonthLabel(monthStr: string): string {
    if (!monthStr) return '';
    const [y, m] = monthStr.split('-');
    return `T${m}/${y.substring(2)}`;
  }

  translateStatus(status: string): string {
    const map: any = {
      'PENDING': 'Chờ xử lý',
      'CONFIRMED': 'Đã xác nhận',
      'CANCELLED': 'Đã hủy',
      'COMPLETED': 'Hoàn thành',
      'REFUNDED': 'Đã hoàn tiền',
      'CHECKED_IN': 'Đã nhận phòng'
    };
    return map[status] || status;
  }

  // --- UPGRADES ---
  loadRequests() {
    this.upgradeReqService.getPendingRequests().subscribe({
      next: (res) => { this.pendingRequests = res; },
      error: (err) => { console.error('Failed to load requests', err); }
    });
  }

  approve(id: string) {
    this.reasonTarget = { id, type: 'APPROVE_UPGRADE' };
    this.reasonTitle = 'Phê duyệt Host';
    this.reasonLabel = 'Ghi chú phê duyệt (tùy chọn)';
    this.reasonValue = '';
    this.showReasonModal = true;
  }

  reject(id: string) {
    this.reasonTarget = { id, type: 'REJECT_UPGRADE' };
    this.reasonTitle = 'Từ chối Host';
    this.reasonLabel = 'Lý do từ chối (bắt buộc)';
    this.reasonValue = '';
    this.showReasonModal = true;
  }

  // --- AMENITIES ---
  loadAmenities() {
    this.amenityService.getAllAmenities().subscribe(res => this.amenities = res);
  }

  addAmenity() {
    if (!this.newAmenityName) return this.notification.warning('Vui lòng nhập tên tiện ích');
    this.amenityService.createAmenity({ name: this.newAmenityName, iconUrl: '' }).subscribe(() => {
      this.newAmenityName = '';
      this.notification.success('Đã thêm tiện ích mới!');
      this.loadAmenities();
    });
  }

  async deleteAmenity(id: number) {
    const ok = await this.confirmDialog.confirm({ message: 'Bạn có chắc muốn xóa tiện ích này?', type: 'danger', confirmText: 'Xóa' });
    if (!ok) return;
    this.amenityService.deleteAmenity(id).subscribe(() => {
      this.notification.success('Đã xóa tiện ích.');
      this.loadAmenities();
    });
  }

  // --- HOMESTAYS ---
  loadHomestays() {
    this.homestayService.getAllHomestaysAdmin().subscribe(res => this.homestays = res);
  }

  get filteredHomestays() {
    if (this.filterStatus === 'ALL') return this.homestays;
    return this.homestays.filter(h => h.status === this.filterStatus);
  }

  async changeHomestayStatus(id: string, newStatus: string) {
    if (newStatus === 'INACTIVE' || newStatus === 'REJECTED') {
      this.reasonTarget = { id, type: 'HOMESTAY_STATUS', status: newStatus };
      this.reasonTitle = newStatus === 'REJECTED' ? 'Từ chối Homestay' : 'Tạm ngưng Homestay';
      this.reasonLabel = 'Lý do (bắt buộc)';
      this.reasonValue = '';
      this.showReasonModal = true;
      return;
    }

    const ok = await this.confirmDialog.confirm({
      title: 'Xác nhận thay đổi',
      message: `Bạn có muốn thay đổi trạng thái Homestay sang ${newStatus}?`,
      type: 'info',
      confirmText: 'Xác nhận'
    });
    if (!ok) return;

    this.homestayService.updateHomestayStatus(id, newStatus, '').subscribe({
      next: () => {
        this.notification.success('Đã cập nhật trạng thái Homestay!');
        this.loadHomestays();
        this.closeDetail();
      },
      error: (err) => this.notification.error(err.error?.message || err.message)
    });
  }

  submitReason() {
    if (!this.reasonTarget) return;
    const { id, type, status } = this.reasonTarget;

    if ((type === 'REJECT_UPGRADE' || status === 'REJECTED' || status === 'INACTIVE') && !this.reasonValue.trim()) {
      this.notification.warning('Vui lòng nhập lý do!');
      return;
    }

    if (type === 'APPROVE_UPGRADE') {
      this.upgradeReqService.approveRequest(id, this.reasonValue).subscribe({
        next: () => { this.notification.success('Đã phê duyệt!'); this.loadRequests(); this.showReasonModal = false; },
        error: err => this.notification.error(err.error?.message || err.message)
      });
    } else if (type === 'REJECT_UPGRADE') {
      this.upgradeReqService.rejectRequest(id, this.reasonValue).subscribe({
        next: () => { this.notification.info('Đã từ chối!'); this.loadRequests(); this.showReasonModal = false; },
        error: err => this.notification.error(err.error?.message || err.message)
      });
    } else if (type === 'HOMESTAY_STATUS') {
      this.homestayService.updateHomestayStatus(id, status, this.reasonValue).subscribe({
        next: () => {
          this.notification.success('Đã cập nhật trạng thái Homestay!');
          this.loadHomestays();
          this.closeDetail();
          this.showReasonModal = false;
        },
        error: err => this.notification.error(err.error?.message || err.message)
      });
    }
  }

  viewDetail(homestay: HomestayDto) {
    this.selectedHomestay = homestay;
  }

  closeDetail() {
    this.selectedHomestay = null;
  }

  // --- ROOM TYPES ---
  loadRoomTypes() {
    this.roomTypeService.getAllRoomTypes().subscribe(res => this.roomTypes = res);
  }

  addRoomType() {
    if (!this.newRoomTypeName) return this.notification.warning('Vui lòng nhập tên loại phòng!');
    this.roomTypeService.createRoomType({ name: this.newRoomTypeName, description: this.newRoomTypeDesc }).subscribe({
      next: () => {
        this.newRoomTypeName = '';
        this.newRoomTypeDesc = '';
        this.notification.success('Đã thêm loại phòng mới!');
        this.loadRoomTypes();
      },
      error: err => this.notification.error(err.error?.message || err.message)
    });
  }

  editRoomType(rt: RoomTypeDto) {
    this.editingRoomType = rt;
    this.editRoomTypeForm = { name: rt.name, description: rt.description || '' };
  }

  cancelEditRoomType() {
    this.editingRoomType = null;
  }

  submitEditRoomType() {
    if (!this.editRoomTypeForm.name.trim()) return this.notification.warning('Tên không được để trống');
    this.roomTypeService.updateRoomType(this.editingRoomType!.id!, this.editRoomTypeForm).subscribe({
      next: () => {
        this.notification.success('Đã cập nhật loại phòng!');
        this.editingRoomType = null;
        this.loadRoomTypes();
      },
      error: err => this.notification.error(err.error?.message || err.message)
    });
  }

  async deleteRoomType(id: number) {
    const ok = await this.confirmDialog.confirm({
      message: 'Bạn có chắc muốn xóa loại phòng này?',
      type: 'danger',
      confirmText: 'Xóa'
    });
    if (!ok) return;
    this.roomTypeService.deleteRoomType(id).subscribe({
      next: () => {
        this.notification.success('Đã xóa loại phòng.');
        this.loadRoomTypes();
      },
      error: err => this.notification.error(err.error?.message || err.message)
    });
  }
}
