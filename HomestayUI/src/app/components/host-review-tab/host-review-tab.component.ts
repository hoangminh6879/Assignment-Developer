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
  templateUrl: './host-review-tab.component.html',
  styleUrls: ['./host-review-tab.component.css']
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
