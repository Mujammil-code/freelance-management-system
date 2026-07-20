package com.freelanceos.backend.controller;

import com.freelanceos.backend.dto.DashboardStatsDTO;
import com.freelanceos.backend.entity.Payment;
import com.freelanceos.backend.entity.Project;
import com.freelanceos.backend.repository.*;
import com.freelanceos.backend.util.SecurityUtils;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/dashboard")
public class DashboardController {

    private final ClientRepository clientRepository;
    private final ProjectRepository projectRepository;
    private final TaskRepository taskRepository;
    private final PaymentRepository paymentRepository;
    private final InvoiceRepository invoiceRepository;

    public DashboardController(ClientRepository clientRepository, ProjectRepository projectRepository,
                               TaskRepository taskRepository, PaymentRepository paymentRepository,
                               InvoiceRepository invoiceRepository) {
        this.clientRepository = clientRepository;
        this.projectRepository = projectRepository;
        this.taskRepository = taskRepository;
        this.paymentRepository = paymentRepository;
        this.invoiceRepository = invoiceRepository;
    }

    @GetMapping("/stats")
    public ResponseEntity<DashboardStatsDTO> getStats() {
        Long userId = SecurityUtils.getCurrentUserId();
        if (userId == null) {
            return ResponseEntity.status(401).build();
        }

        long totalClients = clientRepository.countByUserId(userId);
        long activeProjects = projectRepository.countByUserIdAndStatus(userId, Project.Status.IN_PROGRESS);
        long completedProjects = projectRepository.countByUserIdAndStatus(userId, Project.Status.COMPLETED);
        
        BigDecimal pending = paymentRepository.sumPendingPaymentsByUserId(userId);
        BigDecimal completed = paymentRepository.sumCompletedPaymentsByUserId(userId);
        
        long tasksDueToday = taskRepository.countTasksDueToday(userId, LocalDate.now());

        return ResponseEntity.ok(new DashboardStatsDTO(
                totalClients,
                activeProjects,
                pending != null ? pending : BigDecimal.ZERO,
                completed != null ? completed : BigDecimal.ZERO,
                tasksDueToday,
                completedProjects
        ));
    }

    @GetMapping("/charts")
    public ResponseEntity<Map<String, Object>> getChartData() {
        Long userId = SecurityUtils.getCurrentUserId();
        Map<String, Object> data = new HashMap<>();
        if (userId == null) {
            return ResponseEntity.status(401).build();
        }

        // 1. Monthly revenue chart (last 6 months)
        List<Payment> payments = paymentRepository.findByUserId(userId).stream()
                .filter(p -> p.getStatus() == Payment.Status.COMPLETED)
                .toList();

        Map<String, BigDecimal> monthlyRevenue = new TreeMap<>();
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("MMM yyyy");
        
        // Initialize last 6 months with 0
        for (int i = 5; i >= 0; i--) {
            LocalDate date = LocalDate.now().minusMonths(i);
            monthlyRevenue.put(date.format(formatter), BigDecimal.ZERO);
        }

        for (Payment payment : payments) {
            String monthName = payment.getPaymentDate().format(formatter);
            if (monthlyRevenue.containsKey(monthName)) {
                monthlyRevenue.put(monthName, monthlyRevenue.get(monthName).add(payment.getAmount()));
            }
        }

        List<Map<String, Object>> revenueList = new ArrayList<>();
        for (Map.Entry<String, BigDecimal> entry : monthlyRevenue.entrySet()) {
            Map<String, Object> point = new HashMap<>();
            point.put("month", entry.getKey());
            point.put("revenue", entry.getValue());
            revenueList.add(point);
        }
        data.put("monthlyRevenue", revenueList);

        // 2. Projects status distributions
        List<Project> projects = projectRepository.findByUserId(userId);
        Map<String, Long> statusCounts = projects.stream()
                .collect(Collectors.groupingBy(p -> p.getStatus().name(), Collectors.counting()));

        List<Map<String, Object>> projectStatusList = new ArrayList<>();
        for (Project.Status status : Project.Status.values()) {
            Map<String, Object> item = new HashMap<>();
            item.put("name", status.name());
            item.put("value", statusCounts.getOrDefault(status.name(), 0L));
            projectStatusList.add(item);
        }
        data.put("projectStatus", projectStatusList);

        return ResponseEntity.ok(data);
    }
}
