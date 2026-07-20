package com.freelanceos.backend.service;

import com.freelanceos.backend.dto.PaymentDTO;
import com.freelanceos.backend.dto.PaymentRequest;
import com.freelanceos.backend.entity.*;
import com.freelanceos.backend.exception.ResourceNotFoundException;
import com.freelanceos.backend.exception.BadRequestException;
import com.freelanceos.backend.repository.PaymentRepository;
import com.freelanceos.backend.util.SecurityUtils;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;

@Service
public class PaymentService {

    private final PaymentRepository paymentRepository;
    private final ClientService clientService;
    private final ProjectService projectService;
    private final InvoiceService invoiceService;

    public PaymentService(PaymentRepository paymentRepository, ClientService clientService,
                          ProjectService projectService, InvoiceService invoiceService) {
        this.paymentRepository = paymentRepository;
        this.clientService = clientService;
        this.projectService = projectService;
        this.invoiceService = invoiceService;
    }

    private User getAuthenticatedUser() {
        User user = SecurityUtils.getCurrentUser();
        if (user == null) {
            throw new BadRequestException("User not authenticated");
        }
        return user;
    }

    @Transactional(readOnly = true)
    public List<PaymentDTO> getPayments() {
        User user = getAuthenticatedUser();
        List<Payment> payments;
        if (user.getRole() == User.Role.ADMIN) {
            payments = paymentRepository.findByUserId(user.getId());
        } else {
            payments = paymentRepository.findByClientEmail(user.getEmail());
        }
        return payments.stream()
                .map(PaymentDTO::fromEntity)
                .toList();
    }

    @Transactional
    public PaymentDTO createPayment(PaymentRequest request) {
        User user = getAuthenticatedUser();
        Client client = clientService.getClientEntity(request.clientId());
        Project project = projectService.getProjectEntity(request.projectId());

        Invoice invoice = null;
        if (request.invoiceId() != null) {
            invoice = invoiceService.getInvoiceEntity(request.invoiceId());
        }

        BigDecimal amount = request.amount();

        // Update project paid amounts
        project.setAmountPaid(project.getAmountPaid().add(amount));
        projectService.saveProjectEntity(project);

        // Update invoice status if appropriate
        if (invoice != null && !invoice.getStatus().equals(Invoice.Status.PAID)) {
            // Check if fully paid
            invoice.setStatus(Invoice.Status.PAID);
            invoiceService.saveInvoiceEntity(invoice);
        }

        BigDecimal remainingBalance = project.getBudget().subtract(project.getAmountPaid());

        Payment payment = Payment.builder()
                .amount(amount)
                .paymentDate(request.paymentDate())
                .paymentMethod(Payment.Method.valueOf(request.paymentMethod()))
                .status(request.status() != null ? Payment.Status.valueOf(request.status()) : Payment.Status.COMPLETED)
                .transactionId(request.transactionId())
                .notes(request.notes())
                .remainingBalance(remainingBalance.max(BigDecimal.ZERO))
                .client(client)
                .project(project)
                .invoice(invoice)
                .user(user)
                .build();

        Payment saved = paymentRepository.save(payment);
        return PaymentDTO.fromEntity(saved);
    }

    @Transactional
    public void deletePayment(Long id) {
        User user = getAuthenticatedUser();
        Payment payment = paymentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Payment not found with id: " + id));
        if (!payment.getUser().getId().equals(user.getId())) {
            throw new BadRequestException("Unauthorized access to this payment");
        }

        // Revert project paid amount
        Project project = payment.getProject();
        project.setAmountPaid(project.getAmountPaid().subtract(payment.getAmount()).max(BigDecimal.ZERO));
        projectService.saveProjectEntity(project);

        // Revert invoice status if it exists
        if (payment.getInvoice() != null) {
            Invoice invoice = payment.getInvoice();
            invoice.setStatus(Invoice.Status.SENT);
            invoiceService.saveInvoiceEntity(invoice);
        }

        paymentRepository.delete(payment);
    }

    @Transactional
    public PaymentDTO updatePayment(Long id, PaymentRequest request) {
        User user = getAuthenticatedUser();
        Payment payment = paymentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Payment not found with id: " + id));
        if (!payment.getUser().getId().equals(user.getId())) {
            throw new BadRequestException("Unauthorized access to this payment");
        }

        // Revert previous changes to project amountPaid
        Project project = payment.getProject();
        project.setAmountPaid(project.getAmountPaid().subtract(payment.getAmount()).max(BigDecimal.ZERO));
        projectService.saveProjectEntity(project);

        // Revert previous invoice status if it was changed
        if (payment.getInvoice() != null) {
            Invoice invoice = payment.getInvoice();
            invoice.setStatus(Invoice.Status.SENT);
            invoiceService.saveInvoiceEntity(invoice);
        }

        // Load new entities if changed
        Client client = clientService.getClientEntity(request.clientId());
        Project newProject = projectService.getProjectEntity(request.projectId());

        Invoice newInvoice = null;
        if (request.invoiceId() != null) {
            newInvoice = invoiceService.getInvoiceEntity(request.invoiceId());
        }

        BigDecimal amount = request.amount();

        // Apply new changes to project
        newProject.setAmountPaid(newProject.getAmountPaid().add(amount));
        projectService.saveProjectEntity(newProject);

        // Apply new status to invoice
        if (newInvoice != null && !newInvoice.getStatus().equals(Invoice.Status.PAID)) {
            newInvoice.setStatus(Invoice.Status.PAID);
            invoiceService.saveInvoiceEntity(newInvoice);
        }

        BigDecimal remainingBalance = newProject.getBudget().subtract(newProject.getAmountPaid());

        payment.setAmount(amount);
        payment.setPaymentDate(request.paymentDate());
        payment.setPaymentMethod(Payment.Method.valueOf(request.paymentMethod()));
        payment.setStatus(request.status() != null ? Payment.Status.valueOf(request.status()) : Payment.Status.COMPLETED);
        payment.setTransactionId(request.transactionId());
        payment.setNotes(request.notes());
        payment.setRemainingBalance(remainingBalance.max(BigDecimal.ZERO));
        payment.setClient(client);
        payment.setProject(newProject);
        payment.setInvoice(newInvoice);

        Payment saved = paymentRepository.save(payment);
        return PaymentDTO.fromEntity(saved);
    }
}
