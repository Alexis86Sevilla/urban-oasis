package com.urbanoasis.api.security;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.options;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Regression test locking in the {@code X-API-Key} protection registered by
 * {@link com.urbanoasis.config.SecurityFilterConfig} on {@code /api/oasis/*}.
 *
 * <p>Boots the real application context and dispatches through the actual
 * {@code DispatcherServlet} filter chain (rather than exercising
 * {@link ApiKeyAuthFilter} in isolation), so a dropped registration or a
 * broken URL pattern in {@code SecurityFilterConfig} fails this test too,
 * not just a unit test of the filter class.
 */
@SpringBootTest
@AutoConfigureMockMvc
@TestPropertySource(properties = "admin.api-key=" + ApiKeyAuthFilterSecurityTest.CONFIGURED_KEY)
class ApiKeyAuthFilterSecurityTest {

    static final String CONFIGURED_KEY = "test-only-key-not-a-secret";

    private static final String API_KEY_HEADER = "X-API-Key";

    @Autowired
    private MockMvc mockMvc;

    @Test
    void postWithoutApiKeyIsRejected() throws Exception {
        mockMvc.perform(post("/api/oasis")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(validSpotJson()))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void postWithWrongApiKeyIsRejected() throws Exception {
        mockMvc.perform(post("/api/oasis")
                        .header(API_KEY_HEADER, "not-the-configured-key")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(validSpotJson()))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void deleteByTypeWithoutApiKeyIsRejected() throws Exception {
        mockMvc.perform(delete("/api/oasis/type/WATER_FOUNTAIN"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void postWithCorrectApiKeyIsLetThrough() throws Exception {
        // Body is intentionally left empty: the point of this assertion is
        // only that the filter forwards the request past itself instead of
        // rejecting it with 401. Whatever the controller/validation layer
        // does with an incomplete payload afterwards is not this test's
        // concern.
        MvcResult result = mockMvc.perform(post("/api/oasis")
                        .header(API_KEY_HEADER, CONFIGURED_KEY)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{}"))
                .andReturn();

        assertThat(result.getResponse().getStatus()).isNotEqualTo(401);
    }

    @Test
    void getAllStaysPublic() throws Exception {
        mockMvc.perform(get("/api/oasis"))
                .andExpect(status().isOk());
    }

    @Test
    void corsPreflightStaysPublic() throws Exception {
        MvcResult result = mockMvc.perform(options("/api/oasis")
                        .header("Origin", "http://localhost:4200")
                        .header("Access-Control-Request-Method", "POST"))
                .andReturn();

        assertThat(result.getResponse().getStatus()).isNotEqualTo(401);
    }

    private static String validSpotJson() {
        return """
                {
                  "name": "Test spot",
                  "type": "WATER_FOUNTAIN",
                  "latitude": 37.38,
                  "longitude": -5.98,
                  "available": true
                }
                """;
    }
}
