package com.example.HomestayDev.service;

import com.example.HomestayDev.dto.AmenityDto;
import com.example.HomestayDev.model.Amenity;
import com.example.HomestayDev.repository.AmenityRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AmenityService {

    private final AmenityRepository amenityRepository;

    public List<AmenityDto> getAllAmenities() {
        return amenityRepository.findAll().stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    public AmenityDto createAmenity(AmenityDto dto) {
        Amenity amenity = Amenity.builder()
                .name(dto.getName())
                .iconUrl(dto.getIconUrl())
                .build();
        return mapToDto(amenityRepository.save(amenity));
    }

    public void deleteAmenity(Long id) {
        amenityRepository.deleteById(id);
    }

    private AmenityDto mapToDto(Amenity amenity) {
        return AmenityDto.builder()
                .id(amenity.getId())
                .name(amenity.getName())
                .iconUrl(amenity.getIconUrl())
                .build();
    }
}
