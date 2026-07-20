package com.freelanceos.backend.repository;

import com.freelanceos.backend.entity.Client;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ClientRepository extends JpaRepository<Client, Long> {
    Page<Client> findByUserId(Long userId, Pageable pageable);
    
    @Query("SELECT c FROM Client c WHERE c.user.id = :userId AND " +
           "(LOWER(c.name) LIKE LOWER(concat('%', :query, '%')) OR " +
           "LOWER(c.company) LIKE LOWER(concat('%', :query, '%')) OR " +
           "LOWER(c.email) LIKE LOWER(concat('%', :query, '%')))")
    Page<Client> searchClients(Long userId, String query, Pageable pageable);

    long countByUserId(Long userId);
    List<Client> findByUserId(Long userId);
    List<Client> findByUserIdAndEmail(Long userId, String email);
}
