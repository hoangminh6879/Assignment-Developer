package com.example.HomestayDev.repository;

import com.example.HomestayDev.model.Transaction;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TransactionRepository extends JpaRepository<Transaction, Long> {
    @org.springframework.data.jpa.repository.Query("SELECT t FROM Transaction t WHERE t.wallet.id = :walletId ORDER BY t.createdAt DESC")
    List<Transaction> findByWalletIdOrderByCreatedAtDesc(@org.springframework.data.repository.query.Param("walletId") Long walletId);
    boolean existsByVnpayTxnRef(String vnpayTxnRef);
}
