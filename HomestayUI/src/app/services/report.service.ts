import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class ReportService {
  private apiUrl = 'http://localhost:9999/api/reports';

  constructor(private http: HttpClient) {}

  exportBookingsPdf(startDate?: string, endDate?: string) {
    let url = `${this.apiUrl}/bookings/pdf`;
    if (startDate && endDate) url += `?startDate=${startDate}&endDate=${endDate}`;
    this.downloadFile(url, 'bookings.pdf');
  }

  exportBookingsExcel(startDate?: string, endDate?: string) {
    let url = `${this.apiUrl}/bookings/excel`;
    if (startDate && endDate) url += `?startDate=${startDate}&endDate=${endDate}`;
    this.downloadFile(url, 'bookings.xlsx');
  }

  exportBookingsJasper(format: string = 'pdf', startDate?: string, endDate?: string) {
    const ext = format === 'xlsx' ? 'xlsx' : 'pdf';
    let url = `${this.apiUrl}/bookings/jasper?format=${format}`;
    if (startDate && endDate) url += `&startDate=${startDate}&endDate=${endDate}`;
    this.downloadFile(url, `bookings_jasper.${ext}`);
  }

  exportStatsPdf() {
    this.downloadFile(`${this.apiUrl}/stats/pdf`, 'statistics.pdf');
  }

  exportStatsJasper(format: string = 'pdf') {
    const ext = format === 'xlsx' ? 'xlsx' : 'pdf';
    this.downloadFile(`${this.apiUrl}/stats/jasper?format=${format}`, `statistics_jasper.${ext}`);
  }

  exportAdminStatsJasper(format: string = 'pdf') {
    const ext = format === 'xlsx' ? 'xlsx' : 'pdf';
    this.downloadFile(`${this.apiUrl}/admin/stats/jasper?format=${format}`, `admin_statistics_jasper.${ext}`);
  }

  exportAdminStatsPdf() {
    this.downloadFile(`${this.apiUrl}/admin/stats/pdf`, 'admin_statistics.pdf');
  }

  private downloadFile(url: string, fileName: string) {
    this.http.get(url, { responseType: 'blob' }).subscribe(blob => {
      const a = document.createElement('a');
      const objectUrl = URL.createObjectURL(blob);
      a.href = objectUrl;
      a.download = fileName;
      a.click();
      URL.revokeObjectURL(objectUrl);
    });
  }
}
