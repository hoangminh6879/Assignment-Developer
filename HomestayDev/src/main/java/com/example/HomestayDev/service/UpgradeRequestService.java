package com.example.HomestayDev.service;

import com.example.HomestayDev.dto.UpgradeRequestDto;
import com.example.HomestayDev.model.HostUpgradeRequest;
import com.example.HomestayDev.model.User;
import com.example.HomestayDev.model.enums.UpgradeRequestStatus;
import com.example.HomestayDev.repository.HostUpgradeRequestRepository;
import com.example.HomestayDev.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.keycloak.admin.client.Keycloak;
import org.keycloak.admin.client.resource.RealmResource;
import org.keycloak.admin.client.resource.UserResource;
import org.keycloak.representations.idm.RoleRepresentation;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Collections;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class UpgradeRequestService {

    private final HostUpgradeRequestRepository upgradeRequestRepository;
    private final UserRepository userRepository;
    private final Keycloak keycloak;

    @Value("${keycloak.realm}")
    private String realm;

    @Transactional
    public UpgradeRequestDto createUpgradeRequest(String username, String userNote, String proofUrl) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (upgradeRequestRepository.existsByUserIdAndStatus(user.getId(), UpgradeRequestStatus.PENDING)) {
            throw new RuntimeException("You already have a pending upgrade request.");
        }

        HostUpgradeRequest request = HostUpgradeRequest.builder()
                .user(user)
                .status(UpgradeRequestStatus.PENDING)
                .userNote(userNote)
                .proofUrl(proofUrl)
                .build();

        request = upgradeRequestRepository.save(request);
        return mapToDto(request);
    }

    public List<UpgradeRequestDto> getPendingRequests() {
        return upgradeRequestRepository.findByStatusOrderByCreatedAtDesc(UpgradeRequestStatus.PENDING)
                .stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    public UpgradeRequestDto getMyPendingRequest(String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));
        return upgradeRequestRepository.findByUserIdAndStatus(user.getId(), UpgradeRequestStatus.PENDING)
                .map(this::mapToDto)
                .orElse(null);
    }

    @Transactional
    public UpgradeRequestDto approveRequest(UUID requestId, String adminNote) {
        HostUpgradeRequest request = upgradeRequestRepository.findById(requestId)
                .orElseThrow(() -> new RuntimeException("Request not found"));

        if (request.getStatus() != UpgradeRequestStatus.PENDING) {
            throw new RuntimeException("Request is not pending.");
        }

        request.setStatus(UpgradeRequestStatus.APPROVED);
        request.setAdminNote(adminNote);
        
        // Assign HOST role in Keycloak
        assignHostRoleInKeycloak(request.getUser().getKeycloakId().toString());

        request = upgradeRequestRepository.save(request);
        return mapToDto(request);
    }

    @Transactional
    public UpgradeRequestDto rejectRequest(UUID requestId, String adminNote) {
        HostUpgradeRequest request = upgradeRequestRepository.findById(requestId)
                .orElseThrow(() -> new RuntimeException("Request not found"));

        if (request.getStatus() != UpgradeRequestStatus.PENDING) {
            throw new RuntimeException("Request is not pending.");
        }

        request.setStatus(UpgradeRequestStatus.REJECTED);
        request.setAdminNote(adminNote);

        request = upgradeRequestRepository.save(request);
        return mapToDto(request);
    }

    private void assignHostRoleInKeycloak(String keycloakUserId) {
        RealmResource realmResource = keycloak.realm(realm);
        UserResource userResource = realmResource.users().get(keycloakUserId);
        
        RoleRepresentation hostRole = realmResource.roles().get("HOST").toRepresentation();
        
        userResource.roles().realmLevel().add(Collections.singletonList(hostRole));
    }

    private UpgradeRequestDto mapToDto(HostUpgradeRequest request) {
        return UpgradeRequestDto.builder()
                .id(request.getId())
                .userId(request.getUser().getId())
                .username(request.getUser().getUsername())
                .email(request.getUser().getEmail())
                .status(request.getStatus())
                .userNote(request.getUserNote())
                .proofUrl(request.getProofUrl())
                .adminNote(request.getAdminNote())
                .createdAt(request.getCreatedAt())
                .updatedAt(request.getUpdatedAt())
                .build();
    }
}
