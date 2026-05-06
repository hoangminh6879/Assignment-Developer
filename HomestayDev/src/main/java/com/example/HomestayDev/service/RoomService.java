package com.example.HomestayDev.service;

import com.example.HomestayDev.dto.HomestayImageDto;
import com.example.HomestayDev.dto.RoomDto;
import com.example.HomestayDev.model.Homestay;
import com.example.HomestayDev.model.Image;
import com.example.HomestayDev.model.Room;
import com.example.HomestayDev.model.RoomType;
import com.example.HomestayDev.model.enums.RoomStatus;
import com.example.HomestayDev.repository.HomestayRepository;
import com.example.HomestayDev.repository.ImageRepository;
import com.example.HomestayDev.repository.RoomRepository;
import com.example.HomestayDev.repository.RoomTypeRepository;
import lombok.RequiredArgsConstructor;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.Iterator;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class RoomService {

    private final RoomRepository roomRepository;
    private final RoomTypeRepository roomTypeRepository;
    private final HomestayRepository homestayRepository;
    private final ImageRepository imageRepository;
    private final FileStorageService fileStorageService;

    public List<RoomDto> getRoomsByHomestay(UUID homestayId, String hostUsername) {
        Homestay homestay = homestayRepository.findById(homestayId)
                .orElseThrow(() -> new RuntimeException("Homestay not found"));
        if (!homestay.getHost().getUsername().equals(hostUsername)) {
            throw new RuntimeException("Unauthorized");
        }
        return roomRepository.findByHomestayId(homestayId).stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    @Transactional
    public RoomDto createRoom(UUID homestayId, String name, Long roomTypeId, BigDecimal priceExtra, Integer maxGuests, List<MultipartFile> images, String hostUsername) {
        Homestay homestay = homestayRepository.findById(homestayId)
                .orElseThrow(() -> new RuntimeException("Homestay not found"));
        if (!homestay.getHost().getUsername().equals(hostUsername)) {
            throw new RuntimeException("Unauthorized");
        }

        if (!homestay.getStatus().name().equals("ACTIVE")) {
            throw new RuntimeException("Chỉ có thể thêm phòng cho Homestay đã được phê duyệt và đang hoạt động.");
        }

        RoomType roomType = roomTypeRepository.findById(roomTypeId)
                .orElseThrow(() -> new RuntimeException("Room type not found"));

        Room room = Room.builder()
                .name(name)
                .homestay(homestay)
                .roomType(roomType)
                .priceExtra(priceExtra)
                .maxGuests(maxGuests)
                .build();

        Room savedRoom = roomRepository.save(room);

        if (images != null && !images.isEmpty()) {
            boolean isFirst = true;
            for (MultipartFile file : images) {
                if (file.isEmpty()) continue;
                String url = fileStorageService.storeFile(file);
                Image img = Image.builder()
                        .room(savedRoom)
                        .url(url)
                        .isPrimary(isFirst)
                        .build();
                imageRepository.save(img);
                isFirst = false;
            }
        }

        return mapToDto(roomRepository.findById(savedRoom.getId()).get());
    }

    @Transactional
    public void importRooms(UUID homestayId, MultipartFile file, String hostUsername) {
        Homestay homestay = homestayRepository.findById(homestayId)
                .orElseThrow(() -> new RuntimeException("Homestay not found"));
        if (!homestay.getHost().getUsername().equals(hostUsername)) {
            throw new RuntimeException("Unauthorized");
        }

        try (Workbook workbook = new XSSFWorkbook(file.getInputStream())) {
            Sheet sheet = workbook.getSheetAt(0);
            Iterator<Row> rows = sheet.iterator();

            // Skip header
            if (rows.hasNext()) rows.next();

            List<Room> rooms = new ArrayList<>();
            java.util.Set<String> namesInFile = new java.util.HashSet<>();
            java.util.List<String> duplicateNamesInFile = new java.util.ArrayList<>();
            java.util.List<String> existingNamesInDb = new java.util.ArrayList<>();

            while (rows.hasNext()) {
                Row row = rows.next();
                if (isRowEmpty(row)) continue;

                String name = getCellValueAsString(row.getCell(0));
                if (name == null || name.isBlank()) continue;

                // Check for duplicate in the same file
                if (namesInFile.contains(name.toLowerCase())) {
                    duplicateNamesInFile.add(name);
                } else {
                    namesInFile.add(name.toLowerCase());
                }

                // Check if room name already exists in this homestay
                if (roomRepository.existsByNameAndHomestayId(name, homestayId)) {
                    existingNamesInDb.add(name);
                }

                String typeName = getCellValueAsString(row.getCell(1));
                RoomType roomType = roomTypeRepository.findByName(typeName)
                        .orElseThrow(() -> new RuntimeException("Room type '" + typeName + "' not found"));

                BigDecimal priceExtra = getCellValueAsBigDecimal(row.getCell(2));
                Integer maxGuests = getCellValueAsInteger(row.getCell(3));

                Room room = Room.builder()
                        .name(name)
                        .homestay(homestay)
                        .roomType(roomType)
                        .priceExtra(priceExtra != null ? priceExtra : BigDecimal.ZERO)
                        .maxGuests(maxGuests != null ? maxGuests : 2)
                        .status(RoomStatus.AVAILABLE)
                        .build();

                rooms.add(room);
            }

            // Throw exception if any duplicates were found
            if (!duplicateNamesInFile.isEmpty() || !existingNamesInDb.isEmpty()) {
                StringBuilder errorMsg = new StringBuilder("Lỗi import Phòng: ");
                if (!duplicateNamesInFile.isEmpty()) {
                    errorMsg.append("\n- Các tên phòng trùng lặp trong file: ").append(String.join(", ", duplicateNamesInFile));
                }
                if (!existingNamesInDb.isEmpty()) {
                    errorMsg.append("\n- Các tên phòng đã tồn tại trong Homestay này: ").append(String.join(", ", existingNamesInDb));
                }
                throw new RuntimeException(errorMsg.toString());
            }

            roomRepository.saveAll(rooms);
        } catch (IOException e) {
            throw new RuntimeException("Failed to parse Excel file: " + e.getMessage());
        }
    }

    private boolean isRowEmpty(Row row) {
        if (row == null) return true;
        for (int c = row.getFirstCellNum(); c < row.getLastCellNum(); c++) {
            Cell cell = row.getCell(c);
            if (cell != null && cell.getCellType() != CellType.BLANK) return false;
        }
        return true;
    }

    private String getCellValueAsString(Cell cell) {
        if (cell == null) return null;
        switch (cell.getCellType()) {
            case STRING: return cell.getStringCellValue();
            case NUMERIC: return String.valueOf((long) cell.getNumericCellValue());
            case BOOLEAN: return String.valueOf(cell.getBooleanCellValue());
            default: return null;
        }
    }

    private BigDecimal getCellValueAsBigDecimal(Cell cell) {
        if (cell == null) return null;
        if (cell.getCellType() == CellType.NUMERIC) {
            return BigDecimal.valueOf(cell.getNumericCellValue());
        } else if (cell.getCellType() == CellType.STRING) {
            try {
                return new BigDecimal(cell.getStringCellValue());
            } catch (Exception e) {
                return null;
            }
        }
        return null;
    }

    private Integer getCellValueAsInteger(Cell cell) {
        if (cell == null) return null;
        if (cell.getCellType() == CellType.NUMERIC) {
            return (int) cell.getNumericCellValue();
        } else if (cell.getCellType() == CellType.STRING) {
            try {
                return Integer.parseInt(cell.getStringCellValue());
            } catch (Exception e) {
                return null;
            }
        }
        return null;
    }

    @Transactional
    public RoomDto updateRoom(UUID roomId, String name, Long roomTypeId, BigDecimal priceExtra, Integer maxGuests, String status, List<MultipartFile> images, String hostUsername) {
        Room room = roomRepository.findById(roomId)
                .orElseThrow(() -> new RuntimeException("Room not found"));

        if (!room.getHomestay().getHost().getUsername().equals(hostUsername)) {
            throw new RuntimeException("Unauthorized");
        }

        if (!room.getHomestay().getStatus().name().equals("ACTIVE")) {
            throw new RuntimeException("Chỉ có thể chỉnh sửa phòng cho Homestay đã được phê duyệt và đang hoạt động.");
        }

        RoomType roomType = roomTypeRepository.findById(roomTypeId)
                .orElseThrow(() -> new RuntimeException("Room type not found"));

        room.setName(name);
        room.setRoomType(roomType);
        room.setPriceExtra(priceExtra);
        room.setMaxGuests(maxGuests);
        if (status != null && !status.isBlank()) {
            room.setStatus(RoomStatus.valueOf(status));
        }

        Room savedRoom = roomRepository.save(room);

        if (images != null && !images.isEmpty()) {
            imageRepository.deleteByRoomId(roomId);
            boolean isFirst = true;
            for (MultipartFile file : images) {
                if (file.isEmpty()) continue;
                String url = fileStorageService.storeFile(file);
                Image img = Image.builder()
                        .room(savedRoom)
                        .url(url)
                        .isPrimary(isFirst)
                        .build();
                imageRepository.save(img);
                isFirst = false;
            }
        }

        return mapToDto(roomRepository.findById(roomId).get());
    }

    @Transactional
    public void deleteRoom(UUID roomId, String hostUsername) {
        Room room = roomRepository.findById(roomId)
                .orElseThrow(() -> new RuntimeException("Room not found"));

        if (!room.getHomestay().getHost().getUsername().equals(hostUsername)) {
            throw new RuntimeException("Unauthorized");
        }

        roomRepository.delete(room);
    }

    private RoomDto mapToDto(Room room) {
        List<HomestayImageDto> images = new ArrayList<>();
        if (room.getImages() != null) {
            images = room.getImages().stream().map(img -> HomestayImageDto.builder()
                    .id(img.getId())
                    .url(img.getUrl())
                    .isPrimary(img.isPrimary())
                    .build()).collect(Collectors.toList());
        }

        return RoomDto.builder()
                .id(room.getId())
                .name(room.getName())
                .roomTypeId(room.getRoomType().getId())
                .roomTypeName(room.getRoomType().getName())
                .priceExtra(room.getPriceExtra())
                .maxGuests(room.getMaxGuests())
                .status(room.getStatus())
                .homestayId(room.getHomestay().getId())
                .images(images)
                .build();
    }
}
