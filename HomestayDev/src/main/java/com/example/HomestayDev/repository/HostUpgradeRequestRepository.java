package com.example.HomestayDev.repository;

import com.example.HomestayDev.model.HostUpgradeRequest;
import com.example.HomestayDev.model.enums.UpgradeRequestStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface HostUpgradeRequestRepository extends JpaRepository<HostUpgradeRequest, UUID> {
    List<HostUpgradeRequest> findByStatusOrderByCreatedAtDesc(UpgradeRequestStatus status);
    Optional<HostUpgradeRequest> findByUserIdAndStatus(UUID userId, UpgradeRequestStatus status);
    boolean existsByUserIdAndStatus(UUID userId, UpgradeRequestStatus status);
}
