import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ReviewService, ReviewDto } from '../../services/review.service';
import { HomestayService, HomestayDto } from '../../services/homestay.service';
import { NotificationService } from '../../services/notification.service';

@Component({
  selector: 'app-host-review-tab',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="review-manager">
      <div class="review-stats">
        <div class="stat-mini">
          <span class="label">Tổng đánh giá</span>
          <span class="value">{{ reviews.length }}</span>
        </div>
        <div class="stat-mini">
          <span class="label">Chưa phản hồi</span>
          <span class="value">{{ getUnrespondedCount() }}</span>
        </div>
      </div>

      <!-- Filters Section -->
      <div class="filters-bar animate-fade-in">
        <div class="filter-group">
          <label>Homestay</label>
          <select [(ngModel)]="filterHomestayId" class="filter-input">
            <option value="">Tất cả homestay</option>
            <option *ngFor="let h of myHomestays" [value]="h.id">{{ h.name }}</option>
          </select>
        </div>
        <div class="filter-group">
          <label>Từ ngày</label>
          <input type="date" [(ngModel)]="filterStartDate" class="filter-input">
        </div>
        <div class="filter-group">
          <label>Đến ngày</label>
          <input type="date" [(ngModel)]="filterEndDate" class="filter-input">
        </div>
        <div class="filter-group">
          <label>&nbsp;</label>
          <button class="btn-reset" (click)="resetFilters()">🔄 Đặt lại</button>
        </div>
      </div>

      <div class="review-list" *ngIf="getFilteredReviews().length > 0; else emptyState">
        <div class="review-card animate-fade-in" *ngFor="let r of getFilteredReviews()">
          <!-- Card content remains the same but add homestay name badge -->
          <div class="review-header">
            <div class="user-info">
              <div class="avatar">{{ r.userFullName?.charAt(0) || 'U' }}</div>
              <div>
                <h4>{{ r.userFullName || 'Khách hàng' }}</h4>
                <p class="date">{{ r.createdAt | date:'dd/MM/yyyy HH:mm' }}</p>
              </div>
            </div>
            <div style="display: flex; gap: 10px; align-items: center;">
              <span class="homestay-badge">{{ getHomestayName(r.bookingId) }}</span>
              <div class="rating-badge">★ {{ r.rating }}</div>
            </div>
          </div>

          <div class="review-body">
            <p class="comment">{{ r.comment }}</p>
            <div class="review-photos" *ngIf="r.imageUrls?.length">
              <img *ngFor="let img of r.imageUrls" [src]="'http://localhost:9999' + img" alt="Review photo" />
            </div>
          </div>

          <div class="review-footer">
            <!-- Existing Response -->
            <div class="existing-response" *ngIf="r.response">
              <div class="response-header">
                <strong>🏠 Phản hồi của bạn</strong>
                <span class="date">{{ r.responseCreatedAt | date:'dd/MM/yyyy HH:mm' }}</span>
              </div>
              <p class="response-text">{{ r.response }}</p>
            </div>

            <!-- Response Form -->
            <div class="response-form" *ngIf="!r.response">
              <textarea [(ngModel)]="responseTexts[r.id]" placeholder="Viết phản hồi cho khách hàng..." class="response-input"></textarea>
              <div class="form-actions">
                <button class="btn-submit" [disabled]="!responseTexts[r.id]" (click)="submitResponse(r.id)">
                  Gửi phản hồi
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <ng-template #emptyState>
        <div class="empty-state">
          <span class="icon">💬</span>
          <p>Chưa có đánh giá nào cho các homestay của bạn.</p>
        </div>
      </ng-template>
    </div>
  `,
  styles: [`
    .review-manager { display: flex; flex-direction: column; gap: 20px; }
    .review-stats { display: flex; gap: 20px; margin-bottom: 10px; }
    .stat-mini { background: #f8fafc; padding: 15px 20px; border-radius: 12px; border: 1px solid #e2e8f0; display: flex; flex-direction: column; gap: 5px; min-width: 150px; }
    .stat-mini .label { font-size: 12px; color: #64748b; font-weight: 600; text-transform: uppercase; }
    .stat-mini .value { font-size: 24px; font-weight: 700; color: #0f172a; }

    .filters-bar { display: flex; gap: 20px; background: white; padding: 20px; border-radius: 16px; border: 1px solid #e2e8f0; margin-bottom: 25px; flex-wrap: wrap; align-items: flex-end; }
    .filter-group { display: flex; flex-direction: column; gap: 6px; }
    .filter-group label { font-size: 13px; font-weight: 600; color: #475569; }
    .filter-input { padding: 10px 14px; border: 1px solid #cbd5e1; border-radius: 10px; font-family: inherit; font-size: 14px; min-width: 180px; }
    .btn-reset { background: #f1f5f9; border: none; padding: 10px 16px; border-radius: 10px; cursor: pointer; font-weight: 600; color: #475569; transition: all 0.2s; }
    .btn-reset:hover { background: #e2e8f0; }

    .homestay-badge { background: #e0e7ff; color: #4338ca; padding: 4px 10px; border-radius: 8px; font-size: 12px; font-weight: 600; }

    .review-list { display: flex; flex-direction: column; gap: 20px; }
    .review-card { background: white; border: 1px solid #e2e8f0; border-radius: 16px; padding: 20px; transition: transform 0.2s; }
    .review-card:hover { transform: translateY(-2px); box-shadow: 0 4px 12px rgba(0,0,0,0.05); }

    .review-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px; }
    .user-info { display: flex; align-items: center; gap: 12px; }
    .avatar { width: 40px; height: 40px; background: #6366f1; color: white; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 700; }
    .user-info h4 { margin: 0; font-size: 16px; color: #1e293b; }
    .user-info .date { margin: 0; font-size: 12px; color: #94a3b8; }
    .rating-badge { background: #fef3c7; color: #d97706; padding: 4px 12px; border-radius: 8px; font-weight: 700; }

    .review-body { margin-bottom: 20px; }
    .comment { color: #475569; line-height: 1.6; font-size: 15px; margin-bottom: 15px; }
    .review-photos { display: flex; gap: 10px; flex-wrap: wrap; }
    .review-photos img { width: 100px; height: 100px; object-fit: cover; border-radius: 8px; border: 1px solid #f1f5f9; }

    .review-footer { border-top: 1px solid #f1f5f9; padding-top: 20px; }
    .existing-response { background: #f8fafc; border-left: 4px solid #10b981; padding: 15px; border-radius: 4px 12px 12px 4px; }
    .response-header { display: flex; justify-content: space-between; margin-bottom: 8px; }
    .response-header strong { font-size: 13px; color: #059669; }
    .response-header .date { font-size: 11px; color: #94a3b8; }
    .response-text { font-size: 14px; color: #334155; font-style: italic; margin: 0; }

    .response-form { display: flex; flex-direction: column; gap: 12px; }
    .response-input { width: 100%; border: 1px solid #e2e8f0; border-radius: 12px; padding: 12px; font-family: inherit; font-size: 14px; min-height: 80px; resize: vertical; }
    .response-input:focus { outline: none; border-color: #10b981; }
    .form-actions { display: flex; justify-content: flex-end; }
    .btn-submit { background: #10b981; color: white; border: none; padding: 8px 20px; border-radius: 8px; font-weight: 600; cursor: pointer; transition: all 0.2s; }
    .btn-submit:hover:not(:disabled) { background: #059669; }
    .btn-submit:disabled { opacity: 0.5; cursor: not-allowed; }

    .empty-state { text-align: center; padding: 60px; background: #f8fafc; border-radius: 16px; color: #94a3b8; }
    .empty-state .icon { font-size: 48px; display: block; margin-bottom: 10px; }

    .animate-fade-in { animation: fadeIn 0.4s ease-out; }
    @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
  `]
})
export class HostReviewTabComponent implements OnInit {
  reviews: ReviewDto[] = [];
  myHomestays: HomestayDto[] = [];
  responseTexts: { [key: string]: string } = {};

  // Filter state
  filterHomestayId: string = '';
  filterStartDate: string = '';
  filterEndDate: string = '';

  constructor(
    private reviewService: ReviewService,
    private homestayService: HomestayService,
    private notification: NotificationService
  ) {}

  ngOnInit() {
    this.loadReviews();
    this.loadMyHomestays();
  }

  loadReviews() {
    this.reviewService.getHostReviews().subscribe({
      next: (res) => {
        this.reviews = res.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      },
      error: (err) => console.error('Failed to load reviews', err)
    });
  }

  loadMyHomestays() {
    this.homestayService.getHostHomestays().subscribe({
      next: (res) => this.myHomestays = res,
      error: (err) => console.error('Failed to load homestays', err)
    });
  }

  getFilteredReviews(): ReviewDto[] {
    return this.reviews.filter(r => {
      if (this.filterHomestayId && r.homestayId !== this.filterHomestayId) return false;

      const reviewDate = new Date(r.createdAt);
      if (this.filterStartDate && reviewDate < new Date(this.filterStartDate)) return false;
      if (this.filterEndDate) {
        const endDate = new Date(this.filterEndDate);
        endDate.setHours(23, 59, 59, 999);
        if (reviewDate > endDate) return false;
      }

      return true;
    });
  }

  resetFilters() {
    this.filterHomestayId = '';
    this.filterStartDate = '';
    this.filterEndDate = '';
  }

  getHomestayName(bookingId: string): string {
    const review = this.reviews.find(r => r.bookingId === bookingId);
    return review ? review.homestayName : 'Homestay';
  }

  getUnrespondedCount(): number {
    return this.reviews.filter(r => !r.response).length;
  }

  submitResponse(reviewId: string) {
    const text = this.responseTexts[reviewId];
    if (!text) return;

    this.reviewService.respondToReview(reviewId, text).subscribe({
      next: () => {
        this.notification.success('Đã gửi phản hồi thành công!');
        this.responseTexts[reviewId] = '';
        this.loadReviews();
      },
      error: (err) => this.notification.error(err.error?.message || 'Có lỗi xảy ra')
    });
  }
}
