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
    public ResponseEntity<InputStreamResource> exportBookingsPdf(Authentication auth) {
        List<Booking> bookings = getBookingsForUser(auth);
        ByteArrayInputStream bis = reportService.exportBookingsToPdf(bookings);

        HttpHeaders headers = new HttpHeaders();
        headers.add("Content-Disposition", "attachment; filename=bookings.pdf");

        return ResponseEntity.ok()
                .headers(headers)
                .contentType(MediaType.APPLICATION_PDF)
                .body(new InputStreamResource(bis));
    }

    @GetMapping("/bookings/excel")
    public ResponseEntity<InputStreamResource> exportBookingsExcel(Authentication auth) throws IOException {
        List<Booking> bookings = getBookingsForUser(auth);
        ByteArrayInputStream bis = reportService.exportBookingsToExcel(bookings);

        HttpHeaders headers = new HttpHeaders();
        headers.add("Content-Disposition", "attachment; filename=bookings.xlsx");

        return ResponseEntity.ok()
                .headers(headers)
                .contentType(MediaType.parseMediaType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"))
                .body(new InputStreamResource(bis));
    }

    @GetMapping("/bookings/jasper")
    public ResponseEntity<byte[]> exportBookingsJasper(Authentication auth) throws Exception {
        List<Booking> bookings = getBookingsForUser(auth);
        byte[] report = reportService.exportBookingsJasper(bookings, "pdf");

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_PDF);
        headers.setContentDispositionFormData("attachment", "bookings_jasper.pdf");

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

    @GetMapping("/stats/jasper")
    public ResponseEntity<byte[]> exportStatsJasper(Authentication auth) throws Exception {
        var stats = statisticsService.getHostStatistics(auth.getName());
        byte[] report = reportService.exportStatsJasper(stats);

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_PDF);
        headers.setContentDispositionFormData("attachment", "statistics_jasper.pdf");

        return ResponseEntity.ok()
                .headers(headers)
                .body(report);
    }

    private List<Booking> getBookingsForUser(Authentication auth) {
        String role = auth.getAuthorities().iterator().next().getAuthority();
        if ("ROLE_ADMIN".equals(role)) {
            return bookingRepository.findAll();
        } else {
            return bookingRepository.findByHomestayHostUsername(auth.getName());
        }
    }
}
