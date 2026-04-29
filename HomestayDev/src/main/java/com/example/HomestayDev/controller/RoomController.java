package com.example.HomestayDev.controller;

import com.example.HomestayDev.dto.RoomDto;
import com.example.HomestayDev.service.RoomService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/host")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:4200")
public class RoomController {

    private final RoomService roomService;

    @GetMapping("/homestays/{homestayId}/rooms")
    public ResponseEntity<List<RoomDto>> getRoomsByHomestay(@PathVariable UUID homestayId) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        return ResponseEntity.ok(roomService.getRoomsByHomestay(homestayId, auth.getName()));
    }

    @PostMapping(value = "/homestays/{homestayId}/rooms", consumes = "multipart/form-data")
    public ResponseEntity<RoomDto> createRoom(
            @PathVariable UUID homestayId,
            @RequestParam("name") String name,
            @RequestParam("roomTypeId") Long roomTypeId,
            @RequestParam("priceExtra") BigDecimal priceExtra,
            @RequestParam("maxGuests") Integer maxGuests,
            @RequestParam(value = "images", required = false) List<MultipartFile> images
    ) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        return ResponseEntity.ok(roomService.createRoom(homestayId, name, roomTypeId, priceExtra, maxGuests, images, auth.getName()));
    }

    @PutMapping(value = "/rooms/{roomId}", consumes = "multipart/form-data")
    public ResponseEntity<RoomDto> updateRoom(
            @PathVariable UUID roomId,
            @RequestParam("name") String name,
            @RequestParam("roomTypeId") Long roomTypeId,
            @RequestParam("priceExtra") BigDecimal priceExtra,
            @RequestParam("maxGuests") Integer maxGuests,
            @RequestParam(value = "status", required = false) String status,
            @RequestParam(value = "images", required = false) List<MultipartFile> images
    ) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        return ResponseEntity.ok(roomService.updateRoom(roomId, name, roomTypeId, priceExtra, maxGuests, status, images, auth.getName()));
    }

    @DeleteMapping("/rooms/{roomId}")
    public ResponseEntity<Void> deleteRoom(@PathVariable UUID roomId) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        roomService.deleteRoom(roomId, auth.getName());
        return ResponseEntity.ok().build();
    }
}
