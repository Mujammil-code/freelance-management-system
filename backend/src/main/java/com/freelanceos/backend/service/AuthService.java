package com.freelanceos.backend.service;

import com.freelanceos.backend.dto.AuthRequest;
import com.freelanceos.backend.dto.AuthResponse;
import com.freelanceos.backend.dto.RegisterRequest;
import com.freelanceos.backend.dto.UserDTO;
import com.freelanceos.backend.entity.User;
import com.freelanceos.backend.exception.BadRequestException;
import com.freelanceos.backend.repository.UserRepository;
import com.freelanceos.backend.security.JwtTokenProvider;
import com.freelanceos.backend.security.UserPrincipal;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.HashMap;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider tokenProvider;
    private final AuthenticationManager authenticationManager;
    private final UserDetailsService userDetailsService;

    public AuthService(UserRepository userRepository, PasswordEncoder passwordEncoder,
                       JwtTokenProvider tokenProvider, AuthenticationManager authenticationManager,
                       UserDetailsService userDetailsService) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.tokenProvider = tokenProvider;
        this.authenticationManager = authenticationManager;
        this.userDetailsService = userDetailsService;
    }

    @Transactional
    public AuthResponse register(RegisterRequest request) {
        if (userRepository.existsByEmail(request.email())) {
            throw new BadRequestException("Email is already in use");
        }

        User user = User.builder()
                .firstName(request.firstName())
                .lastName(request.lastName())
                .email(request.email())
                .password(passwordEncoder.encode(request.password()))
                .role(User.Role.USER)
                .enabled(true)
                .skills(new ArrayList<>())
                .socialLinks(new HashMap<>())
                .build();

        User savedUser = userRepository.save(user);
        UserPrincipal userPrincipal = new UserPrincipal(savedUser);

        String token = tokenProvider.generateToken(userPrincipal, false);
        String refreshToken = tokenProvider.generateRefreshToken(userPrincipal);

        UserDTO userDTO = convertToUserDTO(savedUser);
        return new AuthResponse(token, refreshToken, userDTO);
    }

    public AuthResponse login(AuthRequest request) {
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.email(), request.password())
        );

        SecurityContextHolder.getContext().setAuthentication(authentication);
        UserPrincipal principal = (UserPrincipal) authentication.getPrincipal();

        String token = tokenProvider.generateToken(principal, request.rememberMe());
        String refreshToken = tokenProvider.generateRefreshToken(principal);

        UserDTO userDTO = convertToUserDTO(principal.getUser());
        return new AuthResponse(token, refreshToken, userDTO);
    }

    public AuthResponse refreshToken(String refreshToken) {
        String username = tokenProvider.extractUsername(refreshToken);
        UserDetails userDetails = userDetailsService.loadUserByUsername(username);

        if (tokenProvider.validateToken(refreshToken, userDetails)) {
            UserPrincipal principal = (UserPrincipal) userDetails;
            String newAccessToken = tokenProvider.generateToken(principal, false);
            String newRefreshToken = tokenProvider.generateRefreshToken(principal);
            UserDTO userDTO = convertToUserDTO(principal.getUser());
            return new AuthResponse(newAccessToken, newRefreshToken, userDTO);
        } else {
            throw new BadRequestException("Invalid or expired refresh token");
        }
    }

    public boolean existsByEmail(String email) {
        return userRepository.existsByEmail(email);
    }

    public UserDTO convertToUserDTO(User user) {
        return new UserDTO(
                user.getId(),
                user.getFirstName(),
                user.getLastName(),
                user.getEmail(),
                user.getPhone(),
                user.getBio(),
                user.getProfilePhoto(),
                user.getJobTitle(),
                user.getCompany(),
                user.getSkills(),
                user.getSocialLinks(),
                user.getRole().name()
        );
    }
}
