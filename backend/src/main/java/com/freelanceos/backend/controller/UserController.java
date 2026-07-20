package com.freelanceos.backend.controller;

import com.freelanceos.backend.dto.UserDTO;
import com.freelanceos.backend.entity.User;
import com.freelanceos.backend.repository.UserRepository;
import com.freelanceos.backend.util.SecurityUtils;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/users")
public class UserController {

    private final UserRepository userRepository;

    public UserController(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @GetMapping("/me")
    public ResponseEntity<UserDTO> getCurrentUser() {
        User user = SecurityUtils.getCurrentUser();
        if (user == null) {
            return ResponseEntity.status(401).build();
        }

        // Re-load to ensure fresh Hibernate state
        User freshUser = userRepository.findById(user.getId()).orElse(user);

        return ResponseEntity.ok(new UserDTO(
                freshUser.getId(),
                freshUser.getFirstName(),
                freshUser.getLastName(),
                freshUser.getEmail(),
                freshUser.getPhone(),
                freshUser.getBio(),
                freshUser.getProfilePhoto(),
                freshUser.getJobTitle(),
                freshUser.getCompany(),
                freshUser.getSkills(),
                freshUser.getSocialLinks(),
                freshUser.getRole().name()
        ));
    }

    @PutMapping("/me")
    public ResponseEntity<UserDTO> updateProfile(@RequestBody Map<String, Object> body) {
        User user = SecurityUtils.getCurrentUser();
        if (user == null) {
            return ResponseEntity.status(401).build();
        }

        User existingUser = userRepository.findById(user.getId()).orElseThrow();
        
        if (body.containsKey("firstName")) existingUser.setFirstName((String) body.get("firstName"));
        if (body.containsKey("lastName")) existingUser.setLastName((String) body.get("lastName"));
        if (body.containsKey("phone")) existingUser.setPhone((String) body.get("phone"));
        if (body.containsKey("bio")) existingUser.setBio((String) body.get("bio"));
        if (body.containsKey("jobTitle")) existingUser.setJobTitle((String) body.get("jobTitle"));
        if (body.containsKey("company")) existingUser.setCompany((String) body.get("company"));
        
        if (body.containsKey("skills")) {
            existingUser.getSkills().clear();
            existingUser.getSkills().addAll((List<String>) body.get("skills"));
        }
        
        if (body.containsKey("socialLinks")) {
            existingUser.getSocialLinks().clear();
            existingUser.getSocialLinks().putAll((Map<String, String>) body.get("socialLinks"));
        }

        User saved = userRepository.save(existingUser);
        return ResponseEntity.ok(new UserDTO(
                saved.getId(),
                saved.getFirstName(),
                saved.getLastName(),
                saved.getEmail(),
                saved.getPhone(),
                saved.getBio(),
                saved.getProfilePhoto(),
                saved.getJobTitle(),
                saved.getCompany(),
                saved.getSkills(),
                saved.getSocialLinks(),
                saved.getRole().name()
        ));
    }
}
