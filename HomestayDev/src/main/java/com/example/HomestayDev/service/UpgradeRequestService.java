package com.example.HomestayDev.service;

import com.example.HomestayDev.dto.UpgradeRequestDto;
import com.example.HomestayDev.model.HostUpgradeRequest;
import com.example.HomestayDev.model.User;
import com.example.HomestayDev.model.enums.UpgradeRequestStatus;
import com.example.HomestayDev.repository.HostUpgradeRequestRepository;
import com.example.HomestayDev.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.camunda.bpm.engine.RuntimeService;
import org.camunda.bpm.engine.TaskService;
import org.camunda.bpm.engine.task.Task;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class UpgradeRequestService {

    private final HostUpgradeRequestRepository upgradeRequestRepository;
    private final UserRepository userRepository;
    private final RuntimeService runtimeService;
    private final TaskService taskService;
    private final NotificationService notificationService;

    /**
     * Creates a new host upgrade request and starts a Camunda process instance.
     * The process instance tracks the lifecycle of the approval workflow.
     */
    @Transactional
    public UpgradeRequestDto createUpgradeRequest(String username, String userNote, String proofUrl) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (upgradeRequestRepository.existsByUserIdAndStatus(user.getId(), UpgradeRequestStatus.PENDING)) {
            throw new RuntimeException("Bạn đã có yêu cầu nâng cấp đang chờ xử lý.");
        }

        // 1. Save request to DB with status PENDING
        HostUpgradeRequest request = HostUpgradeRequest.builder()
                .user(user)
                .status(UpgradeRequestStatus.PENDING)
                .userNote(userNote)
                .proofUrl(proofUrl)
                .build();
        request = upgradeRequestRepository.save(request);

        // 2. Start Camunda process instance with process variables
        Map<String, Object> variables = new HashMap<>();
        variables.put("requestId", request.getId().toString());
        variables.put("userId", user.getId().toString());
        variables.put("username", user.getUsername());
        variables.put("userEmail", user.getEmail());

        runtimeService.startProcessInstanceByKey("hostUpgradeProcess", variables);

        // Notify User
        notificationService.createNotification(
                user.getUsername(),
                "Y\u00eau c\u1ea7u n\u00e2ng c\u1ea5p l\u00ean Ch\u1ee7 nh\u00e0 c\u1ee7a b\u1ea1n \u0111\u00e3 \u0111\u01b0\u1ee3c g\u1eedi v\u00e0 \u0111ang ch\u1edd ph\u00ea duy\u1ec7t.",
                "SYSTEM",
                request.getId().toString()
        );
        
        // Notify Admin
        notificationService.createNotification(
                "admin",
                "C\u00f3 y\u00eau c\u1ea7u n\u00e2ng c\u1ea5p Host m\u1edbi t\u1eeb " + username,
                "SYSTEM",
                request.getId().toString()
        );

        log.info("[Camunda] Process started for upgradeRequest={}, user={}", request.getId(), username);
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

    /**
     * Admin approves a request by completing the Camunda UserTask with approved=true.
     * The ApproveUpgradeDelegate will then assign the HOST role in Keycloak and update the DB.
     */
    @Transactional
    public UpgradeRequestDto approveRequest(UUID requestId, String adminNote) {
        HostUpgradeRequest request = upgradeRequestRepository.findById(requestId)
                .orElseThrow(() -> new RuntimeException("Request not found"));

        if (request.getStatus() != UpgradeRequestStatus.PENDING) {
            throw new RuntimeException("Request is not in PENDING status.");
        }

        Task task = findCamundaTaskForRequest(requestId.toString());

        Map<String, Object> variables = new HashMap<>();
        variables.put("approved", true);
        variables.put("adminNote", adminNote != null ? adminNote : "");

        taskService.complete(task.getId(), variables);

        // Notify User
        notificationService.createNotification(
                request.getUser().getUsername(),
                "Ch\u00fac m\u1eebng! Y\u00eau c\u1ea7u n\u00e2ng c\u1ea5p l\u00ean Ch\u1ee7 nh\u00e0 c\u1ee7a b\u1ea1n \u0111\u00e3 \u0111\u01b0\u1ee3c ph\u00ea duy\u1ec7t. Vui l\u00f2ng \u0111\u0103ng nh\u1eadp l\u1ea1i \u0111\u1ec3 tr\u1ea3i nghi\u1ec7m c\u00e1c t\u00ednh n\u0103ng m\u1edbi.",
                "SYSTEM",
                request.getId().toString()
        );

        log.info("[Camunda] Task {} completed with APPROVED for requestId={}", task.getId(), requestId);

        // Reload from DB – status is updated by the delegate
        return mapToDto(upgradeRequestRepository.findById(requestId)
                .orElseThrow(() -> new RuntimeException("Request not found after approval")));
    }

    /**
     * Admin rejects a request by completing the Camunda UserTask with approved=false.
     * The RejectUpgradeDelegate will update the DB and send rejection email.
     */
    @Transactional
    public UpgradeRequestDto rejectRequest(UUID requestId, String adminNote) {
        HostUpgradeRequest request = upgradeRequestRepository.findById(requestId)
                .orElseThrow(() -> new RuntimeException("Request not found"));

        if (request.getStatus() != UpgradeRequestStatus.PENDING) {
            throw new RuntimeException("Request is not in PENDING status.");
        }

        Task task = findCamundaTaskForRequest(requestId.toString());

        Map<String, Object> variables = new HashMap<>();
        variables.put("approved", false);
        variables.put("adminNote", adminNote != null ? adminNote : "");

        taskService.complete(task.getId(), variables);

        // Notify User
        notificationService.createNotification(
                request.getUser().getUsername(),
                "Y\u00eau c\u1ea7u n\u00e2ng c\u1ea5p l\u00ean Ch\u1ee7 nh\u00e0 c\u1ee7a b\u1ea1n \u0111\u00e3 b\u1ecb t\u1eeb ch\u1ed1i. L\u00fd do: " + adminNote,
                "SYSTEM",
                request.getId().toString()
        );

        log.info("[Camunda] Task {} completed with REJECTED for requestId={}", task.getId(), requestId);

        // Reload from DB – status is updated by the delegate
        return mapToDto(upgradeRequestRepository.findById(requestId)
                .orElseThrow(() -> new RuntimeException("Request not found after rejection")));
    }

    /**
     * Returns the Camunda Task ID for a given upgrade request.
     * Useful for the admin UI to reference the task if needed.
     */
    public String getCamundaTaskId(UUID requestId) {
        Task task = findCamundaTaskForRequest(requestId.toString());
        return task.getId();
    }

    private Task findCamundaTaskForRequest(String requestId) {
        List<Task> tasks = taskService.createTaskQuery()
                .processDefinitionKey("hostUpgradeProcess")
                .processVariableValueEquals("requestId", requestId)
                .list();

        if (tasks.isEmpty()) {
            throw new RuntimeException("No active Camunda task found for requestId=" + requestId
                    + ". The process may have already been completed or not yet started.");
        }
        return tasks.get(0);
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
