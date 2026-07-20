package com.freelanceos.backend.controller;

import com.freelanceos.backend.dto.AuthRequest;
import com.freelanceos.backend.dto.AuthResponse;
import com.freelanceos.backend.dto.RegisterRequest;
import com.freelanceos.backend.service.AuthService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/register")
    public ResponseEntity<AuthResponse> register(@Valid @RequestBody RegisterRequest request) {
        return ResponseEntity.ok(authService.register(request));
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody AuthRequest request) {
        return ResponseEntity.ok(authService.login(request));
    }

    @PostMapping("/refresh-token")
    public ResponseEntity<AuthResponse> refreshToken(@RequestBody Map<String, String> request) {
        String token = request.get("refreshToken");
        return ResponseEntity.ok(authService.refreshToken(token));
    }

    @GetMapping("/check-email")
    public ResponseEntity<Map<String, Boolean>> checkEmail(@RequestParam String email) {
        return ResponseEntity.ok(Map.of("exists", authService.existsByEmail(email)));
    }

    @PostMapping("/forgot-password")
    public ResponseEntity<Map<String, String>> forgotPassword(@RequestBody Map<String, String> request) {
        // Mock success response for recovery flow demonstration
        return ResponseEntity.ok(Map.of("message", "Password reset instructions have been sent to " + request.get("email")));
    }

    @PostMapping("/reset-password")
    public ResponseEntity<Map<String, String>> resetPassword(@RequestBody Map<String, String> request) {
        // Mock success response for recovery flow demonstration
        return ResponseEntity.ok(Map.of("message", "Password has been reset successfully. Please login with your new credentials."));
    }
}
