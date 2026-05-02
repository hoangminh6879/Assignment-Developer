import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface ReviewDto {
  id: string;
  rating: number;
  comment: string;
  createdAt: string;
  response?: string;
  responseCreatedAt?: string;
  userFullName: string;
  userUsername: string;
  imageUrls: string[];
  bookingId: string;
  homestayId: string;
  homestayName: string;
}

@Injectable({
  providedIn: 'root'
})
export class ReviewService {
  private apiUrl = 'http://localhost:9999/api';

  constructor(private http: HttpClient) {}

  createReview(formData: FormData): Observable<ReviewDto> {
    return this.http.post<ReviewDto>(`${this.apiUrl}/reviews`, formData);
  }

  respondToReview(reviewId: string, response: string): Observable<ReviewDto> {
    return this.http.post<ReviewDto>(`${this.apiUrl}/reviews/${reviewId}/response`, { response });
  }

  getReviewsByHomestay(homestayId: string): Observable<ReviewDto[]> {
    return this.http.get<ReviewDto[]>(`${this.apiUrl}/homestays/${homestayId}/reviews`);
  }

  getHostReviews(): Observable<ReviewDto[]> {
    return this.http.get<ReviewDto[]>(`${this.apiUrl}/reviews/host`);
  }
}
