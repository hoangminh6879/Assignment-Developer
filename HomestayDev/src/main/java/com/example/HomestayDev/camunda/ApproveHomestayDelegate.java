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
 * Camunda JavaDelegate executed when Admin approves a homestay.
 */
@Slf4j
@Component("approveHomestayDelegate")
@RequiredArgsConstructor
public class ApproveHomestayDelegate implements JavaDelegate {

    private final HomestayRepository homestayRepository;
    private final NotificationService notificationService;

    @Override
    @Transactional
    public void execute(DelegateExecution execution) throws Exception {
        String homestayIdStr = (String) execution.getVariable("homestayId");
        
        log.info("[Camunda] ApproveHomestayDelegate executing for homestayId={}", homestayIdStr);

        UUID homestayId = UUID.fromString(homestayIdStr);
        Homestay homestay = homestayRepository.findById(homestayId)
                .orElseThrow(() -> new RuntimeException("Homestay not found: " + homestayId));

        // Update DB status
        homestay.setStatus(HomestayStatus.ACTIVE);
        // Clear admin reason if any
        homestay.setAdminReason(null);
        homestayRepository.save(homestay);

        // Notify Host
        String message = "Chúc mừng! Homestay '" + homestay.getName() + "' của bạn đã được phê duyệt và hiển thị trên hệ thống.";
        notificationService.createNotification(homestay.getHost().getUsername(), message, "HOMESTAY", homestay.getId().toString());

        log.info("[Camunda] Homestay {} APPROVED.", homestayId);
    }
}
