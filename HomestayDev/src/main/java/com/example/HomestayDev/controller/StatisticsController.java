package com.example.HomestayDev.controller;

import com.example.HomestayDev.dto.StatisticsDto;
import com.example.HomestayDev.service.StatisticsService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/statistics")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:4200")
public class StatisticsController {

    private final StatisticsService statisticsService;

    @GetMapping("/admin")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<StatisticsDto.AdminStatistics> getAdminStatistics() {
        return ResponseEntity.ok(statisticsService.getAdminStatistics());
    }

    @GetMapping("/host")
    @PreAuthorize("hasRole('HOST')")
    public ResponseEntity<StatisticsDto.HostStatistics> getHostStatistics(Authentication authentication) {
        return ResponseEntity.ok(statisticsService.getHostStatistics(authentication.getName()));
    }
}
