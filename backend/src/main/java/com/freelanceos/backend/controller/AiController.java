package com.freelanceos.backend.controller;

import com.freelanceos.backend.dto.AiEstimationRequest;
import com.freelanceos.backend.dto.AiEstimationResponse;
import com.freelanceos.backend.service.AiService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/ai")
public class AiController {

    private final AiService aiService;

    public AiController(AiService aiService) {
        this.aiService = aiService;
    }

    @PostMapping("/estimate")
    public ResponseEntity<AiEstimationResponse> getEstimate(@RequestBody AiEstimationRequest request) {
        return ResponseEntity.ok(aiService.generateEstimate(request));
    }
}
