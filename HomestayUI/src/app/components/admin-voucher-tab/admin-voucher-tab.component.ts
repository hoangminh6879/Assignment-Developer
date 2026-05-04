import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { VoucherService, VoucherDto, VoucherType } from '../../services/voucher.service';
import { NotificationService } from '../../services/notification.service';

@Component({
  selector: 'app-admin-voucher-tab',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="voucher-tab">
      <div class="card-header">
        <h3>Quản lý Toàn bộ Voucher</h3>
        <button class="btn-primary" (click)="openAddForm()">+ Tạo Voucher Hệ thống</button>
      </div>

      <div class="filter-bar">
        <div class="filter-group">
          <label>Phạm vi:</label>
          <select [(ngModel)]="filters.scope" (change)="applyFilters()" class="filter-select">
            <option value="ALL">Tất cả</option>
            <option value="GLOBAL">Hệ thống</option>
            <option value="HOST">Host</option>
          </select>
        </div>
        <div class="filter-group">
          <label>Loại giảm giá:</label>
          <select [(ngModel)]="filters.type" (change)="applyFilters()" class="filter-select">
            <option value="ALL">Tất cả</option>
            <option value="PERCENTAGE">Phần trăm (%)</option>
            <option value="FIXED_AMOUNT">Số tiền (đ)</option>
          </select>
        </div>
        <div class="filter-info">
          Hiển thị: <strong>{{ filteredVouchers.length }}</strong> voucher
        </div>
      </div>

      <div class="voucher-grid" *ngIf="!showForm; else formTemplate">
        <div class="voucher-card" *ngFor="let v of filteredVouchers" [class.inactive]="!v.isActive" [class.global-card]="v.isGlobal">
          <div class="v-header">
            <span class="v-code">{{ v.code }}</span>
            <div class="v-scope-badge" [class.global]="v.isGlobal">
              {{ v.isGlobal ? 'Hệ thống' : 'Cá nhân' }}
            </div>
          </div>
          
          <div class="v-body">
            <p><strong>Người tạo:</strong> <span>{{ v.hostName || 'Hệ thống' }}</span></p>
            <p><strong>Giảm:</strong> <span class="v-value-text">{{ v.type === 'PERCENTAGE' ? v.value + '%' : (v.value | number) + 'đ' }}</span></p>
            <p><strong>Loại:</strong> {{ v.type === 'PERCENTAGE' ? 'Giảm theo %' : 'Giảm theo số tiền' }}</p>
            <p><strong>Đã dùng:</strong> {{ v.usedCount }} / {{ v.usageLimit || '∞' }}</p>
            <p><strong>Hết hạn:</strong> {{ v.expiryDate ? (v.expiryDate | date:'dd/MM/yyyy') : 'Không' }}</p>
          </div>

          <div class="v-footer">
            <div class="v-status-badge" [class.active]="v.isActive">
              <span class="status-dot" [class.active]="v.isActive"></span>
              {{ v.isActive ? 'Hoạt động' : 'Tạm ngưng' }}
            </div>
            
            <div class="v-actions">
              <!-- Admin chỉ quản lý được Voucher Global -->
              <ng-container *ngIf="v.isGlobal; else viewOnly">
                <button class="btn-icon-small" (click)="toggleStatus(v.id!)" [title]="v.isActive ? 'Tạm ngưng' : 'Kích hoạt'">
                  <i class="fas" [ngClass]="v.isActive ? 'fa-pause' : 'fa-play'"></i>
                </button>
                <button class="btn-icon-small" (click)="editVoucher(v)" title="Sửa"><i class="fas fa-edit"></i></button>
                <button class="btn-icon-small delete" (click)="deleteVoucher(v.id!)" title="Xóa"><i class="fas fa-trash"></i></button>
              </ng-container>
              <ng-template #viewOnly>
                <span class="view-only-label">Chỉ xem</span>
              </ng-template>
            </div>
          </div>
        </div>
        
        <div *ngIf="vouchers.length === 0" class="empty-state">
          <span class="empty-icon">🎟️</span>
          <p>Chưa có mã giảm giá nào trên hệ thống.</p>
        </div>
      </div>

      <ng-template #formTemplate>
        <div class="voucher-form animate-fade-in">
          <div class="form-header">
            <h4>{{ isEditing ? 'Cập nhật mã giảm giá' : 'Tạo mã giảm giá cho toàn hệ thống' }}</h4>
            <p>{{ isEditing ? 'Chỉnh sửa thông tin voucher đã chọn.' : 'Mã này sẽ áp dụng được cho tất cả Homestay.' }}</p>
          </div>
          <form (submit)="submitForm()">
            <div class="form-row">
              <div class="form-group">
                <label>Mã Code</label>
                <input type="text" [(ngModel)]="formData.code" name="code" required class="input-field" placeholder="Ví dụ: ADMINHOT">
              </div>
              <div class="form-group">
                <label>Loại giảm giá</label>
                <select [(ngModel)]="formData.type" name="type" required class="input-field">
                  <option [value]="VoucherType.PERCENTAGE">Phần trăm (%)</option>
                  <option [value]="VoucherType.FIXED_AMOUNT">Số tiền cố định (đ)</option>
                </select>
              </div>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label>Giá trị giảm</label>
                <input type="number" [(ngModel)]="formData.value" name="value" required class="input-field">
              </div>
              <div class="form-group">
                <label>Số tiền tối thiểu</label>
                <input type="number" [(ngModel)]="formData.minBookingAmount" name="minAmount" class="input-field">
              </div>
            </div>

            <div class="form-row">
              <div class="form-group" *ngIf="formData.type === VoucherType.PERCENTAGE">
                <label>Giảm tối đa (VNĐ)</label>
                <input type="number" [(ngModel)]="formData.maxDiscountAmount" name="maxDiscount" class="input-field">
              </div>
              <div class="form-group">
                <label>Số lượng mã</label>
                <input type="number" [(ngModel)]="formData.usageLimit" name="limit" class="input-field">
              </div>
            </div>

            <div class="form-group">
              <label>Ngày hết hạn</label>
              <input type="date" [(ngModel)]="formData.expiryDate" name="expiry" class="input-field">
            </div>

            <div class="form-actions">
              <button type="button" class="btn-secondary" (click)="showForm = false">Hủy</button>
              <button type="submit" class="btn-primary" [disabled]="isLoading">
                {{ isLoading ? 'Đang lưu...' : (isEditing ? 'Cập nhật Voucher' : 'Tạo Global Voucher') }}
              </button>
            </div>
          </form>
        </div>
      </ng-template>
    </div>
  `,
  styles: [`
    .voucher-tab { padding: 5px; }
    .card-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 25px; }
    .card-header h3 { font-size: 20px; font-weight: 800; color: #1e293b; margin: 0; }
    
    .filter-bar { display: flex; align-items: center; gap: 24px; margin-bottom: 25px; background: #f8fafc; padding: 15px 25px; border-radius: 20px; border: 1px solid #e2e8f0; }
    .filter-group { display: flex; align-items: center; gap: 10px; }
    .filter-group label { font-size: 13px; font-weight: 700; color: #64748b; }
    .filter-select { padding: 8px 16px; border-radius: 12px; border: 1px solid #e2e8f0; background: white; color: #1e293b; font-size: 14px; font-weight: 600; cursor: pointer; outline: none; transition: all 0.2s; }
    .filter-select:focus { border-color: #4f46e5; box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.1); }
    .filter-info { margin-left: auto; font-size: 13px; color: #64748b; }
    .filter-info strong { color: #4f46e5; }

    .voucher-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 24px; }
    .voucher-card { background: white; border: 1px solid #e2e8f0; border-radius: 24px; padding: 24px; position: relative; transition: all 0.3s ease; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); }
    .voucher-card.global-card { border-left: 6px solid #4f46e5; }
    .voucher-card:not(.global-card) { border-left: 6px solid #94a3b8; }
    .voucher-card.inactive { opacity: 0.8; background: #f8fafc; }
    .voucher-card:hover { transform: translateY(-5px); box-shadow: 0 12px 20px -5px rgba(0,0,0,0.1); }

    .v-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
    .v-code { font-family: 'JetBrains Mono', monospace; font-size: 18px; font-weight: 800; color: #4f46e5; background: #f5f3ff; padding: 4px 12px; border-radius: 10px; }
    .v-scope-badge { font-size: 11px; font-weight: 800; padding: 4px 10px; border-radius: 8px; text-transform: uppercase; }
    .v-scope-badge.global { background: #fff1f2; color: #e11d48; }
    .v-scope-badge:not(.global) { background: #f1f5f9; color: #475569; }

    .v-body { font-size: 14px; color: #475569; display: flex; flex-direction: column; gap: 8px; margin-bottom: 20px; padding: 15px; background: #f8fafc; border-radius: 16px; }
    .v-body p { margin: 0; display: flex; justify-content: space-between; }
    .v-body strong { color: #64748b; font-weight: 600; }
    .v-value-text { color: #4f46e5; font-weight: 800; }

    .v-footer { display: flex; justify-content: space-between; align-items: center; padding-top: 15px; border-top: 1px dashed #e2e8f0; }
    .v-status-badge { display: flex; align-items: center; gap: 6px; font-size: 12px; font-weight: 700; color: #64748b; }
    .status-dot { width: 8px; height: 8px; border-radius: 50%; background: #cbd5e1; }
    .status-dot.active { background: #10b981; box-shadow: 0 0 8px rgba(16, 185, 129, 0.4); }
    
    .v-actions { display: flex; gap: 8px; align-items: center; }
    .view-only-label { font-size: 11px; color: #94a3b8; font-style: italic; font-weight: 600; }

    .voucher-form { max-width: 750px; margin: 0 auto; background: white; padding: 40px; border-radius: 32px; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.1); border: 1px solid #f1f5f9; }
    .form-header { margin-bottom: 35px; border-bottom: 1px solid #f1f5f9; padding-bottom: 20px; }
    .form-header h4 { margin: 0; color: #0f172a; font-size: 22px; font-weight: 800; }
    .form-header p { margin: 8px 0 0; color: #64748b; font-size: 14px; }
    
    .form-row { display: flex; gap: 24px; margin-bottom: 24px; }
    .form-group { flex: 1; }
    .form-group label { display: block; font-size: 13px; font-weight: 700; color: #475569; margin-bottom: 10px; text-transform: uppercase; letter-spacing: 0.5px; }
    .input-field { width: 100%; padding: 14px 18px; border: 2px solid #f1f5f9; border-radius: 16px; font-family: inherit; font-size: 15px; transition: all 0.3s; background: #f8fafc; }
    .input-field:focus { outline: none; border-color: #4f46e5; background: white; box-shadow: 0 0 0 4px rgba(79, 70, 229, 0.1); }
    
    .form-actions { display: flex; justify-content: flex-end; gap: 16px; margin-top: 40px; padding-top: 25px; border-top: 1px solid #f1f5f9; }
    
    .btn-primary { padding: 14px 32px; background: linear-gradient(135deg, #4f46e5 0%, #3b82f6 100%); color: white; border: none; border-radius: 16px; cursor: pointer; font-weight: 700; transition: all 0.3s; box-shadow: 0 10px 15px -3px rgba(79, 70, 229, 0.3); }
    .btn-primary:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 15px 20px -3px rgba(79, 70, 229, 0.4); filter: brightness(1.1); }
    .btn-primary:disabled { opacity: 0.6; cursor: not-allowed; }
    
    .btn-secondary { padding: 14px 32px; background: white; color: #64748b; border: 2px solid #e2e8f0; border-radius: 16px; cursor: pointer; font-weight: 700; transition: all 0.3s; }
    .btn-secondary:hover { background: #f8fafc; color: #1e293b; border-color: #cbd5e1; }

    .btn-icon-small { width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; border-radius: 8px; border: 1px solid #e2e8f0; background: white; color: #64748b; cursor: pointer; transition: all 0.2s; }
    .btn-icon-small:hover { color: #4f46e5; border-color: #4f46e5; transform: translateY(-2px); }
    .btn-icon-small.delete:hover { color: #ef4444; border-color: #ef4444; }
    
    .empty-state { text-align: center; padding: 100px 20px; grid-column: 1 / -1; }
    .empty-icon { font-size: 64px; display: block; margin-bottom: 20px; opacity: 0.2; }
    .empty-state p { font-size: 16px; color: #94a3b8; font-weight: 500; }

    .animate-fade-in { animation: fadeIn 0.5s ease-out; }
    @keyframes fadeIn { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
  `]
})
export class AdminVoucherTabComponent implements OnInit {
  vouchers: VoucherDto[] = [];
  filteredVouchers: VoucherDto[] = [];
  showForm = false;
  isLoading = false;
  isEditing = false;
  VoucherType = VoucherType;

  filters = {
    scope: 'ALL',
    type: 'ALL'
  };

  formData: Partial<VoucherDto> = {
    type: VoucherType.PERCENTAGE,
    isGlobal: true,
    isActive: true
  };

  constructor(
    private voucherService: VoucherService,
    private notification: NotificationService
  ) {}

  ngOnInit() {
    this.loadVouchers();
  }

  loadVouchers() {
    this.voucherService.getAdminVouchers().subscribe((data: VoucherDto[]) => {
      this.vouchers = data;
      this.applyFilters();
    });
  }

  applyFilters() {
    this.filteredVouchers = this.vouchers.filter(v => {
      const matchScope = this.filters.scope === 'ALL' || 
                        (this.filters.scope === 'GLOBAL' && v.isGlobal) || 
                        (this.filters.scope === 'HOST' && !v.isGlobal);
      
      const matchType = this.filters.type === 'ALL' || v.type === this.filters.type;
      
      return matchScope && matchType;
    });
  }

  openAddForm() {
    this.isEditing = false;
    this.formData = {
      type: VoucherType.PERCENTAGE,
      isGlobal: true,
      isActive: true,
      value: 0
    };
    this.showForm = true;
  }

  editVoucher(v: VoucherDto) {
    this.isEditing = true;
    this.formData = { ...v };
    this.showForm = true;
  }

  deleteVoucher(id: string) {
    if (confirm('Bạn có chắc chắn muốn xóa mã giảm giá này?')) {
      this.voucherService.deleteVoucher(id).subscribe({
        next: () => {
          this.notification.success('Đã xóa Voucher');
          this.loadVouchers();
        },
        error: () => this.notification.error('Không thể xóa Voucher')
      });
    }
  }

  submitForm() {
    this.isLoading = true;
    const request = this.isEditing 
      ? this.voucherService.updateVoucher(this.formData.id!, this.formData as VoucherDto)
      : this.voucherService.createVoucher(this.formData as VoucherDto);

    request.subscribe({
      next: () => {
        this.notification.success(this.isEditing ? 'Đã cập nhật Voucher!' : 'Đã tạo Voucher hệ thống thành công!');
        this.showForm = false;
        this.loadVouchers();
        this.isLoading = false;
      },
      error: (err: any) => {
        this.notification.error(err.error?.message || 'Có lỗi xảy ra');
        this.isLoading = false;
      }
    });
  }

  toggleStatus(id: string) {
    this.voucherService.toggleStatus(id).subscribe({
      next: () => {
        this.notification.success('Đã cập nhật trạng thái Voucher');
        this.loadVouchers();
      },
      error: () => this.notification.error('Không thể cập nhật trạng thái')
    });
  }
}
