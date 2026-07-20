package com.freelanceos.backend.service;

import com.freelanceos.backend.dto.ClientDTO;
import com.freelanceos.backend.dto.ClientRequest;
import com.freelanceos.backend.entity.Client;
import com.freelanceos.backend.entity.User;
import com.freelanceos.backend.exception.ResourceNotFoundException;
import com.freelanceos.backend.exception.BadRequestException;
import com.freelanceos.backend.repository.ClientRepository;
import com.freelanceos.backend.util.SecurityUtils;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ClientService {

    private final ClientRepository clientRepository;

    public ClientService(ClientRepository clientRepository) {
        this.clientRepository = clientRepository;
    }

    private User getAuthenticatedUser() {
        User user = SecurityUtils.getCurrentUser();
        if (user == null) {
            throw new BadRequestException("User not authenticated");
        }
        return user;
    }

    @Transactional(readOnly = true)
    public Page<ClientDTO> getClients(String query, Pageable pageable) {
        User user = getAuthenticatedUser();
        Page<Client> clients;
        if (query != null && !query.trim().isEmpty()) {
            clients = clientRepository.searchClients(user.getId(), query.trim(), pageable);
        } else {
            clients = clientRepository.findByUserId(user.getId(), pageable);
        }
        return clients.map(ClientDTO::fromEntity);
    }

    @Transactional(readOnly = true)
    public ClientDTO getClientById(Long id) {
        Client client = getClientEntity(id);
        return ClientDTO.fromEntity(client);
    }

    @Transactional
    public ClientDTO createClient(ClientRequest request) {
        User user = getAuthenticatedUser();
        Client client = Client.builder()
                .name(request.name())
                .company(request.company())
                .email(request.email())
                .phone(request.phone())
                .address(request.address())
                .country(request.country())
                .gstNumber(request.gstNumber())
                .notes(request.notes())
                .status(request.status() != null ? Client.Status.valueOf(request.status()) : Client.Status.PROSPECT)
                .website(request.website())
                .profilePhoto(request.profilePhoto())
                .user(user)
                .build();

        Client savedClient = clientRepository.save(client);
        return ClientDTO.fromEntity(savedClient);
    }

    @Transactional
    public ClientDTO updateClient(Long id, ClientRequest request) {
        Client client = getClientEntity(id);
        client.setName(request.name());
        client.setCompany(request.company());
        client.setEmail(request.email());
        client.setPhone(request.phone());
        client.setAddress(request.address());
        client.setCountry(request.country());
        client.setGstNumber(request.gstNumber());
        client.setNotes(request.notes());
        if (request.status() != null) {
            client.setStatus(Client.Status.valueOf(request.status()));
        }
        client.setWebsite(request.website());
        client.setProfilePhoto(request.profilePhoto());

        Client updatedClient = clientRepository.save(client);
        return ClientDTO.fromEntity(updatedClient);
    }

    @Transactional
    public void deleteClient(Long id) {
        Client client = getClientEntity(id);
        clientRepository.delete(client);
    }

    public Client getClientEntity(Long id) {
        User user = getAuthenticatedUser();
        Client client = clientRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Client not found with id: " + id));
        if (!client.getUser().getId().equals(user.getId())) {
            throw new BadRequestException("Unauthorized access to this client record");
        }
        return client;
    }
}
