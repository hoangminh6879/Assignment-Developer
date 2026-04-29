package com.example.HomestayDev.repository;

import com.example.HomestayDev.model.Image;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface ImageRepository extends JpaRepository<Image, UUID> {
    void deleteByRoomId(UUID roomId);
}
