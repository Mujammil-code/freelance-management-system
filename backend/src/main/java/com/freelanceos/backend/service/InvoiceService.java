package com.freelanceos.backend.service;

import com.freelanceos.backend.dto.InvoiceDTO;
import com.freelanceos.backend.dto.InvoiceRequest;
import com.freelanceos.backend.entity.Client;
import com.freelanceos.backend.entity.Invoice;
import com.freelanceos.backend.entity.InvoiceLineItem;
import com.freelanceos.backend.entity.Project;
import com.freelanceos.backend.entity.User;
import com.freelanceos.backend.exception.ResourceNotFoundException;
import com.freelanceos.backend.exception.BadRequestException;
import com.freelanceos.backend.repository.InvoiceRepository;
import com.freelanceos.backend.util.SecurityUtils;
import com.freelanceos.backend.entity.Notification;
import com.freelanceos.backend.repository.NotificationRepository;
import com.freelanceos.backend.repository.UserRepository;
import com.freelanceos.backend.service.ChatService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Service
public class InvoiceService {

    private final InvoiceRepository invoiceRepository;
    private final ClientService clientService;
    private final ProjectService projectService;
    private final ChatService chatService;
    private final NotificationRepository notificationRepository;
    private final UserRepository userRepository;

    public InvoiceService(InvoiceRepository invoiceRepository, ClientService clientService, ProjectService projectService, ChatService chatService, NotificationRepository notificationRepository, UserRepository userRepository) {
        this.invoiceRepository = invoiceRepository;
        this.clientService = clientService;
        this.projectService = projectService;
        this.chatService = chatService;
        this.notificationRepository = notificationRepository;
        this.userRepository = userRepository;
    }

    private User getAuthenticatedUser() {
        User user = SecurityUtils.getCurrentUser();
        if (user == null) {
            throw new BadRequestException("User not authenticated");
        }
        return user;
    }

    @Transactional(readOnly = true)
    public List<InvoiceDTO> getInvoices() {
        User user = getAuthenticatedUser();
        List<Invoice> invoices;
        if (user.getRole() == User.Role.ADMIN) {
            invoices = invoiceRepository.findByUserId(user.getId());
        } else {
            invoices = invoiceRepository.findByClientEmail(user.getEmail());
        }
        return invoices.stream()
                .map(InvoiceDTO::fromEntity)
                .toList();
    }

    @Transactional(readOnly = true)
    public InvoiceDTO getInvoiceById(Long id) {
        Invoice invoice = getInvoiceEntity(id);
        return InvoiceDTO.fromEntity(invoice);
    }

    @Transactional
    public InvoiceDTO createInvoice(InvoiceRequest request) {
        User user = getAuthenticatedUser();
        Client client = clientService.getClientEntity(request.clientId());
        Project project = projectService.getProjectEntity(request.projectId());

        // Generate invoice number
        long count = invoiceRepository.count() + 1;
        String invoiceNumber = "INV-" + LocalDate.now().getYear() + "-" + String.format("%04d", count);

        // Auto-calculate total amount if not set correctly
        BigDecimal amount = request.amount();
        BigDecimal gst = request.gst() != null ? request.gst() : BigDecimal.ZERO;
        BigDecimal discount = request.discount() != null ? request.discount() : BigDecimal.ZERO;
        BigDecimal totalAmount = amount.add(gst).subtract(discount);

        Invoice invoice = Invoice.builder()
                .invoiceNumber(invoiceNumber)
                .amount(amount)
                .gst(gst)
                .discount(discount)
                .totalAmount(totalAmount)
                .dueDate(request.dueDate())
                .issueDate(request.issueDate() != null ? request.issueDate() : LocalDate.now())
                .status(request.status() != null ? Invoice.Status.valueOf(request.status()) : Invoice.Status.DRAFT)
                .notes(request.notes())
                .terms(request.terms())
                .client(client)
                .project(project)
                .user(user)
                .build();

        // Convert line items
        List<InvoiceLineItem> items = new ArrayList<>();
        if (request.lineItems() != null) {
            for (InvoiceRequest.LineItemRequest itemReq : request.lineItems()) {
                items.add(InvoiceLineItem.builder()
                        .description(itemReq.description())
                        .quantity(itemReq.quantity())
                        .unitPrice(itemReq.unitPrice())
                        .total(itemReq.total() != null ? itemReq.total() : itemReq.unitPrice().multiply(BigDecimal.valueOf(itemReq.quantity())))
                        .invoice(invoice)
                        .build());
            }
        }
        invoice.setLineItems(items);

        Invoice saved = invoiceRepository.save(invoice);
        return InvoiceDTO.fromEntity(saved);
    }

    @Transactional
    public InvoiceDTO updateInvoice(Long id, InvoiceRequest request) {
        Invoice invoice = getInvoiceEntity(id);
        Client client = clientService.getClientEntity(request.clientId());
        Project project = projectService.getProjectEntity(request.projectId());

        BigDecimal amount = request.amount();
        BigDecimal gst = request.gst() != null ? request.gst() : BigDecimal.ZERO;
        BigDecimal discount = request.discount() != null ? request.discount() : BigDecimal.ZERO;
        BigDecimal totalAmount = amount.add(gst).subtract(discount);

        invoice.setAmount(amount);
        invoice.setGst(gst);
        invoice.setDiscount(discount);
        invoice.setTotalAmount(totalAmount);
        invoice.setDueDate(request.dueDate());
        invoice.setIssueDate(request.issueDate());
        invoice.setNotes(request.notes());
        invoice.setTerms(request.terms());
        invoice.setClient(client);
        invoice.setProject(project);
        if (request.status() != null) {
            invoice.setStatus(Invoice.Status.valueOf(request.status()));
        }

        // Recreate line items
        invoice.getLineItems().clear();
        if (request.lineItems() != null) {
            for (InvoiceRequest.LineItemRequest itemReq : request.lineItems()) {
                invoice.getLineItems().add(InvoiceLineItem.builder()
                        .description(itemReq.description())
                        .quantity(itemReq.quantity())
                        .unitPrice(itemReq.unitPrice())
                        .total(itemReq.total() != null ? itemReq.total() : itemReq.unitPrice().multiply(BigDecimal.valueOf(itemReq.quantity())))
                        .invoice(invoice)
                        .build());
            }
        }

        Invoice updated = invoiceRepository.save(invoice);
        return InvoiceDTO.fromEntity(updated);
    }

    @Transactional
    public InvoiceDTO markPaid(Long id) {
        Invoice invoice = getInvoiceEntity(id);
        invoice.setStatus(Invoice.Status.PAID);
        Invoice updated = invoiceRepository.save(invoice);
        
        // Also update project payment amount if it fits
        Project project = invoice.getProject();
        project.setAmountPaid(project.getAmountPaid().add(invoice.getTotalAmount()));
        projectService.saveProjectEntity(project);

        return InvoiceDTO.fromEntity(updated);
    }

    @Transactional
    public void deleteInvoice(Long id) {
        Invoice invoice = getInvoiceEntity(id);
        invoiceRepository.delete(invoice);
    }

    public Invoice getInvoiceEntity(Long id) {
        User user = getAuthenticatedUser();
        Invoice invoice = invoiceRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Invoice not found with id: " + id));
        if (user.getRole() == User.Role.ADMIN) {
            if (!invoice.getUser().getId().equals(user.getId())) {
                throw new BadRequestException("Unauthorized access to this invoice");
            }
        } else {
            if (invoice.getClient() == null || !invoice.getClient().getEmail().equalsIgnoreCase(user.getEmail())) {
                throw new BadRequestException("Unauthorized access to this invoice");
            }
        }
        return invoice;
    }

    @Transactional
    public InvoiceDTO sendInvoiceReminder(Long id) {
        User user = getAuthenticatedUser();
        if (user.getRole() != User.Role.ADMIN) {
            throw new BadRequestException("Only administrators can send payment reminders.");
        }

        Invoice invoice = getInvoiceEntity(id);
        if (invoice.getStatus() == Invoice.Status.PAID || invoice.getStatus() == Invoice.Status.CANCELLED) {
            throw new BadRequestException("Invoice is already paid or cancelled.");
        }

        Client client = invoice.getClient();
        if (client == null) {
            throw new BadRequestException("Client not associated with this invoice.");
        }

        User clientUser = client.getUser();
        if (clientUser == null) {
            clientUser = userRepository.findByEmail(client.getEmail())
                    .orElseThrow(() -> new ResourceNotFoundException("Client user account not found for email: " + client.getEmail()));
        }

        // Create platform warning notification
        Notification notification = Notification.builder()
                .title("Payment Reminder: " + invoice.getInvoiceNumber())
                .message("Hi " + client.getName() + ", this is a friendly reminder that Invoice " + invoice.getInvoiceNumber() + " for " + invoice.getTotalAmount() + " is due on " + invoice.getDueDate() + ".")
                .type(Notification.Type.WARNING)
                .user(clientUser)
                .isRead(false)
                .build();
        notificationRepository.save(notification);

        // Send direct chat reminder message
        String chatContent = "Dear " + client.getName() + ",\n\n" +
                "This is a friendly reminder that Invoice " + invoice.getInvoiceNumber() + " (Amount: ₹" + invoice.getTotalAmount() + ") is due on " + invoice.getDueDate() + ".\n\n" +
                "Please review and process the payment from your invoices panel. Thank you!";

        chatService.sendMessage(user.getId(), clientUser.getId(), chatContent, "TEXT", null);

        return InvoiceDTO.fromEntity(invoice);
    }

    @Transactional
    public Invoice saveInvoiceEntity(Invoice invoice) {
        return invoiceRepository.save(invoice);
    }
}
