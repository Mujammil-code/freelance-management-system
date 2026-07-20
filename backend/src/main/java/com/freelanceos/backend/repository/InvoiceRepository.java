package com.freelanceos.backend.repository;

import com.freelanceos.backend.entity.Invoice;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface InvoiceRepository extends JpaRepository<Invoice, Long> {
    List<Invoice> findByUserId(Long userId);
    List<Invoice> findByClientId(Long clientId);
    
    @Query("SELECT i FROM Invoice i WHERE i.client.email = :email")
    List<Invoice> findByClientEmail(@Param("email") String email);
    
    Optional<Invoice> findByInvoiceNumber(String invoiceNumber);
    long countByUserIdAndStatus(Long userId, Invoice.Status status);
    
    @Query("SELECT COUNT(i) FROM Invoice i WHERE i.user.id = :userId AND i.dueDate < :date AND i.status != 'PAID'")
    long countOverdueInvoices(Long userId, LocalDate date);

    @Query("SELECT i FROM Invoice i WHERE i.user.id = :userId ORDER BY i.createdAt DESC")
    List<Invoice> findRecentInvoices(Long userId);
}
