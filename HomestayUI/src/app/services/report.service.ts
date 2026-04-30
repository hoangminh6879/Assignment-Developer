import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class ReportService {
  private apiUrl = 'http://localhost:9999/api/reports';

  constructor(private http: HttpClient) {}

  exportBookingsPdf() {
    this.downloadFile(`${this.apiUrl}/bookings/pdf`, 'bookings.pdf');
  }

  exportBookingsExcel() {
    this.downloadFile(`${this.apiUrl}/bookings/excel`, 'bookings.xlsx');
  }

  exportBookingsJasper() {
    this.downloadFile(`${this.apiUrl}/bookings/jasper`, 'bookings_jasper.pdf');
  }

  exportStatsPdf() {
    this.downloadFile(`${this.apiUrl}/stats/pdf`, 'statistics.pdf');
  }

  exportStatsJasper() {
    this.downloadFile(`${this.apiUrl}/stats/jasper`, 'statistics_jasper.pdf');
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
