package com.example.HomestayDev.service;

import com.example.HomestayDev.dto.RoomTypeDto;
import com.example.HomestayDev.model.RoomType;
import com.example.HomestayDev.repository.RoomTypeRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class RoomTypeService {

    private final RoomTypeRepository roomTypeRepository;

    public List<RoomTypeDto> getAll() {
        return roomTypeRepository.findAll().stream()
                .map(rt -> new RoomTypeDto(rt.getId(), rt.getName(), rt.getDescription()))
                .collect(Collectors.toList());
    }

    public RoomTypeDto create(RoomTypeDto dto) {
        System.out.println("DEBUG: Creating RoomType with name: " + dto.getName());
        if (roomTypeRepository.existsByName(dto.getName())) {
            throw new RuntimeException("Room type name already exists");
        }
        RoomType rt = RoomType.builder()
                .name(dto.getName())
                .description(dto.getDescription())
                .build();
        RoomType saved = roomTypeRepository.save(rt);
        return new RoomTypeDto(saved.getId(), saved.getName(), saved.getDescription());
    }

    public RoomTypeDto update(Long id, RoomTypeDto dto) {
        RoomType rt = roomTypeRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Room type not found"));
        
        if (!rt.getName().equals(dto.getName()) && roomTypeRepository.existsByName(dto.getName())) {
            throw new RuntimeException("Room type name already exists");
        }

        rt.setName(dto.getName());
        rt.setDescription(dto.getDescription());
        RoomType saved = roomTypeRepository.save(rt);
        return new RoomTypeDto(saved.getId(), saved.getName(), saved.getDescription());
    }

    public void delete(Long id) {
        roomTypeRepository.deleteById(id);
    }
}
