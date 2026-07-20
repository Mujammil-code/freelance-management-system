package com.freelanceos.backend.controller;

import com.freelanceos.backend.dto.MilestoneDTO;
import com.freelanceos.backend.dto.MilestoneRequest;
import com.freelanceos.backend.service.MilestoneService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/milestones")
public class MilestoneController {

    private final MilestoneService milestoneService;

    public MilestoneController(MilestoneService milestoneService) {
        this.milestoneService = milestoneService;
    }

    @GetMapping
    public ResponseEntity<List<MilestoneDTO>> getMilestones() {
        return ResponseEntity.ok(milestoneService.getMilestones());
    }

    @GetMapping("/project/{projectId}")
    public ResponseEntity<List<MilestoneDTO>> getMilestonesByProjectId(@PathVariable Long projectId) {
        return ResponseEntity.ok(milestoneService.getMilestonesByProjectId(projectId));
    }

    @PostMapping
    public ResponseEntity<MilestoneDTO> createMilestone(@Valid @RequestBody MilestoneRequest request) {
        return ResponseEntity.ok(milestoneService.createMilestone(request));
    }

    @PutMapping("/{id}")
    public ResponseEntity<MilestoneDTO> updateMilestone(@PathVariable Long id, @Valid @RequestBody MilestoneRequest request) {
        return ResponseEntity.ok(milestoneService.updateMilestone(id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteMilestone(@PathVariable Long id) {
        milestoneService.deleteMilestone(id);
        return ResponseEntity.noContent().build();
    }
}
