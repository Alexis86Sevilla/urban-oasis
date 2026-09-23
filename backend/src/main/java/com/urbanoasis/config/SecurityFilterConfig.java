package com.urbanoasis.config;

import com.urbanoasis.api.security.ApiKeyAuthFilter;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.web.servlet.FilterRegistrationBean;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * Registers {@link ApiKeyAuthFilter} scoped to {@code /api/oasis/*} only, so
 * no other path is affected.
 */
@Configuration
public class SecurityFilterConfig {

    @Value("${admin.api-key:}")
    private String adminApiKey;

    @Bean
    public FilterRegistrationBean<ApiKeyAuthFilter> apiKeyAuthFilter() {
        FilterRegistrationBean<ApiKeyAuthFilter> registration = new FilterRegistrationBean<>();
        registration.setFilter(new ApiKeyAuthFilter(adminApiKey));
        registration.addUrlPatterns("/api/oasis/*");
        registration.setName("apiKeyAuthFilter");
        registration.setOrder(1);
        return registration;
    }
}
