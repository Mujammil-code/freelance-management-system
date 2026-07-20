package com.freelanceos.backend.dto;

import com.freelanceos.backend.entity.Payment;
import java.math.BigDecimal;
import java.time.LocalDate;

public record PaymentDTO(
    Long id,
    BigDecimal amount,
    LocalDate paymentDate,
    String paymentMethod,
    String status,
    String transactionId,
    String notes,
    BigDecimal remainingBalance,
    Long clientId,
    String clientName,
    Long projectId,
    String projectName,
    Long invoiceId,
    String invoiceNumber
) {
    public static PaymentDTO fromEntity(Payment payment) {
        if (payment == null) return null;
        return new PaymentDTO(
            payment.getId(),
            payment.getAmount(),
            payment.getPaymentDate(),
            payment.getPaymentMethod().name(),
            payment.getStatus().name(),
            payment.getTransactionId(),
            payment.getNotes(),
            payment.getRemainingBalance(),
            payment.getClient().getId(),
            payment.getClient().getName(),
            payment.getProject().getId(),
            payment.getProject().getName(),
            payment.getInvoice() != null ? payment.getInvoice().getId() : null,
            payment.getInvoice() != null ? payment.getInvoice().getInvoiceNumber() : null
        );
    }
}
