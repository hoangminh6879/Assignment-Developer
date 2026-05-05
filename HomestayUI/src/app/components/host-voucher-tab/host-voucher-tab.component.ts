import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { VoucherService, VoucherDto, VoucherType } from '../../services/voucher.service';
import { NotificationService } from '../../services/notification.service';

@Component({
  selector: 'app-host-voucher-tab',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="voucher-tab">
      <div class="card-header">
        <h3>Mã giảm giá của tôi</h3>
        <button class="btn-primary" (click)="openAddForm()">+ Tạo Voucher mới</button>
      </div>

      <div class="filter-bar">
        <div class="filter-group">
          <label>Loại giảm giá:</label>
          <select [(ngModel)]="filterType" (change)="applyFilters()" class="filter-select">
            <option value="ALL">Tất cả</option>
            <option value="PERCENTAGE">Phần trăm (%)</option>
            <option value="FIXED_AMOUNT">Số tiền (đ)</option>
          </select>
        </div>
        <div class="filter-info">
          Hiển thị: <strong>{{ filteredVouchers.length }}</strong> voucher
        </div>
      </div>

      <!-- Nút Sửa và Xóa sẽ được thêm vào góc thẻ -->

      <div class="voucher-grid" *ngIf="!showForm; else formTemplate">
        <div class="voucher-card" *ngFor="let v of filteredVouchers" [class.inactive]="!v.isActive">
          <div class="v-header">
            <span class="v-code">{{ v.code }}</span>
            <div class="v-actions-top">
              <button class="btn-icon" (click)="editVoucher(v)" title="Sửa"><i class="fas fa-edit"></i></button>
              <button class="btn-icon delete" (click)="deleteVoucher(v.id!)" title="Xóa"><i class="fas fa-trash"></i></button>
            </div>
          </div>
          <div class="v-body">
            <p><strong>Giảm:</strong> <span class="v-value-text">{{ v.type === 'PERCENTAGE' ? v.value + '%' : (v.value | number) + 'đ' }}</span></p>
            <p><strong>Loại:</strong> {{ v.type === 'PERCENTAGE' ? 'Giảm theo %' : 'Giảm theo số tiền' }}</p>
            <p><strong>Tối thiểu:</strong> {{ (v.minBookingAmount || 0) | number }}đ</p>
            <p *ngIf="v.type === 'PERCENTAGE'"><strong>Tối đa:</strong> {{ (v.maxDiscountAmount || 0) | number }}đ</p>
            <p><strong>Đã dùng:</strong> {{ v.usedCount }} / {{ v.usageLimit || '∞' }}</p>
            <p><strong>Hết hạn:</strong> {{ v.expiryDate ? (v.expiryDate | date:'dd/MM/yyyy') : 'Không' }}</p>
          </div>
          <div class="v-status">
            <div class="status-info">
              <span class="status-dot" [class.active]="v.isActive"></span>
              {{ v.isActive ? 'Đang hoạt động' : 'Tạm ngưng' }}
            </div>
            <button class="btn-toggle" (click)="toggleStatus(v.id!)" [class.active]="v.isActive">
              {{ v.isActive ? 'Tạm ngưng' : 'Kích hoạt' }}
            </button>
          </div>
        </div>
        <div *ngIf="vouchers.length === 0" class="empty-state">
          <span class="empty-icon">🎟️</span>
          <p>Bạn chưa tạo mã giảm giá nào.</p>
        </div>
      </div>

      <ng-template #formTemplate>
        <div class="voucher-form animate-fade-in">
          <form (submit)="submitForm()">
            <div class="form-row">
              <div class="form-group">
                <label>Mã Code (Ví dụ: GIAM50K)</label>
                <input type="text" [(ngModel)]="formData.code" name="code" required class="input-field" placeholder="Nhập mã...">
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
                <label>Giá trị giảm ({{ formData.type === VoucherType.PERCENTAGE ? '%' : 'đ' }})</label>
                <input type="number" [(ngModel)]="formData.value" name="value" required class="input-field">
              </div>
              <div class="form-group">
                <label>Số tiền tối thiểu của đơn hàng</label>
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
                {{ isLoading ? 'Đang lưu...' : (isEditing ? 'Cập nhật Voucher' : 'Tạo Voucher') }}
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
    
    .filter-bar { display: flex; align-items: center; gap: 24px; margin-bottom: 25px; background: #f8fafc; padding: 12px 20px; border-radius: 20px; border: 1px solid #e2e8f0; }
    .filter-group { display: flex; align-items: center; gap: 10px; }
    .filter-group label { font-size: 13px; font-weight: 700; color: #64748b; }
    .filter-select { padding: 8px 16px; border-radius: 12px; border: 1px solid #e2e8f0; background: white; color: #1e293b; font-size: 14px; font-weight: 600; cursor: pointer; outline: none; transition: all 0.2s; }
    .filter-select:focus { border-color: #4f46e5; }
    .filter-info { margin-left: auto; font-size: 13px; color: #64748b; }
    .filter-info strong { color: #4f46e5; }

    .voucher-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 24px; margin-top: 10px; }
    .voucher-card { background: white; border: 1px solid #e2e8f0; border-radius: 24px; padding: 24px; position: relative; transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275); box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); overflow: hidden; }
    .voucher-card::before { content: ''; position: absolute; top: 0; left: 0; width: 6px; height: 100%; background: #4f46e5; opacity: 0.8; }
    .voucher-card:hover { transform: translateY(-8px); box-shadow: 0 20px 25px -5px rgba(0,0,0,0.1); border-color: #4f46e5; }
    .voucher-card.inactive { border-color: #cbd5e1; background: #fcfcfc; }
    .voucher-card.inactive::before { background: #94a3b8; }
    
    .v-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
    .v-code { font-family: 'JetBrains Mono', 'Fira Code', monospace; font-size: 20px; font-weight: 900; color: #4f46e5; background: #f5f3ff; padding: 6px 16px; border-radius: 12px; letter-spacing: 1px; }
    .v-badge { font-weight: 800; padding: 6px 14px; border-radius: 10px; font-size: 12px; text-transform: uppercase; }
    .v-badge.percentage { background: #ecfdf5; color: #059669; }
    .v-badge.fixed_amount { background: #eff6ff; color: #2563eb; }
    
    .v-body { font-size: 14px; color: #475569; display: flex; flex-direction: column; gap: 10px; margin-bottom: 20px; padding: 15px; background: #f8fafc; border-radius: 16px; }
    .v-body p { margin: 0; display: flex; justify-content: space-between; }
    .v-body strong { color: #64748b; font-weight: 600; }
    
    .v-status { display: flex; justify-content: space-between; align-items: center; padding-top: 15px; border-top: 1px dashed #e2e8f0; }
    .status-info { display: flex; align-items: center; gap: 8px; font-size: 13px; font-weight: 700; color: #64748b; }
    .status-dot { width: 8px; height: 8px; border-radius: 50%; background: #cbd5e1; }
    .status-dot.active { background: #10b981; box-shadow: 0 0 8px rgba(16, 185, 129, 0.5); }
    .btn-toggle { padding: 6px 16px; border-radius: 12px; border: none; font-size: 11px; font-weight: 800; cursor: pointer; transition: all 0.3s; text-transform: uppercase; letter-spacing: 0.5px; }
    .btn-toggle.active { background: #fef2f2; color: #ef4444; border: 1px solid #fee2e2; }
    .btn-toggle:not(.active) { background: #dcfce7; color: #15803d; border: 1px solid #bbf7d0; box-shadow: 0 2px 4px rgba(21, 128, 61, 0.1); } /* Super clear Green */
    .btn-toggle:hover { transform: scale(1.05); filter: brightness(0.9); }

    .v-value-text { color: #4f46e5; font-weight: 800; font-size: 15px; }

    .v-actions-top { display: flex; gap: 8px; }
    .btn-icon { background: none; border: none; color: #94a3b8; cursor: pointer; font-size: 14px; transition: all 0.2s; padding: 4px; }
    .btn-icon:hover { color: #4f46e5; transform: scale(1.2); }
    .btn-icon.delete:hover { color: #ef4444; }

    .voucher-form { max-width: 700px; margin: 0 auto; background: white; padding: 40px; border-radius: 32px; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.1); border: 1px solid #f1f5f9; }
    .form-header { margin-bottom: 30px; }
    .form-header h4 { font-size: 20px; font-weight: 800; color: #0f172a; margin: 0; }
    
    .form-row { display: flex; gap: 24px; margin-bottom: 20px; }
    .form-group { flex: 1; }
    .form-group label { display: block; font-size: 13px; font-weight: 700; color: #475569; margin-bottom: 10px; text-transform: uppercase; letter-spacing: 0.5px; }
    .input-field { width: 100%; padding: 14px 18px; border: 2px solid #f1f5f9; border-radius: 16px; font-family: inherit; font-size: 15px; transition: all 0.3s; background: #f8fafc; }
    .input-field:focus { outline: none; border-color: #4f46e5; background: white; box-shadow: 0 0 0 4px rgba(79, 70, 229, 0.1); }
    
    .form-actions { display: flex; justify-content: flex-end; gap: 16px; margin-top: 40px; padding-top: 25px; border-top: 1px solid #f1f5f9; }
    
    .btn-primary { padding: 14px 28px; background: linear-gradient(135deg, #4f46e5 0%, #3b82f6 100%); color: white; border: none; border-radius: 16px; cursor: pointer; font-weight: 700; transition: all 0.3s; box-shadow: 0 10px 15px -3px rgba(79, 70, 229, 0.3); }
    .btn-primary:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 15px 20px -3px rgba(79, 70, 229, 0.4); filter: brightness(1.1); }
    .btn-primary:disabled { opacity: 0.6; cursor: not-allowed; }
    
    .btn-secondary { padding: 14px 28px; background: #f1f5f9; color: #475569; border: none; border-radius: 16px; cursor: pointer; font-weight: 700; transition: all 0.3s; }
    .btn-secondary:hover { background: #e2e8f0; color: #0f172a; }

    .empty-state { grid-column: 1 / -1; text-align: center; padding: 100px 20px; }
    .empty-icon { font-size: 64px; display: block; margin-bottom: 20px; opacity: 0.2; }
    .empty-state p { font-size: 16px; color: #94a3b8; font-weight: 500; }

    .animate-fade-in { animation: fadeIn 0.5s ease-out; }
    @keyframes fadeIn { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
  `]
})
export class HostVoucherTabComponent implements OnInit {
  vouchers: VoucherDto[] = [];
  filteredVouchers: VoucherDto[] = [];
  showForm = false;
  isLoading = false;
  isEditing = false;
  VoucherType = VoucherType;
  filterType = 'ALL';

  formData: Partial<VoucherDto> = {
    type: VoucherType.PERCENTAGE,
    isGlobal: false,
    isActive: true
  };

  constructor(
    private voucherService: VoucherService,
    private notification: NotificationService
  ) { }

  ngOnInit() {
    this.loadVouchers();
  }

  loadVouchers() {
    this.voucherService.getHostVouchers().subscribe((data: VoucherDto[]) => {
      this.vouchers = data;
      this.applyFilters();
    });
  }

  applyFilters() {
    this.filteredVouchers = this.vouchers.filter(v => {
      return this.filterType === 'ALL' || v.type === this.filterType;
    });
  }

  openAddForm() {
    this.isEditing = false;
    this.formData = {
      type: VoucherType.PERCENTAGE,
      isGlobal: false,
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
        this.notification.success(this.isEditing ? 'Đã cập nhật Voucher!' : 'Đã tạo Voucher mới!');
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
