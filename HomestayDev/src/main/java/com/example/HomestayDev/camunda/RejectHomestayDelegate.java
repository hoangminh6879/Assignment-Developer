package com.example.HomestayDev.camunda;

import com.example.HomestayDev.model.Homestay;
import com.example.HomestayDev.model.enums.HomestayStatus;
import com.example.HomestayDev.repository.HomestayRepository;
import com.example.HomestayDev.service.NotificationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.camunda.bpm.engine.delegate.DelegateExecution;
import org.camunda.bpm.engine.delegate.JavaDelegate;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

/**
 * Camunda JavaDelegate executed when Admin rejects a homestay.
 */
@Slf4j
@Component("rejectHomestayDelegate")
@RequiredArgsConstructor
public class RejectHomestayDelegate implements JavaDelegate {

    private final HomestayRepository homestayRepository;
    private final NotificationService notificationService;

    @Override
    @Transactional
    public void execute(DelegateExecution execution) throws Exception {
        String homestayIdStr = (String) execution.getVariable("homestayId");
        String adminReason = (String) execution.getVariable("adminReason");
        
        log.info("[Camunda] RejectHomestayDelegate executing for homestayId={}", homestayIdStr);

        UUID homestayId = UUID.fromString(homestayIdStr);
        Homestay homestay = homestayRepository.findById(homestayId)
                .orElseThrow(() -> new RuntimeException("Homestay not found: " + homestayId));

        // Update DB status
        homestay.setStatus(HomestayStatus.REJECTED);
        homestay.setAdminReason(adminReason);
        homestayRepository.save(homestay);

        // Notify Host
        String message = "Homestay '" + homestay.getName() + "' của bạn đã bị từ chối. Lý do: " + adminReason;
        notificationService.createNotification(homestay.getHost().getUsername(), message, "HOMESTAY", homestay.getId().toString());

        log.info("[Camunda] Homestay {} REJECTED. Reason: {}", homestayId, adminReason);
    }
}
