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
import com.example.HomestayDev.repository.ReviewRepository;
import com.example.HomestayDev.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import org.camunda.bpm.engine.RuntimeService;
import org.camunda.bpm.engine.TaskService;
import org.camunda.bpm.engine.task.Task;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
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
    private final ReviewRepository reviewRepository;
    private final NotificationService notificationService;
    private final RuntimeService runtimeService;
    private final TaskService taskService;

    // PUBLIC
    public List<HomestayDto> getActiveHomestays() {
        return homestayRepository.findByStatus(HomestayStatus.ACTIVE).stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    public HomestayDto getHomestayById(UUID id) {
        return homestayRepository.findById(id)
                .map(this::mapToDto)
                .orElseThrow(() -> new RuntimeException("Homestay not found"));
    }

    @Transactional
    public void incrementViewCount(UUID id) {
        homestayRepository.findById(id).ifPresent(homestay -> {
            Long currentViews = homestay.getViewCount();
            homestay.setViewCount((currentViews == null ? 0 : currentViews) + 1);
            homestayRepository.save(homestay);
        });
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

        // Notify Admin (or just system log for now, but usually we notify host that it's pending)
        notificationService.createNotification(
                host.getUsername(),
                "Homestay '" + name + "' c\u1ee7a b\u1ea1n \u0111\u00e3 \u0111\u01b0\u1ee3c t\u1ea1o v\u00e0 \u0111ang ch\u1edd qu\u1ea3n tr\u1ecb vi\u00ean ph\u00ea duy\u1ec7t.",
                "HOMESTAY",
                savedHomestay.getId().toString()
        );

        // Notify Admin
        notificationService.createNotification(
                "admin",
                "C\u00f3 Homestay m\u1edbi \u0111ang ch\u1edd ph\u00ea duy\u1ec7t: " + name,
                "HOMESTAY",
                savedHomestay.getId().toString()
        );

        // Start Camunda Process
        Map<String, Object> variables = new HashMap<>();
        variables.put("homestayId", savedHomestay.getId().toString());
        variables.put("hostUsername", host.getUsername());
        variables.put("homestayName", savedHomestay.getName());
        runtimeService.startProcessInstanceByKey("homestayApprovalProcess", savedHomestay.getId().toString(), variables);

        return mapToDto(homestayRepository.findById(savedHomestay.getId()).get());
    }

    @Transactional
    public HomestayDto updateHomestay(UUID homestayId, String username, String name, String description, String address, String city,
                                      BigDecimal pricePerNight, Integer maxGuests, List<Long> amenityIds, List<MultipartFile> images, 
                                      List<UUID> deleteImageIds) {
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
        homestay.setStatus(HomestayStatus.ACTIVE); 
        homestay.setAdminReason(null);

        Homestay savedHomestay = homestayRepository.save(homestay);

        // Delete specific images
        if (deleteImageIds != null && !deleteImageIds.isEmpty()) {
            for (UUID imgId : deleteImageIds) {
                homestayImageRepository.findById(imgId).ifPresent(img -> {
                    if (img.getHomestay().getId().equals(homestayId)) {
                        fileStorageService.deleteFile(img.getUrl());
                        homestayImageRepository.delete(img);
                    }
                });
            }
        }

        // Delete old amenities
        homestayAmenityRepository.deleteByHomestayId(homestayId);

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

        // Find Camunda Task
        Task task = taskService.createTaskQuery()
                .processInstanceBusinessKey(id.toString())
                .taskDefinitionKey("reviewTask")
                .singleResult();

        if (task == null) {
            // Fallback for homestays without Camunda process
            homestay.setStatus(status);
            homestay.setAdminReason(adminReason);
            Homestay saved = homestayRepository.save(homestay);
            
            String message = status == HomestayStatus.ACTIVE ? 
                    "Ch\u00fac m\u1eebng! Homestay '" + homestay.getName() + "' c\u1ee7a b\u1ea1n \u0111\u00e3 \u0111\u01b0\u1ee3c ph\u00ea duy\u1ec7t v\u00e0 hi\u1ec3n th\u1ecb tr\u00ean h\u1ec7 th\u1ed1ng." :
                    "Homestay '" + homestay.getName() + "' c\u1ee7a b\u1ea1n \u0111\u00e3 b\u1ecb t\u1eeb ch\u1ed1i. L\u00fd do: " + adminReason;
            
            notificationService.createNotification(homestay.getHost().getUsername(), message, "HOMESTAY", homestay.getId().toString());
            return mapToDto(saved);
        }

        // Complete Camunda Task
        Map<String, Object> variables = new HashMap<>();
        boolean isApproved = (status == HomestayStatus.ACTIVE);
        variables.put("approved", isApproved);
        variables.put("adminReason", adminReason);

        taskService.complete(task.getId(), variables);

        Homestay updatedHomestay = homestayRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Homestay not found after task completion"));

        return mapToDto(updatedHomestay);
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

        List<String> roomTypeNames = new ArrayList<>();
        if (homestay.getRooms() != null) {
            roomTypeNames = homestay.getRooms().stream()
                    .map(room -> room.getRoomType().getName())
                    .distinct()
                    .collect(Collectors.toList());
        }

        List<Review> reviews = reviewRepository.findByBookingHomestayId(homestay.getId());
        Double avgRating = reviews.isEmpty() ? 0.0 : reviews.stream().mapToInt(Review::getRating).average().orElse(0.0);
        Integer reviewCount = reviews.size();

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
                .viewCount(homestay.getViewCount())
                .images(images)
                .amenities(amenities)
                .roomTypeNames(roomTypeNames)
                .averageRating(avgRating)
                .reviewCount(reviewCount)
                .build();
    }
}
