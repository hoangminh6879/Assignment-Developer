package com.example.HomestayDev.service;

import com.example.HomestayDev.dto.StatisticsDto;
import com.example.HomestayDev.model.Booking;
import com.example.HomestayDev.repository.BookingRepository;
import com.lowagie.text.*;
import com.lowagie.text.Font;
import com.lowagie.text.pdf.PdfPCell;
import com.lowagie.text.pdf.PdfPTable;
import com.lowagie.text.pdf.PdfWriter;
import lombok.RequiredArgsConstructor;
import net.sf.jasperreports.engine.*;
import net.sf.jasperreports.engine.data.JRBeanCollectionDataSource;
import org.apache.poi.ss.usermodel.Cell;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.ss.usermodel.Workbook;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.stereotype.Service;

import java.awt.Color;
import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class ReportService {

    private final BookingRepository bookingRepository;

    // --- PDF EXPORT (Method 1: OpenPDF) ---
    public ByteArrayInputStream exportBookingsToPdf(List<Booking> bookings) {
        Document document = new Document(PageSize.A4.rotate());
        ByteArrayOutputStream out = new ByteArrayOutputStream();

        try {
            PdfWriter.getInstance(document, out);
            document.open();

            // Note: For full Vietnamese support in PDF, we usually need a .ttf file. 
            // Since I can't guarantee the path to a .ttf here, I will use non-accented text 
            // but make the design much more premium.
            
            // Header Section
            Font titleFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 24, new Color(79, 70, 229));
            Paragraph title = new Paragraph("BAO CAO DANH SACH DAT PHONG", titleFont);
            title.setAlignment(Paragraph.ALIGN_CENTER);
            document.add(title);

            Font subTitleFont = FontFactory.getFont(FontFactory.HELVETICA, 12, Color.GRAY);
            Paragraph subTitle = new Paragraph("He thong HomestayDev - Ngay xuat: " + java.time.LocalDate.now(), subTitleFont);
            subTitle.setAlignment(Paragraph.ALIGN_CENTER);
            document.add(subTitle);
            document.add(new Paragraph(" "));

            // Table styling
            PdfPTable table = new PdfPTable(7);
            table.setWidthPercentage(100);
            table.setSpacingBefore(20);
            table.setWidths(new float[] {1.2f, 2.5f, 2.5f, 1.8f, 1.8f, 1.8f, 1.8f});

            // Table Header
            Font headFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 11, Color.WHITE);
            String[] headers = {"MA DON", "HOMESTAY", "KHACH HANG", "NGAY NHAN", "NGAY TRA", "TONG TIEN", "TRANG THAI"};
            for (String header : headers) {
                PdfPCell cell = new PdfPCell(new Phrase(header, headFont));
                cell.setBackgroundColor(new Color(79, 70, 229));
                cell.setPadding(10);
                cell.setHorizontalAlignment(Element.ALIGN_CENTER);
                cell.setBorderColor(new Color(255, 255, 255));
                table.addCell(cell);
            }

            // Table Data
            Font dataFont = FontFactory.getFont(FontFactory.HELVETICA, 10, Color.BLACK);
            for (Booking b : bookings) {
                String code = b.getCheckInCode() != null ? b.getCheckInCode() : b.getId().toString().substring(0, 8);
                
                table.addCell(createStyledCell(code, dataFont));
                table.addCell(createStyledCell(b.getHomestay().getName(), dataFont));
                table.addCell(createStyledCell(b.getUser().getFirstName() + " " + b.getUser().getLastName(), dataFont));
                table.addCell(createStyledCell(b.getCheckInDate().toString(), dataFont));
                table.addCell(createStyledCell(b.getCheckOutDate().toString(), dataFont));
                table.addCell(createStyledCell(String.format("%,.0f VND", b.getTotalPrice().doubleValue()), dataFont));
                
                String status = b.getStatus().toString();
                PdfPCell statusCell = createStyledCell(status, dataFont);
                if ("COMPLETED".equals(status)) {
                    statusCell.setPhrase(new Phrase(status, FontFactory.getFont(FontFactory.HELVETICA_BOLD, 10, new Color(16, 185, 129))));
                } else if ("CANCELLED".equals(status)) {
                    statusCell.setPhrase(new Phrase(status, FontFactory.getFont(FontFactory.HELVETICA_BOLD, 10, new Color(239, 68, 68))));
                }
                table.addCell(statusCell);
            }

            document.add(table);
            document.close();
        } catch (DocumentException e) {
            e.printStackTrace();
        }

        return new ByteArrayInputStream(out.toByteArray());
    }

    private PdfPCell createStyledCell(String text, Font font) {
        PdfPCell cell = new PdfPCell(new Phrase(text, font));
        cell.setPadding(8);
        cell.setVerticalAlignment(Element.ALIGN_MIDDLE);
        cell.setBorderColor(new Color(226, 232, 240));
        return cell;
    }

    // --- EXCEL EXPORT ---
    public ByteArrayInputStream exportBookingsToExcel(List<Booking> bookings) throws IOException {
        try (Workbook workbook = new XSSFWorkbook(); ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            Sheet sheet = workbook.createSheet("Bookings");

            Row headerRow = sheet.createRow(0);
            String[] headers = {"Mã đơn", "Homestay", "Khách hàng", "Ngày nhận", "Ngày trả", "Tổng tiền", "Trạng thái"};
            for (int i = 0; i < headers.length; i++) {
                Cell cell = headerRow.createCell(i);
                cell.setCellValue(headers[i]);
            }

            int rowIdx = 1;
            for (Booking b : bookings) {
                Row row = sheet.createRow(rowIdx++);
                row.createCell(0).setCellValue(b.getCheckInCode() != null ? b.getCheckInCode() : b.getId().toString().substring(0, 8));
                row.createCell(1).setCellValue(b.getHomestay().getName());
                row.createCell(2).setCellValue(b.getUser().getFirstName() + " " + b.getUser().getLastName());
                row.createCell(3).setCellValue(b.getCheckInDate().toString());
                row.createCell(4).setCellValue(b.getCheckOutDate().toString());
                row.createCell(5).setCellValue(b.getTotalPrice().doubleValue());
                row.createCell(6).setCellValue(b.getStatus().toString());
            }

            workbook.write(out);
            return new ByteArrayInputStream(out.toByteArray());
        }
    }

    // --- JASPER REPORT EXPORT ---
    public byte[] exportBookingsJasper(List<Booking> bookings, String format) throws JRException {
        // Simple DTO for Jasper
        List<Map<String, Object>> data = bookings.stream().map(b -> {
            Map<String, Object> map = new HashMap<>();
            map.put("bookingCode", b.getCheckInCode() != null ? b.getCheckInCode() : b.getId().toString().substring(0, 8));
            map.put("homestayName", b.getHomestay().getName());
            map.put("customerName", b.getUser().getFirstName() + " " + b.getUser().getLastName());
            map.put("checkInDate", b.getCheckInDate().toString());
            map.put("checkOutDate", b.getCheckOutDate().toString());
            map.put("totalPrice", b.getTotalPrice().doubleValue());
            map.put("status", b.getStatus().toString());
            return map;
        }).toList();

        // In a real app, you'd load a .jrxml file. 
        // For this demo, we'll use a very simple dynamic report if possible, 
        // but Jasper usually needs a template. 
        // I will provide a basic template placeholder logic.
        
        // Load the template (we'll need to create this file)
        JasperReport jasperReport = JasperCompileManager.compileReport(getClass().getResourceAsStream("/reports/bookings.jrxml"));
        JRBeanCollectionDataSource dataSource = new JRBeanCollectionDataSource(data);
        Map<String, Object> parameters = new HashMap<>();
        parameters.put("title", "Báo cáo Đặt phòng");

        JasperPrint jasperPrint = JasperFillManager.fillReport(jasperReport, parameters, dataSource);

        if ("pdf".equalsIgnoreCase(format)) {
            return JasperExportManager.exportReportToPdf(jasperPrint);
        } else {
            return JasperExportManager.exportReportToPdf(jasperPrint); 
        }
    }

    // --- STATISTICS EXPORT (Method 1: OpenPDF) ---
    public ByteArrayInputStream exportStatsToPdf(StatisticsDto.HostStatistics stats) {
        Document document = new Document(PageSize.A4);
        ByteArrayOutputStream out = new ByteArrayOutputStream();

        try {
            PdfWriter.getInstance(document, out);
            document.open();

            Font titleFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 22, new Color(99, 102, 241));
            Paragraph title = new Paragraph("BAO CAO THONG KE CHU NHA", titleFont);
            title.setAlignment(Paragraph.ALIGN_CENTER);
            document.add(title);
            document.add(new Paragraph(" "));

            // Overview Cards
            PdfPTable overviewTable = new PdfPTable(3);
            overviewTable.setWidthPercentage(100);
            overviewTable.addCell(createStatCell("Tong Doanh Thu", stats.getTotalRevenue().toString() + " VND"));
            overviewTable.addCell(createStatCell("Tong Luot Dat", stats.getTotalBookings().toString()));
            overviewTable.addCell(createStatCell("Tong Homestay", stats.getTotalHomestays().toString()));
            document.add(overviewTable);
            document.add(new Paragraph(" "));

            document.add(new Paragraph("Hieu suat chi tiet tung Homestay:", FontFactory.getFont(FontFactory.HELVETICA_BOLD, 14)));
            PdfPTable table = new PdfPTable(3);
            table.setWidthPercentage(100);
            table.setSpacingBefore(10);
            
            String[] headers = {"Ten Homestay", "Luot dat", "Doanh thu"};
            for (String h : headers) {
                PdfPCell cell = new PdfPCell(new Phrase(h, FontFactory.getFont(FontFactory.HELVETICA_BOLD, 12, Color.WHITE)));
                cell.setBackgroundColor(new Color(79, 70, 229));
                cell.setPadding(8);
                table.addCell(cell);
            }

            Font dataFont = FontFactory.getFont(FontFactory.HELVETICA, 11);
            for (StatisticsDto.HomestayStats s : stats.getHomestayStats()) {
                table.addCell(createStyledCell(s.getHomestayName(), dataFont));
                table.addCell(createStyledCell(s.getBookingCount().toString(), dataFont));
                table.addCell(createStyledCell(s.getTotalRevenue().toString() + " VND", dataFont));
            }
            document.add(table);

            document.close();
        } catch (DocumentException e) {
            e.printStackTrace();
        }

        return new ByteArrayInputStream(out.toByteArray());
    }

    private PdfPCell createStatCell(String label, String value) {
        PdfPCell cell = new PdfPCell();
        cell.setPadding(15);
        cell.setBackgroundColor(new Color(248, 250, 252));
        cell.setBorderColor(new Color(226, 232, 240));
        cell.addElement(new Paragraph(label, FontFactory.getFont(FontFactory.HELVETICA, 10, Color.GRAY)));
        cell.addElement(new Paragraph(value, FontFactory.getFont(FontFactory.HELVETICA_BOLD, 16, Color.BLACK)));
        return cell;
    }

    public ByteArrayInputStream exportAdminStatsToPdf(StatisticsDto.AdminStatistics stats) {
        Document document = new Document(PageSize.A4);
        ByteArrayOutputStream out = new ByteArrayOutputStream();

        try {
            PdfWriter.getInstance(document, out);
            document.open();

            Font titleFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 22, new Color(79, 70, 229));
            Paragraph title = new Paragraph("BAO CAO THONG KE QUAN TRI", titleFont);
            title.setAlignment(Paragraph.ALIGN_CENTER);
            document.add(title);
            document.add(new Paragraph(" "));

            PdfPTable overviewTable = new PdfPTable(4);
            overviewTable.setWidthPercentage(100);
            overviewTable.addCell(createStatCell("Doanh Thu HT", stats.getTotalRevenue().toString() + " VND"));
            overviewTable.addCell(createStatCell("Tong Don Hang", stats.getTotalBookings().toString()));
            overviewTable.addCell(createStatCell("Tong Homestay", stats.getTotalHomestays().toString()));
            overviewTable.addCell(createStatCell("Tong Nguoi Dung", stats.getTotalUsers().toString()));
            document.add(overviewTable);
            document.add(new Paragraph(" "));

            document.add(new Paragraph("Top 5 Homestay doanh thu cao nhat:", FontFactory.getFont(FontFactory.HELVETICA_BOLD, 14)));
            PdfPTable table = new PdfPTable(3);
            table.setWidthPercentage(100);
            table.setSpacingBefore(10);
            
            String[] headers = {"Ten Homestay", "Don hang", "Doanh thu"};
            for (String h : headers) {
                PdfPCell cell = new PdfPCell(new Phrase(h, FontFactory.getFont(FontFactory.HELVETICA_BOLD, 12, Color.WHITE)));
                cell.setBackgroundColor(new Color(59, 130, 246));
                cell.setPadding(8);
                table.addCell(cell);
            }

            Font dataFont = FontFactory.getFont(FontFactory.HELVETICA, 11);
            for (StatisticsDto.HomestayStats s : stats.getTopHomestays()) {
                table.addCell(createStyledCell(s.getHomestayName(), dataFont));
                table.addCell(createStyledCell(s.getBookingCount().toString(), dataFont));
                table.addCell(createStyledCell(s.getTotalRevenue().toString() + " VND", dataFont));
            }
            document.add(table);

            document.close();
        } catch (DocumentException e) {
            e.printStackTrace();
        }

        return new ByteArrayInputStream(out.toByteArray());
    }

    // --- JASPER STATS EXPORT ---
    public byte[] exportStatsJasper(StatisticsDto.HostStatistics stats) throws JRException {
        List<Map<String, Object>> data = stats.getHomestayStats().stream().map(s -> {
            Map<String, Object> map = new HashMap<>();
            map.put("homestayName", s.getHomestayName());
            map.put("bookingCount", s.getBookingCount());
            map.put("revenue", s.getTotalRevenue().doubleValue());
            return map;
        }).toList();

        JasperReport jasperReport = JasperCompileManager.compileReport(getClass().getResourceAsStream("/reports/stats.jrxml"));
        JRBeanCollectionDataSource dataSource = new JRBeanCollectionDataSource(data);
        Map<String, Object> parameters = new HashMap<>();
        parameters.put("title", "BAO CAO THONG KE DOANH THU");
        parameters.put("totalRevenue", stats.getTotalRevenue().doubleValue());
        parameters.put("totalBookings", stats.getTotalBookings());

        JasperPrint jasperPrint = JasperFillManager.fillReport(jasperReport, parameters, dataSource);
        return JasperExportManager.exportReportToPdf(jasperPrint);
    }
}
