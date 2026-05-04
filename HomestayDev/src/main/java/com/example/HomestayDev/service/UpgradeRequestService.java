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
