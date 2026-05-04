package com.example.HomestayDev.camunda;

import com.example.HomestayDev.model.HostUpgradeRequest;
import com.example.HomestayDev.model.enums.UpgradeRequestStatus;
import com.example.HomestayDev.repository.HostUpgradeRequestRepository;
import com.example.HomestayDev.service.EmailService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.camunda.bpm.engine.delegate.DelegateExecution;
import org.camunda.bpm.engine.delegate.JavaDelegate;
import org.keycloak.admin.client.Keycloak;
import org.keycloak.admin.client.resource.RealmResource;
import org.keycloak.admin.client.resource.UserResource;
import org.keycloak.representations.idm.RoleRepresentation;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.Collections;
import java.util.UUID;

/**
 * Camunda JavaDelegate executed when Admin approves a host upgrade request.
 * Responsibilities:
 *  1. Update request status to APPROVED in the database.
 *  2. Assign the HOST role to the user in Keycloak.
 *  3. Send an approval notification email to the user.
 */
@Slf4j
@Component("approveUpgradeDelegate")
@RequiredArgsConstructor
public class ApproveUpgradeDelegate implements JavaDelegate {

    private final HostUpgradeRequestRepository upgradeRequestRepository;
    private final Keycloak keycloak;
    private final EmailService emailService;

    @Value("${keycloak.realm}")
    private String realm;

    @Override
    @Transactional
    public void execute(DelegateExecution execution) throws Exception {
        String requestIdStr = (String) execution.getVariable("requestId");
        String adminNote = (String) execution.getVariable("adminNote");

        log.info("[Camunda] ApproveUpgradeDelegate executing for requestId={}", requestIdStr);

        UUID requestId = UUID.fromString(requestIdStr);
        HostUpgradeRequest request = upgradeRequestRepository.findById(requestId)
                .orElseThrow(() -> new RuntimeException("HostUpgradeRequest not found: " + requestId));

        // 1. Update DB status
        request.setStatus(UpgradeRequestStatus.APPROVED);
        request.setAdminNote(adminNote);
        upgradeRequestRepository.save(request);

        // 2. Assign HOST role in Keycloak
        assignHostRoleInKeycloak(request.getUser().getKeycloakId().toString());

        // 3. Send email notification
        try {
            emailService.sendUpgradeApprovalEmail(request.getUser());
        } catch (Exception e) {
            log.warn("[Camunda] Failed to send approval email for user={}: {}", request.getUser().getEmail(), e.getMessage());
        }

        log.info("[Camunda] Request {} APPROVED. HOST role assigned in Keycloak.", requestId);
    }

    private void assignHostRoleInKeycloak(String keycloakUserId) {
        RealmResource realmResource = keycloak.realm(realm);
        UserResource userResource = realmResource.users().get(keycloakUserId);
        RoleRepresentation hostRole = realmResource.roles().get("HOST").toRepresentation();
        userResource.roles().realmLevel().add(Collections.singletonList(hostRole));
        log.info("[Camunda] HOST role assigned in Keycloak for userId={}", keycloakUserId);
    }
}
