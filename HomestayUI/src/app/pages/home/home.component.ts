import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NavbarComponent } from '../../components/navbar/navbar.component';
import { RouterModule } from '@angular/router';
import { HomestayService, HomestayDto } from '../../services/homestay.service';
import { NotificationService } from '../../services/notification.service';
import { AuthService } from '../../services/auth.service';

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
  slideIndex = 0;

  constructor(
    private homestayService: HomestayService,
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
    document.body.style.overflow = 'hidden';
  }

  closeDetail() {
    this.selectedHomestay = null;
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
