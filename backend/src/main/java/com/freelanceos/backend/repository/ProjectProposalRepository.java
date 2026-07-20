package com.freelanceos.backend.repository;

import com.freelanceos.backend.entity.ProjectProposal;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ProjectProposalRepository extends JpaRepository<ProjectProposal, Long> {
    List<ProjectProposal> findByClientEmail(String email);
    List<ProjectProposal> findAllByOrderByCreatedAtDesc();
}
