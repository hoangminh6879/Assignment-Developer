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
            
            com.lowagie.text.pdf.BaseFont baseFont = com.lowagie.text.pdf.BaseFont.createFont("C:\\Windows\\Fonts\\arial.ttf", com.lowagie.text.pdf.BaseFont.IDENTITY_H, com.lowagie.text.pdf.BaseFont.EMBEDDED);
            Font titleFont = new Font(baseFont, 22, Font.BOLD, new Color(79, 70, 229));
            Font headFont = new Font(baseFont, 11, Font.BOLD, Color.WHITE);
            Font dataFont = new Font(baseFont, 10, Font.NORMAL, Color.BLACK);

            Paragraph title = new Paragraph("DANH SÁCH ĐƠN ĐẶT PHÒNG", titleFont);
            title.setAlignment(Paragraph.ALIGN_CENTER);
            document.add(title);
            document.add(new Paragraph(" "));

            PdfPTable table = new PdfPTable(7);
            table.setWidthPercentage(100);
            table.setSpacingBefore(20);
            table.setWidths(new float[] {1.5f, 2.5f, 2.5f, 1.8f, 1.8f, 1.8f, 1.5f});

            String[] headers = {"MÃ ĐƠN", "HOMESTAY", "KHÁCH HÀNG", "NGÀY NHẬN", "NGÀY TRẢ", "TỔNG TIỀN", "TRẠNG THÁI"};
            System.out.println("Generating PDF for " + bookings.size() + " bookings");
            for (String header : headers) {
                PdfPCell cell = new PdfPCell(new Phrase(header, headFont));
                cell.setBackgroundColor(new Color(79, 70, 229));
                cell.setPadding(10);
                cell.setHorizontalAlignment(Element.ALIGN_CENTER);
                cell.setBorderColor(new Color(255, 255, 255));
                table.addCell(cell);
            }

            for (Booking b : bookings) {
                String code = b.getCheckInCode() != null ? b.getCheckInCode() : b.getId().toString().substring(0, 8);
                table.addCell(createStyledCell(code, dataFont));
                table.addCell(createStyledCell(b.getHomestay().getName(), dataFont));
                table.addCell(createStyledCell(b.getUser().getFirstName() + " " + b.getUser().getLastName(), dataFont));
                table.addCell(createStyledCell(b.getCheckInDate().toString(), dataFont));
                table.addCell(createStyledCell(b.getCheckOutDate().toString(), dataFont));
                table.addCell(createStyledCell(String.format("%,.0f VND", b.getTotalPrice().doubleValue()), dataFont));
                
                String status = b.getStatus().toString();
                table.addCell(createStyledCell(status, dataFont));
            }

            if (bookings.isEmpty()) {
                Paragraph noData = new Paragraph("KHÔNG CÓ DỮ LIỆU ĐƠN HÀNG TRONG KHOẢNG THỜI GIAN NÀY", new Font(baseFont, 12, Font.ITALIC, Color.RED));
                noData.setAlignment(Paragraph.ALIGN_CENTER);
                document.add(noData);
            } else {
                document.add(table);
            }
            document.close();
        } catch (Exception e) {
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
        List<Map<String, Object>> data = bookings.stream().map(b -> {
            Map<String, Object> map = new HashMap<>();
            map.put("bookingCode", b.getCheckInCode() != null ? b.getCheckInCode() : b.getId().toString().substring(0, 8));
            map.put("homestayName", b.getHomestay() != null ? b.getHomestay().getName() : "N/A");
            map.put("customerName", b.getUser() != null ? b.getUser().getFirstName() + " " + b.getUser().getLastName() : "N/A");
            map.put("checkInDate", b.getCheckInDate() != null ? b.getCheckInDate().toString() : "N/A");
            map.put("checkOutDate", b.getCheckOutDate() != null ? b.getCheckOutDate().toString() : "N/A");
            map.put("totalPrice", b.getTotalPrice() != null ? b.getTotalPrice().doubleValue() : 0.0);
            map.put("status", b.getStatus() != null ? b.getStatus().toString() : "N/A");
            return map;
        }).toList();

        // Load the template
        try {
            var reportStream = getClass().getResourceAsStream("/reports/bookings.jrxml");
            if (reportStream == null) {
                System.err.println("CRITICAL: /reports/bookings.jrxml NOT FOUND");
                throw new RuntimeException("Jasper template /reports/bookings.jrxml not found");
            }
            JasperReport jasperReport = JasperCompileManager.compileReport(reportStream);
            JRBeanCollectionDataSource dataSource = new JRBeanCollectionDataSource(data);
            Map<String, Object> parameters = new HashMap<>();
            parameters.put("title", "DANH SÁCH ĐẶT PHÒNG");
            parameters.put("exportDate", java.time.LocalDateTime.now().toString());

            JasperPrint jasperPrint = JasperFillManager.fillReport(jasperReport, parameters, dataSource);

            if ("xlsx".equalsIgnoreCase(format)) {
                ByteArrayOutputStream baos = new ByteArrayOutputStream();
                net.sf.jasperreports.export.SimpleXlsxReportConfiguration configuration = new net.sf.jasperreports.export.SimpleXlsxReportConfiguration();
                configuration.setOnePagePerSheet(false);
                configuration.setRemoveEmptySpaceBetweenRows(true);
                configuration.setDetectCellType(true);
                configuration.setWhitePageBackground(false);

                net.sf.jasperreports.export.SimpleOutputStreamExporterOutput exporterOutput = new net.sf.jasperreports.export.SimpleOutputStreamExporterOutput(baos);
                net.sf.jasperreports.engine.export.ooxml.JRXlsxExporter exporter = new net.sf.jasperreports.engine.export.ooxml.JRXlsxExporter();
                exporter.setExporterInput(new net.sf.jasperreports.export.SimpleExporterInput(jasperPrint));
                exporter.setExporterOutput(exporterOutput);
                exporter.setConfiguration(configuration);
                exporter.exportReport();
                return baos.toByteArray();
            } else {
                return JasperExportManager.exportReportToPdf(jasperPrint);
            }
        } catch (Exception e) {
            System.err.println("JASPER ERROR: " + e.getMessage());
            e.printStackTrace();
            throw new RuntimeException("Error generating Jasper report: " + e.getMessage());
        }
    }

    // --- STATISTICS EXPORT (Method 1: OpenPDF) ---
    public ByteArrayInputStream exportStatsToPdf(StatisticsDto.HostStatistics stats) {
        Document document = new Document(PageSize.A4);
        ByteArrayOutputStream out = new ByteArrayOutputStream();

        try {
            PdfWriter.getInstance(document, out);
            document.open();

            // Load a font that supports Vietnamese
            com.lowagie.text.pdf.BaseFont baseFont = com.lowagie.text.pdf.BaseFont.createFont("C:\\Windows\\Fonts\\arial.ttf", com.lowagie.text.pdf.BaseFont.IDENTITY_H, com.lowagie.text.pdf.BaseFont.EMBEDDED);
            Font titleFont = new Font(baseFont, 22, Font.BOLD, new Color(79, 70, 229));
            Font headerFont = new Font(baseFont, 12, Font.BOLD, Color.WHITE);
            Font dataFont = new Font(baseFont, 11, Font.NORMAL, Color.BLACK);
            Font labelFont = new Font(baseFont, 10, Font.NORMAL, Color.GRAY);
            Font cardValueFont = new Font(baseFont, 16, Font.BOLD, Color.BLACK);

            Paragraph title = new Paragraph("BÁO CÁO THỐNG KÊ CHỦ NHÀ", titleFont);
            title.setAlignment(Paragraph.ALIGN_CENTER);
            document.add(title);
            document.add(new Paragraph(" "));

            // Overview Cards
            PdfPTable overviewTable = new PdfPTable(3);
            overviewTable.setWidthPercentage(100);
            overviewTable.addCell(createStatCell("Tổng Doanh Thu", (stats.getTotalRevenue() != null ? String.format("%,d", stats.getTotalRevenue().longValue()) : "0") + " VND", labelFont, cardValueFont));
            overviewTable.addCell(createStatCell("Tổng Lượt Đặt", (stats.getTotalBookings() != null ? stats.getTotalBookings().toString() : "0"), labelFont, cardValueFont));
            overviewTable.addCell(createStatCell("Tổng Homestay", (stats.getTotalHomestays() != null ? stats.getTotalHomestays().toString() : "0"), labelFont, cardValueFont));
            document.add(overviewTable);
            document.add(new Paragraph(" "));

            document.add(new Paragraph("Hiệu suất chi tiết từng Homestay:", new Font(baseFont, 14, Font.BOLD)));
            PdfPTable table = new PdfPTable(3);
            table.setWidthPercentage(100);
            table.setSpacingBefore(10);
            
            String[] headers = {"Tên Homestay", "Lượt đặt", "Doanh thu"};
            for (String h : headers) {
                PdfPCell cell = new PdfPCell(new Phrase(h, headerFont));
                cell.setBackgroundColor(new Color(79, 70, 229));
                cell.setPadding(8);
                table.addCell(cell);
            }

            if (stats.getHomestayStats() != null) {
                for (StatisticsDto.HomestayStats s : stats.getHomestayStats()) {
                    table.addCell(createStyledCell(s.getHomestayName(), dataFont));
                    table.addCell(createStyledCell(s.getBookingCount().toString(), dataFont));
                    table.addCell(createStyledCell(String.format("%,d", s.getTotalRevenue().longValue()) + " VND", dataFont));
                }
            }
            document.add(table);

            document.close();
        } catch (Exception e) {
            e.printStackTrace();
        }

        return new ByteArrayInputStream(out.toByteArray());
    }

    private PdfPCell createStatCell(String label, String value, Font labelFont, Font valueFont) {
        PdfPCell cell = new PdfPCell();
        cell.setPadding(15);
        cell.setBackgroundColor(new Color(248, 250, 252));
        cell.setBorderColor(new Color(226, 232, 240));
        cell.addElement(new Paragraph(label, labelFont));
        cell.addElement(new Paragraph(value, valueFont));
        return cell;
    }

    public ByteArrayInputStream exportAdminStatsToPdf(StatisticsDto.AdminStatistics stats) {
        Document document = new Document(PageSize.A4);
        ByteArrayOutputStream out = new ByteArrayOutputStream();

        try {
            PdfWriter.getInstance(document, out);
            document.open();

            com.lowagie.text.pdf.BaseFont baseFont = com.lowagie.text.pdf.BaseFont.createFont("C:\\Windows\\Fonts\\arial.ttf", com.lowagie.text.pdf.BaseFont.IDENTITY_H, com.lowagie.text.pdf.BaseFont.EMBEDDED);
            Font titleFont = new Font(baseFont, 22, Font.BOLD, new Color(79, 70, 229));
            Font headerFont = new Font(baseFont, 12, Font.BOLD, Color.WHITE);
            Font dataFont = new Font(baseFont, 11, Font.NORMAL, Color.BLACK);
            Font labelFont = new Font(baseFont, 10, Font.NORMAL, Color.GRAY);
            Font cardValueFont = new Font(baseFont, 16, Font.BOLD, Color.BLACK);

            Paragraph title = new Paragraph("BÁO CÁO THỐNG KÊ QUẢN TRỊ", titleFont);
            title.setAlignment(Paragraph.ALIGN_CENTER);
            document.add(title);
            document.add(new Paragraph(" "));

            PdfPTable overviewTable = new PdfPTable(4);
            overviewTable.setWidthPercentage(100);
            overviewTable.addCell(createStatCell("Doanh Thu HT", (stats.getTotalRevenue() != null ? String.format("%,d", stats.getTotalRevenue().longValue()) : "0") + " VND", labelFont, cardValueFont));
            overviewTable.addCell(createStatCell("Tổng Đơn Hàng", (stats.getTotalBookings() != null ? stats.getTotalBookings().toString() : "0"), labelFont, cardValueFont));
            overviewTable.addCell(createStatCell("Tổng Homestay", (stats.getTotalHomestays() != null ? stats.getTotalHomestays().toString() : "0"), labelFont, cardValueFont));
            overviewTable.addCell(createStatCell("Tổng Người Dùng", (stats.getTotalUsers() != null ? stats.getTotalUsers().toString() : "0"), labelFont, cardValueFont));
            document.add(overviewTable);
            document.add(new Paragraph(" "));

            document.add(new Paragraph("Top 5 Homestay doanh thu cao nhất:", new Font(baseFont, 14, Font.BOLD)));
            PdfPTable table = new PdfPTable(3);
            table.setWidthPercentage(100);
            table.setSpacingBefore(10);
            
            String[] headers = {"Tên Homestay", "Đơn hàng", "Doanh thu"};
            for (String h : headers) {
                PdfPCell cell = new PdfPCell(new Phrase(h, headerFont));
                cell.setBackgroundColor(new Color(59, 130, 246));
                cell.setPadding(8);
                table.addCell(cell);
            }

            if (stats.getTopHomestays() != null) {
                for (StatisticsDto.HomestayStats s : stats.getTopHomestays()) {
                    table.addCell(createStyledCell(s.getHomestayName(), dataFont));
                    table.addCell(createStyledCell(s.getBookingCount().toString(), dataFont));
                    table.addCell(createStyledCell(String.format("%,d", s.getTotalRevenue().longValue()) + " VND", dataFont));
                }
            }
            document.add(table);

            document.close();
        } catch (Exception e) {
            e.printStackTrace();
        }

        return new ByteArrayInputStream(out.toByteArray());
    }

    // --- JASPER STATS EXPORT ---
    public byte[] exportStatsJasper(StatisticsDto.HostStatistics stats, String format) throws JRException {
        try {
            List<Map<String, Object>> data = stats.getHomestayStats() != null ? stats.getHomestayStats().stream().map(s -> {
                Map<String, Object> map = new HashMap<>();
                map.put("homestayName", s.getHomestayName());
                map.put("bookingCount", s.getBookingCount());
                map.put("revenue", s.getTotalRevenue().doubleValue());
                return map;
            }).toList() : List.of();

            var reportStream = getClass().getResourceAsStream("/reports/stats.jrxml");
            if (reportStream == null) {
                System.err.println("CRITICAL: /reports/stats.jrxml NOT FOUND");
                throw new RuntimeException("Jasper template /reports/stats.jrxml not found");
            }
            JasperReport jasperReport = JasperCompileManager.compileReport(reportStream);
            JRBeanCollectionDataSource dataSource = new JRBeanCollectionDataSource(data);
            Map<String, Object> parameters = new HashMap<>();
            parameters.put("title", "BÁO CÁO THỐNG KÊ DOANH THU");
            parameters.put("totalRevenue", stats.getTotalRevenue() != null ? stats.getTotalRevenue().doubleValue() : 0.0);
            parameters.put("totalBookings", stats.getTotalBookings() != null ? stats.getTotalBookings() : 0L);
            parameters.put("totalHomestays", stats.getTotalHomestays() != null ? stats.getTotalHomestays() : 0L);
            parameters.put("exportDate", java.time.LocalDateTime.now().toString());

            JasperPrint jasperPrint = JasperFillManager.fillReport(jasperReport, parameters, dataSource);
            System.out.println("Jasper: Report filled successfully (Host Stats) for " + format);
            return exportToBytes(jasperPrint, format);
        } catch (Exception e) {
            System.err.println("JASPER STATS ERROR: " + e.getClass().getName() + ": " + e.getMessage());
            e.printStackTrace();
            throw new RuntimeException("Error generating stats report: " + e.getMessage(), e);
        }
    }

    public byte[] exportAdminStatsJasper(StatisticsDto.AdminStatistics stats, String format) throws JRException {
        try {
            List<Map<String, Object>> data = stats.getTopHomestays() != null ? stats.getTopHomestays().stream().map(s -> {
                Map<String, Object> map = new HashMap<>();
                map.put("homestayName", s.getHomestayName());
                map.put("bookingCount", s.getBookingCount());
                map.put("revenue", s.getTotalRevenue().doubleValue());
                return map;
            }).toList() : List.of();

            var reportStream = getClass().getResourceAsStream("/reports/stats.jrxml");
            if (reportStream == null) {
                System.err.println("CRITICAL: /reports/stats.jrxml NOT FOUND");
                throw new RuntimeException("Jasper template /reports/stats.jrxml not found");
            }
            JasperReport jasperReport = JasperCompileManager.compileReport(reportStream);
            JRBeanCollectionDataSource dataSource = new JRBeanCollectionDataSource(data);
            Map<String, Object> parameters = new HashMap<>();
            parameters.put("title", "BÁO CÁO THỐNG KÊ QUẢN TRỊ");
            parameters.put("totalRevenue", stats.getTotalRevenue() != null ? stats.getTotalRevenue().doubleValue() : 0.0);
            parameters.put("totalBookings", stats.getTotalBookings() != null ? stats.getTotalBookings() : 0L);
            parameters.put("totalHomestays", stats.getTotalHomestays() != null ? stats.getTotalHomestays() : 0L);
            parameters.put("totalUsers", stats.getTotalUsers() != null ? stats.getTotalUsers() : 0L);
            parameters.put("exportDate", java.time.LocalDateTime.now().toString());

            JasperPrint jasperPrint = JasperFillManager.fillReport(jasperReport, parameters, dataSource);
            System.out.println("Jasper: Report filled successfully for " + format);
            return exportToBytes(jasperPrint, format);
        } catch (Exception e) {
            System.err.println("JASPER ADMIN STATS ERROR: " + e.getClass().getName() + ": " + e.getMessage());
            e.printStackTrace();
            throw new RuntimeException("Error generating admin stats report: " + e.getMessage(), e);
        }
    }

    private byte[] exportToBytes(JasperPrint jasperPrint, String format) throws JRException {
        try {
            if ("xlsx".equalsIgnoreCase(format)) {
                ByteArrayOutputStream baos = new ByteArrayOutputStream();
                net.sf.jasperreports.export.SimpleXlsxReportConfiguration configuration = new net.sf.jasperreports.export.SimpleXlsxReportConfiguration();
                configuration.setOnePagePerSheet(false);
                configuration.setRemoveEmptySpaceBetweenRows(true);
                configuration.setRemoveEmptySpaceBetweenColumns(true);
                configuration.setDetectCellType(true);
                configuration.setWhitePageBackground(false);

                net.sf.jasperreports.export.SimpleOutputStreamExporterOutput exporterOutput = new net.sf.jasperreports.export.SimpleOutputStreamExporterOutput(baos);
                net.sf.jasperreports.engine.export.ooxml.JRXlsxExporter exporter = new net.sf.jasperreports.engine.export.ooxml.JRXlsxExporter();
                exporter.setExporterInput(new net.sf.jasperreports.export.SimpleExporterInput(jasperPrint));
                exporter.setExporterOutput(exporterOutput);
                exporter.setConfiguration(configuration);
                exporter.exportReport();
                return baos.toByteArray();
            } else {
                return JasperExportManager.exportReportToPdf(jasperPrint);
            }
        } catch (Exception e) {
            System.err.println("EXPORT TO BYTES ERROR: " + e.getMessage());
            throw e;
        }
    }

}
