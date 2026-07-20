package com.freelanceos.backend.dto;

import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

public record InvoiceRequest(
    @NotNull(message = "Client ID is required")
    Long clientId,
    
    @NotNull(message = "Project ID is required")
    Long projectId,
    
    @NotNull(message = "Amount is required")
    BigDecimal amount,
    
    BigDecimal gst,
    BigDecimal discount,
    
    @NotNull(message = "Total amount is required")
    BigDecimal totalAmount,
    
    LocalDate dueDate,
    LocalDate issueDate,
    String notes,
    String terms,
    String status,
    
    @NotEmpty(message = "At least one line item is required")
    List<LineItemRequest> lineItems
) {
    public record LineItemRequest(
        String description,
        int quantity,
        BigDecimal unitPrice,
        BigDecimal total
    ) {}
}
