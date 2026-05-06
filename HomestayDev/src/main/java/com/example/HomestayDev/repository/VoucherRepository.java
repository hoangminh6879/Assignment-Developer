package com.example.HomestayDev.repository;

import com.example.HomestayDev.model.Voucher;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface VoucherRepository extends JpaRepository<Voucher, UUID> {
    Optional<Voucher> findByCode(String code);
    boolean existsByCode(String code);
    
    List<Voucher> findByHostId(UUID hostId);
    
    List<Voucher> findByIsGlobalTrue();
    
    @Query("SELECT v FROM Voucher v WHERE v.isGlobal = true OR v.host.id = :hostId")
    List<Voucher> findApplicableVouchers(UUID hostId);
}
