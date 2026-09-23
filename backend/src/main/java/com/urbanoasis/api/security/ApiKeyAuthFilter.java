package com.urbanoasis.api.security;

import jakarta.annotation.PostConstruct;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;

/**
 * Requires a valid {@code X-API-Key} header on every mutating request under
 * {@code /api/oasis/**}. GET requests and CORS preflight (OPTIONS) stay public
 * so the read-only contract used by the frontend keeps working unchanged.
 *
 * <p>Fails closed: if {@code admin.api-key} is not configured, every
 * protected request is rejected and mutating endpoints are effectively
 * disabled. The configured key is never logged or echoed back.
 */
public class ApiKeyAuthFilter extends OncePerRequestFilter {

    private static final Logger log = LoggerFactory.getLogger(ApiKeyAuthFilter.class);
    private static final String API_KEY_HEADER = "X-API-Key";

    private final String configuredApiKey;

    public ApiKeyAuthFilter(String configuredApiKey) {
        this.configuredApiKey = configuredApiKey;
    }

    @PostConstruct
    public void warnIfUnconfigured() {
        if (isBlank(configuredApiKey)) {
            log.warn("ADMIN_API_KEY is not configured: mutating /api/oasis endpoints are disabled (failing closed).");
        }
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {

        String method = request.getMethod();
        if (HttpMethod.GET.matches(method) || HttpMethod.OPTIONS.matches(method)) {
            filterChain.doFilter(request, response);
            return;
        }

        if (isAuthorized(request)) {
            filterChain.doFilter(request, response);
            return;
        }

        response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        response.setCharacterEncoding(StandardCharsets.UTF_8.name());
        response.getWriter().write("{\"error\":\"Unauthorized\"}");
    }

    private boolean isAuthorized(HttpServletRequest request) {
        if (isBlank(configuredApiKey)) {
            return false;
        }

        String suppliedKey = request.getHeader(API_KEY_HEADER);
        if (suppliedKey == null) {
            return false;
        }

        byte[] expected = configuredApiKey.getBytes(StandardCharsets.UTF_8);
        byte[] actual = suppliedKey.getBytes(StandardCharsets.UTF_8);
        return MessageDigest.isEqual(expected, actual);
    }

    private static boolean isBlank(String value) {
        return value == null || value.isBlank();
    }
}
