import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { VoucherService, VoucherDto, VoucherType } from '../../services/voucher.service';
import { NotificationService } from '../../services/notification.service';

@Component({
  selector: 'app-admin-voucher-tab',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-voucher-tab.component.html',
  styleUrl: './admin-voucher-tab.component.css'
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
