import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NavbarComponent } from '../../../components/navbar/navbar.component';
import { UpgradeRequestService, UpgradeRequestDto } from '../../../services/upgrade-request.service';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, NavbarComponent],
  template: `
    <app-navbar></app-navbar>
    <div class="dashboard-page">
      <div class="dashboard-container">
        <div class="header">
          <h2>Quản Trị Hệ Thống</h2>
          <p class="subtitle">Kiểm duyệt và quản lý các yêu cầu nâng cấp tài khoản</p>
        </div>

        <div class="card glass-card">
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
      </div>
    </div>
  `,
  styles: [`
    .dashboard-page { min-height: 100vh; background: #f1f5f9; padding-top: 40px; font-family: 'Inter', sans-serif; }
    .dashboard-container { max-width: 1200px; margin: 0 auto; padding: 0 20px; }
    .header { margin-bottom: 30px; }
    .header h2 { font-size: 28px; color: #0f172a; margin-bottom: 8px; font-weight: 700; }
    .subtitle { color: #64748b; font-size: 16px; }
    
    .glass-card { background: white; border-radius: 16px; padding: 30px; box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.05); border: 1px solid #e2e8f0; }
    .card-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 25px; }
    .card-header h3 { font-size: 20px; color: #1e293b; margin: 0; font-weight: 600; border-left: 4px solid #6366f1; padding-left: 10px; }
    .count-badge { background: #e0e7ff; color: #4338ca; padding: 6px 12px; border-radius: 999px; font-size: 14px; font-weight: 600; }
    
    .table-container { overflow-x: auto; border-radius: 12px; border: 1px solid #f1f5f9; }
    .modern-table { width: 100%; border-collapse: collapse; text-align: left; }
    .modern-table th { background: #f8fafc; padding: 15px 20px; color: #64748b; font-size: 13px; text-transform: uppercase; font-weight: 600; letter-spacing: 0.5px; border-bottom: 1px solid #e2e8f0; }
    .modern-table td { padding: 16px 20px; border-bottom: 1px solid #f1f5f9; color: #334155; vertical-align: middle; }
    
    .user-cell { display: flex; align-items: center; gap: 12px; }
    .avatar-placeholder { width: 36px; height: 36px; border-radius: 50%; background: linear-gradient(135deg, #c7d2fe 0%, #a5b4fc 100%); color: #4338ca; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 16px; flex-shrink: 0; }
    .username { font-weight: 600; color: #0f172a; }
    .email { font-size: 12px; color: #64748b; }
    
    .details-cell { max-width: 300px; }
    .user-note { font-size: 13px; margin-bottom: 6px; color: #475569; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; text-overflow: ellipsis; }
    .proof-link { display: inline-flex; align-items: center; gap: 4px; font-size: 13px; color: #3b82f6; text-decoration: none; font-weight: 500; }
    .proof-link:hover { text-decoration: underline; }
    .no-details { font-size: 13px; color: #94a3b8; font-style: italic; }
    
    .date-cell { color: #64748b; font-size: 14px; }
    
    .actions-col { text-align: right; }
    .actions-cell { text-align: right; display: flex; gap: 8px; justify-content: flex-end; }
    .btn-icon { display: inline-flex; align-items: center; gap: 6px; padding: 8px 14px; border: none; border-radius: 6px; font-size: 13px; font-weight: 600; cursor: pointer; transition: all 0.2s; }
    .btn-approve { background: #dcfce7; color: #166534; }
    .btn-approve:hover { background: #bbf7d0; transform: translateY(-1px); }
    .btn-reject { background: #fee2e2; color: #991b1b; }
    .btn-reject:hover { background: #fecaca; transform: translateY(-1px); }
    
    .empty-state { text-align: center; padding: 60px 20px; color: #94a3b8; }
    .empty-icon { font-size: 48px; display: block; margin-bottom: 15px; opacity: 0.8; }
  `]
})
export class AdminDashboardComponent implements OnInit {
  pendingRequests: UpgradeRequestDto[] = [];

  constructor(private upgradeReqService: UpgradeRequestService) {}

  ngOnInit() {
    this.loadRequests();
  }

  loadRequests() {
    this.upgradeReqService.getPendingRequests().subscribe({
      next: (res) => { this.pendingRequests = res; },
      error: (err) => { console.error('Failed to load requests', err); }
    });
  }

  approve(id: string) {
    const note = prompt('Thêm ghi chú phê duyệt (tuỳ chọn):') || '';
    this.upgradeReqService.approveRequest(id, note).subscribe({
      next: () => {
        alert('Đã phê duyệt thành công!');
        this.loadRequests();
      },
      error: (err) => { alert('Lỗi: ' + (err.error?.message || err.message)); }
    });
  }

  reject(id: string) {
    const note = prompt('Lý do từ chối:') || '';
    if (note === null) return;
    this.upgradeReqService.rejectRequest(id, note).subscribe({
      next: () => {
        alert('Đã từ chối yêu cầu.');
        this.loadRequests();
      },
      error: (err) => { alert('Lỗi: ' + (err.error?.message || err.message)); }
    });
  }
}
