package com.freelanceos.backend.repository;

import com.freelanceos.backend.entity.Payment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.List;

@Repository
public interface PaymentRepository extends JpaRepository<Payment, Long> {
    List<Payment> findByUserId(Long userId);
    List<Payment> findByClientId(Long clientId);
    List<Payment> findByProjectId(Long projectId);
    
    @Query("SELECT p FROM Payment p WHERE p.client.email = :email")
    List<Payment> findByClientEmail(@Param("email") String email);
    
    @Query("SELECT COALESCE(SUM(p.amount), 0) FROM Payment p WHERE p.user.id = :userId AND p.status = 'COMPLETED'")
    BigDecimal sumCompletedPaymentsByUserId(Long userId);

    @Query("SELECT COALESCE(SUM(p.amount), 0) FROM Payment p WHERE p.user.id = :userId AND p.status = 'PENDING'")
    BigDecimal sumPendingPaymentsByUserId(Long userId);
}
