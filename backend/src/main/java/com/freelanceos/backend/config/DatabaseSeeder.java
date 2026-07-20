package com.freelanceos.backend.config;

import com.freelanceos.backend.entity.User;
import com.freelanceos.backend.repository.UserRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.HashMap;

@Component
public class DatabaseSeeder implements CommandLineRunner {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public DatabaseSeeder(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public void run(String... args) throws Exception {
        if (!userRepository.existsByEmail("admin@freelanceos.com")) {
            User admin = User.builder()
                    .firstName("Admin")
                    .lastName("OS")
                    .email("admin@freelanceos.com")
                    .password(passwordEncoder.encode("admin123"))
                    .role(User.Role.ADMIN)
                    .enabled(true)
                    .skills(new ArrayList<>())
                    .socialLinks(new HashMap<>())
                    .build();
            userRepository.save(admin);
            System.out.println("Default ADMIN account seeded successfully: admin@freelanceos.com / admin123");
        }
    }
}
