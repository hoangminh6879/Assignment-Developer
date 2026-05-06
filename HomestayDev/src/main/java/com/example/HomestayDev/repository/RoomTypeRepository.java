package com.example.HomestayDev.repository;

import com.example.HomestayDev.model.RoomType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface RoomTypeRepository extends JpaRepository<RoomType, Long> {
    boolean existsByName(String name);
    java.util.Optional<RoomType> findByName(String name);
}
