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
    
    @org.springframework.data.jpa.repository.Query("SELECT COUNT(h) FROM Homestay h WHERE h.host.username = :username")
    Long countByHostUsername(@org.springframework.data.repository.query.Param("username") String username);
}
