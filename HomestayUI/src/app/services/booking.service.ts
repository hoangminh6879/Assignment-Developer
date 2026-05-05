import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { RoomDto } from './room.service';

export interface BookingRequestDto {
  homestayId: string;
  roomId: string;
  checkInDate: string;
  checkOutDate: string;
  paymentMethod: string;
  voucherCode?: string;
}

import { ReviewDto } from './review.service';

export interface BookingDto {
  id: string;
  checkInDate: string;
  checkOutDate: string;
  totalPrice: number;
  status: string;
  paymentStatus: string;
  paymentMethod: string;
  createdAt: string;
  checkInCode: string;
  discountAmount?: number;
  appliedVoucherCode?: string;
  homestayName: string;
  roomName: string;
  roomTypeName: string;
  userName?: string;
  userId?: string;
  hostId?: string;
  hostName?: string;
  review?: ReviewDto;
}

@Injectable({
  providedIn: 'root'
})
export class BookingService {
  private apiUrl = 'http://localhost:9999/api/bookings';

  constructor(private http: HttpClient) {}

  createBooking(request: BookingRequestDto): Observable<BookingDto> {
    return this.http.post<BookingDto>(this.apiUrl, request);
  }

  getMyBookings(): Observable<BookingDto[]> {
    return this.http.get<BookingDto[]>(`${this.apiUrl}/my`);
  }

  getAllBookings(): Observable<BookingDto[]> {
    return this.http.get<BookingDto[]>(`${this.apiUrl}/admin`);
  }

  getHostBookings(): Observable<BookingDto[]> {
    return this.http.get<BookingDto[]>(`${this.apiUrl}/host`);
  }

  approveBooking(id: string): Observable<BookingDto> {
    return this.http.put<BookingDto>(`${this.apiUrl}/${id}/approve`, {});
  }

  cancelBooking(id: string): Observable<BookingDto> {
    return this.http.put<BookingDto>(`${this.apiUrl}/${id}/cancel`, {});
  }

  getBookingByCheckInCode(code: string): Observable<BookingDto> {
    return this.http.get<BookingDto>(`${this.apiUrl}/check-in/${code}`);
  }

  getBookingsByCitizenId(citizenId: string): Observable<BookingDto[]> {
    return this.http.get<BookingDto[]>(`${this.apiUrl}/check-in/cccd/${citizenId}`);
  }

  confirmCheckIn(id: string): Observable<BookingDto> {
    return this.http.put<BookingDto>(`${this.apiUrl}/${id}/check-in`, {});
  }

  getCheckedInBookings(): Observable<BookingDto[]> {
    return this.http.get<BookingDto[]>(`${this.apiUrl}/host/checked-in`);
  }

  checkout(id: string, citizenId: string): Observable<BookingDto> {
    return this.http.put<BookingDto>(`${this.apiUrl}/${id}/checkout`, { citizenId });
  }

  getAvailableRooms(homestayId: string, roomTypeId: number, checkIn: string, checkOut: string): Observable<RoomDto[]> {
    const params = new HttpParams()
      .set('homestayId', homestayId)
      .set('roomTypeId', roomTypeId.toString())
      .set('checkIn', checkIn)
      .set('checkOut', checkOut);
    
    return this.http.get<RoomDto[]>(`${this.apiUrl}/available-rooms`, { params });
  }
}
