package com.example.HomestayDev.service;

import com.example.HomestayDev.dto.AmenityDto;
import com.example.HomestayDev.dto.HomestayDto;
import com.example.HomestayDev.dto.HomestayImageDto;
import com.example.HomestayDev.model.*;
import com.example.HomestayDev.model.enums.HomestayStatus;
import com.example.HomestayDev.repository.AmenityRepository;
import com.example.HomestayDev.repository.HomestayAmenityRepository;
import com.example.HomestayDev.repository.HomestayImageRepository;
import com.example.HomestayDev.repository.HomestayRepository;
import com.example.HomestayDev.repository.UserRepository;
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
public class HomestayService {

    private final HomestayRepository homestayRepository;
    private final HomestayImageRepository homestayImageRepository;
    private final HomestayAmenityRepository homestayAmenityRepository;
    private final UserRepository userRepository;
    private final AmenityRepository amenityRepository;
    private final FileStorageService fileStorageService;

    // PUBLIC
    public List<HomestayDto> getActiveHomestays() {
        return homestayRepository.findByStatus(HomestayStatus.ACTIVE).stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    // HOST
    public List<HomestayDto> getHostHomestays(String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));
        return homestayRepository.findByHostId(user.getId()).stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    @Transactional
    public HomestayDto createHomestay(String username, String name, String description, String address, String city,
                                      BigDecimal pricePerNight, Integer maxGuests, List<Long> amenityIds, List<MultipartFile> images) {
        User host = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("Host not found"));

        Homestay homestay = Homestay.builder()
                .host(host)
                .name(name)
                .description(description)
                .address(address)
                .city(city)
                .pricePerNight(pricePerNight)
                .maxGuests(maxGuests)
                .status(HomestayStatus.PENDING)
                .build();

        Homestay savedHomestay = homestayRepository.save(homestay);

        saveAmenitiesAndImages(savedHomestay, amenityIds, images);

        return mapToDto(homestayRepository.findById(savedHomestay.getId()).get());
    }

    @Transactional
    public HomestayDto updateHomestay(UUID homestayId, String username, String name, String description, String address, String city,
                                      BigDecimal pricePerNight, Integer maxGuests, List<Long> amenityIds, List<MultipartFile> images) {
        Homestay homestay = homestayRepository.findById(homestayId)
                .orElseThrow(() -> new RuntimeException("Homestay not found"));

        if (!homestay.getHost().getUsername().equals(username)) {
            throw new RuntimeException("Not authorized to update this homestay");
        }

        homestay.setName(name);
        homestay.setDescription(description);
        homestay.setAddress(address);
        homestay.setCity(city);
        homestay.setPricePerNight(pricePerNight);
        homestay.setMaxGuests(maxGuests);
        homestay.setStatus(HomestayStatus.PENDING); // Need to be re-approved
        homestay.setAdminReason(null);

        Homestay savedHomestay = homestayRepository.save(homestay);

        // Delete old amenities and images
        homestayAmenityRepository.deleteByHomestayId(homestayId);
        // Note: we might not want to delete old images if new images aren't provided, 
        // but for simplicity, if images are provided, we overwrite. If not, we keep old ones.
        if (images != null && !images.isEmpty()) {
            homestayImageRepository.deleteByHomestayId(homestayId);
        }

        saveAmenitiesAndImages(savedHomestay, amenityIds, images);

        return mapToDto(homestayRepository.findById(homestayId).get());
    }

    @Transactional
    public void deleteHomestay(UUID homestayId, String username) {
        Homestay homestay = homestayRepository.findById(homestayId)
                .orElseThrow(() -> new RuntimeException("Homestay not found"));

        if (!homestay.getHost().getUsername().equals(username)) {
            throw new RuntimeException("Not authorized to delete this homestay");
        }

        homestayRepository.delete(homestay);
    }

    private void saveAmenitiesAndImages(Homestay homestay, List<Long> amenityIds, List<MultipartFile> images) {
        if (amenityIds != null) {
            for (Long aId : amenityIds) {
                amenityRepository.findById(aId).ifPresent(amenity -> {
                    HomestayAmenity ha = HomestayAmenity.builder()
                            .homestay(homestay)
                            .amenity(amenity)
                            .build();
                    homestayAmenityRepository.save(ha);
                });
            }
        }

        if (images != null && !images.isEmpty()) {
            boolean isFirst = true;
            for (MultipartFile file : images) {
                if (file.isEmpty()) continue;
                String url = fileStorageService.storeFile(file);
                HomestayImage hi = HomestayImage.builder()
                        .homestay(homestay)
                        .url(url)
                        .isPrimary(isFirst)
                        .build();
                homestayImageRepository.save(hi);
                isFirst = false;
            }
        }
    }

    // ADMIN
    public List<HomestayDto> getAllHomestays() {
        return homestayRepository.findAll().stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    @Transactional
    public HomestayDto updateStatus(UUID id, HomestayStatus status, String adminReason) {
        Homestay homestay = homestayRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Homestay not found"));

        homestay.setStatus(status);
        homestay.setAdminReason(adminReason);

        return mapToDto(homestayRepository.save(homestay));
    }

    // MAPPER
    private HomestayDto mapToDto(Homestay homestay) {
        List<HomestayImageDto> images = new ArrayList<>();
        if (homestay.getHomestayImages() != null) {
            images = homestay.getHomestayImages().stream().map(img -> HomestayImageDto.builder()
                    .id(img.getId())
                    .url(img.getUrl())
                    .isPrimary(img.isPrimary())
                    .build()).collect(Collectors.toList());
        }

        List<AmenityDto> amenities = new ArrayList<>();
        if (homestay.getHomestayAmenities() != null) {
            amenities = homestay.getHomestayAmenities().stream().map(ha -> AmenityDto.builder()
                    .id(ha.getAmenity().getId())
                    .name(ha.getAmenity().getName())
                    .iconUrl(ha.getAmenity().getIconUrl())
                    .build()).collect(Collectors.toList());
        }

        return HomestayDto.builder()
                .id(homestay.getId())
                .name(homestay.getName())
                .description(homestay.getDescription())
                .address(homestay.getAddress())
                .city(homestay.getCity())
                .pricePerNight(homestay.getPricePerNight())
                .maxGuests(homestay.getMaxGuests())
                .status(homestay.getStatus())
                .adminReason(homestay.getAdminReason())
                .createdAt(homestay.getCreatedAt())
                .hostId(homestay.getHost().getId())
                .hostName(homestay.getHost().getUsername())
                .images(images)
                .amenities(amenities)
                .build();
    }
}
