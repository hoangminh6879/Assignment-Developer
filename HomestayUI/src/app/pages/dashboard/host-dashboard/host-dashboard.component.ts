import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NavbarComponent } from '../../../components/navbar/navbar.component';
import { HomestayService, HomestayDto } from '../../../services/homestay.service';
import { AmenityService, AmenityDto } from '../../../services/amenity.service';

@Component({
  selector: 'app-host-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, NavbarComponent],
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
            <li class="active">
              <span class="menu-icon">🏠</span> Quản lý Homestay
            </li>
          </ul>
        </aside>

        <!-- MAIN CONTENT -->
        <main class="main-content">
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
                  <th>Giá / Đêm</th>
                  <th>Trạng thái</th>
                  <th class="actions-col">Hành động</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let h of homestays" class="table-row">
                  <td class="homestay-cell">
                    <img *ngIf="h.images && h.images.length > 0" [src]="'http://localhost:9999' + h.images[0].url" class="h-thumb" />
                    <div class="h-thumb-placeholder" *ngIf="!h.images || h.images.length === 0">🏠</div>
                    <div>
                      <div class="h-name">{{ h.name }}</div>
                      <div class="h-city">{{ h.city }}</div>
                    </div>
                  </td>
                  <td>{{ h.pricePerNight | number }}đ</td>
                  <td>
                    <span class="badge" [ngClass]="h.status.toLowerCase()">{{ h.status }}</span>
                    <div *ngIf="h.adminReason" class="admin-reason-text">Lý do: {{ h.adminReason }}</div>
                  </td>
                  <td class="actions-cell">
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
              <label>Hình ảnh (Có thể chọn nhiều ảnh)</label>
              <input type="file" multiple (change)="onFilesSelected($event)" accept="image/*" class="input-file" />
              <div class="file-info" *ngIf="previewUrls.length > 0">
                <p style="margin-bottom: 10px;">Đã chọn {{ previewUrls.length }} ảnh:</p>
                <div class="image-preview-grid">
                  <div class="preview-wrapper" *ngFor="let url of previewUrls; let i = index">
                    <img [src]="url" class="preview-img" />
                    <button type="button" class="preview-remove-btn" (click)="removeImage(i)" title="Xóa ảnh này">✕</button>
                  </div>
                </div>
              </div>
              <div class="file-info" *ngIf="isEditMode">
                <small>* Nếu bạn chọn ảnh mới, các ảnh cũ sẽ bị xóa và thay thế.</small>
              </div>
            </div>

            <div class="form-actions">
              <button type="submit" class="btn-primary" [disabled]="isLoading">
                {{ isLoading ? 'Đang lưu...' : 'Lưu Homestay' }}
              </button>
            </div>
          </form>
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
    
    .table-container { overflow-x: auto; border-radius: 12px; border: 1px solid #f1f5f9; }
    .modern-table { width: 100%; border-collapse: collapse; text-align: left; }
    .modern-table th { background: #f8fafc; padding: 15px 20px; color: #64748b; font-size: 13px; text-transform: uppercase; font-weight: 600; border-bottom: 1px solid #e2e8f0; }
    .modern-table td { padding: 16px 20px; border-bottom: 1px solid #f1f5f9; color: #334155; vertical-align: middle; }
    
    .homestay-cell { display: flex; align-items: center; gap: 12px; }
    .h-thumb { width: 50px; height: 50px; border-radius: 8px; object-fit: cover; }
    .h-thumb-placeholder { width: 50px; height: 50px; border-radius: 8px; background: #e2e8f0; display: flex; align-items: center; justify-content: center; font-size: 20px; }
    .h-name { font-weight: 600; color: #0f172a; }
    .h-city { font-size: 12px; color: #64748b; }
    
    .badge { padding: 4px 12px; border-radius: 999px; font-size: 12px; font-weight: 700; text-transform: uppercase; }
    .pending { background: #fffbeb; color: #92400e; }
    .active { background: #dcfce7; color: #166534; }
    .inactive { background: #f1f5f9; color: #475569; }
    .rejected { background: #fee2e2; color: #991b1b; }
    .admin-reason-text { font-size: 11px; color: #ef4444; margin-top: 4px; max-width: 200px; }
    
    .actions-col { text-align: right; }
    .actions-cell { text-align: right; display: flex; gap: 8px; justify-content: flex-end; }
    .btn-icon { display: inline-flex; align-items: center; gap: 6px; padding: 6px 12px; border: none; border-radius: 6px; font-size: 13px; font-weight: 600; cursor: pointer; transition: all 0.2s; }
    .btn-edit { background: #e0e7ff; color: #4338ca; }
    .btn-edit:hover { background: #c7d2fe; }
    .btn-delete { background: #fee2e2; color: #991b1b; }
    .btn-delete:hover { background: #fecaca; }

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
  `]
})
export class HostDashboardComponent implements OnInit {
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
  currentEditId: string | null = null;

  constructor(
    private homestayService: HomestayService,
    private amenityService: AmenityService
  ) {}

  ngOnInit() {
    this.loadHomestays();
    this.loadAmenities();
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
    this.formData = { pricePerNight: 0, maxGuests: 1 };
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

  submitForm(event: Event) {
    event.preventDefault();
    this.isLoading = true;

    const fd = new FormData();
    fd.append('name', this.formData.name);
    fd.append('description', this.formData.description || '');
    fd.append('address', this.formData.address);
    fd.append('city', this.formData.city);
    fd.append('pricePerNight', this.formData.pricePerNight);
    fd.append('maxGuests', this.formData.maxGuests);
    
    this.selectedAmenityIds.forEach(id => {
      fd.append('amenityIds', id.toString());
    });
    
    this.selectedFiles.forEach(file => {
      fd.append('images', file);
    });

    if (this.isEditMode && this.currentEditId) {
      this.homestayService.updateHomestay(this.currentEditId, fd).subscribe({
        next: () => {
          alert('Cập nhật thành công! Trạng thái chuyển về Chờ duyệt.');
          this.closeForm();
          this.loadHomestays();
          this.isLoading = false;
        },
        error: (err) => {
          alert('Lỗi: ' + (err.error?.message || err.message));
          this.isLoading = false;
        }
      });
    } else {
      this.homestayService.createHomestay(fd).subscribe({
        next: () => {
          alert('Thêm mới thành công! Đang chờ duyệt.');
          this.closeForm();
          this.loadHomestays();
          this.isLoading = false;
        },
        error: (err) => {
          alert('Lỗi: ' + (err.error?.message || err.message));
          this.isLoading = false;
        }
      });
    }
  }

  deleteHomestay(id: string) {
    if (confirm('Bạn có chắc muốn xóa Homestay này không? Hành động này không thể hoàn tác.')) {
      this.homestayService.deleteHomestay(id).subscribe({
        next: () => {
          alert('Đã xóa thành công!');
          this.loadHomestays();
        },
        error: (err) => alert('Lỗi: ' + (err.error?.message || err.message))
      });
    }
  }
}
