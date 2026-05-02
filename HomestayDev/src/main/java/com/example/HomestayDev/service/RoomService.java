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
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.math.BigDecimal;
import java.util.ArrayList;
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
