import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NavbarComponent } from '../../components/navbar/navbar.component';
import { RouterModule } from '@angular/router';
import { HomestayService, HomestayDto } from '../../services/homestay.service';
import { NotificationService } from '../../services/notification.service';
import { AuthService } from '../../services/auth.service';
import { ReviewService, ReviewDto } from '../../services/review.service';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, NavbarComponent, RouterModule],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css'
})
export class HomeComponent implements OnInit {
  featuredHomestays: HomestayDto[] = [];
  selectedHomestay: HomestayDto | null = null;
  reviews: ReviewDto[] = [];
  slideIndex = 0;

  constructor(
    private homestayService: HomestayService,
    private reviewService: ReviewService,
    private notification: NotificationService,
    public authService: AuthService
  ) {}

  ngOnInit() {
    this.homestayService.getActiveHomestays().subscribe({
      next: (data) => { this.featuredHomestays = data; },
      error: (err) => {
        this.notification.error('Không thể tải danh sách homestay.');
        console.error(err);
      }
    });
  }

  viewDetail(homestay: HomestayDto) {
    this.selectedHomestay = homestay;
    this.slideIndex = 0;
    this.reviews = [];
    document.body.style.overflow = 'hidden';
    this.incrementView(homestay.id);
    this.loadReviews(homestay.id);
  }

  loadReviews(homestayId: string) {
    this.reviewService.getReviewsByHomestay(homestayId).subscribe({
      next: (data) => { this.reviews = data; },
      error: (err) => console.error('Error loading reviews:', err)
    });
  }

  incrementView(id: string) {
    console.log('Sending view increment request for:', id);
    this.homestayService.incrementViewCount(id).subscribe({
      next: () => console.log('View incremented successfully'),
      error: (err) => console.error('Error incrementing view count:', err)
    });
  }

  closeDetail() {
    this.selectedHomestay = null;
    this.reviews = [];
    document.body.style.overflow = '';
  }

  prevSlide() {
    if (!this.selectedHomestay?.images?.length) return;
    this.slideIndex = (this.slideIndex - 1 + this.selectedHomestay.images.length) % this.selectedHomestay.images.length;
  }

  nextSlide() {
    if (!this.selectedHomestay?.images?.length) return;
    this.slideIndex = (this.slideIndex + 1) % this.selectedHomestay.images.length;
  }

  goToSlide(index: number) {
    this.slideIndex = index;
  }
}
