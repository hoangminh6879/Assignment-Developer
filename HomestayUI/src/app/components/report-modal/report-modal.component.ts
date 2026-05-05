import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ReportService } from '../../services/report.service';

@Component({
  selector: 'app-report-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="modal-overlay" (click)="close.emit()">
      <div class="modal-content" (click)="$event.stopPropagation()">
        <div class="modal-header">
          <div class="header-icon">📊</div>
          <h2>{{ reportTitle }}</h2>
          <p>Chọn định dạng tệp bạn muốn xuất</p>
          <button class="close-btn" (click)="close.emit()">✕</button>
        </div>

        <div class="modal-body">
          <div class="selection-group" *ngIf="reportType === 'BOOKINGS'">
            <label class="group-label">Khoảng thời gian báo cáo</label>
            <div class="date-inputs">
              <div class="date-field">
                <span>Từ ngày:</span>
                <input type="date" [(ngModel)]="startDate" class="form-input">
              </div>
              <div class="date-field">
                <span>Đến ngày:</span>
                <input type="date" [(ngModel)]="endDate" class="form-input">
              </div>
            </div>
          </div>

          <div class="selection-group">
            <label class="group-label">Chọn định dạng tệp</label>
            <div class="format-chips">
              <div class="format-chip" [class.active]="format === 'JASPER'" (click)="format = 'JASPER'">
                <span class="chip-icon">💎</span> Jasper Report (PDF)
              </div>
              <div class="format-chip" [class.active]="format === 'PDF'" (click)="format = 'PDF'">
                <span class="chip-icon">📄</span> PDF Standard
              </div>
              <div class="format-chip" [class.active]="format === 'EXCEL'" (click)="format = 'EXCEL'">
                <span class="chip-icon">Excel</span> Excel (XLSX)
              </div>
            </div>
          </div>

          <div class="info-banner" *ngIf="format === 'JASPER'">
            <span class="info-icon">💡</span>
            <span>Jasper Report cung cấp giao diện báo cáo chuyên nghiệp, đẹp mắt nhất.</span>
          </div>
        </div>

        <div class="modal-footer">
          <button class="btn-cancel" (click)="close.emit()">Hủy bỏ</button>
          <button class="btn-export" (click)="exportReport()" [disabled]="isExporting">
            <span *ngIf="!isExporting">📥 Xuất ngay</span>
            <span *ngIf="isExporting" class="loader"></span>
            <span *ngIf="isExporting">Đang xử lý...</span>
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .modal-overlay {
      position: fixed; top: 0; left: 0; width: 100%; height: 100%;
      background: rgba(15, 23, 42, 0.7); backdrop-filter: blur(8px);
      display: flex; align-items: center; justify-content: center;
      z-index: 3000; animation: fadeIn 0.3s ease;
    }
    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }

    .modal-content {
      background: white; width: 100%; max-width: 550px;
      border-radius: 24px; overflow: hidden;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
      animation: slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1);
    }
    @keyframes slideUp { from { transform: translateY(30px) scale(0.95); opacity: 0; } to { transform: translateY(0) scale(1); opacity: 1; } }

    .modal-header {
      padding: 30px; text-align: center; background: #f8fafc;
      border-bottom: 1px solid #f1f5f9; position: relative;
    }
    .header-icon { font-size: 40px; margin-bottom: 15px; }
    .modal-header h2 { margin: 0 0 8px 0; color: #0f172a; font-size: 22px; font-weight: 800; }
    .modal-header p { margin: 0; color: #64748b; font-size: 14px; }
    .close-btn {
      position: absolute; top: 20px; right: 20px;
      background: transparent; border: none; font-size: 18px;
      color: #94a3b8; cursor: pointer; transition: color 0.2s;
    }
    .close-btn:hover { color: #0f172a; }

    .modal-body { padding: 30px; }
    .selection-group { margin-bottom: 30px; }
    .group-label {
      display: block; font-size: 13px; font-weight: 700;
      color: #94a3b8; text-transform: uppercase; letter-spacing: 1px;
      margin-bottom: 15px;
    }

    .options-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; }
    .option-card {
      padding: 20px; border-radius: 16px; border: 2px solid #f1f5f9;
      cursor: pointer; transition: all 0.2s; position: relative;
      display: flex; flex-direction: column; gap: 10px;
    }
    .option-card:hover { border-color: #e2e8f0; background: #f8fafc; }
    .option-card.active { border-color: #4f46e5; background: #f5f3ff; }
    .option-icon { font-size: 24px; }
    .option-title { display: block; font-weight: 700; color: #1e293b; font-size: 16px; }
    .option-desc { display: block; font-size: 12px; color: #64748b; line-height: 1.4; }
    .check-mark {
      position: absolute; top: 12px; right: 12px;
      background: #4f46e5; color: white; width: 20px; height: 20px;
      border-radius: 50%; display: flex; align-items: center;
      justify-content: center; font-size: 12px;
    }

    .format-chips { display: flex; flex-wrap: wrap; gap: 10px; }
    .format-chip {
      padding: 10px 16px; border-radius: 12px; border: 1px solid #e2e8f0;
      font-size: 14px; font-weight: 600; color: #475569;
      cursor: pointer; transition: all 0.2s; display: flex; align-items: center; gap: 8px;
    }
    .format-chip:hover { background: #f1f5f9; }
    .format-chip.active { background: #1e293b; color: white; border-color: #1e293b; }
    .chip-icon { font-size: 16px; }

    .info-banner {
      background: #eff6ff; color: #1e40af; padding: 12px 16px;
      border-radius: 12px; font-size: 13px; display: flex; align-items: center; gap: 10px;
    }
    .info-icon { font-size: 18px; }

    .modal-footer {
      padding: 20px 30px; background: #f8fafc; border-top: 1px solid #f1f5f9;
      display: flex; justify-content: flex-end; gap: 15px;
    }
    .btn-cancel {
      padding: 12px 24px; border-radius: 12px; border: 1px solid #e2e8f0;
      background: white; font-weight: 700; color: #64748b;
      cursor: pointer; transition: all 0.2s;
    }
    .btn-cancel:hover { background: #f1f5f9; color: #0f172a; }
    .btn-export {
      padding: 12px 30px; border-radius: 12px; border: none;
      background: linear-gradient(135deg, #4f46e5 0%, #3b82f6 100%);
      color: white; font-weight: 700; cursor: pointer;
      box-shadow: 0 10px 15px -3px rgba(79, 70, 229, 0.4);
      transition: all 0.2s; display: flex; align-items: center; gap: 10px;
    }
    .btn-export:hover { transform: translateY(-2px); box-shadow: 0 15px 20px -5px rgba(79, 70, 229, 0.5); }
    .btn-export:disabled { opacity: 0.7; cursor: not-allowed; transform: none; }

    .loader {
      width: 18px; height: 18px; border: 3px solid rgba(255,255,255,0.3);
      border-radius: 50%; border-top-color: white;
      animation: spin 0.8s linear infinite;
    }
    @keyframes spin { to { transform: rotate(360deg); } }
    .date-inputs { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; }
    .date-field { display: flex; flex-direction: column; gap: 8px; }
    .date-field span { font-size: 13px; color: #64748b; font-weight: 600; }
    .form-input {
      padding: 12px; border-radius: 12px; border: 1px solid #e2e8f0;
      font-size: 14px; color: #1e293b; transition: all 0.2s;
    }
    .form-input:focus { outline: none; border-color: #4f46e5; box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.1); }
  `]
})
export class ReportModalComponent {
  @Input() role: 'HOST' | 'ADMIN' = 'HOST';
  @Input() reportType: 'STATS' | 'BOOKINGS' = 'STATS'; // Pre-set report type
  @Output() close = new EventEmitter<void>();

  format: 'PDF' | 'EXCEL' | 'JASPER' = 'JASPER';
  isExporting = false;
  startDate: string = '';
  endDate: string = '';

  constructor(private reportService: ReportService) {
    // Default to current month
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
    
    // Format as YYYY-MM-DD in local time
    const formatDate = (date: Date) => {
      const d = new Date(date);
      let month = '' + (d.getMonth() + 1);
      let day = '' + d.getDate();
      const year = d.getFullYear();
      if (month.length < 2) month = '0' + month;
      if (day.length < 2) day = '0' + day;
      return [year, month, day].join('-');
    };

    this.startDate = formatDate(firstDay);
    this.endDate = formatDate(now);
  }

  get reportTitle(): string {
    return this.reportType === 'STATS' ? 'Báo cáo thống kê' : 'Danh sách đặt phòng';
  }

  exportReport() {
    this.isExporting = true;
    
    setTimeout(() => {
      try {
        if (this.reportType === 'STATS') {
          if (this.role === 'ADMIN') {
            if (this.format === 'PDF') this.reportService.exportAdminStatsPdf();
            else if (this.format === 'JASPER') this.reportService.exportAdminStatsJasper('pdf');
            else if (this.format === 'EXCEL') this.reportService.exportAdminStatsJasper('xlsx');
          } else {
            if (this.format === 'PDF') this.reportService.exportStatsPdf();
            else if (this.format === 'JASPER') this.reportService.exportStatsJasper('pdf');
            else if (this.format === 'EXCEL') this.reportService.exportStatsJasper('xlsx');
          }
        } else {
          if (this.format === 'PDF') this.reportService.exportBookingsPdf(this.startDate, this.endDate);
          else if (this.format === 'EXCEL') this.reportService.exportBookingsJasper('xlsx', this.startDate, this.endDate); // Use Jasper for Excel now
          else if (this.format === 'JASPER') this.reportService.exportBookingsJasper('pdf', this.startDate, this.endDate);
        }
      } finally {
        this.isExporting = false;
        this.close.emit();
      }
    }, 800);
  }
}
