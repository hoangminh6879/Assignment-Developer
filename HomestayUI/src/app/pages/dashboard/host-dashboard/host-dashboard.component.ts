import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NavbarComponent } from '../../../components/navbar/navbar.component';

@Component({
  selector: 'app-host-dashboard',
  standalone: true,
  imports: [CommonModule, NavbarComponent],
  template: `
    <app-navbar></app-navbar>
    <div class="dashboard-page">
      <div class="dashboard-container">
        <div class="header">
          <h2>Kênh Chủ Nhà</h2>
          <p class="subtitle">Quản lý các homestay và theo dõi doanh thu của bạn</p>
        </div>

        <div class="stats-grid">
          <div class="stat-card">
            <div class="stat-icon">🏠</div>
            <div class="stat-info">
              <h4>Tổng số Homestay</h4>
              <p class="stat-value">0</p>
            </div>
          </div>
          <div class="stat-card">
            <div class="stat-icon">📅</div>
            <div class="stat-info">
              <h4>Lượt đặt phòng</h4>
              <p class="stat-value">0</p>
            </div>
          </div>
          <div class="stat-card">
            <div class="stat-icon">💰</div>
            <div class="stat-info">
              <h4>Doanh thu tháng</h4>
              <p class="stat-value">0đ</p>
            </div>
          </div>
        </div>

        <div class="card glass-card">
          <div class="card-header">
            <h3>Danh sách Homestay của bạn</h3>
            <button class="btn-primary">+ Thêm Homestay mới</button>
          </div>
          <div class="empty-state">
            <span class="empty-icon">📭</span>
            <p>Bạn chưa có homestay nào. Hãy tạo ngay một homestay để bắt đầu kinh doanh!</p>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .dashboard-page { min-height: 100vh; background: #f8fafc; padding-top: 40px; font-family: 'Inter', sans-serif; }
    .dashboard-container { max-width: 1000px; margin: 0 auto; padding: 0 20px; }
    .header { margin-bottom: 30px; }
    .header h2 { font-size: 28px; color: #0f172a; margin-bottom: 8px; font-weight: 700; }
    .subtitle { color: #64748b; font-size: 16px; }
    
    .stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 20px; margin-bottom: 30px; }
    .stat-card {
      background: white; border-radius: 16px; padding: 24px;
      display: flex; align-items: center; gap: 20px;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05); border: 1px solid #e2e8f0;
    }
    .stat-icon { font-size: 32px; background: #f1f5f9; width: 60px; height: 60px; display: flex; align-items: center; justify-content: center; border-radius: 12px; }
    .stat-info h4 { color: #64748b; font-size: 14px; font-weight: 600; margin: 0 0 5px 0; text-transform: uppercase; letter-spacing: 0.5px; }
    .stat-value { font-size: 24px; font-weight: 700; color: #0f172a; margin: 0; }
    
    .glass-card {
      background: white; border-radius: 16px; padding: 30px;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05); border: 1px solid #e2e8f0;
    }
    .card-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; border-bottom: 1px solid #e2e8f0; padding-bottom: 15px; }
    .card-header h3 { font-size: 18px; color: #1e293b; margin: 0; font-weight: 600; }
    
    .empty-state { text-align: center; padding: 50px 20px; color: #64748b; }
    .empty-icon { font-size: 48px; display: block; margin-bottom: 15px; opacity: 0.5; }
    
    .btn-primary { 
      padding: 10px 20px; background: #10b981; color: white; 
      border: none; border-radius: 8px; cursor: pointer; font-weight: 600; transition: background 0.2s;
    }
    .btn-primary:hover { background: #059669; }
  `]
})
export class HostDashboardComponent {}
