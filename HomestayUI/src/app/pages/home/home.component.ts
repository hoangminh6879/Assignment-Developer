import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NavbarComponent } from '../../components/navbar/navbar.component';
import { RouterModule } from '@angular/router';
import { HomestayService, HomestayDto } from '../../services/homestay.service';
import { NotificationService } from '../../services/notification.service';
import { AuthService } from '../../services/auth.service';
import { ReviewService, ReviewDto } from '../../services/review.service';
import { FormsModule } from '@angular/forms';
import { RoomTypeService, RoomTypeDto } from '../../services/room-type.service';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, NavbarComponent, RouterModule, FormsModule],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css'
})
export class HomeComponent implements OnInit {
  allHomestays: HomestayDto[] = [];
  featuredHomestays: HomestayDto[] = [];
  roomTypes: RoomTypeDto[] = [];
  selectedHomestay: HomestayDto | null = null;
  reviews: ReviewDto[] = [];
  slideIndex = 0;

  // Filter properties
  searchQuery: string = '';
  searchCity: string = '';
  minPrice: number | null = null;
  maxPrice: number | null = null;
  minStars: number = 0;
  selectedRoomType: string = '';
  cities: string[] = [];
  showFilters: boolean = false;

  constructor(
    private homestayService: HomestayService,
    private roomTypeService: RoomTypeService,
    private reviewService: ReviewService,
    private notification: NotificationService,
    public authService: AuthService
  ) {}

  ngOnInit() {
    // Fetch homestays
    this.homestayService.getActiveHomestays().subscribe({
      next: (data) => { 
        this.allHomestays = data;
        this.featuredHomestays = [...data];
        this.extractCities(data);
      },
      error: (err) => {
        this.notification.error('Không thể tải danh sách homestay.');
        console.error(err);
      }
    });

    // Fetch room types
    this.roomTypeService.getAllRoomTypes().subscribe({
      next: (data) => { this.roomTypes = data; },
      error: (err) => console.error('Error fetching room types:', err)
    });
  }

  extractCities(homestays: HomestayDto[]) {
    const uniqueCities = new Set(homestays.map(h => h.city));
    this.cities = Array.from(uniqueCities).sort();
  }

  applyFilters() {
    this.featuredHomestays = this.allHomestays.filter(h => {
      // Search text (Name or Address)
      const matchesSearch = !this.searchQuery || 
        h.name.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
        h.address.toLowerCase().includes(this.searchQuery.toLowerCase());

      // City
      const matchesCity = !this.searchCity || h.city === this.searchCity;

      // Price
      const price = h.pricePerNight;
      const matchesMinPrice = this.minPrice === null || price >= this.minPrice;
      const matchesMaxPrice = this.maxPrice === null || price <= this.maxPrice;

      // Stars
      const matchesStars = (h.averageRating || 0) >= this.minStars;

      // Room Type
      const matchesRoomType = !this.selectedRoomType || 
        (h.roomTypeNames && h.roomTypeNames.includes(this.selectedRoomType));

      return matchesSearch && matchesCity && matchesMinPrice && matchesMaxPrice && matchesStars && matchesRoomType;
    });
  }

  toggleFilters() {
    this.showFilters = !this.showFilters;
  }

  resetFilters() {
    this.searchQuery = '';
    this.searchCity = '';
    this.minPrice = null;
    this.maxPrice = null;
    this.minStars = 0;
    this.selectedRoomType = '';
    this.featuredHomestays = [...this.allHomestays];
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
