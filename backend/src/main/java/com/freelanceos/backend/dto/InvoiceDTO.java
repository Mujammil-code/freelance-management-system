package com.freelanceos.backend.dto;

import com.freelanceos.backend.entity.Invoice;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

public record InvoiceDTO(
    Long id,
    String invoiceNumber,
    BigDecimal amount,
    BigDecimal gst,
    BigDecimal discount,
    BigDecimal totalAmount,
    LocalDate dueDate,
    LocalDate issueDate,
    String status,
    String notes,
    String terms,
    Long clientId,
    String clientName,
    Long projectId,
    String projectName,
    List<LineItemDTO> lineItems
) {
    public record LineItemDTO(
        Long id,
        String description,
        int quantity,
        BigDecimal unitPrice,
        BigDecimal total
    ) {}

    public static InvoiceDTO fromEntity(Invoice invoice) {
        if (invoice == null) return null;
        
        List<LineItemDTO> items = invoice.getLineItems().stream()
            .map(item -> new LineItemDTO(
                item.getId(),
                item.getDescription(),
                item.getQuantity(),
                item.getUnitPrice(),
                item.getTotal()
            ))
            .toList();

        return new InvoiceDTO(
            invoice.getId(),
            invoice.getInvoiceNumber(),
            invoice.getAmount(),
            invoice.getGst(),
            invoice.getDiscount(),
            invoice.getTotalAmount(),
            invoice.getDueDate(),
            invoice.getIssueDate(),
            invoice.getStatus().name(),
            invoice.getNotes(),
            invoice.getTerms(),
            invoice.getClient().getId(),
            invoice.getClient().getName(),
            invoice.getProject().getId(),
            invoice.getProject().getName(),
            items
        );
    }
}
