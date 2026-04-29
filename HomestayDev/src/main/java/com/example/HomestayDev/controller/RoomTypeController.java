package com.example.HomestayDev.controller;

import com.example.HomestayDev.dto.RoomTypeDto;
import com.example.HomestayDev.service.RoomTypeService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:4200")
public class RoomTypeController {

    private final RoomTypeService roomTypeService;

    // Public: cho host và user xem
    @GetMapping(value = "/room-types", produces = "application/json;charset=UTF-8")
    public ResponseEntity<List<RoomTypeDto>> getAllRoomTypes() {
        return ResponseEntity.ok(roomTypeService.getAll());
    }

    // Admin
    @PostMapping(value = "/admin/room-types", produces = "application/json;charset=UTF-8", consumes = "application/json;charset=UTF-8")
    public ResponseEntity<RoomTypeDto> createRoomType(@RequestBody RoomTypeDto dto) {
        return ResponseEntity.ok(roomTypeService.create(dto));
    }

    @PutMapping("/admin/room-types/{id}")
    public ResponseEntity<RoomTypeDto> updateRoomType(@PathVariable Long id, @RequestBody RoomTypeDto dto) {
        return ResponseEntity.ok(roomTypeService.update(id, dto));
    }

    @DeleteMapping("/admin/room-types/{id}")
    public ResponseEntity<Void> deleteRoomType(@PathVariable Long id) {
        roomTypeService.delete(id);
        return ResponseEntity.ok().build();
    }
}
