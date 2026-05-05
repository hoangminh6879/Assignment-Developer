import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NavbarComponent } from '../../../components/navbar/navbar.component';
import { HomestayService, HomestayDto } from '../../../services/homestay.service';
import { AmenityService, AmenityDto } from '../../../services/amenity.service';
import { RoomService, RoomDto } from '../../../services/room.service';
import { RoomTypeService, RoomTypeDto } from '../../../services/room-type.service';
import { NotificationService } from '../../../services/notification.service';
import { ConfirmDialogService } from '../../../services/confirm-dialog.service';
import { ProfileTabComponent } from '../../../components/profile-tab/profile-tab.component';
import { BookingHistoryTabComponent } from '../../../components/booking-history-tab/booking-history-tab.component';
import { HostCheckinTabComponent } from '../../../components/host-checkin-tab/host-checkin-tab.component';
import { HostReviewTabComponent } from '../../../components/host-review-tab/host-review-tab.component';
import { StatisticsService, HostStatistics } from '../../../services/statistics.service';
import { ReportService } from '../../../services/report.service';
import { ChatTabComponent } from '../chat-tab/chat-tab.component';
import { HostVoucherTabComponent } from '../../../components/host-voucher-tab/host-voucher-tab.component';

@Component({
  selector: 'app-host-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    NavbarComponent,
    ProfileTabComponent,
    BookingHistoryTabComponent,
    HostCheckinTabComponent,
    HostReviewTabComponent,
    ChatTabComponent,
    HostVoucherTabComponent
  ],
  templateUrl: './host-dashboard.component.html',
  styleUrl: './host-dashboard.component.css'
})
export class HostDashboardComponent implements OnInit {
  activeTab = 'statistics';
  chatRecipientUser: any = null;

  // Detail Modal State
  showDetailModal = false;
  selectedHomestayForDetail: HomestayDto | null = null;

  homestays: HomestayDto[] = [];
  availableAmenities: AmenityDto[] = [];

  activeCount = 0;
  pendingCount = 0;

  showForm = false;
  isEditMode = false;
  isLoading = false;

  formData: any = {};
  selectedAmenityIds: number[] = [];
  selectedFiles: File[] = [];
  previewUrls: string[] = [];
  existingImages: any[] = [];
  deletedImageIds: string[] = [];
  currentEditId: string | null = null;

  // Detail Modal Methods
  openDetail(h: HomestayDto) {
    this.selectedHomestayForDetail = h;
    this.showDetailModal = true;
  }

  closeDetail() {
    this.showDetailModal = false;
    this.selectedHomestayForDetail = null;
  }

  editFromDetail() {
    if (this.selectedHomestayForDetail) {
      const h = this.selectedHomestayForDetail;
      this.closeDetail();
      this.openEditForm(h);
    }
  }

  hostStats: HostStatistics | null = null;

  constructor(
    private homestayService: HomestayService,
    private amenityService: AmenityService,
    private roomService: RoomService,
    private roomTypeService: RoomTypeService,
    public notificationService: NotificationService,
    private confirmDialog: ConfirmDialogService,
    private statsService: StatisticsService,
    public reportService: ReportService
  ) { }

  ngOnInit() {
    this.loadHostStats();
    this.loadHomestays();
    this.loadAmenities();
    this.loadRoomTypes();
  }

  loadAllStats() {
    this.loadHostStats();
    this.loadHomestays();
  }

  loadHostStats() {
    this.statsService.getHostStats().subscribe({
      next: (res) => this.hostStats = res,
      error: (err) => console.error('Failed to load host stats', err)
    });
  }

  getRevenuePercentage(rev: number): number {
    if (!this.hostStats || !this.hostStats.monthlyRevenue.length) return 0;
    const max = Math.max(...this.hostStats.monthlyRevenue.map(m => m.revenue));
    return max === 0 ? 0 : (rev / max) * 100;
  }

  formatMonthLabel(monthStr: string): string {
    if (!monthStr) return '';
    const [y, m] = monthStr.split('-');
    return `T${m}/${y.substring(2)}`;
  }

  get totalViews(): number {
    return this.homestays.reduce((acc, h) => acc + (h.viewCount || 0), 0);
  }

  getViewCountForHomestay(name: string): number {
    const homestay = this.homestays.find(h => h.name === name);
    return homestay ? (homestay.viewCount || 0) : 0;
  }

  getBookingCountForHomestay(name: string): number {
    if (!this.hostStats || !this.hostStats.homestayStats) return 0;
    const stat = this.hostStats.homestayStats.find((s: any) => s.homestayName === name);
    return stat ? stat.bookingCount : 0;
  }

  getRevenueForHomestay(name: string): number {
    if (!this.hostStats || !this.hostStats.homestayStats) return 0;
    const stat = this.hostStats.homestayStats.find((s: any) => s.homestayName === name);
    return stat ? stat.totalRevenue : 0;
  }

  loadHomestays() {
    this.homestayService.getHostHomestays().subscribe({
      next: (res) => {
        this.homestays = res;
        this.activeCount = res.filter(h => h.status === 'ACTIVE').length;
        this.pendingCount = res.filter(h => h.status === 'PENDING').length;
      },
      error: (err) => console.error(err)
    });
  }

  loadAmenities() {
    this.amenityService.getAllAmenities().subscribe(res => this.availableAmenities = res);
  }

  openAddForm() {
    this.isEditMode = false;
    this.currentEditId = null;
    this.formData = { name: '', description: '', address: '', city: '', pricePerNight: 0, maxGuests: 1 };
    this.selectedAmenityIds = [];
    this.selectedFiles = [];
    this.previewUrls = [];
    this.showForm = true;
  }

  openEditForm(homestay: HomestayDto) {
    this.isEditMode = true;
    this.currentEditId = homestay.id;
    this.formData = {
      name: homestay.name,
      description: homestay.description,
      address: homestay.address,
      city: homestay.city,
      pricePerNight: homestay.pricePerNight,
      maxGuests: homestay.maxGuests
    };
    this.selectedAmenityIds = homestay.amenities.map(a => a.id);
    this.existingImages = [...(homestay.images || [])];
    this.deletedImageIds = [];
    this.selectedFiles = [];
    this.previewUrls = [];
    this.showForm = true;
  }

  closeForm() {
    this.previewUrls.forEach(url => URL.revokeObjectURL(url));
    this.showForm = false;
  }

  toggleAmenity(id: number, event: any) {
    if (event.target.checked) {
      this.selectedAmenityIds.push(id);
    } else {
      this.selectedAmenityIds = this.selectedAmenityIds.filter(aId => aId !== id);
    }
  }

  onFilesSelected(event: any) {
    if (event.target.files) {
      const newFiles: File[] = Array.from(event.target.files);

      newFiles.forEach(file => {
        this.selectedFiles.push(file);
        this.previewUrls.push(URL.createObjectURL(file));
      });
    }
  }

  removeImage(index: number) {
    URL.revokeObjectURL(this.previewUrls[index]);
    this.previewUrls.splice(index, 1);
    this.selectedFiles.splice(index, 1);
  }

  removeExistingImage(imgId: string) {
    this.existingImages = this.existingImages.filter(img => img.id !== imgId);
    this.deletedImageIds.push(imgId);
  }

  submitForm(event: Event) {
    event.preventDefault();
    this.isLoading = true;

    const fd = new FormData();
    fd.append('name', this.formData.name || '');
    fd.append('description', this.formData.description || '');
    fd.append('address', this.formData.address || '');
    fd.append('city', this.formData.city || '');
    fd.append('pricePerNight', (this.formData.pricePerNight || 0).toString());
    fd.append('maxGuests', (this.formData.maxGuests || 1).toString());

    this.selectedAmenityIds.forEach(id => {
      fd.append('amenityIds', id.toString());
    });

    this.selectedFiles.forEach(file => {
      fd.append('images', file);
    });

    this.deletedImageIds.forEach(id => {
      fd.append('deleteImageIds', id);
    });

    if (this.isEditMode && this.currentEditId) {
      this.homestayService.updateHomestay(this.currentEditId, fd).subscribe({
        next: () => {
          this.notificationService.success('Cập nhật thành công! Các thay đổi đã được áp dụng ngay lập tức.');
          this.closeForm();
          this.loadHomestays();
          this.isLoading = false;
        },
        error: (err) => {
          this.notificationService.error(err.error?.message || err.message);
          this.isLoading = false;
        }
      });
    } else {
      this.homestayService.createHomestay(fd).subscribe({
        next: () => {
          this.notificationService.success('Thêm mới thành công! Đang chờ duyệt.');
          this.closeForm();
          this.loadHomestays();
          this.isLoading = false;
        },
        error: (err) => {
          this.notificationService.error(err.error?.message || err.message);
          this.isLoading = false;
        }
      });
    }
  }

  async deleteHomestay(id: string) {
    const ok = await this.confirmDialog.confirm({
      message: 'Bạn có chắc muốn xóa Homestay này không? Hành động này không thể hoàn tác.',
      type: 'danger',
      confirmText: 'Xóa'
    });
    if (!ok) return;

    this.homestayService.deleteHomestay(id).subscribe({
      next: () => {
        this.notificationService.success('Đã xóa thành công!');
        this.loadHomestays();
      },
      error: (err) => this.notificationService.error(err.error?.message || err.message)
    });
  }

  // === ROOMS LOGIC ===
  rooms: RoomDto[] = [];
  roomTypes: RoomTypeDto[] = [];
  selectedHomestayForRoom: string | null = null;

  showRoomForm = false;
  isRoomEditMode = false;
  roomFormData: any = {};
  roomSelectedFiles: File[] = [];
  roomPreviewUrls: string[] = [];
  currentRoomEditId: string | null = null;

  loadRoomTypes() {
    this.roomTypeService.getAllRoomTypes().subscribe(res => this.roomTypes = res);
  }

  loadRooms() {
    if (!this.selectedHomestayForRoom) {
      this.rooms = [];
      return;
    }
    this.roomService.getRoomsByHomestay(this.selectedHomestayForRoom).subscribe({
      next: (res) => this.rooms = res,
      error: (err) => console.error(err)
    });
  }

  openAddRoomForm() {
    this.isRoomEditMode = false;
    this.currentRoomEditId = null;
    this.roomFormData = { priceExtra: 0, maxGuests: 2, roomTypeId: null };
    this.roomSelectedFiles = [];
    this.roomPreviewUrls = [];
    this.showRoomForm = true;
  }

  openEditRoomForm(room: RoomDto) {
    this.isRoomEditMode = true;
    this.currentRoomEditId = room.id;
    this.roomFormData = {
      name: room.name,
      roomTypeId: room.roomTypeId,
      priceExtra: room.priceExtra,
      maxGuests: room.maxGuests,
      status: room.status || 'AVAILABLE'
    };
    this.roomSelectedFiles = [];
    this.roomPreviewUrls = [];
    this.showRoomForm = true;
  }

  closeRoomForm() {
    this.roomPreviewUrls.forEach(url => URL.revokeObjectURL(url));
    this.showRoomForm = false;
  }

  onRoomFilesSelected(event: any) {
    if (event.target.files) {
      const newFiles: File[] = Array.from(event.target.files);
      newFiles.forEach(file => {
        this.roomSelectedFiles.push(file);
        this.roomPreviewUrls.push(URL.createObjectURL(file));
      });
    }
  }

  removeRoomImage(index: number) {
    URL.revokeObjectURL(this.roomPreviewUrls[index]);
    this.roomPreviewUrls.splice(index, 1);
    this.roomSelectedFiles.splice(index, 1);
  }

  submitRoomForm(event: Event) {
    event.preventDefault();
    if (!this.selectedHomestayForRoom || !this.roomFormData.roomTypeId) {
      this.notificationService.warning('Vui lòng chọn Homestay và Loại phòng!');
      return;
    }
    this.isLoading = true;

    const fd = new FormData();
    fd.append('name', this.roomFormData.name);
    fd.append('roomTypeId', this.roomFormData.roomTypeId);
    fd.append('priceExtra', this.roomFormData.priceExtra);
    fd.append('maxGuests', this.roomFormData.maxGuests);
    if (this.isRoomEditMode && this.roomFormData.status) {
      fd.append('status', this.roomFormData.status);
    }

    this.roomSelectedFiles.forEach(file => {
      fd.append('images', file);
    });

    if (this.isRoomEditMode && this.currentRoomEditId) {
      this.roomService.updateRoom(this.currentRoomEditId, fd).subscribe({
        next: () => {
          this.notificationService.success('Cập nhật phòng thành công!');
          this.closeRoomForm();
          this.loadRooms();
          this.isLoading = false;
        },
        error: (err) => {
          this.notificationService.error(err.error?.message || err.message);
          this.isLoading = false;
        }
      });
    } else {
      this.roomService.createRoom(this.selectedHomestayForRoom, fd).subscribe({
        next: () => {
          this.notificationService.success('Thêm phòng thành công!');
          this.closeRoomForm();
          this.loadRooms();
          this.isLoading = false;
        },
        error: (err) => {
          this.notificationService.error(err.error?.message || err.message);
          this.isLoading = false;
        }
      });
    }
  }

  async deleteRoom(id: string) {
    const ok = await this.confirmDialog.confirm({
      message: 'Bạn có chắc muốn xóa Phòng này không?',
      type: 'danger',
      confirmText: 'Xóa'
    });
    if (!ok) return;

    this.roomService.deleteRoom(id).subscribe({
      next: () => {
        this.notificationService.success('Đã xóa phòng!');
        this.loadRooms();
      },
      error: (err) => this.notificationService.error(err.error?.message || err.message)
    });
  }

  isHomestayActive(): boolean {
    const h = this.homestays.find(item => item.id === this.selectedHomestayForRoom);
    return h ? h.status === 'ACTIVE' : false;
  }

  getSelectedHomestayStatus(): string {
    const h = this.homestays.find(item => item.id === this.selectedHomestayForRoom);
    return h ? h.status : '';
  }

  onChatRequested(user: any) {
    this.chatRecipientUser = user;
    this.activeTab = 'chat';
  }
}
