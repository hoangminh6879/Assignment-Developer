package com.example.HomestayDev.controller;

import com.example.HomestayDev.model.Booking;
import com.example.HomestayDev.repository.BookingRepository;
import com.example.HomestayDev.service.ReportService;
import com.example.HomestayDev.service.StatisticsService;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.InputStreamResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.util.List;

@RestController
@RequestMapping("/api/reports")
@RequiredArgsConstructor
public class ReportController {

    private final ReportService reportService;
    private final BookingRepository bookingRepository;
    private final StatisticsService statisticsService;

    @GetMapping("/bookings/pdf")
    public ResponseEntity<InputStreamResource> exportBookingsPdf(
            Authentication auth,
            @RequestParam(required = false) String startDate,
            @RequestParam(required = false) String endDate) {
        List<Booking> bookings = getBookingsWithFilters(auth, startDate, endDate);
        ByteArrayInputStream bis = reportService.exportBookingsToPdf(bookings);

        HttpHeaders headers = new HttpHeaders();
        headers.add("Content-Disposition", "attachment; filename=bookings.pdf");

        return ResponseEntity.ok()
                .headers(headers)
                .contentType(MediaType.APPLICATION_PDF)
                .body(new InputStreamResource(bis));
    }

    @GetMapping("/bookings/excel")
    public ResponseEntity<InputStreamResource> exportBookingsExcel(
            Authentication auth,
            @RequestParam(required = false) String startDate,
            @RequestParam(required = false) String endDate) throws IOException {
        List<Booking> bookings = getBookingsWithFilters(auth, startDate, endDate);
        ByteArrayInputStream bis = reportService.exportBookingsToExcel(bookings);

        HttpHeaders headers = new HttpHeaders();
        headers.add("Content-Disposition", "attachment; filename=bookings.xlsx");

        return ResponseEntity.ok()
                .headers(headers)
                .contentType(MediaType.parseMediaType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"))
                .body(new InputStreamResource(bis));
    }

    @GetMapping("/bookings/jasper")
    public ResponseEntity<byte[]> exportBookingsJasper(
            Authentication auth,
            @RequestParam(defaultValue = "pdf") String format,
            @RequestParam(required = false) String startDate,
            @RequestParam(required = false) String endDate) throws Exception {
        List<Booking> bookings = getBookingsWithFilters(auth, startDate, endDate);
        byte[] report = reportService.exportBookingsJasper(bookings, format);

        HttpHeaders headers = new HttpHeaders();
        if ("xlsx".equalsIgnoreCase(format)) {
            headers.setContentType(MediaType.parseMediaType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"));
            headers.setContentDispositionFormData("attachment", "bookings_jasper.xlsx");
        } else {
            headers.setContentType(MediaType.APPLICATION_PDF);
            headers.setContentDispositionFormData("attachment", "bookings_jasper.pdf");
        }

        return ResponseEntity.ok()
                .headers(headers)
                .body(report);
    }

    @GetMapping("/stats/pdf")
    public ResponseEntity<InputStreamResource> exportStatsPdf(Authentication auth) {
        var stats = statisticsService.getHostStatistics(auth.getName());
        ByteArrayInputStream bis = reportService.exportStatsToPdf(stats);

        HttpHeaders headers = new HttpHeaders();
        headers.add("Content-Disposition", "attachment; filename=statistics.pdf");

        return ResponseEntity.ok()
                .headers(headers)
                .contentType(MediaType.APPLICATION_PDF)
                .body(new InputStreamResource(bis));
    }

    @GetMapping("/admin/stats/pdf")
    public ResponseEntity<InputStreamResource> exportAdminStatsPdf() {
        var stats = statisticsService.getAdminStatistics();
        ByteArrayInputStream bis = reportService.exportAdminStatsToPdf(stats);

        HttpHeaders headers = new HttpHeaders();
        headers.add("Content-Disposition", "attachment; filename=admin_statistics.pdf");

        return ResponseEntity.ok()
                .headers(headers)
                .contentType(MediaType.APPLICATION_PDF)
                .body(new InputStreamResource(bis));
    }

    @GetMapping("/admin/stats/jasper")
    public ResponseEntity<byte[]> exportAdminStatsJasper(@RequestParam(defaultValue = "pdf") String format) throws Exception {
        var stats = statisticsService.getAdminStatistics();
        byte[] report = reportService.exportAdminStatsJasper(stats, format);

        HttpHeaders headers = new HttpHeaders();
        if ("xlsx".equalsIgnoreCase(format)) {
            headers.setContentType(MediaType.parseMediaType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"));
            headers.setContentDispositionFormData("attachment", "admin_statistics_jasper.xlsx");
        } else {
            headers.setContentType(MediaType.APPLICATION_PDF);
            headers.setContentDispositionFormData("attachment", "admin_statistics_jasper.pdf");
        }

        return ResponseEntity.ok()
                .headers(headers)
                .body(report);
    }

    @GetMapping("/stats/jasper")
    public ResponseEntity<byte[]> exportStatsJasper(Authentication auth, @RequestParam(defaultValue = "pdf") String format) throws Exception {
        var stats = statisticsService.getHostStatistics(auth.getName());
        byte[] report = reportService.exportStatsJasper(stats, format);

        HttpHeaders headers = new HttpHeaders();
        if ("xlsx".equalsIgnoreCase(format)) {
            headers.setContentType(MediaType.parseMediaType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"));
            headers.setContentDispositionFormData("attachment", "statistics_jasper.xlsx");
        } else {
            headers.setContentType(MediaType.APPLICATION_PDF);
            headers.setContentDispositionFormData("attachment", "statistics_jasper.pdf");
        }

        return ResponseEntity.ok()
                .headers(headers)
                .body(report);
    }

    private List<Booking> getBookingsWithFilters(Authentication auth, String startDateStr, String endDateStr) {
        boolean isAdmin = auth.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));
        List<Booking> result;
        if (startDateStr != null && !"".equals(startDateStr) && endDateStr != null && !"".equals(endDateStr)) {
            java.time.LocalDateTime start = java.time.LocalDate.parse(startDateStr).atStartOfDay();
            java.time.LocalDateTime end = java.time.LocalDate.parse(endDateStr).atTime(23, 59, 59);
            System.out.println("Filtering bookings from " + start + " to " + end);
            
            if (isAdmin) {
                result = bookingRepository.findAllByDateRange(start, end);
            } else {
                result = bookingRepository.findByHostAndDateRange(auth.getName(), start, end);
            }
        } else {
            result = getBookingsForUser(auth);
        }
        System.out.println("Bookings found for report: " + (result != null ? result.size() : 0));
        return result;
    }

    private List<Booking> getBookingsForUser(Authentication auth) {
        boolean isAdmin = auth.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));
        if (isAdmin) {
            return bookingRepository.findAll();
        } else {
            return bookingRepository.findByHomestayHostUsername(auth.getName());
        }
    }
}
