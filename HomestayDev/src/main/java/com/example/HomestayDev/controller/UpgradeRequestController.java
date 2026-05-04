package com.example.HomestayDev.controller;

import com.example.HomestayDev.dto.UpgradeRequestDto;
import com.example.HomestayDev.service.FileStorageService;
import com.example.HomestayDev.service.UpgradeRequestService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:4200")
public class UpgradeRequestController {

    private final UpgradeRequestService upgradeRequestService;
    private final FileStorageService fileStorageService;

    // =========================================================
    // USER ENDPOINTS
    // =========================================================

    @PostMapping(value = "/user/upgrade-request", consumes = "multipart/form-data")
    public ResponseEntity<UpgradeRequestDto> createUpgradeRequest(
            @RequestParam(value = "userNote", required = false) String userNote,
            @RequestParam(value = "file", required = false) MultipartFile file) {

        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String username = authentication.getName();

        String proofUrl = null;
        if (file != null && !file.isEmpty()) {
            proofUrl = fileStorageService.storeFile(file);
        }

        return ResponseEntity.ok(upgradeRequestService.createUpgradeRequest(username, userNote, proofUrl));
    }

    @GetMapping("/user/upgrade-request/status")
    public ResponseEntity<UpgradeRequestDto> getMyRequestStatus() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String username = authentication.getName();
        UpgradeRequestDto dto = upgradeRequestService.getMyPendingRequest(username);
        return dto != null ? ResponseEntity.ok(dto) : ResponseEntity.notFound().build();
    }

    // =========================================================
    // ADMIN ENDPOINTS
    // =========================================================

    @GetMapping("/admin/upgrade-requests")
    public ResponseEntity<List<UpgradeRequestDto>> getPendingRequests() {
        return ResponseEntity.ok(upgradeRequestService.getPendingRequests());
    }

    /**
     * Returns the Camunda task ID for a given upgrade request.
     * Can be used by the frontend or admin tools to reference the task directly.
     */
    @GetMapping("/admin/upgrade-requests/{id}/task")
    public ResponseEntity<Map<String, String>> getCamundaTaskId(@PathVariable UUID id) {
        String taskId = upgradeRequestService.getCamundaTaskId(id);
        return ResponseEntity.ok(Map.of("taskId", taskId));
    }

    /**
     * Approves the upgrade request by completing the Camunda UserTask with approved=true.
     * The ApproveUpgradeDelegate then handles Keycloak role assignment and email notification.
     */
    @PostMapping("/admin/upgrade-requests/{id}/approve")
    public ResponseEntity<UpgradeRequestDto> approveRequest(
            @PathVariable UUID id,
            @RequestBody Map<String, String> body) {
        String adminNote = body.get("adminNote");
        return ResponseEntity.ok(upgradeRequestService.approveRequest(id, adminNote));
    }

    /**
     * Rejects the upgrade request by completing the Camunda UserTask with approved=false.
     * The RejectUpgradeDelegate then updates the DB and sends a rejection email.
     */
    @PostMapping("/admin/upgrade-requests/{id}/reject")
    public ResponseEntity<UpgradeRequestDto> rejectRequest(
            @PathVariable UUID id,
            @RequestBody Map<String, String> body) {
        String adminNote = body.get("adminNote");
        return ResponseEntity.ok(upgradeRequestService.rejectRequest(id, adminNote));
    }
}
