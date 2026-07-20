package com.freelanceos.backend.service;

import com.freelanceos.backend.dto.AiEstimationRequest;
import com.freelanceos.backend.dto.AiEstimationResponse;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

@Service
public class AiService {

    public AiEstimationResponse generateEstimate(AiEstimationRequest request) {
        // Evaluate project complexity and scope parameters
        String complexity = request.complexity() != null ? request.complexity().toUpperCase() : "MEDIUM";
        int pages = request.numberOfPages() != null ? request.numberOfPages() : 5;
        int teamSize = request.teamSize() != null && request.teamSize() > 0 ? request.teamSize() : 1;
        int deadlineDays = request.deadline() != null ? request.deadline() : 30;

        // 1. Calculate Base Hours based on complexity
        int baseHours = switch (complexity) {
            case "LOW" -> 40;
            case "HIGH" -> 220;
            case "VERY_HIGH" -> 380;
            default -> 120; // MEDIUM
        };

        // 2. Add page and feature complexities
        int pageHours = pages * 6;
        int featureHours = 0;
        if (request.features() != null) {
            for (String feature : request.features()) {
                featureHours += switch (feature.toUpperCase()) {
                    case "AUTH", "AUTHENTICATION" -> 16;
                    case "PAYMENT", "INVOICING" -> 24;
                    case "CHAT", "MESSAGING" -> 32;
                    case "FILES", "STORAGE" -> 20;
                    case "CALENDAR", "DEADLINES" -> 16;
                    case "REPORTS", "ANALYTICS" -> 24;
                    default -> 12;
                };
            }
        }

        // 3. Add technology factors
        int techHours = 0;
        if (request.technologies() != null) {
            techHours = request.technologies().size() * 8;
        }

        int totalHours = baseHours + pageHours + featureHours + techHours;
        // Total working days (assuming 8h per day per team member)
        int estimatedDays = (int) Math.ceil((double) totalHours / (8 * teamSize));

        // 4. Calculate Risk Matrix and warnings
        String riskLevel = "LOW";
        List<String> warnings = new ArrayList<>();

        double timelineRatio = (double) deadlineDays / estimatedDays;
        if (timelineRatio < 0.7) {
            riskLevel = "HIGH";
            warnings.add("CRITICAL: The requested deadline (" + deadlineDays + " days) is extremely tight. We estimate " + estimatedDays + " days needed. Consider expanding team size or trimming project features.");
        } else if (timelineRatio < 1.0) {
            riskLevel = "MEDIUM";
            warnings.add("WARNING: Tight timeline. Project progress must be closely monitored weekly.");
        }

        if (teamSize == 1 && (complexity.equals("HIGH") || complexity.equals("VERY_HIGH"))) {
            warnings.add("NOTE: A single freelancer handling a high-complexity project may face delivery risks if backup resources aren't planned.");
        }

        if (pages > 20 && totalHours < 150) {
            warnings.add("Heuristic Warning: Large page count suggests more developer hours might be required for layout adjustments.");
        }

        // 5. Difficulty Score (1 - 10)
        int difficultyScore = switch (complexity) {
            case "LOW" -> 2;
            case "HIGH" -> 7;
            case "VERY_HIGH" -> 9;
            default -> 5; // MEDIUM
        };
        // Adjust for feature load
        if (request.features() != null && request.features().size() > 4) {
            difficultyScore = Math.min(difficultyScore + 1, 10);
        }

        // 6. Generate project phases
        List<String> phases = List.of(
            "Phase 1: Project kickoff & wireframing (10% - " + (int) Math.max(1, Math.round(estimatedDays * 0.1)) + " days)",
            "Phase 2: Database architecture & API integration (30% - " + (int) Math.max(1, Math.round(estimatedDays * 0.3)) + " days)",
            "Phase 3: Core frontend UI/UX layout development (30% - " + (int) Math.max(1, Math.round(estimatedDays * 0.3)) + " days)",
            "Phase 4: Advanced feature integration (Auth, Chat, Payments) (20% - " + (int) Math.max(1, Math.round(estimatedDays * 0.2)) + " days)",
            "Phase 5: User testing, QA debugging & client handover (10% - " + (int) Math.max(1, Math.round(estimatedDays * 0.1)) + " days)"
        );

        // 7. Recommended Milestones list
        List<String> milestones = List.of(
            "M1: Design system, layout components, and DB schema sign-off (Target: Day " + (int) Math.max(2, Math.round(estimatedDays * 0.15)) + ")",
            "M2: REST APIs functioning with user auth & clients CRUD (Target: Day " + (int) Math.max(5, Math.round(estimatedDays * 0.40)) + ")",
            "M3: Kanban task board, calendar view, and chat modules complete (Target: Day " + (int) Math.max(8, Math.round(estimatedDays * 0.70)) + ")",
            "M4: Invoice generators, reports export, and end-to-end integration done (Target: Day " + (int) Math.max(10, Math.round(estimatedDays * 0.90)) + ")",
            "M5: Production deploy & client handbook delivery (Target: Day " + estimatedDays + ")"
        );

        String deliverySchedule = "Sprint iteration reviews every " + (estimatedDays > 14 ? "2 weeks" : "week") + " with active demo deployment checkpoints on staging environments.";

        return new AiEstimationResponse(
            estimatedDays,
            phases,
            milestones,
            totalHours,
            request.technologies() != null ? request.technologies() : List.of("React", "Java Spring Boot", "PostgreSQL"),
            riskLevel,
            difficultyScore,
            deliverySchedule,
            warnings
        );
    }
}
