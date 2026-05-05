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
import { WalletTabComponent } from '../../../components/wallet-tab/wallet-tab.component';

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
    HostVoucherTabComponent,
    WalletTabComponent
  ],
  template: `
    <app-navbar></app-navbar>
    <div class="dashboard-page">
      <div class="dashboard-layout">
        
        <!-- SIDEBAR -->
        <aside class="sidebar">
          <div class="sidebar-header">
            <h2>Chủ Nhà</h2>
            <p class="subtitle">Kênh quản lý</p>
          </div>
          <ul class="sidebar-menu">
            <li [class.active]="activeTab === 'profile'" (click)="activeTab = 'profile'">
              <span class="menu-icon">👤</span> Hồ sơ của tôi
            </li>
            <li [class.active]="activeTab === 'statistics'" (click)="activeTab = 'statistics'; loadAllStats()">
              <span class="menu-icon">📊</span> Thống kê của tôi
            </li>
            <li [class.active]="activeTab === 'bookings'" (click)="activeTab = 'bookings'; notificationService.markTypeAsRead('BOOKING')">
              <span class="menu-icon">📅</span> Quản lý Đặt phòng
              <span class="nav-dot" *ngIf="notificationService.hasUnreadOfType('BOOKING') | async"></span>
            </li>
            <li [class.active]="activeTab === 'checkin'" (click)="activeTab = 'checkin'">
              <span class="menu-icon">🔑</span> Mã nhận phòng
            </li>
            <li [class.active]="activeTab === 'reviews'" (click)="activeTab = 'reviews'">
              <span class="menu-icon">💬</span> Quản lý Đánh giá
            </li>
            <li [class.active]="activeTab === 'homestays'" (click)="activeTab = 'homestays'; notificationService.markTypeAsRead('HOMESTAY')">
              <span class="menu-icon">🏠</span> Quản lý Homestay
              <span class="nav-dot" *ngIf="notificationService.hasUnreadOfType('HOMESTAY') | async"></span>
            </li>
            <li [class.active]="activeTab === 'rooms'" (click)="activeTab = 'rooms'">
              <span class="menu-icon">🛏️</span> Quản lý Phòng
            </li>
            <li [class.active]="activeTab === 'chat'" (click)="activeTab = 'chat'; notificationService.markTypeAsRead('CHAT')">
              <span class="menu-icon">💬</span> Tin nhắn
              <span class="nav-dot" *ngIf="notificationService.hasUnreadOfType('CHAT') | async"></span>
            </li>
            <li [class.active]="activeTab === 'vouchers'" (click)="activeTab = 'vouchers'">
              <span class="menu-icon">🎟️</span> Quản lý Voucher
            </li>
            <li [class.active]="activeTab === 'wallet'" (click)="activeTab = 'wallet'">
              <span class="menu-icon">💳</span> Ví doanh thu
            </li>
          </ul>
        </aside>

        <!-- MAIN CONTENT -->
        <main class="main-content">
        
        <!-- STATISTICS TAB -->
        <div *ngIf="activeTab === 'statistics'">
          <div class="tab-header-actions">
            <div class="export-dropdown">
              <button class="btn-export">📥 Xuất báo cáo thống kê</button>
              <div class="dropdown-content">
                <a (click)="reportService.exportStatsPdf()">PDF/XLSX</a>
                <a (click)="reportService.exportStatsJasper()">Jasper Report</a>
              </div>
            </div>
          </div>
          <div class="stats-overview">
            <div class="stat-card-premium green">
              <div class="stat-info">
                <span class="label">Doanh thu của tôi</span>
                <span class="value">{{ hostStats?.totalRevenue | number }}đ</span>
              </div>
              <div class="stat-icon">💰</div>
            </div>
            <div class="stat-card-premium blue">
              <div class="stat-info">
                <span class="label">Tổng lượt đặt</span>
                <span class="value">{{ hostStats?.totalBookings }}</span>
              </div>
              <div class="stat-icon">📅</div>
            </div>
            <div class="stat-card-premium orange">
              <div class="stat-info">
                <span class="label">Homestay của tôi</span>
                <span class="value">{{ hostStats?.totalHomestays }}</span>
              </div>
              <div class="stat-icon">🏠</div>
            </div>
            <div class="stat-card-premium purple">
              <div class="stat-info">
                <span class="label">Tổng lượt truy cập</span>
                <span class="value">{{ totalViews | number }}</span>
              </div>
              <div class="stat-icon">👁️</div>
            </div>
          </div>

          <div class="stats-grid-vertical">
            <!-- REVENUE CHART -->
            <div class="card glass-card revenue-chart-section">
              <div class="card-header">
                <h3>Biểu đồ doanh thu</h3>
              </div>
              <div class="chart-container-large">
                <div class="bar-chart" *ngIf="hostStats?.monthlyRevenue?.length; else emptyChart">
                  <div class="bar-item" *ngFor="let item of hostStats?.monthlyRevenue">
                    <div class="bar-wrapper">
                      <div class="bar host-theme" [style.height.%]="getRevenuePercentage(item.revenue)">
                        <span class="bar-tooltip">{{ item.revenue | number }}đ</span>
                      </div>
                    </div>
                    <span class="bar-label">{{ formatMonthLabel(item.month) }}</span>
                  </div>
                </div>
                <ng-template #emptyChart>
                  <div class="empty-chart">Chưa có dữ liệu doanh thu</div>
                </ng-template>
              </div>
            </div>

            <!-- HOMESTAY PERFORMANCE -->
            <div class="card glass-card performance-section">
              <div class="card-header">
                <h3>Hiệu suất Homestay</h3>
              </div>
              <div class="table-container-large">
                <table class="simple-table" *ngIf="hostStats?.homestayStats?.length; else emptyTable">
                  <thead>
                    <tr>
                      <th style="width: 40%">Homestay</th>
                      <th style="text-align: center">Lượt đặt</th>
                      <th style="text-align: center">Lượt xem</th>
                      <th style="text-align: right">Doanh thu</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr *ngFor="let s of hostStats?.homestayStats">
                      <td class="h-name-cell">{{ s.homestayName }}</td>
                      <td style="text-align: center; font-weight: 600;">{{ s.bookingCount }}</td>
                      <td style="text-align: center; font-weight: 600; color: #6366f1;">{{ getViewCountForHomestay(s.homestayName) }}</td>
                      <td class="revenue-cell" style="text-align: right">{{ s.totalRevenue | number }}đ</td>
                    </tr>
                  </tbody>
                </table>
                <ng-template #emptyTable>
                  <div class="empty-state-simple">Chưa có dữ liệu</div>
                </ng-template>
              </div>
            </div>
          </div>
        </div>

        <!-- PROFILE TAB -->
        <div class="card glass-card" *ngIf="activeTab === 'profile'">
          <app-profile-tab></app-profile-tab>
        </div>

        <!-- BOOKINGS TAB -->
        <div class="card glass-card" *ngIf="activeTab === 'bookings'">
          <div class="card-header">
            <h3>Danh sách Đặt phòng</h3>
            <div class="export-dropdown">
              <button class="btn-primary">📤 Xuất báo cáo</button>
              <div class="dropdown-content">
                <a (click)="reportService.exportBookingsPdf()">PDF/XLSX</a>
                <a (click)="reportService.exportBookingsJasper()">Jasper Report</a>
              </div>
            </div>
          </div>
          <app-booking-history-tab role="HOST"></app-booking-history-tab>
        </div>

        <!-- CHECKIN TAB -->
        <div class="card glass-card" *ngIf="activeTab === 'checkin'">
          <app-host-checkin-tab></app-host-checkin-tab>
        </div>

        <!-- REVIEWS TAB -->
        <div class="card glass-card" *ngIf="activeTab === 'reviews'">
          <div class="card-header">
            <h3>Quản lý Đánh giá & Phản hồi</h3>
          </div>
          <app-host-review-tab></app-host-review-tab>
        </div>
        
        <!-- HOMESTAYS TAB -->
        <div *ngIf="activeTab === 'homestays'">
        <div class="stats-grid">
          <div class="stat-card">
            <div class="stat-icon">🏠</div>
            <div class="stat-info">
              <h4>Tổng số Homestay</h4>
              <p class="stat-value">{{ homestays.length }}</p>
            </div>
          </div>
          <div class="stat-card">
            <div class="stat-icon">✅</div>
            <div class="stat-info">
              <h4>Đang hoạt động</h4>
              <p class="stat-value">{{ activeCount }}</p>
            </div>
          </div>
          <div class="stat-card">
            <div class="stat-icon">⏳</div>
            <div class="stat-info">
              <h4>Chờ duyệt</h4>
              <p class="stat-value">{{ pendingCount }}</p>
            </div>
          </div>
        </div>

        <div class="card glass-card" *ngIf="!showForm">
          <div class="card-header">
            <h3>Danh sách Homestay của bạn</h3>
            <button class="btn-primary" (click)="openAddForm()">+ Thêm Homestay mới</button>
          </div>

          <div class="table-container" *ngIf="homestays.length > 0; else emptyState">
            <table class="modern-table">
              <thead>
                <tr>
                  <th>Homestay</th>
                  <th class="text-center">Giá / Đêm</th>
                  <th class="text-center">Lượt xem</th>
                  <th class="text-center">Trạng thái</th>
                  <th class="text-center">Hành động</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let h of homestays" class="table-row">
                  <td class="homestay-cell">
                    <img *ngIf="h.images && h.images.length > 0" [src]="'http://localhost:9999' + h.images[0].url" class="h-thumb" />
                    <div class="h-thumb-placeholder" *ngIf="!h.images || h.images.length === 0">🏠</div>
                    <div class="h-info-inline">
                      <span class="h-name">{{ h.name }}</span>
                      <span class="h-city-tag">{{ h.city }}</span>
                    </div>
                  </td>
                   <td class="text-center" style="font-weight: 600; color: #334155;">{{ h.pricePerNight | number }}đ</td>
                   <td class="text-center" style="font-weight: 700; color: #6366f1;">{{ h.viewCount | number }}</td>
                   <td class="text-center">
                     <div class="status-inline">
                       <span class="badge" [ngClass]="h.status.toLowerCase()">{{ h.status }}</span>
                       <span *ngIf="h.adminReason" class="admin-reason-inline" [title]="h.adminReason">⚠️ Lý do: {{ h.adminReason }}</span>
                     </div>
                   </td>
                   <td class="actions-cell">
                     <button class="btn-icon btn-view" (click)="openDetail(h)">Xem</button>
                     <button class="btn-icon btn-edit" (click)="openEditForm(h)">Sửa</button>
                     <button class="btn-icon btn-delete" (click)="deleteHomestay(h.id)">Xóa</button>
                   </td>
                </tr>
              </tbody>
            </table>
          </div>
          <ng-template #emptyState>
            <div class="empty-state">
              <span class="empty-icon">📭</span>
              <p>Bạn chưa có homestay nào. Hãy tạo ngay một homestay để bắt đầu kinh doanh!</p>
            </div>
          </ng-template>
        </div>

        <!-- FORM ADD/EDIT -->
        <div class="card glass-card" *ngIf="showForm">
          <div class="card-header">
            <h3>{{ isEditMode ? 'Cập nhật Homestay' : 'Thêm Homestay mới' }}</h3>
            <button class="btn-secondary" (click)="closeForm()">Quay lại</button>
          </div>

          <form (submit)="submitForm($event)" class="homestay-form">
            <div class="form-row">
              <div class="form-group">
                <label>Tên Homestay *</label>
                <input type="text" [(ngModel)]="formData.name" name="name" required class="input-field" placeholder="Nhập tên homestay..." />
              </div>
              <div class="form-group">
                <label>Thành phố *</label>
                <input type="text" [(ngModel)]="formData.city" name="city" required class="input-field" placeholder="Ví dụ: Đà Lạt" />
              </div>
            </div>

            <div class="form-group">
              <label>Địa chỉ chi tiết *</label>
              <input type="text" [(ngModel)]="formData.address" name="address" required class="input-field" placeholder="Số nhà, tên đường..." />
            </div>

            <div class="form-row">
              <div class="form-group">
                <label>Giá mỗi đêm (VNĐ) *</label>
                <input type="number" [(ngModel)]="formData.pricePerNight" name="price" required class="input-field" />
              </div>
              <div class="form-group">
                <label>Số khách tối đa *</label>
                <input type="number" [(ngModel)]="formData.maxGuests" name="guests" required class="input-field" />
              </div>
            </div>

            <div class="form-group">
              <label>Mô tả chi tiết</label>
              <textarea [(ngModel)]="formData.description" name="description" class="input-field" rows="4"></textarea>
            </div>

            <div class="form-group">
              <label>Tiện ích</label>
              <div class="amenities-checkboxes">
                <label class="amenity-checkbox" *ngFor="let am of availableAmenities">
                  <input type="checkbox" [value]="am.id" (change)="toggleAmenity(am.id, $event)" [checked]="selectedAmenityIds.includes(am.id)">
                  {{ am.iconUrl }} {{ am.name }}
                </label>
              </div>
            </div>

            <div class="form-group">
              <label>Hình ảnh hiện có</label>
              <div class="image-preview-grid" *ngIf="existingImages.length > 0; else noExisting">
                <div class="preview-wrapper" *ngFor="let img of existingImages">
                  <img [src]="'http://localhost:9999' + img.url" class="preview-img" />
                  <button type="button" class="preview-remove-btn" (click)="removeExistingImage(img.id)" title="Xóa ảnh này">✕</button>
                </div>
              </div>
              <ng-template #noExisting>
                <p class="small-text">Chưa có ảnh nào.</p>
              </ng-template>
            </div>

            <div class="form-group">
              <label>Thêm hình ảnh mới (Có thể chọn nhiều ảnh)</label>
              <input type="file" multiple (change)="onFilesSelected($event)" accept="image/*" class="input-file" />
              <div class="file-info" *ngIf="previewUrls.length > 0">
                <p style="margin-bottom: 10px;">Ảnh mới đã chọn ({{ previewUrls.length }}):</p>
                <div class="image-preview-grid">
                  <div class="preview-wrapper" *ngFor="let url of previewUrls; let i = index">
                    <img [src]="url" class="preview-img" />
                    <button type="button" class="preview-remove-btn" (click)="removeImage(i)" title="Xóa ảnh này">✕</button>
                  </div>
                </div>
              </div>
            </div>

            <div class="form-actions">
              <button type="submit" class="btn-primary" [disabled]="isLoading">
                {{ isLoading ? 'Đang lưu...' : 'Lưu Homestay' }}
              </button>
            </div>
          </form>
        </div>
        </div> <!-- END HOMESTAYS TAB -->

        <div class="modal-overlay" *ngIf="showDetailModal" (click)="closeDetail()">
          <div class="modal-box premium-modal" (click)="$event.stopPropagation()">
            <button class="modal-close-btn" (click)="closeDetail()">✕</button>
            
            <div class="modal-header-banner" *ngIf="selectedHomestayForDetail?.images?.length">
               <img [src]="'http://localhost:9999' + selectedHomestayForDetail?.images?.[0]?.url" class="header-bg-img" />
               <div class="header-overlay">
                 <span class="badge-large" [ngClass]="selectedHomestayForDetail?.status?.toLowerCase()">{{ selectedHomestayForDetail?.status }}</span>
                 <h2>{{ selectedHomestayForDetail?.name }}</h2>
               </div>
            </div>

            <div class="modal-body">
              <div class="detail-grid-modern">
                <div class="detail-card">
                  <span class="d-label">📍 Vị trí</span>
                  <span class="d-value">{{ selectedHomestayForDetail?.city }}</span>
                  <p class="d-subtext">{{ selectedHomestayForDetail?.address }}</p>
                </div>
                <div class="detail-card">
                  <span class="d-label">💰 Giá / Đêm</span>
                  <span class="d-value price-text">{{ selectedHomestayForDetail?.pricePerNight | number }}đ</span>
                </div>
                <div class="detail-card">
                  <span class="d-label">👥 Sức chứa</span>
                  <span class="d-value">{{ selectedHomestayForDetail?.maxGuests }} khách</span>
                </div>
                <div class="detail-card">
                  <span class="d-label">👁️ Lượt xem</span>
                  <span class="d-value">{{ selectedHomestayForDetail?.viewCount || 0 }}</span>
                </div>
              </div>

              <div class="detail-main-section">
                <div class="section-title">📝 Mô tả chi tiết</div>
                <div class="description-rich-text">
                  {{ selectedHomestayForDetail?.description }}
                </div>
              </div>

              <div class="detail-main-section">
                <div class="section-title">✨ Tiện ích có sẵn</div>
                <div class="amenity-modern-list">
                  <div class="amenity-item-chip" *ngFor="let am of selectedHomestayForDetail?.amenities">
                    <span class="am-icon-large">{{ am.iconUrl }}</span>
                    <span class="am-name-text">{{ am.name }}</span>
                  </div>
                </div>
              </div>

              <div class="detail-main-section" *ngIf="selectedHomestayForDetail?.images?.length">
                <div class="section-title">🖼️ Bộ sưu tập hình ảnh</div>
                <div class="image-gallery-modern">
                  <img *ngFor="let img of selectedHomestayForDetail?.images" [src]="'http://localhost:9999' + img.url" class="gallery-img" />
                </div>
              </div>
            </div>

            <div class="modal-footer-modern">
              <button class="btn-edit-premium" (click)="closeDetail()">Đóng cửa sổ</button>
            </div>
          </div>
        </div>

        <!-- ROOMS TAB -->
        <div *ngIf="activeTab === 'rooms'">
          <div class="card glass-card" *ngIf="!showRoomForm">
            <div class="card-header">
              <h3>Danh sách Phòng</h3>
              <div style="display: flex; gap: 15px; align-items: center;">
                <select [(ngModel)]="selectedHomestayForRoom" (change)="loadRooms()" class="input-field" style="width: 250px;">
                  <option [ngValue]="null">-- Chọn Homestay --</option>
                  <option *ngFor="let h of homestays" [ngValue]="h.id">{{ h.name }}</option>
                </select>
                <button class="btn-primary" [disabled]="!selectedHomestayForRoom || !isHomestayActive()" (click)="openAddRoomForm()">+ Thêm Phòng</button>
              </div>
            </div>

            <div class="warning-banner" *ngIf="selectedHomestayForRoom && !isHomestayActive()">
              <span>⚠️ Homestay này đang ở trạng thái <strong>{{ getSelectedHomestayStatus() }}</strong>. Bạn cần chờ Quản trị viên phê duyệt để có thể thêm hoặc chỉnh sửa phòng.</span>
            </div>

            <div class="table-container" *ngIf="rooms.length > 0; else emptyRoomState">
              <table class="modern-table">
                <thead>
                  <tr>
                    <th>Phòng</th>
                    <th>Loại</th>
                    <th>Giá thêm</th>
                    <th>Khách tối đa</th>
                    <th>Trạng thái</th>
                    <th class="actions-col">Hành động</th>
                  </tr>
                </thead>
                <tbody>
                  <tr *ngFor="let r of rooms" class="table-row">
                    <td class="homestay-cell">
                      <img *ngIf="r.images && r.images.length > 0" [src]="'http://localhost:9999' + r.images[0].url" class="h-thumb" />
                      <div class="h-thumb-placeholder" *ngIf="!r.images || r.images.length === 0">🛏️</div>
                      <div class="h-name">{{ r.name }}</div>
                    </td>
                    <td>{{ r.roomTypeName }}</td>
                    <td>{{ r.priceExtra | number }}đ</td>
                    <td>{{ r.maxGuests }}</td>
                    <td>
                      <span class="badge room-status" [ngClass]="(r.status || '').toLowerCase()">
                        {{ r.status === 'AVAILABLE' ? 'Sẵn sàng' : r.status === 'BOOKED' ? 'Đã đặt' : 'Tạm ngưng' }}
                      </span>
                    </td>
                    <td class="actions-cell">
                      <button class="btn-icon btn-edit" [disabled]="!isHomestayActive()" (click)="openEditRoomForm(r)">Sửa</button>
                      <button class="btn-icon btn-delete" (click)="deleteRoom(r.id)">Xóa</button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            <ng-template #emptyRoomState>
              <div class="empty-state">
                <span class="empty-icon">🛏️</span>
                <p *ngIf="selectedHomestayForRoom">Chưa có phòng nào trong Homestay này.</p>
                <p *ngIf="!selectedHomestayForRoom">Vui lòng chọn một Homestay để xem danh sách phòng.</p>
              </div>
            </ng-template>
          </div>

          <!-- FORM ADD/EDIT ROOM -->
          <div class="card glass-card" *ngIf="showRoomForm">
            <div class="card-header">
              <h3>{{ isRoomEditMode ? 'Cập nhật Phòng' : 'Thêm Phòng mới' }}</h3>
              <button class="btn-secondary" (click)="closeRoomForm()">Quay lại</button>
            </div>

            <form (submit)="submitRoomForm($event)" class="homestay-form">
              <div class="form-row">
                <div class="form-group">
                  <label>Tên Phòng *</label>
                  <input type="text" [(ngModel)]="roomFormData.name" name="name" required class="input-field" placeholder="Nhập tên phòng..." />
                </div>
                <div class="form-group">
                  <label>Loại Phòng *</label>
                  <select [(ngModel)]="roomFormData.roomTypeId" name="roomTypeId" required class="input-field">
                    <option [ngValue]="null">-- Chọn loại phòng --</option>
                    <option *ngFor="let rt of roomTypes" [ngValue]="rt.id">{{ rt.name }}</option>
                  </select>
                </div>
              </div>

              <div class="form-row">
                <div class="form-group">
                  <label>Giá phụ thu (VNĐ) *</label>
                  <input type="number" [(ngModel)]="roomFormData.priceExtra" name="priceExtra" required class="input-field" />
                </div>
                <div class="form-group">
                  <label>Số khách tối đa *</label>
                  <input type="number" [(ngModel)]="roomFormData.maxGuests" name="maxGuests" required class="input-field" />
                </div>
              </div>

              <div class="form-group" *ngIf="isRoomEditMode">
                <label>Trạng thái phòng</label>
                <select [(ngModel)]="roomFormData.status" name="status" class="input-field">
                  <option value="AVAILABLE">✅ Sẵn sàng</option>
                  <option value="BOOKED">📅 Đã đặt</option>
                  <option value="UNAVAILABLE">🔧 Tạm ngưng</option>
                </select>
              </div>

              <div class="form-group">
                <label>Hình ảnh (Có thể chọn nhiều ảnh)</label>
                <input type="file" multiple (change)="onRoomFilesSelected($event)" accept="image/*" class="input-file" />
                <div class="file-info" *ngIf="roomPreviewUrls.length > 0">
                  <p style="margin-bottom: 10px;">Đã chọn {{ roomPreviewUrls.length }} ảnh:</p>
                  <div class="image-preview-grid">
                    <div class="preview-wrapper" *ngFor="let url of roomPreviewUrls; let i = index">
                      <img [src]="url" class="preview-img" />
                      <button type="button" class="preview-remove-btn" (click)="removeRoomImage(i)">✕</button>
                    </div>
                  </div>
                </div>
                <div class="file-info" *ngIf="isRoomEditMode">
                  <small>* Nếu bạn chọn ảnh mới, các ảnh cũ sẽ bị thay thế.</small>
                </div>
              </div>

              <div class="form-actions">
                <button type="submit" class="btn-primary" [disabled]="isLoading">
                  {{ isLoading ? 'Đang lưu...' : 'Lưu Phòng' }}
                </button>
              </div>
            </form>
          </div>
        </div> <!-- END ROOMS TAB -->
        <!-- CHAT TAB -->
        <div *ngIf="activeTab === 'chat'">
          <app-chat-tab [initialUser]="chatRecipientUser"></app-chat-tab>
        </div>
        
        <!-- VOUCHERS TAB -->
        <div class="card glass-card" *ngIf="activeTab === 'vouchers'">
          <app-host-voucher-tab></app-host-voucher-tab>
        </div>

        <!-- WALLET TAB -->
        <div class="card glass-card" *ngIf="activeTab === 'wallet'">
          <app-wallet-tab></app-wallet-tab>
        </div>
        </main>
      </div>
    </div>
  `,
  styles: [`
    .dashboard-page { min-height: 100vh; background: #f8fafc; padding-top: 80px; font-family: 'Inter', sans-serif; display: flex; flex-direction: column; }
    .dashboard-layout { display: flex; flex: 1; max-width: 1400px; margin: 0 auto; width: 100%; padding: 30px 20px; gap: 30px; }
    
    .sidebar { width: 260px; background: white; border-radius: 16px; padding: 25px 20px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05); border: 1px solid #e2e8f0; height: fit-content; flex-shrink: 0; }
    .sidebar-header { margin-bottom: 30px; border-bottom: 1px solid #f1f5f9; padding-bottom: 15px;}
    .sidebar-header h2 { font-size: 24px; color: #0f172a; margin: 0 0 5px 0; font-weight: 700; }
    .subtitle { color: #64748b; font-size: 14px; margin: 0; }
    
    .sidebar-menu { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 8px; }
    .sidebar-menu li { padding: 12px 16px; border-radius: 10px; color: #475569; font-weight: 600; cursor: pointer; transition: all 0.2s; display: flex; align-items: center; gap: 12px; font-size: 15px; }
    .sidebar-menu li:hover { background: #f8fafc; color: #0f172a; }
    .sidebar-menu li.active { background: #10b981; color: white; box-shadow: 0 4px 6px rgba(16, 185, 129, 0.2); }
    .menu-icon { font-size: 18px; }

    .main-content { flex: 1; min-width: 0; }

    .stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 20px; margin-bottom: 30px; }
    .stat-card { background: white; border-radius: 16px; padding: 24px; display: flex; align-items: center; gap: 20px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05); border: 1px solid #e2e8f0; }
    .stat-icon { font-size: 32px; background: #f1f5f9; width: 60px; height: 60px; display: flex; align-items: center; justify-content: center; border-radius: 12px; }
    .stat-info h4 { color: #64748b; font-size: 14px; font-weight: 600; margin: 0 0 5px 0; text-transform: uppercase; letter-spacing: 0.5px; }
    .stat-value { font-size: 24px; font-weight: 700; color: #0f172a; margin: 0; }
    
    .glass-card { background: white; border-radius: 16px; padding: 30px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05); border: 1px solid #e2e8f0; }
    .card-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; border-bottom: 1px solid #e2e8f0; padding-bottom: 15px; }
    .card-header h3 { font-size: 18px; color: #1e293b; margin: 0; font-weight: 600; }
    
    .empty-state { text-align: center; padding: 50px 20px; color: #64748b; }
    .empty-icon { font-size: 48px; display: block; margin-bottom: 15px; opacity: 0.5; }
    
    .warning-banner { background: #fff7ed; border: 1px solid #ffedd5; color: #9a3412; padding: 12px 20px; border-radius: 12px; margin-bottom: 20px; font-size: 14px; display: flex; align-items: center; gap: 10px; }

    .table-container { overflow-x: auto; border-radius: 12px; border: 1px solid #f1f5f9; }
    .modern-table { width: 100%; border-collapse: collapse; text-align: left; }
    .modern-table th { background: #f8fafc; padding: 15px 20px; color: #64748b; font-size: 13px; text-transform: uppercase; font-weight: 600; border-bottom: 1px solid #e2e8f0; }
    .modern-table td { padding: 20px; border-bottom: 1px solid #f1f5f9; color: #334155; vertical-align: middle; }
    
    .homestay-cell { display: flex; align-items: center; gap: 15px; }
    .h-thumb { width: 48px; height: 48px; border-radius: 10px; object-fit: cover; box-shadow: 0 4px 8px rgba(0,0,0,0.08); }
    .h-thumb-placeholder { width: 48px; height: 48px; border-radius: 10px; background: #f1f5f9; display: flex; align-items: center; justify-content: center; font-size: 20px; color: #94a3b8; }
    .h-info-inline { display: flex; align-items: center; gap: 10px; }
    .h-name { font-weight: 700; color: #1e293b; font-size: 15px; white-space: nowrap; }
    .h-city-tag { font-size: 12px; color: #64748b; background: #f1f5f9; padding: 2px 10px; border-radius: 6px; font-weight: 600; }
    
    .badge { padding: 4px 12px; border-radius: 999px; font-size: 12px; font-weight: 700; text-transform: uppercase; }
    .pending { background: #fffbeb; color: #92400e; }
    .active { background: #dcfce7; color: #166534; }
    .inactive { background: #f1f5f9; color: #475569; }
    .rejected { background: #fee2e2; color: #991b1b; }
    .room-status { text-transform: none; font-size: 11px; }
    .available { background: #dcfce7; color: #166534; }
    .booked { background: #dbeafe; color: #1e40af; }
    .unavailable { background: #fef3c7; color: #92400e; }
    .status-inline { display: flex; align-items: center; justify-content: center; gap: 8px; }
    .admin-reason-inline { font-size: 12px; color: #ef4444; font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 150px; }
    
    .text-center { text-align: center !important; }
    .actions-cell { text-align: center; display: flex; gap: 10px; justify-content: center; align-items: center; min-height: 56px; }
    .btn-icon { display: inline-flex; align-items: center; justify-content: center; width: 80px; height: 40px; border: none; border-radius: 12px; font-size: 13px; font-weight: 700; cursor: pointer; transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); }
    
    .btn-view { background: #f0fdf4; color: #15803d; border: 1.5px solid #dcfce7; }
    .btn-view:hover { background: #dcfce7; transform: translateY(-2px); box-shadow: 0 4px 12px rgba(22, 101, 52, 0.1); }
    
    .btn-edit { background: #eff6ff; color: #1d4ed8; border: 1.5px solid #dbeafe; }
    .btn-edit:hover { background: #dbeafe; transform: translateY(-2px); box-shadow: 0 4px 12px rgba(29, 78, 216, 0.1); }
    
    .btn-delete { background: #fff1f2; color: #be123c; border: 1.5px solid #ffe4e6; }
    .btn-delete:hover { background: #ffe4e6; transform: translateY(-2px); box-shadow: 0 4px 12px rgba(190, 18, 60, 0.1); }

    .btn-primary { padding: 10px 20px; background: #10b981; color: white; border: none; border-radius: 8px; cursor: pointer; font-weight: 600; transition: background 0.2s; }
    .btn-primary:hover { background: #059669; }
    .btn-primary:disabled { opacity: 0.6; cursor: not-allowed; }
    
    .btn-secondary { padding: 10px 20px; background: #f1f5f9; color: #475569; border: none; border-radius: 8px; cursor: pointer; font-weight: 600; }
    .btn-secondary:hover { background: #e2e8f0; }

    .form-row { display: flex; gap: 20px; }
    .form-row .form-group { flex: 1; }
    .form-group { margin-bottom: 20px; }
    .form-group label { display: block; font-weight: 600; color: #4a5568; margin-bottom: 8px; font-size: 14px; }
    .input-field { width: 100%; padding: 10px 12px; border: 1px solid #cbd5e0; border-radius: 8px; font-size: 14px; font-family: inherit; }
    .input-file { display: block; width: 100%; padding: 10px; border: 1px dashed #cbd5e0; border-radius: 8px; background: #f8fafc; cursor: pointer; }
    
    .amenities-checkboxes { display: flex; flex-wrap: wrap; gap: 15px; padding: 10px; background: #f8fafc; border-radius: 8px; border: 1px solid #e2e8f0; }
    .amenity-checkbox { display: flex; align-items: center; gap: 5px; font-size: 14px; cursor: pointer; }
    
    .file-info { margin-top: 15px; font-size: 13px; color: #475569; }
    .image-preview-grid { display: flex; flex-wrap: wrap; gap: 10px; }
    .preview-wrapper { position: relative; width: 80px; height: 80px; }
    .preview-img { width: 100%; height: 100%; object-fit: cover; border-radius: 8px; border: 1px solid #e2e8f0; display: block; }
    .preview-remove-btn { position: absolute; top: -6px; right: -6px; width: 20px; height: 20px; border-radius: 50%; background: #ef4444; color: white; border: 2px solid white; font-size: 10px; font-weight: bold; cursor: pointer; display: flex; align-items: center; justify-content: center; padding: 0; transition: all 0.2s; box-shadow: 0 2px 6px rgba(0,0,0,0.2); }
    .preview-remove-btn:hover { background: #dc2626; transform: scale(1.1); }
    .form-actions { margin-top: 30px; text-align: right; }

    /* STATISTICS STYLES */
    .stats-overview { display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 20px; margin-bottom: 25px; }
    .stat-card-premium { border-radius: 20px; padding: 24px; color: white; display: flex; justify-content: space-between; align-items: center; box-shadow: 0 10px 20px -5px rgba(0,0,0,0.15); transition: transform 0.3s ease; }
    .stat-card-premium:hover { transform: translateY(-5px); }
    .stat-card-premium.green { background: linear-gradient(135deg, #10b981, #047857); }
    .stat-card-premium.blue { background: linear-gradient(135deg, #3b82f6, #1d4ed8); }
    .stat-card-premium.orange { background: linear-gradient(135deg, #f59e0b, #d97706); }
    .stat-card-premium.purple { background: linear-gradient(135deg, #8b5cf6, #6d28d9); }
    .stat-info .label { display: block; font-size: 14px; opacity: 0.9; font-weight: 500; margin-bottom: 5px; }
    .stat-info .value { display: block; font-size: 24px; font-weight: 800; }
    .stat-icon { font-size: 40px; opacity: 0.3; }

    .stats-grid-vertical { display: flex; flex-direction: column; gap: 25px; margin-bottom: 25px; }
    .revenue-chart-section { min-height: 450px; }
    .chart-container-large { height: 350px; display: flex; align-items: flex-end; padding: 30px 0; }
    
    .bar-chart { display: flex; align-items: flex-end; justify-content: space-around; width: 100%; height: 100%; gap: 10px; }
    .bar-item { flex: 1; display: flex; flex-direction: column; align-items: center; height: 100%; max-width: 80px; }
    .bar-wrapper { width: 100%; flex: 1; display: flex; align-items: flex-end; background: #f1f5f9; border-radius: 12px 12px 0 0; position: relative; }
    .bar { width: 100%; background: linear-gradient(to top, #10b981, #34d399); border-radius: 12px 12px 0 0; position: relative; transition: height 0.5s ease-out; }
    .bar.host-theme { background: linear-gradient(to top, #059669, #10b981); }
    .bar:hover { opacity: 0.8; }
    .bar-tooltip { position: absolute; top: -35px; left: 50%; transform: translateX(-50%); background: #1e293b; color: white; padding: 6px 10px; border-radius: 6px; font-size: 12px; white-space: nowrap; opacity: 0; transition: opacity 0.2s; pointer-events: none; z-index: 10; }
    .bar:hover .bar-tooltip { opacity: 1; }
    .bar-label { margin-top: 12px; font-size: 13px; color: #64748b; font-weight: 600; }
    .empty-chart { display: flex; align-items: center; justify-content: center; width: 100%; height: 100%; color: #94a3b8; font-style: italic; }

    .table-container-large { margin-top: 15px; }
    .simple-table { width: 100%; border-collapse: collapse; }
    .simple-table th { text-align: left; padding: 15px; color: #64748b; font-size: 14px; border-bottom: 1px solid #e2e8f0; background: #f8fafc; font-weight: 700; }
    .simple-table td { padding: 18px 15px; font-size: 15px; border-bottom: 1px solid #f1f5f9; }
    .h-name-cell { font-weight: 700; color: #0f172a; }
    .revenue-cell { font-weight: 800; color: #10b981; font-size: 16px; }
    .empty-state-simple { text-align: center; padding: 40px; color: #94a3b8; font-style: italic; }

    /* EXPORT DROPDOWN */
    .tab-header-actions { display: flex; justify-content: flex-end; margin-bottom: 15px; }
    .btn-export { background: #6366f1; color: white; border: none; padding: 10px 18px; border-radius: 8px; font-weight: 600; cursor: pointer; transition: all 0.2s; }
    .btn-export:hover { background: #4f46e5; transform: translateY(-2px); }

    .export-dropdown { position: relative; display: inline-block; }
    .dropdown-content { display: none; position: absolute; right: 0; background-color: white; min-width: 240px; box-shadow: 0px 8px 16px 0px rgba(0,0,0,0.1); z-index: 100; border-radius: 8px; border: 1px solid #e2e8f0; overflow: hidden; }
    .dropdown-content a { color: #1e293b; padding: 12px 16px; text-decoration: none; display: block; font-size: 14px; cursor: pointer; transition: background 0.2s; }
    .dropdown-content a:hover { background-color: #f1f5f9; color: #6366f1; }
    .export-dropdown:hover .dropdown-content { display: block; }

    /* PREMIUM MODAL STYLES */
    .modal-overlay { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(15, 23, 42, 0.8); display: flex; align-items: flex-start; justify-content: center; z-index: 2000; backdrop-filter: blur(12px); padding: 40px 20px; overflow-y: auto; scrollbar-width: none; }
    .modal-overlay::-webkit-scrollbar { display: none; }
    
    .premium-modal { background: white; width: 100%; max-width: 950px; border-radius: 32px; position: relative; display: flex; flex-direction: column; box-shadow: 0 40px 100px -20px rgba(0,0,0,0.4); border: 1px solid rgba(255,255,255,0.1); animation: modalAppear 0.4s cubic-bezier(0.16, 1, 0.3, 1); margin-bottom: 40px; transform-origin: top; overflow: hidden; }
    
    @keyframes modalAppear {
      from { opacity: 0; transform: translateY(20px) scale(0.98); }
      to { opacity: 1; transform: translateY(0) scale(1); }
    }

    .modal-header-banner { position: relative; height: 280px; width: 100%; overflow: hidden; }
    .header-bg-img { width: 100%; height: 100%; object-fit: cover; filter: brightness(0.75); }
    .header-overlay { position: absolute; bottom: 0; left: 0; right: 0; padding: 40px; background: linear-gradient(to top, rgba(15, 23, 42, 0.9), transparent); color: white; }
    .header-overlay h2 { margin: 12px 0 0 0; font-size: 38px; font-weight: 900; text-shadow: 0 4px 12px rgba(0,0,0,0.4); letter-spacing: -0.5px; }
    .badge-large { background: #10b981; color: white; padding: 8px 20px; border-radius: 50px; font-size: 14px; font-weight: 800; text-transform: uppercase; letter-spacing: 1.2px; box-shadow: 0 4px 10px rgba(16, 185, 129, 0.3); }
    .badge-large.pending { background: #f59e0b; box-shadow: 0 4px 10px rgba(245, 158, 11, 0.3); }
    .badge-large.rejected { background: #ef4444; box-shadow: 0 4px 10px rgba(239, 68, 68, 0.3); }

    .modal-close-btn { position: absolute; top: 25px; right: 25px; background: rgba(255,255,255,0.15); backdrop-filter: blur(12px); border: 1px solid rgba(255,255,255,0.2); width: 44px; height: 44px; border-radius: 50%; cursor: pointer; display: flex; align-items: center; justify-content: center; color: white; font-size: 18px; z-index: 100; transition: all 0.3s; }
    .modal-close-btn:hover { background: rgba(255,255,255,0.3); transform: rotate(90deg) scale(1.1); }

    .modal-body { padding: 40px; overflow-y: auto; overflow-x: hidden; flex: 1; background: #ffffff; max-width: 100%; box-sizing: border-box; }
    
    .detail-grid-modern { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 24px; margin-bottom: 45px; }
    .detail-card { background: #f8fafc; padding: 25px; border-radius: 24px; border: 1px solid #f1f5f9; transition: all 0.3s; }
    .detail-card:hover { transform: translateY(-5px); background: #ffffff; box-shadow: 0 10px 25px -5px rgba(0,0,0,0.05); border-color: #e2e8f0; }
    .d-label { display: block; font-size: 11px; font-weight: 800; color: #64748b; text-transform: uppercase; letter-spacing: 1.5px; margin-bottom: 10px; }
    .d-value { display: block; font-size: 22px; font-weight: 800; color: #0f172a; }
    .d-subtext { margin: 6px 0 0 0; font-size: 14px; color: #64748b; font-weight: 500; }
    .price-text { color: #10b981; }

    .detail-main-section { margin-bottom: 45px; }
    .section-title { font-size: 20px; font-weight: 900; color: #0f172a; margin-bottom: 20px; display: flex; align-items: center; gap: 12px; }
    .description-rich-text { background: #f8fafc; padding: 30px; border-radius: 24px; border: 1px solid #f1f5f9; line-height: 1.9; color: #334155; font-size: 16px; white-space: pre-wrap; }

    .amenity-modern-list { display: flex; flex-wrap: wrap; gap: 14px; }
    .amenity-item-chip { background: #f8fafc; padding: 12px 24px; border-radius: 16px; border: 1px solid #f1f5f9; display: flex; align-items: center; gap: 12px; transition: all 0.3s; cursor: default; }
    .amenity-item-chip:hover { background: #ffffff; transform: translateY(-3px); border-color: #10b981; box-shadow: 0 8px 20px -5px rgba(16, 185, 129, 0.2); }
    .am-icon-large { font-size: 24px; }
    .am-name-text { font-size: 15px; font-weight: 700; color: #1e293b; }

    .image-gallery-modern { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 20px; width: 100%; box-sizing: border-box; }
    .gallery-img { width: 100%; height: 180px; object-fit: cover; border-radius: 24px; transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1); cursor: pointer; border: 4px solid transparent; box-sizing: border-box; }
    .gallery-img:hover { transform: scale(1.02); z-index: 2; box-shadow: 0 20px 40px -10px rgba(0,0,0,0.3); border-color: #10b981; }

    .modal-footer-modern { padding: 30px 40px; background: #f8fafc; border-top: 1px solid #f1f5f9; display: flex; justify-content: flex-end; gap: 18px; border-radius: 0 0 32px 32px; }
    .btn-cancel-flat { background: #ffffff; border: 1px solid #e2e8f0; padding: 14px 35px; border-radius: 16px; font-weight: 700; color: #475569; cursor: pointer; transition: all 0.2s; }
    .btn-cancel-flat:hover { background: #f1f5f9; color: #0f172a; }
    .btn-edit-premium { background: #10b981; color: white; border: none; padding: 14px 40px; border-radius: 16px; font-weight: 800; cursor: pointer; display: flex; align-items: center; gap: 12px; box-shadow: 0 10px 25px -5px rgba(16, 185, 129, 0.4); transition: all 0.3s; font-size: 15px; }
    .btn-edit-premium:hover { background: #059669; transform: translateY(-3px) scale(1.02); box-shadow: 0 15px 35px -5px rgba(16, 185, 129, 0.5); }
    .btn-icon-inside { font-size: 20px; }

    .btn-view { background: #f0fdf4; color: #166534; }
    .btn-view:hover { background: #dcfce7; }
  `]
})
export class HostDashboardComponent implements OnInit {
  activeTab = 'profile';
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
