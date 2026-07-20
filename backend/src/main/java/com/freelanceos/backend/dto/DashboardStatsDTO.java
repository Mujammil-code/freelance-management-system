package com.freelanceos.backend.dto;

import java.math.BigDecimal;

public record DashboardStatsDTO(
    long totalClients,
    long activeProjects,
    BigDecimal pendingPayments,
    BigDecimal monthlyRevenue,
    long tasksDueToday,
    long completedProjects
) {}
