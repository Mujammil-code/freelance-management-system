package com.freelanceos.backend.dto;

import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;
import java.time.LocalDate;

public record PaymentRequest(
    @NotNull(message = "Amount is required")
    BigDecimal amount,
    
    @NotNull(message = "Payment date is required")
    LocalDate paymentDate,
    
    @NotNull(message = "Payment method is required")
    String paymentMethod,
    
    String status,
    String transactionId,
    String notes,
    
    @NotNull(message = "Client is required")
    Long clientId,
    
    @NotNull(message = "Project is required")
    Long projectId,
    
    Long invoiceId
) {}
