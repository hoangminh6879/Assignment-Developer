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
    public ByteArrayInputStream exportBookingsToPdf(List<Booking> bookings, String exporterName) {
        Document document = new Document(PageSize.A4.rotate());
        ByteArrayOutputStream out = new ByteArrayOutputStream();

        try {
            PdfWriter.getInstance(document, out);
            document.open();

            // Note: For full Vietnamese support in PDF, we usually need a .ttf file.
            // Since I can't guarantee the path to a .ttf here, I will use non-accented text
            // but make the design much more premium.

            com.lowagie.text.pdf.BaseFont baseFont = com.lowagie.text.pdf.BaseFont.createFont(
                    "C:\\Windows\\Fonts\\arial.ttf", com.lowagie.text.pdf.BaseFont.IDENTITY_H,
                    com.lowagie.text.pdf.BaseFont.EMBEDDED);
            Font titleFont = new Font(baseFont, 22, Font.BOLD, new Color(79, 70, 229));
            Font headFont = new Font(baseFont, 11, Font.BOLD, Color.WHITE);
            Font dataFont = new Font(baseFont, 10, Font.NORMAL, Color.BLACK);

            Paragraph title = new Paragraph("DANH SÁCH ĐƠN ĐẶT PHÒNG", titleFont);
            title.setAlignment(Paragraph.ALIGN_CENTER);
            document.add(title);

            String exportTime = java.time.format.DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm")
                    .format(java.time.LocalDateTime.now());
            Paragraph info = new Paragraph("Người xuất: " + exporterName + "  |  Ngày xuất: " + exportTime,
                    new Font(baseFont, 11, Font.ITALIC, Color.DARK_GRAY));
            info.setAlignment(Paragraph.ALIGN_RIGHT);
            document.add(info);
            document.add(new Paragraph(" "));

            PdfPTable table = new PdfPTable(7);
            table.setWidthPercentage(100);
            table.setSpacingBefore(20);
            table.setWidths(new float[] { 1.5f, 2.5f, 2.5f, 1.8f, 1.8f, 1.8f, 1.5f });

            String[] headers = { "MÃ ĐƠN", "HOMESTAY", "KHÁCH HÀNG", "NGÀY NHẬN", "NGÀY TRẢ", "TỔNG TIỀN",
                    "TRẠNG THÁI" };
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
                Paragraph noData = new Paragraph("KHÔNG CÓ DỮ LIỆU ĐƠN HÀNG TRONG KHOẢNG THỜI GIAN NÀY",
                        new Font(baseFont, 12, Font.ITALIC, Color.RED));
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

    // --- POI EXCEL STYLE HELPERS ---
    private org.apache.poi.ss.usermodel.CellStyle createHeaderStyle(Workbook workbook) {
        org.apache.poi.ss.usermodel.CellStyle style = workbook.createCellStyle();
        org.apache.poi.ss.usermodel.Font font = workbook.createFont();
        font.setBold(true);
        font.setColor(org.apache.poi.ss.usermodel.IndexedColors.WHITE.getIndex());
        font.setFontHeightInPoints((short) 12);
        style.setFont(font);
        style.setFillForegroundColor(org.apache.poi.ss.usermodel.IndexedColors.ROYAL_BLUE.getIndex());
        style.setFillPattern(org.apache.poi.ss.usermodel.FillPatternType.SOLID_FOREGROUND);
        style.setAlignment(org.apache.poi.ss.usermodel.HorizontalAlignment.CENTER);
        style.setVerticalAlignment(org.apache.poi.ss.usermodel.VerticalAlignment.CENTER);
        style.setBorderBottom(org.apache.poi.ss.usermodel.BorderStyle.THIN);
        style.setBorderTop(org.apache.poi.ss.usermodel.BorderStyle.THIN);
        style.setBorderLeft(org.apache.poi.ss.usermodel.BorderStyle.THIN);
        style.setBorderRight(org.apache.poi.ss.usermodel.BorderStyle.THIN);
        return style;
    }

    private org.apache.poi.ss.usermodel.CellStyle createDataStyle(Workbook workbook) {
        org.apache.poi.ss.usermodel.CellStyle style = workbook.createCellStyle();
        style.setBorderBottom(org.apache.poi.ss.usermodel.BorderStyle.THIN);
        style.setBorderTop(org.apache.poi.ss.usermodel.BorderStyle.THIN);
        style.setBorderLeft(org.apache.poi.ss.usermodel.BorderStyle.THIN);
        style.setBorderRight(org.apache.poi.ss.usermodel.BorderStyle.THIN);
        style.setVerticalAlignment(org.apache.poi.ss.usermodel.VerticalAlignment.CENTER);
        return style;
    }

    private org.apache.poi.ss.usermodel.CellStyle createCurrencyStyle(Workbook workbook) {
        org.apache.poi.ss.usermodel.CellStyle style = createDataStyle(workbook);
        org.apache.poi.ss.usermodel.DataFormat format = workbook.createDataFormat();
        style.setDataFormat(format.getFormat("#,##0"));
        return style;
    }

    private org.apache.poi.ss.usermodel.CellStyle createTitleStyle(Workbook workbook) {
        org.apache.poi.ss.usermodel.CellStyle style = workbook.createCellStyle();
        org.apache.poi.ss.usermodel.Font font = workbook.createFont();
        font.setBold(true);
        font.setFontHeightInPoints((short) 18);
        font.setColor(org.apache.poi.ss.usermodel.IndexedColors.ROYAL_BLUE.getIndex());
        style.setFont(font);
        style.setAlignment(org.apache.poi.ss.usermodel.HorizontalAlignment.CENTER);
        return style;
    }

    // --- EXCEL EXPORT ---
    public ByteArrayInputStream exportBookingsToExcel(List<Booking> bookings, String exporterName) throws IOException {
        try (Workbook workbook = new XSSFWorkbook(); ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            Sheet sheet = workbook.createSheet("Bookings");

            org.apache.poi.ss.usermodel.CellStyle titleStyle = createTitleStyle(workbook);
            org.apache.poi.ss.usermodel.CellStyle headerStyle = createHeaderStyle(workbook);
            org.apache.poi.ss.usermodel.CellStyle dataStyle = createDataStyle(workbook);
            org.apache.poi.ss.usermodel.CellStyle currencyStyle = createCurrencyStyle(workbook);

            Row titleRow = sheet.createRow(0);
            Cell titleCell = titleRow.createCell(0);
            titleCell.setCellValue("DANH SÁCH ĐƠN ĐẶT PHÒNG");
            titleCell.setCellStyle(titleStyle);
            sheet.addMergedRegion(new org.apache.poi.ss.util.CellRangeAddress(0, 0, 0, 6));

            String exportTime = java.time.format.DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm")
                    .format(java.time.LocalDateTime.now());
            Row infoRow = sheet.createRow(1);
            infoRow.createCell(0).setCellValue("Người xuất: " + exporterName + "  |  Ngày xuất: " + exportTime);

            Row headerRow = sheet.createRow(3);
            String[] headers = { "Mã đơn", "Homestay", "Khách hàng", "Ngày nhận", "Ngày trả", "Tổng tiền",
                    "Trạng thái" };
            for (int i = 0; i < headers.length; i++) {
                Cell cell = headerRow.createCell(i);
                cell.setCellValue(headers[i]);
                cell.setCellStyle(headerStyle);
            }

            int rowIdx = 4;
            for (Booking b : bookings) {
                Row row = sheet.createRow(rowIdx++);
                Cell c0 = row.createCell(0);
                c0.setCellValue(b.getCheckInCode() != null ? b.getCheckInCode() : b.getId().toString().substring(0, 8));
                c0.setCellStyle(dataStyle);
                Cell c1 = row.createCell(1);
                c1.setCellValue(b.getHomestay().getName());
                c1.setCellStyle(dataStyle);
                Cell c2 = row.createCell(2);
                c2.setCellValue(b.getUser().getFirstName() + " " + b.getUser().getLastName());
                c2.setCellStyle(dataStyle);
                Cell c3 = row.createCell(3);
                c3.setCellValue(b.getCheckInDate().toString());
                c3.setCellStyle(dataStyle);
                Cell c4 = row.createCell(4);
                c4.setCellValue(b.getCheckOutDate().toString());
                c4.setCellStyle(dataStyle);
                Cell c5 = row.createCell(5);
                c5.setCellValue(b.getTotalPrice().doubleValue());
                c5.setCellStyle(currencyStyle);
                Cell c6 = row.createCell(6);
                c6.setCellValue(b.getStatus().toString());
                c6.setCellStyle(dataStyle);
            }

            for (int i = 0; i < headers.length; i++) {
                sheet.autoSizeColumn(i);
            }

            workbook.write(out);
            return new ByteArrayInputStream(out.toByteArray());
        }
    }

    public ByteArrayInputStream exportStatsToExcel(StatisticsDto.HostStatistics stats, String exporterName)
            throws IOException {
        try (Workbook workbook = new XSSFWorkbook(); ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            Sheet sheet = workbook.createSheet("Statistics");

            org.apache.poi.ss.usermodel.CellStyle titleStyle = createTitleStyle(workbook);
            org.apache.poi.ss.usermodel.CellStyle headerStyle = createHeaderStyle(workbook);
            org.apache.poi.ss.usermodel.CellStyle dataStyle = createDataStyle(workbook);
            org.apache.poi.ss.usermodel.CellStyle currencyStyle = createCurrencyStyle(workbook);

            Row titleRow = sheet.createRow(0);
            Cell titleCell = titleRow.createCell(0);
            titleCell.setCellValue("BÁO CÁO THỐNG KÊ DOANH THU");
            titleCell.setCellStyle(titleStyle);
            sheet.addMergedRegion(new org.apache.poi.ss.util.CellRangeAddress(0, 0, 0, 2));

            String exportTime = java.time.format.DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm")
                    .format(java.time.LocalDateTime.now());
            Row infoRow = sheet.createRow(1);
            infoRow.createCell(0).setCellValue("Người xuất: " + exporterName + "  |  Ngày xuất: " + exportTime);

            Row sumRow1 = sheet.createRow(3);
            sumRow1.createCell(0).setCellValue("Tổng Doanh Thu:");
            Cell cRev = sumRow1.createCell(2);
            cRev.setCellValue(stats.getTotalRevenue() != null ? stats.getTotalRevenue().doubleValue() : 0);
            cRev.setCellStyle(currencyStyle);

            Row sumRow2 = sheet.createRow(4);
            sumRow2.createCell(0).setCellValue("Tổng Lượt Đặt:");
            sumRow2.createCell(2).setCellValue(stats.getTotalBookings() != null ? stats.getTotalBookings() : 0);

            Row sumRow3 = sheet.createRow(5);
            sumRow3.createCell(0).setCellValue("Tổng Homestay:");
            sumRow3.createCell(2).setCellValue(stats.getTotalHomestays() != null ? stats.getTotalHomestays() : 0);

            Row headerRow = sheet.createRow(7);
            String[] headers = { "Tên Homestay", "Lượt đặt", "Doanh thu" };
            for (int i = 0; i < headers.length; i++) {
                Cell cell = headerRow.createCell(i);
                cell.setCellValue(headers[i]);
                cell.setCellStyle(headerStyle);
            }

            int rowIdx = 8;
            if (stats.getHomestayStats() != null) {
                for (StatisticsDto.HomestayStats s : stats.getHomestayStats()) {
                    Row row = sheet.createRow(rowIdx++);
                    Cell c0 = row.createCell(0);
                    c0.setCellValue(s.getHomestayName() != null ? s.getHomestayName() : "N/A");
                    c0.setCellStyle(dataStyle);
                    Cell c1 = row.createCell(1);
                    c1.setCellValue(s.getBookingCount() != null ? s.getBookingCount() : 0);
                    c1.setCellStyle(dataStyle);
                    Cell c2 = row.createCell(2);
                    c2.setCellValue(s.getTotalRevenue() != null ? s.getTotalRevenue().doubleValue() : 0);
                    c2.setCellStyle(currencyStyle);
                }
            }

            for (int i = 0; i < headers.length; i++) {
                sheet.autoSizeColumn(i);
            }

            workbook.write(out);
            return new ByteArrayInputStream(out.toByteArray());
        }
    }

    public ByteArrayInputStream exportAdminStatsToExcel(StatisticsDto.AdminStatistics stats, String exporterName)
            throws IOException {
        try (Workbook workbook = new XSSFWorkbook(); ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            Sheet sheet = workbook.createSheet("Admin Statistics");

            org.apache.poi.ss.usermodel.CellStyle titleStyle = createTitleStyle(workbook);
            org.apache.poi.ss.usermodel.CellStyle headerStyle = createHeaderStyle(workbook);
            org.apache.poi.ss.usermodel.CellStyle dataStyle = createDataStyle(workbook);
            org.apache.poi.ss.usermodel.CellStyle currencyStyle = createCurrencyStyle(workbook);

            Row titleRow = sheet.createRow(0);
            Cell titleCell = titleRow.createCell(0);
            titleCell.setCellValue("BÁO CÁO THỐNG KÊ QUẢN TRỊ");
            titleCell.setCellStyle(titleStyle);
            sheet.addMergedRegion(new org.apache.poi.ss.util.CellRangeAddress(0, 0, 0, 2));

            String exportTime = java.time.format.DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm")
                    .format(java.time.LocalDateTime.now());
            Row infoRow = sheet.createRow(1);
            infoRow.createCell(0).setCellValue("Người xuất: " + exporterName + "  |  Ngày xuất: " + exportTime);

            Row sumRow1 = sheet.createRow(3);
            sumRow1.createCell(0).setCellValue("Doanh Thu Hệ Thống:");
            Cell cRev = sumRow1.createCell(2);
            cRev.setCellValue(stats.getTotalRevenue() != null ? stats.getTotalRevenue().doubleValue() : 0);
            cRev.setCellStyle(currencyStyle);

            Row sumRow2 = sheet.createRow(4);
            sumRow2.createCell(0).setCellValue("Tổng Đơn Hàng:");
            sumRow2.createCell(2).setCellValue(stats.getTotalBookings() != null ? stats.getTotalBookings() : 0);

            Row sumRow3 = sheet.createRow(5);
            sumRow3.createCell(0).setCellValue("Tổng Homestay:");
            sumRow3.createCell(2).setCellValue(stats.getTotalHomestays() != null ? stats.getTotalHomestays() : 0);

            Row sumRow4 = sheet.createRow(6);
            sumRow4.createCell(0).setCellValue("Tổng Người Dùng:");
            sumRow4.createCell(2).setCellValue(stats.getTotalUsers() != null ? stats.getTotalUsers() : 0);

            Row headerRow = sheet.createRow(8);
            String[] headers = { "Tên Homestay", "Lượt đặt", "Doanh thu" };
            for (int i = 0; i < headers.length; i++) {
                Cell cell = headerRow.createCell(i);
                cell.setCellValue(headers[i]);
                cell.setCellStyle(headerStyle);
            }

            int rowIdx = 9;
            if (stats.getTopHomestays() != null) {
                for (StatisticsDto.HomestayStats s : stats.getTopHomestays()) {
                    Row row = sheet.createRow(rowIdx++);
                    Cell c0 = row.createCell(0);
                    c0.setCellValue(s.getHomestayName() != null ? s.getHomestayName() : "N/A");
                    c0.setCellStyle(dataStyle);
                    Cell c1 = row.createCell(1);
                    c1.setCellValue(s.getBookingCount() != null ? s.getBookingCount() : 0);
                    c1.setCellStyle(dataStyle);
                    Cell c2 = row.createCell(2);
                    c2.setCellValue(s.getTotalRevenue() != null ? s.getTotalRevenue().doubleValue() : 0);
                    c2.setCellStyle(currencyStyle);
                }
            }

            for (int i = 0; i < headers.length; i++) {
                sheet.autoSizeColumn(i);
            }

            workbook.write(out);
            return new ByteArrayInputStream(out.toByteArray());
        }
    }

    // --- JASPER REPORT EXPORT ---
    public byte[] exportBookingsJasper(List<Booking> bookings, String format, String exporterName) throws JRException {
        List<Map<String, Object>> data = bookings.stream().map(b -> {
            Map<String, Object> map = new HashMap<>();
            map.put("bookingCode",
                    b.getCheckInCode() != null ? b.getCheckInCode() : b.getId().toString().substring(0, 8));
            map.put("homestayName", b.getHomestay() != null ? b.getHomestay().getName() : "N/A");
            map.put("customerName",
                    b.getUser() != null ? b.getUser().getFirstName() + " " + b.getUser().getLastName() : "N/A");
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
            String exportTime = java.time.format.DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm")
                    .format(java.time.LocalDateTime.now());
            parameters.put("exportDate", exportTime);
            parameters.put("exporterName", exporterName);
            if ("xlsx".equalsIgnoreCase(format)) {
                parameters.put(net.sf.jasperreports.engine.JRParameter.IS_IGNORE_PAGINATION, true);
            }

            JasperPrint jasperPrint = JasperFillManager.fillReport(jasperReport, parameters, dataSource);

            if ("xlsx".equalsIgnoreCase(format)) {
                ByteArrayOutputStream baos = new ByteArrayOutputStream();
                net.sf.jasperreports.export.SimpleXlsxReportConfiguration configuration = new net.sf.jasperreports.export.SimpleXlsxReportConfiguration();
                configuration.setOnePagePerSheet(false);
                configuration.setRemoveEmptySpaceBetweenRows(true);
                configuration.setDetectCellType(true);
                configuration.setWhitePageBackground(false);
                configuration.setIgnorePageMargins(true);

                net.sf.jasperreports.export.SimpleOutputStreamExporterOutput exporterOutput = new net.sf.jasperreports.export.SimpleOutputStreamExporterOutput(
                        baos);
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
    public ByteArrayInputStream exportStatsToPdf(StatisticsDto.HostStatistics stats, String exporterName) {
        Document document = new Document(PageSize.A4);
        ByteArrayOutputStream out = new ByteArrayOutputStream();

        try {
            PdfWriter.getInstance(document, out);
            document.open();

            // Load a font that supports Vietnamese
            com.lowagie.text.pdf.BaseFont baseFont = com.lowagie.text.pdf.BaseFont.createFont(
                    "C:\\Windows\\Fonts\\arial.ttf", com.lowagie.text.pdf.BaseFont.IDENTITY_H,
                    com.lowagie.text.pdf.BaseFont.EMBEDDED);
            Font titleFont = new Font(baseFont, 22, Font.BOLD, new Color(79, 70, 229));
            Font headerFont = new Font(baseFont, 12, Font.BOLD, Color.WHITE);
            Font dataFont = new Font(baseFont, 11, Font.NORMAL, Color.BLACK);
            Font labelFont = new Font(baseFont, 10, Font.NORMAL, Color.GRAY);
            Font cardValueFont = new Font(baseFont, 16, Font.BOLD, Color.BLACK);

            Paragraph title = new Paragraph("BÁO CÁO THỐNG KÊ CHỦ NHÀ", titleFont);
            title.setAlignment(Paragraph.ALIGN_CENTER);
            document.add(title);

            String exportTime = java.time.format.DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm")
                    .format(java.time.LocalDateTime.now());
            Paragraph info = new Paragraph("Người xuất: " + exporterName + "  |  Ngày xuất: " + exportTime,
                    new Font(baseFont, 11, Font.ITALIC, Color.DARK_GRAY));
            info.setAlignment(Paragraph.ALIGN_RIGHT);
            document.add(info);
            document.add(new Paragraph(" "));

            // Overview Cards
            PdfPTable overviewTable = new PdfPTable(3);
            overviewTable.setWidthPercentage(100);
            overviewTable.addCell(createStatCell("Tổng Doanh Thu",
                    (stats.getTotalRevenue() != null ? String.format("%,d", stats.getTotalRevenue().longValue()) : "0")
                            + " VND",
                    labelFont, cardValueFont));
            overviewTable.addCell(createStatCell("Tổng Lượt Đặt",
                    (stats.getTotalBookings() != null ? stats.getTotalBookings().toString() : "0"), labelFont,
                    cardValueFont));
            overviewTable.addCell(createStatCell("Tổng Homestay",
                    (stats.getTotalHomestays() != null ? stats.getTotalHomestays().toString() : "0"), labelFont,
                    cardValueFont));
            document.add(overviewTable);
            document.add(new Paragraph(" "));

            document.add(new Paragraph("Hiệu suất chi tiết từng Homestay:", new Font(baseFont, 14, Font.BOLD)));
            PdfPTable table = new PdfPTable(3);
            table.setWidthPercentage(100);
            table.setSpacingBefore(10);

            String[] headers = { "Tên Homestay", "Lượt đặt", "Doanh thu" };
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
                    table.addCell(
                            createStyledCell(String.format("%,d", s.getTotalRevenue().longValue()) + " VND", dataFont));
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

    public ByteArrayInputStream exportAdminStatsToPdf(StatisticsDto.AdminStatistics stats, String exporterName) {
        Document document = new Document(PageSize.A4);
        ByteArrayOutputStream out = new ByteArrayOutputStream();

        try {
            PdfWriter.getInstance(document, out);
            document.open();

            com.lowagie.text.pdf.BaseFont baseFont = com.lowagie.text.pdf.BaseFont.createFont(
                    "C:\\Windows\\Fonts\\arial.ttf", com.lowagie.text.pdf.BaseFont.IDENTITY_H,
                    com.lowagie.text.pdf.BaseFont.EMBEDDED);
            Font titleFont = new Font(baseFont, 22, Font.BOLD, new Color(79, 70, 229));
            Font headerFont = new Font(baseFont, 12, Font.BOLD, Color.WHITE);
            Font dataFont = new Font(baseFont, 11, Font.NORMAL, Color.BLACK);
            Font labelFont = new Font(baseFont, 10, Font.NORMAL, Color.GRAY);
            Font cardValueFont = new Font(baseFont, 16, Font.BOLD, Color.BLACK);

            Paragraph title = new Paragraph("BÁO CÁO THỐNG KÊ QUẢN TRỊ", titleFont);
            title.setAlignment(Paragraph.ALIGN_CENTER);
            document.add(title);

            String exportTime = java.time.format.DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm")
                    .format(java.time.LocalDateTime.now());
            Paragraph info = new Paragraph("Người xuất: " + exporterName + "  |  Ngày xuất: " + exportTime,
                    new Font(baseFont, 11, Font.ITALIC, Color.DARK_GRAY));
            info.setAlignment(Paragraph.ALIGN_RIGHT);
            document.add(info);
            document.add(new Paragraph(" "));

            PdfPTable overviewTable = new PdfPTable(4);
            overviewTable.setWidthPercentage(100);
            overviewTable.addCell(createStatCell("Doanh Thu HT",
                    (stats.getTotalRevenue() != null ? String.format("%,d", stats.getTotalRevenue().longValue()) : "0")
                            + " VND",
                    labelFont, cardValueFont));
            overviewTable.addCell(createStatCell("Tổng Đơn Hàng",
                    (stats.getTotalBookings() != null ? stats.getTotalBookings().toString() : "0"), labelFont,
                    cardValueFont));
            overviewTable.addCell(createStatCell("Tổng Homestay",
                    (stats.getTotalHomestays() != null ? stats.getTotalHomestays().toString() : "0"), labelFont,
                    cardValueFont));
            overviewTable.addCell(createStatCell("Tổng Người Dùng",
                    (stats.getTotalUsers() != null ? stats.getTotalUsers().toString() : "0"), labelFont,
                    cardValueFont));
            document.add(overviewTable);
            document.add(new Paragraph(" "));

            document.add(new Paragraph("Top 5 Homestay doanh thu cao nhất:", new Font(baseFont, 14, Font.BOLD)));
            PdfPTable table = new PdfPTable(3);
            table.setWidthPercentage(100);
            table.setSpacingBefore(10);

            String[] headers = { "Tên Homestay", "Đơn hàng", "Doanh thu" };
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
                    table.addCell(
                            createStyledCell(String.format("%,d", s.getTotalRevenue().longValue()) + " VND", dataFont));
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
    public byte[] exportStatsJasper(StatisticsDto.HostStatistics stats, String format, String exporterName)
            throws JRException {
        try {
            List<Map<String, Object>> data = stats.getHomestayStats() != null
                    ? stats.getHomestayStats().stream().map(s -> {
                        Map<String, Object> map = new HashMap<>();
                        map.put("homestayName", s.getHomestayName() != null ? s.getHomestayName() : "N/A");
                        map.put("bookingCount", s.getBookingCount() != null ? s.getBookingCount() : 0L);
                        map.put("revenue", s.getTotalRevenue() != null ? s.getTotalRevenue().doubleValue() : 0.0);
                        return map;
                    }).toList()
                    : List.of();

            var reportStream = getClass().getResourceAsStream("/reports/stats.jrxml");
            if (reportStream == null) {
                System.err.println("CRITICAL: /reports/stats.jrxml NOT FOUND");
                throw new RuntimeException("Jasper template /reports/stats.jrxml not found");
            }
            JasperReport jasperReport = JasperCompileManager.compileReport(reportStream);
            JRBeanCollectionDataSource dataSource = new JRBeanCollectionDataSource(data);
            Map<String, Object> parameters = new HashMap<>();
            parameters.put("title", "BÁO CÁO THỐNG KÊ DOANH THU");
            parameters.put("totalRevenue",
                    stats.getTotalRevenue() != null ? stats.getTotalRevenue().doubleValue() : 0.0);
            parameters.put("totalBookings", stats.getTotalBookings() != null ? stats.getTotalBookings() : 0L);
            parameters.put("totalHomestays", stats.getTotalHomestays() != null ? stats.getTotalHomestays() : 0L);
            String exportTime = java.time.format.DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm")
                    .format(java.time.LocalDateTime.now());
            parameters.put("exportDate", exportTime);
            parameters.put("exporterName", exporterName);
            if ("xlsx".equalsIgnoreCase(format)) {
                parameters.put(net.sf.jasperreports.engine.JRParameter.IS_IGNORE_PAGINATION, true);
            }

            JasperPrint jasperPrint = JasperFillManager.fillReport(jasperReport, parameters, dataSource);
            System.out.println("Jasper: Report filled successfully (Host Stats) for " + format);
            return exportToBytes(jasperPrint, format);
        } catch (Exception e) {
            System.err.println("JASPER STATS ERROR: " + e.getClass().getName() + ": " + e.getMessage());
            e.printStackTrace();
            throw new RuntimeException("Error generating stats report: " + e.getMessage(), e);
        }
    }

    public byte[] exportAdminStatsJasper(StatisticsDto.AdminStatistics stats, String format, String exporterName)
            throws JRException {
        try {
            List<Map<String, Object>> data = stats.getTopHomestays() != null
                    ? stats.getTopHomestays().stream().map(s -> {
                        Map<String, Object> map = new HashMap<>();
                        map.put("homestayName", s.getHomestayName() != null ? s.getHomestayName() : "N/A");
                        map.put("bookingCount", s.getBookingCount() != null ? s.getBookingCount() : 0L);
                        map.put("revenue", s.getTotalRevenue() != null ? s.getTotalRevenue().doubleValue() : 0.0);
                        return map;
                    }).toList()
                    : List.of();

            var reportStream = getClass().getResourceAsStream("/reports/stats.jrxml");
            if (reportStream == null) {
                System.err.println("CRITICAL: /reports/stats.jrxml NOT FOUND");
                throw new RuntimeException("Jasper template /reports/stats.jrxml not found");
            }
            JasperReport jasperReport = JasperCompileManager.compileReport(reportStream);
            JRBeanCollectionDataSource dataSource = new JRBeanCollectionDataSource(data);
            Map<String, Object> parameters = new HashMap<>();
            parameters.put("title", "BÁO CÁO THỐNG KÊ QUẢN TRỊ");
            parameters.put("totalRevenue",
                    stats.getTotalRevenue() != null ? stats.getTotalRevenue().doubleValue() : 0.0);
            parameters.put("totalBookings", stats.getTotalBookings() != null ? stats.getTotalBookings() : 0L);
            parameters.put("totalHomestays", stats.getTotalHomestays() != null ? stats.getTotalHomestays() : 0L);
            parameters.put("totalUsers", stats.getTotalUsers() != null ? stats.getTotalUsers() : 0L);
            String exportTime = java.time.format.DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm")
                    .format(java.time.LocalDateTime.now());
            parameters.put("exportDate", exportTime);
            parameters.put("exporterName", exporterName);
            if ("xlsx".equalsIgnoreCase(format)) {
                parameters.put(net.sf.jasperreports.engine.JRParameter.IS_IGNORE_PAGINATION, true);
            }

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
                configuration.setIgnorePageMargins(true);

                net.sf.jasperreports.export.SimpleOutputStreamExporterOutput exporterOutput = new net.sf.jasperreports.export.SimpleOutputStreamExporterOutput(
                        baos);
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
