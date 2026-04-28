package com.example.HomestayDev.repository;

import com.example.HomestayDev.model.Homestay;
import com.example.HomestayDev.model.enums.HomestayStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface HomestayRepository extends JpaRepository<Homestay, UUID> {
    List<Homestay> findByHostId(UUID hostId);
    List<Homestay> findByStatus(HomestayStatus status);
}
