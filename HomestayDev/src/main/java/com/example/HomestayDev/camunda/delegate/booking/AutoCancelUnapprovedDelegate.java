package com.example.HomestayDev.camunda.delegate.booking;

import com.example.HomestayDev.service.BookingService;
import lombok.RequiredArgsConstructor;
import org.camunda.bpm.engine.delegate.DelegateExecution;
import org.camunda.bpm.engine.delegate.JavaDelegate;
import org.springframework.stereotype.Component;

import java.util.UUID;

@Component("autoCancelUnapprovedDelegate")
@RequiredArgsConstructor
public class AutoCancelUnapprovedDelegate implements JavaDelegate {

    private final BookingService bookingService;

    @Override
    public void execute(DelegateExecution execution) throws Exception {
        String bookingIdStr = (String) execution.getVariable("bookingId");
        if (bookingIdStr != null) {
            UUID bookingId = UUID.fromString(bookingIdStr);
            bookingService.handleAutoCancelUnapproved(bookingId);
        }
    }
}
