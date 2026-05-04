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
  template: `
    <app-navbar></app-navbar>
    <div class="dashboard-page">
      <div class="dashboard-layout">
        
        <!-- SIDEBAR -->
        <aside class="sidebar">
          <div class="sidebar-header">
            <h2>Quản Trị</h2>
            <p class="subtitle">Trung tâm điều khiển</p>
          </div>
          <ul class="sidebar-menu">
            <li [class.active]="activeTab === 'profile'" (click)="activeTab = 'profile'">
              <span class="menu-icon">👤</span> Hồ sơ cá nhân
            </li>
            <li [class.active]="activeTab === 'statistics'" (click)="activeTab = 'statistics'; loadAdminStats()">
              <span class="menu-icon">📊</span> Thống kê
            </li>
            <li [class.active]="activeTab === 'bookings'" (click)="activeTab = 'bookings'">
              <span class="menu-icon">🧾</span> Quản lý Đơn hàng
            </li>
            <li [class.active]="activeTab === 'upgrades'" (click)="activeTab = 'upgrades'; notificationService.markTypeAsRead('SYSTEM')">
              <span class="menu-icon">👑</span> Yêu cầu Host
              <span class="nav-dot" *ngIf="notificationService.hasUnreadOfType('SYSTEM') | async"></span>
            </li>
            <li [class.active]="activeTab === 'amenities'" (click)="activeTab = 'amenities'">
              <span class="menu-icon">✨</span> Tiện ích
            </li>
            <li [class.active]="activeTab === 'homestays'" (click)="activeTab = 'homestays'; notificationService.markTypeAsRead('HOMESTAY')">
              <span class="menu-icon">🏠</span> Duyệt Homestay
              <span class="nav-dot" *ngIf="notificationService.hasUnreadOfType('HOMESTAY') | async"></span>
            </li>
            <li [class.active]="activeTab === 'room-types'" (click)="activeTab = 'room-types'">
              <span class="menu-icon">🛏️</span> Loại phòng
            </li>
            <li [class.active]="activeTab === 'chat'" (click)="activeTab = 'chat'; notificationService.markTypeAsRead('CHAT')">
              <span class="menu-icon">💬</span> Tin nhắn
              <span class="nav-dot" *ngIf="notificationService.hasUnreadOfType('CHAT') | async"></span>
            </li>
            <li [class.active]="activeTab === 'vouchers'" (click)="activeTab = 'vouchers'">
              <span class="menu-icon">🎟️</span> Quản lý Voucher
            </li>
          </ul>
        </aside>

        <!-- MAIN CONTENT -->
        <main class="main-content">
        
        <!-- STATISTICS TAB -->
        <div *ngIf="activeTab === 'statistics'">
          <div class="tab-header-actions">
            <div class="export-dropdown">
              <button class="btn-export">📥 Xuất báo cáo quản trị</button>
              <div class="dropdown-content">
                <a (click)="reportService.exportAdminStatsPdf()">PDF/XLSX</a>
                <a (click)="reportService.exportStatsJasper()">Jasper Report</a>
              </div>
            </div>
          </div>
          <div class="stats-overview">
            <div class="stat-card-premium blue">
              <div class="stat-info">
                <span class="label">Tổng doanh thu</span>
                <span class="value">{{ adminStats?.totalRevenue | number }}đ</span>
              </div>
              <div class="stat-icon">💰</div>
            </div>
            <div class="stat-card-premium purple">
              <div class="stat-info">
                <span class="label">Tổng đơn hàng</span>
                <span class="value">{{ adminStats?.totalBookings }}</span>
              </div>
              <div class="stat-icon">🧾</div>
            </div>
            <div class="stat-card-premium green">
              <div class="stat-info">
                <span class="label">Tổng Homestay</span>
                <span class="value">{{ adminStats?.totalHomestays }}</span>
              </div>
              <div class="stat-icon">🏠</div>
            </div>
            <div class="stat-card-premium orange">
              <div class="stat-info">
                <span class="label">Người dùng</span>
                <span class="value">{{ adminStats?.totalUsers }}</span>
              </div>
              <div class="stat-icon">👥</div>
            </div>
          </div>

          <div class="stats-grid-main">
            <!-- REVENUE CHART (Simple CSS Bars) -->
            <div class="card glass-card">
              <div class="card-header">
                <h3>Doanh thu theo tháng</h3>
              </div>
              <div class="chart-container-simple">
                <div class="bar-chart" *ngIf="adminStats?.monthlyRevenue?.length; else emptyChart">
                  <div class="bar-item" *ngFor="let item of adminStats?.monthlyRevenue">
                    <div class="bar-wrapper">
                      <div class="bar" [style.height.%]="getRevenuePercentage(item.revenue)">
                        <span class="bar-tooltip">{{ item.revenue | number }}đ</span>
                      </div>
                    </div>
                    <span class="bar-label">{{ formatMonthLabel(item.month) }}</span>
                  </div>
                </div>
                <ng-template #emptyChart>
                  <div class="empty-chart">Không có dữ liệu doanh thu</div>
                </ng-template>
              </div>
            </div>

            <!-- TOP HOMESTAYS -->
            <div class="card glass-card">
              <div class="card-header">
                <h3>Homestay hàng đầu</h3>
              </div>
              <div class="table-container-simple">
                <table class="simple-table" *ngIf="adminStats?.topHomestays?.length; else emptyTable">
                  <thead>
                    <tr>
                      <th>Homestay</th>
                      <th>Đơn hàng</th>
                      <th>Doanh thu</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr *ngFor="let h of adminStats?.topHomestays">
                      <td>{{ h.homestayName }}</td>
                      <td>{{ h.bookingCount }}</td>
                      <td class="revenue-cell">{{ h.totalRevenue | number }}đ</td>
                    </tr>
                  </tbody>
                </table>
                <ng-template #emptyTable>
                   <div class="empty-state-simple">Chưa có dữ liệu</div>
                </ng-template>
              </div>
            </div>
          </div>

          <div class="stats-grid-secondary">
             <!-- BOOKING STATUS -->
             <div class="card glass-card">
                <div class="card-header">
                  <h3>Trạng thái đơn hàng</h3>
                </div>
                <div class="status-distribution">
                  <div class="status-item" *ngFor="let entry of adminStats?.bookingsByStatus | keyvalue">
                    <div class="status-label-wrap">
                      <span class="status-circle" [ngClass]="entry.key.toLowerCase()"></span>
                      <span class="status-name">{{ translateStatus(entry.key) }}</span>
                    </div>
                    <div class="status-value-wrap">
                      <div class="status-progress-bg">
                        <div class="status-progress-bar" [ngClass]="entry.key.toLowerCase()" [style.width.%]="getStatusPercentage(entry.value || 0)"></div>
                      </div>
                      <span class="status-count">{{ entry.value }}</span>
                    </div>
                  </div>
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
            <h3>Quản lý Đơn hàng</h3>
            <div class="export-dropdown">
              <button class="btn-primary">📤 Xuất báo cáo hệ thống</button>
              <div class="dropdown-content">
                <a (click)="reportService.exportBookingsPdf()">PDF/XLSX</a>
                <a (click)="reportService.exportBookingsJasper()">Jasper Report</a>
              </div>
            </div>
          </div>
          <app-booking-history-tab role="ADMIN"></app-booking-history-tab>
        </div>

        <!-- UPGRADES TAB -->
        <div class="card glass-card" *ngIf="activeTab === 'upgrades'">
          <div class="card-header">
            <h3>Danh sách Yêu cầu Trở thành Host</h3>
            <span class="badge count-badge">{{ pendingRequests.length }} chờ duyệt</span>
          </div>
          
          <div class="table-container" *ngIf="pendingRequests.length > 0; else noRequests">
            <table class="modern-table">
              <thead>
                <tr>
                  <th>Người dùng</th>
                  <th>Thông tin chi tiết</th>
                  <th>Ngày yêu cầu</th>
                  <th class="actions-col">Hành động</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let req of pendingRequests" class="table-row">
                  <td class="user-cell">
                    <div class="avatar-placeholder">{{ req.username.charAt(0).toUpperCase() }}</div>
                    <div>
                      <div class="username">{{ req.username }}</div>
                      <div class="email">{{ req.email }}</div>
                    </div>
                  </td>
                  <td class="details-cell">
                    <div *ngIf="req.userNote" class="user-note"><strong>Ghi chú:</strong> {{ req.userNote }}</div>
                    <a *ngIf="req.proofUrl" [href]="'http://localhost:9999' + req.proofUrl" target="_blank" class="proof-link">
                      <span class="icon">📎</span> Xem minh chứng
                    </a>
                    <span *ngIf="!req.proofUrl && !req.userNote" class="no-details">Không có chi tiết</span>
                  </td>
                  <td class="date-cell">{{ req.createdAt | date:'dd/MM/yyyy HH:mm' }}</td>
                  <td class="actions-cell">
                    <button class="btn-icon btn-approve" title="Phê duyệt" (click)="approve(req.id)">
                      <i class="icon">✓</i> Duyệt
                    </button>
                    <button class="btn-icon btn-reject" title="Từ chối" (click)="reject(req.id)">
                      <i class="icon">✕</i> Từ chối
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <ng-template #noRequests>
            <div class="empty-state">
              <span class="empty-icon">☕</span>
              <p>Hiện không có yêu cầu nâng cấp nào đang chờ xử lý.</p>
            </div>
          </ng-template>
        </div>

        <!-- AMENITIES TAB -->
        <div class="card glass-card" *ngIf="activeTab === 'amenities'">
          <div class="card-header">
            <h3>Quản lý Tiện ích (Amenities)</h3>
            <div class="add-form">
              <input type="text" [(ngModel)]="newAmenityName" placeholder="Tên tiện ích (vd: Wifi)" class="input-field" style="width: 300px;" />
              <button class="btn-primary btn-sm" (click)="addAmenity()">Thêm</button>
            </div>
          </div>
          
          <div class="amenities-grid">
            <div class="amenity-chip" *ngFor="let am of amenities">
              <span class="am-name">{{ am.name }}</span>
              <button class="btn-delete-chip" (click)="deleteAmenity(am.id)">✕</button>
            </div>
          </div>
        </div>

        <!-- HOMESTAYS TAB -->
        <div class="card glass-card" *ngIf="activeTab === 'homestays'">
          <div class="card-header">
            <h3>Quản lý Homestay</h3>
            <select [(ngModel)]="filterStatus" class="input-field status-filter">
              <option value="ALL">Tất cả</option>
              <option value="PENDING">Chờ duyệt</option>
              <option value="ACTIVE">Đang hoạt động</option>
              <option value="INACTIVE">Đã khóa</option>
              <option value="REJECTED">Đã từ chối</option>
            </select>
          </div>
          
          <div class="table-container">
            <table class="modern-table">
              <thead>
                <tr>
                  <th>Homestay</th>
                  <th>Chủ nhà</th>
                  <th>Trạng thái</th>
                  <th class="actions-col">Hành động</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let h of filteredHomestays" class="table-row">
                  <td class="homestay-cell">
                    <img *ngIf="h.images && h.images.length > 0" [src]="'http://localhost:9999' + h.images[0].url" class="h-thumb" />
                    <div class="h-thumb-placeholder" *ngIf="!h.images || h.images.length === 0">🏠</div>
                    <div>
                      <div class="h-name">{{ h.name }}</div>
                      <div class="h-city">{{ h.city }}</div>
                    </div>
                  </td>
                  <td>{{ h.hostName }}</td>
                  <td>
                    <span class="badge" [ngClass]="h.status.toLowerCase()">{{ h.status }}</span>
                    <div *ngIf="h.adminReason" class="admin-reason-text">Lý do: {{ h.adminReason }}</div>
                  </td>
                  <td class="actions-cell">
                    <button class="action-btn detail-btn" (click)="viewDetail(h)">
                      <span class="btn-icon-wrap">🔍</span> Xem
                    </button>
                    <button *ngIf="h.status !== 'ACTIVE'" class="action-btn approve-btn" (click)="changeHomestayStatus(h.id, 'ACTIVE')">
                      <span class="btn-icon-wrap">✅</span> Duyệt
                    </button>
                    <button *ngIf="h.status === 'ACTIVE'" class="action-btn lock-btn" (click)="changeHomestayStatus(h.id, 'INACTIVE')">
                      <span class="btn-icon-wrap">🔒</span> Khóa
                    </button>
                    <button *ngIf="h.status === 'INACTIVE' || h.status === 'PENDING'" class="action-btn reject-btn" (click)="changeHomestayStatus(h.id, 'REJECTED')">
                      <span class="btn-icon-wrap">🗑️</span> Từ chối
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>


        <!-- ROOM TYPES TAB -->
        <div class="card glass-card" *ngIf="activeTab === 'room-types'">
          <div class="card-header">
            <h3>Quản lý Loại phòng (Room Types)</h3>
            <div class="add-form" style="display: flex; gap: 10px; align-items: flex-start;">
              <div style="display: flex; flex-direction: column; gap: 5px;">
                <input type="text" [(ngModel)]="newRoomTypeName" placeholder="Tên loại phòng" class="input-field" style="width: 250px;" />
                <input type="text" [(ngModel)]="newRoomTypeDesc" placeholder="Mô tả..." class="input-field" style="width: 250px;" />
              </div>
              <button class="btn-primary btn-sm" (click)="addRoomType()" style="height: 36px;">Thêm</button>
            </div>
          </div>
          
          <div class="table-container">
            <table class="modern-table">
              <thead>
                <tr>
                  <th>Tên</th>
                  <th>Mô tả</th>
                  <th class="actions-col">Hành động</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let rt of roomTypes" class="table-row">
                  <td><strong>{{ rt.name }}</strong></td>
                  <td>{{ rt.description }}</td>
                  <td class="actions-cell">
                    <button class="action-btn detail-btn" (click)="editRoomType(rt)">Sửa</button>
                    <button class="action-btn reject-btn" (click)="deleteRoomType(rt.id!)">Xóa</button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- CHAT TAB -->
        <div *ngIf="activeTab === 'chat'">
          <app-chat-tab></app-chat-tab>
        </div>

        <!-- VOUCHERS TAB -->
        <div class="card glass-card" *ngIf="activeTab === 'vouchers'">
          <app-admin-voucher-tab></app-admin-voucher-tab>
        </div>
        </main>
      </div>
    </div>

    <!-- REASON MODAL (Generic for approve/reject/inactive) -->
    <div class="modal-overlay" *ngIf="showReasonModal" (click)="showReasonModal = false">
      <div class="edit-modal-box premium-reason-modal" (click)="$event.stopPropagation()">
        <div class="modal-header premium-header">
          <div class="header-content">
            <div class="header-icon-wrap" [ngClass]="reasonTarget?.type?.includes('APPROVE') ? 'bg-success' : 'bg-warning'">
              {{ reasonTarget?.type?.includes('APPROVE') ? '✨' : '⚠️' }}
            </div>
            <div class="header-text">
              <h3>{{ reasonTitle }}</h3>
              <p class="header-subtitle">Hành động này sẽ được lưu lại vào lịch sử hệ thống</p>
            </div>
          </div>
          <button class="modal-close-btn" (click)="showReasonModal = false">✕</button>
        </div>
        
        <div class="edit-modal-body premium-body">
          <div class="info-banner" *ngIf="reasonTarget?.type?.includes('REJECT') || reasonTarget?.status === 'INACTIVE'">
            <span class="banner-icon">ℹ️</span>
            <p>Nội dung lý do sẽ được gửi trực tiếp qua thông báo cho người dùng.</p>
          </div>

          <div class="form-group-premium">
            <label>{{ reasonLabel }}</label>
            <textarea [(ngModel)]="reasonValue" class="premium-input" rows="4" 
              [placeholder]="reasonTarget?.type?.includes('APPROVE') ? 'Nhập ghi chú chào mừng (không bắt buộc)...' : 'Nhập lý do chi tiết để hỗ trợ người dùng...'">
            </textarea>
          </div>

          <div class="modal-actions-premium">
            <button class="btn-cancel" (click)="showReasonModal = false">Hủy bỏ</button>
            <button class="btn-confirm" [ngClass]="{'btn-success': reasonTarget?.type?.includes('APPROVE')}" (click)="submitReason()">
              {{ reasonTarget?.type?.includes('APPROVE') ? 'Phê duyệt ngay' : 'Xác nhận gửi' }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- EDIT ROOM TYPE MODAL -->
    <div class="modal-overlay" *ngIf="editingRoomType" (click)="cancelEditRoomType()">
      <div class="edit-modal-box" (click)="$event.stopPropagation()">
        <div class="modal-header">
          <h3>✏️ Sửa Loại Phòng</h3>
          <button class="modal-close" (click)="cancelEditRoomType()">✕</button>
        </div>
        <div class="edit-modal-body">
          <div class="form-group">
            <label>Tên loại phòng *</label>
            <input type="text" [(ngModel)]="editRoomTypeForm.name" class="input-field" placeholder="Nhập tên..." />
          </div>
          <div class="form-group">
            <label>Mô tả</label>
            <textarea [(ngModel)]="editRoomTypeForm.description" class="input-field" rows="3" placeholder="Nhập mô tả..."></textarea>
          </div>
          <div class="edit-modal-actions">
            <button class="btn-secondary" (click)="cancelEditRoomType()">Hủy</button>
            <button class="btn-primary btn-sm" style="padding: 10px 24px;" (click)="submitEditRoomType()">Lưu</button>
          </div>
        </div>
      </div>
    </div>

    <!-- HOMESTAY DETAIL MODAL -->
    <div class="modal-overlay" *ngIf="selectedHomestay" (click)="closeDetail()">
      <div class="modal-box" (click)="$event.stopPropagation()">
        <div class="modal-header">
          <h3>🏠 Chi tiết Homestay</h3>
          <button class="modal-close" (click)="closeDetail()">✕</button>
        </div>
        <div class="modal-body">
          <!-- Images carousel -->
          <div class="modal-images-container" *ngIf="selectedHomestay.images && selectedHomestay.images.length > 0">
            <div class="modal-images">
              <img *ngFor="let img of selectedHomestay.images" [src]="'http://localhost:9999' + img.url" class="modal-img" />
            </div>
          </div>
          <div class="modal-no-img" *ngIf="!selectedHomestay.images || selectedHomestay.images.length === 0">
            <span class="icon">🖼️</span>
            <p>Không có ảnh hiển thị</p>
          </div>

          <div class="modal-info-grid">
            <div class="info-item">
              <span class="info-label">🏠 Tên:</span>
              <span class="info-value">{{ selectedHomestay.name }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">📍 Thành phố:</span>
              <span class="info-value">{{ selectedHomestay.city }}</span>
            </div>
            <div class="info-item info-full">
              <span class="info-label">📮 Địa chỉ:</span>
              <span class="info-value">{{ selectedHomestay.address }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">💰 Giá/đêm:</span>
              <span class="info-value price-highlight">{{ selectedHomestay.pricePerNight | number }}đ</span>
            </div>
            <div class="info-item">
              <span class="info-label">👥 Tối đa:</span>
              <span class="info-value">{{ selectedHomestay.maxGuests }} khách</span>
            </div>
            <div class="info-item">
              <span class="info-label">👤 Chủ nhà:</span>
              <span class="info-value">{{ selectedHomestay.hostName }}</span>
            </div>
            <div class="info-item info-full" *ngIf="selectedHomestay.description">
              <span class="info-label">📝 Mô tả:</span>
              <span class="info-value description-text">{{ selectedHomestay.description }}</span>
            </div>
            <div class="info-item info-full" *ngIf="selectedHomestay.amenities && selectedHomestay.amenities.length > 0">
              <span class="info-label">✨ Tiện ích:</span>
              <div class="amenity-tags">
                <span class="amenity-tag" *ngFor="let am of selectedHomestay.amenities">{{ am.name }}</span>
              </div>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button class="action-btn approve-btn" *ngIf="selectedHomestay.status !== 'ACTIVE'" (click)="changeHomestayStatus(selectedHomestay.id, 'ACTIVE'); closeDetail()">
            <span>✅</span> Duyệt ngay
          </button>
          <button class="action-btn lock-btn" *ngIf="selectedHomestay.status === 'ACTIVE'" (click)="changeHomestayStatus(selectedHomestay.id, 'INACTIVE'); closeDetail()">
            <span>🔒</span> Khóa
          </button>
          <button class="action-btn reject-btn" *ngIf="selectedHomestay.status !== 'REJECTED'" (click)="changeHomestayStatus(selectedHomestay.id, 'REJECTED'); closeDetail()">
            <span>🗑️</span> Từ chối
          </button>
          <button class="btn-secondary" (click)="closeDetail()">Đóng</button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .dashboard-page { min-height: 100vh; background: #f1f5f9; padding-top: 80px; font-family: 'Inter', sans-serif; display: flex; flex-direction: column;}
    .dashboard-layout { display: flex; flex: 1; max-width: 1400px; margin: 0 auto; width: 100%; padding: 30px 20px; gap: 30px; }
    
    .sidebar { width: 260px; background: white; border-radius: 16px; padding: 25px 20px; box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.05); border: 1px solid #e2e8f0; height: fit-content; flex-shrink: 0; }
    .sidebar-header { margin-bottom: 30px; border-bottom: 1px solid #f1f5f9; padding-bottom: 15px;}
    .sidebar-header h2 { font-size: 24px; color: #0f172a; margin: 0 0 5px 0; font-weight: 700; }
    .subtitle { color: #64748b; font-size: 14px; margin: 0; }
    
    .sidebar-menu { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 8px; }
    .sidebar-menu li { padding: 12px 16px; border-radius: 10px; color: #475569; font-weight: 600; cursor: pointer; transition: all 0.2s; display: flex; align-items: center; gap: 12px; font-size: 15px; }
    .sidebar-menu li:hover { background: #f8fafc; color: #0f172a; }
    .sidebar-menu li.active { background: #4f46e5; color: white; box-shadow: 0 4px 6px rgba(79, 70, 229, 0.2); }
    .menu-icon { font-size: 18px; }
    .nav-dot { position: absolute; top: 18px; right: 20px; width: 8px; height: 8px; background: #ef4444; border-radius: 50%; box-shadow: 0 0 0 2px white; }

    .main-content { flex: 1; min-width: 0; }
    
    .glass-card { background: white; border-radius: 16px; padding: 30px; box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.05); border: 1px solid #e2e8f0; margin-bottom: 20px; }
    .card-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 25px; }
    .card-header h3 { font-size: 20px; color: #1e293b; margin: 0; font-weight: 600; border-left: 4px solid #6366f1; padding-left: 10px; }
    .count-badge { background: #e0e7ff; color: #4338ca; padding: 6px 12px; border-radius: 999px; font-size: 14px; font-weight: 600; }
    
    .input-field { padding: 8px 12px; border: 1px solid #cbd5e0; border-radius: 6px; font-size: 14px; }
    .add-form { display: flex; gap: 10px; }
    .btn-sm { padding: 8px 16px; }
    
    .amenities-grid { display: flex; flex-wrap: wrap; gap: 10px; }
    .amenity-chip { display: flex; align-items: center; gap: 8px; background: #f1f5f9; padding: 8px 12px; border-radius: 999px; font-size: 14px; font-weight: 500; }
    .btn-delete-chip { background: transparent; border: none; color: #ef4444; cursor: pointer; font-weight: bold; border-radius: 50%; width: 20px; height: 20px; display: flex; align-items: center; justify-content: center; transition: background 0.2s; }
    .btn-delete-chip:hover { background: #fee2e2; }

    .table-container { overflow-x: auto; border-radius: 12px; border: 1px solid #f1f5f9; }
    .modern-table { width: 100%; border-collapse: collapse; text-align: left; }
    .modern-table th { background: #f8fafc; padding: 15px 20px; color: #64748b; font-size: 13px; text-transform: uppercase; font-weight: 600; letter-spacing: 0.5px; border-bottom: 1px solid #e2e8f0; }
    .modern-table td { padding: 16px 20px; border-bottom: 1px solid #f1f5f9; color: #334155; vertical-align: middle; }
    
    .user-cell { display: flex; align-items: center; gap: 12px; }
    .avatar-placeholder { width: 36px; height: 36px; border-radius: 50%; background: linear-gradient(135deg, #c7d2fe 0%, #a5b4fc 100%); color: #4338ca; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 16px; flex-shrink: 0; }
    .username { font-weight: 600; color: #0f172a; }
    .email { font-size: 12px; color: #64748b; }
    
    .homestay-cell { display: flex; align-items: center; gap: 12px; }
    .h-thumb { width: 50px; height: 50px; border-radius: 8px; object-fit: cover; }
    .h-thumb-placeholder { width: 50px; height: 50px; border-radius: 8px; background: #e2e8f0; display: flex; align-items: center; justify-content: center; font-size: 20px; }
    .h-name { font-weight: 600; color: #0f172a; }
    .h-city { font-size: 12px; color: #64748b; }
    
    .details-cell { max-width: 300px; }
    .user-note { font-size: 13px; margin-bottom: 6px; color: #475569; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; text-overflow: ellipsis; }
    .proof-link { display: inline-flex; align-items: center; gap: 4px; font-size: 13px; color: #3b82f6; text-decoration: none; font-weight: 500; }
    .proof-link:hover { text-decoration: underline; }
    .no-details { font-size: 13px; color: #94a3b8; font-style: italic; }
    .admin-reason-text { font-size: 11px; color: #ef4444; margin-top: 4px; max-width: 200px; }
    
    .badge { padding: 4px 12px; border-radius: 999px; font-size: 12px; font-weight: 700; text-transform: uppercase; }
    .pending { background: #fffbeb; color: #92400e; }
    .active { background: #dcfce7; color: #166534; }
    .inactive { background: #f1f5f9; color: #475569; }
    .rejected { background: #fee2e2; color: #991b1b; }
    
    .date-cell { color: #64748b; font-size: 14px; }
    
    .actions-col { text-align: right; }
    .actions-cell { display: flex; gap: 8px; justify-content: flex-end; flex-wrap: wrap; }
    .action-btn { display: inline-flex; align-items: center; gap: 6px; padding: 7px 14px; border: none; border-radius: 8px; font-size: 13px; font-weight: 600; cursor: pointer; transition: all 0.2s ease; box-shadow: 0 2px 4px rgba(0,0,0,0.08); white-space: nowrap; }
    .action-btn:hover { transform: translateY(-2px); box-shadow: 0 4px 12px rgba(0,0,0,0.15); }
    .action-btn:active { transform: translateY(0); }
    .btn-icon-wrap { font-size: 14px; }
    .approve-btn { background: linear-gradient(135deg, #34d399, #10b981); color: white; }
    .approve-btn:hover { background: linear-gradient(135deg, #10b981, #059669); }
    .lock-btn { background: linear-gradient(135deg, #fbbf24, #f59e0b); color: white; }
    .lock-btn:hover { background: linear-gradient(135deg, #f59e0b, #d97706); }
    .reject-btn { background: linear-gradient(135deg, #f87171, #ef4444); color: white; }
    .reject-btn:hover { background: linear-gradient(135deg, #ef4444, #dc2626); }
    /* Legacy btn-icon kept for upgrade requests tab */
    .btn-icon { display: inline-flex; align-items: center; gap: 6px; padding: 6px 10px; border: none; border-radius: 6px; font-size: 12px; font-weight: 600; cursor: pointer; transition: all 0.2s; }
    .btn-approve { background: #dcfce7; color: #166534; }
    .btn-approve:hover { background: #bbf7d0; transform: translateY(-1px); }
    .btn-reject { background: #fee2e2; color: #991b1b; }
    .btn-reject:hover { background: #fecaca; transform: translateY(-1px); }

    .btn-primary { background: linear-gradient(135deg, #4f46e5 0%, #3b82f6 100%); color: white; border: none; border-radius: 8px; cursor: pointer; font-weight: 600; }
    .btn-secondary { padding: 8px 20px; background: #f1f5f9; color: #475569; border: none; border-radius: 8px; cursor: pointer; font-weight: 600; font-size: 14px; }
    .btn-secondary:hover { background: #e2e8f0; }
    .detail-btn { background: linear-gradient(135deg, #818cf8, #6366f1); color: white; }
    .detail-btn:hover { background: linear-gradient(135deg, #6366f1, #4f46e5); }
    
    /* MODAL */
    .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.7); z-index: 9999; display: flex; align-items: flex-start; justify-content: center; backdrop-filter: blur(8px); animation: fadeIn 0.3s ease; padding-top: 40px; overflow-y: auto; }
    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
    .modal-box { background: white; border-radius: 24px; width: 1000px; max-width: 95vw; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.5); animation: slideDown 0.4s cubic-bezier(0.16, 1, 0.3, 1); margin-bottom: 40px; }
    @keyframes slideDown { from { transform: translateY(-30px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
    .modal-header { display: flex; justify-content: space-between; align-items: center; padding: 28px 32px; border-bottom: 1px solid #f1f5f9; background: white; border-radius: 24px 24px 0 0; }
    .modal-header h3 { margin: 0; font-size: 22px; font-weight: 800; color: #0f172a; }
    .modal-close { background: #f8fafc; border: none; border-radius: 12px; width: 40px; height: 40px; font-size: 20px; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: all 0.2s; color: #64748b; }
    .modal-close:hover { background: #fee2e2; color: #ef4444; }
    .modal-body { padding: 24px 28px; }
    .modal-images { display: flex; gap: 10px; overflow-x: auto; padding-bottom: 10px; margin-bottom: 20px; }
    .modal-img { width: 180px; height: 130px; object-fit: cover; border-radius: 12px; flex-shrink: 0; border: 1px solid #e2e8f0; }
    .modal-no-img { text-align: center; padding: 30px; background: #f8fafc; border-radius: 12px; color: #94a3b8; margin-bottom: 20px; }
    .modal-info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
    .info-full { grid-column: 1 / -1; }
    .info-item { background: #f8fafc; border-radius: 10px; padding: 14px 16px; display: flex; flex-direction: column; gap: 4px; }
    .info-label { font-size: 12px; color: #64748b; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; }
    .info-value { font-size: 15px; color: #0f172a; font-weight: 500; }
    .price-highlight { color: #10b981; font-weight: 700; font-size: 18px; }
    .description-text { white-space: pre-line; color: #475569; font-size: 14px; line-height: 1.6; }
    .amenity-tags { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 6px; }
    .amenity-tag { background: #e0e7ff; color: #4338ca; padding: 4px 12px; border-radius: 999px; font-size: 13px; font-weight: 500; }
    .modal-footer { padding: 20px 28px; border-top: 1px solid #e2e8f0; display: flex; gap: 10px; justify-content: flex-end; background: #f8fafc; border-radius: 0 0 20px 20px; }
    
    .empty-state { text-align: center; padding: 60px 20px; color: #94a3b8; }
    .empty-icon { font-size: 48px; display: block; margin-bottom: 15px; opacity: 0.8; }
    .status-filter { margin-left: 15px; }
    /* REFINED PREMIUM MODAL */
    .premium-reason-modal { width: 540px; background: white; border-radius: 24px; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25); border: none; }
    .premium-header { padding: 30px 30px 20px; border-bottom: 1px solid #f1f5f9; display: flex; align-items: center; justify-content: space-between; background: white; border-radius: 24px 24px 0 0; }
    .header-content { display: flex; align-items: center; gap: 16px; }
    .header-icon-wrap { width: 48px; height: 48px; border-radius: 14px; display: flex; align-items: center; justify-content: center; font-size: 24px; }
    .bg-success { background: #ecfdf5; color: #10b981; }
    .bg-warning { background: #fff7ed; color: #f59e0b; }
    .header-text h3 { margin: 0; font-size: 18px; font-weight: 700; color: #1e293b; }
    .header-subtitle { margin: 2px 0 0; font-size: 12px; color: #94a3b8; }
    .modal-close-btn { background: #f8fafc; border: none; width: 32px; height: 32px; border-radius: 50%; color: #94a3b8; cursor: pointer; transition: all 0.2s; }
    .modal-close-btn:hover { background: #fee2e2; color: #ef4444; }

    .premium-body { padding: 25px 30px 30px; }
    .info-banner { background: #f0f9ff; border-radius: 12px; padding: 12px 16px; display: flex; gap: 10px; margin-bottom: 20px; border: 1px solid #e0f2fe; }
    .info-banner p { margin: 0; font-size: 13px; color: #0369a1; line-height: 1.5; }
    
    .form-group-premium label { display: block; font-size: 13px; font-weight: 600; color: #64748b; margin-bottom: 8px; text-transform: uppercase; letter-spacing: 0.5px; }
    .premium-input { width: 100%; border: 1px solid #e2e8f0; border-radius: 16px; padding: 15px; font-size: 15px; background: #f8fafc; transition: all 0.2s; min-height: 120px; font-family: inherit; }
    .premium-input:focus { outline: none; border-color: #6366f1; background: white; box-shadow: 0 0 0 4px rgba(99, 102, 241, 0.1); }
    
    .modal-actions-premium { display: flex; gap: 12px; margin-top: 30px; }
    .modal-actions-premium button { flex: 1; height: 48px; border-radius: 14px; font-weight: 600; font-size: 15px; cursor: pointer; transition: all 0.2s; border: none; }
    .btn-cancel { background: #f1f5f9; color: #475569; }
    .btn-cancel:hover { background: #e2e8f0; }
    .btn-confirm { background: #4f46e5; color: white; box-shadow: 0 4px 12px rgba(79, 70, 229, 0.2); }
    .btn-confirm:hover { background: #4338ca; transform: translateY(-2px); }
    .btn-success { background: #10b981; box-shadow: 0 4px 12px rgba(16, 185, 129, 0.2); }
    .btn-success:hover { background: #059669; }

    /* STATISTICS STYLES */
    .stats-overview { display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 20px; margin-bottom: 25px; }
    .stat-card-premium { border-radius: 20px; padding: 24px; color: white; display: flex; justify-content: space-between; align-items: center; box-shadow: 0 10px 20px -5px rgba(0,0,0,0.15); transition: transform 0.3s ease; }
    .stat-card-premium:hover { transform: translateY(-5px); }
    .stat-card-premium.blue { background: linear-gradient(135deg, #3b82f6, #1d4ed8); }
    .stat-card-premium.purple { background: linear-gradient(135deg, #8b5cf6, #6d28d9); }
    .stat-card-premium.green { background: linear-gradient(135deg, #10b981, #047857); }
    .stat-card-premium.orange { background: linear-gradient(135deg, #f59e0b, #d97706); }
    .stat-info .label { display: block; font-size: 14px; opacity: 0.9; font-weight: 500; margin-bottom: 5px; }
    .stat-info .value { display: block; font-size: 24px; font-weight: 800; }
    .stat-icon { font-size: 40px; opacity: 0.3; }

    .stats-grid-main { display: grid; grid-template-columns: 2fr 1fr; gap: 20px; margin-bottom: 25px; }
    .stats-grid-secondary { display: grid; grid-template-columns: 1fr; gap: 20px; }

    .chart-container-simple { height: 300px; display: flex; align-items: flex-end; padding: 20px 0; }
    .bar-chart { display: flex; align-items: flex-end; justify-content: space-around; width: 100%; height: 100%; gap: 10px; }
    .bar-item { flex: 1; display: flex; flex-direction: column; align-items: center; height: 100%; max-width: 60px; }
    .bar-wrapper { width: 100%; flex: 1; display: flex; align-items: flex-end; background: #f1f5f9; border-radius: 8px 8px 0 0; overflow: visible; position: relative; }
    .bar { width: 100%; background: linear-gradient(to top, #4f46e5, #818cf8); border-radius: 8px 8px 0 0; position: relative; transition: height 0.5s ease-out; }
    .bar:hover { background: #4338ca; }
    .bar-tooltip { position: absolute; top: -30px; left: 50%; transform: translateX(-50%); background: #1e293b; color: white; padding: 4px 8px; border-radius: 4px; font-size: 11px; white-space: nowrap; opacity: 0; transition: opacity 0.2s; pointer-events: none; }
    .bar:hover .bar-tooltip { opacity: 1; }
    .bar-label { margin-top: 10px; font-size: 12px; color: #64748b; font-weight: 600; }
    .empty-chart { display: flex; align-items: center; justify-content: center; width: 100%; height: 100%; color: #94a3b8; font-style: italic; }

    .table-container-simple { margin-top: 10px; }
    .simple-table { width: 100%; border-collapse: collapse; }
    .simple-table th { text-align: left; padding: 12px; color: #64748b; font-size: 13px; border-bottom: 1px solid #e2e8f0; }
    .simple-table td { padding: 12px; font-size: 14px; border-bottom: 1px solid #f1f5f9; }
    .revenue-cell { font-weight: 700; color: #10b981; }

    .status-distribution { display: flex; flex-direction: column; gap: 15px; }
    .status-item { display: flex; flex-direction: column; gap: 8px; }
    .status-label-wrap { display: flex; align-items: center; gap: 8px; }
    .status-circle { width: 10px; height: 10px; border-radius: 50%; }
    .status-circle.pending { background: #fbbf24; }
    .status-circle.confirmed { background: #3b82f6; }
    .status-circle.completed { background: #10b981; }
    .status-circle.cancelled { background: #ef4444; }
    .status-name { font-size: 14px; font-weight: 600; color: #475569; }
    .status-value-wrap { display: flex; align-items: center; gap: 12px; }
    .status-progress-bg { flex: 1; height: 8px; background: #f1f5f9; border-radius: 4px; overflow: hidden; }
    .status-progress-bar { height: 100%; border-radius: 4px; transition: width 0.5s ease-out; }
    .status-progress-bar.pending { background: #fbbf24; }
    .status-progress-bar.confirmed { background: #3b82f6; }
    .status-progress-bar.completed { background: #10b981; }
    .status-progress-bar.cancelled { background: #ef4444; }
    .status-count { font-size: 14px; font-weight: 700; color: #1e293b; min-width: 30px; text-align: right; }

    /* EXPORT DROPDOWN */
    .tab-header-actions { display: flex; justify-content: flex-end; margin-bottom: 15px; }
    .btn-export { background: #4f46e5; color: white; border: none; padding: 10px 18px; border-radius: 8px; font-weight: 600; cursor: pointer; transition: all 0.2s; }
    .btn-export:hover { background: #4338ca; transform: translateY(-2px); }

    .export-dropdown { position: relative; display: inline-block; }
    .dropdown-content { display: none; position: absolute; right: 0; background-color: white; min-width: 240px; box-shadow: 0px 8px 16px 0px rgba(0,0,0,0.1); z-index: 100; border-radius: 8px; border: 1px solid #e2e8f0; overflow: hidden; }
    .dropdown-content a { color: #1e293b; padding: 12px 16px; text-decoration: none; display: block; font-size: 14px; cursor: pointer; transition: background 0.2s; text-align: left; }
    .dropdown-content a:hover { background-color: #f1f5f9; color: #4f46e5; }
    .export-dropdown:hover .dropdown-content { display: block; }
  `]
})
export class AdminDashboardComponent implements OnInit {
  activeTab = 'profile';
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
