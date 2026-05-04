package com.example.HomestayDev.camunda;

import com.example.HomestayDev.model.HostUpgradeRequest;
import com.example.HomestayDev.model.enums.UpgradeRequestStatus;
import com.example.HomestayDev.repository.HostUpgradeRequestRepository;
import com.example.HomestayDev.service.EmailService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.camunda.bpm.engine.delegate.DelegateExecution;
import org.camunda.bpm.engine.delegate.JavaDelegate;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

/**
 * Camunda JavaDelegate executed when Admin rejects a host upgrade request.
 * Responsibilities:
 *  1. Update request status to REJECTED in the database.
 *  2. Send a rejection notification email to the user.
 */
@Slf4j
@Component("rejectUpgradeDelegate")
@RequiredArgsConstructor
public class RejectUpgradeDelegate implements JavaDelegate {

    private final HostUpgradeRequestRepository upgradeRequestRepository;
    private final EmailService emailService;

    @Override
    @Transactional
    public void execute(DelegateExecution execution) throws Exception {
        String requestIdStr = (String) execution.getVariable("requestId");
        String adminNote = (String) execution.getVariable("adminNote");

        log.info("[Camunda] RejectUpgradeDelegate executing for requestId={}", requestIdStr);

        UUID requestId = UUID.fromString(requestIdStr);
        HostUpgradeRequest request = upgradeRequestRepository.findById(requestId)
                .orElseThrow(() -> new RuntimeException("HostUpgradeRequest not found: " + requestId));

        // 1. Update DB status
        request.setStatus(UpgradeRequestStatus.REJECTED);
        request.setAdminNote(adminNote);
        upgradeRequestRepository.save(request);

        // 2. Send rejection email
        try {
            emailService.sendUpgradeRejectionEmail(request.getUser(), adminNote);
        } catch (Exception e) {
            log.warn("[Camunda] Failed to send rejection email for user={}: {}", request.getUser().getEmail(), e.getMessage());
        }

        log.info("[Camunda] Request {} REJECTED.", requestId);
    }
}
