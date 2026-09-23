package com.urbanoasis.api.dto;

import com.urbanoasis.domain.model.OasisType;
import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

/**
 * Write-only request payload for creating/updating an oasis spot.
 *
 * <p>Intentionally excludes {@code id}, {@code osmNodeId}, {@code createdAt}
 * and {@code updatedAt} to prevent mass assignment and to close the
 * {@code osmNodeId} collision/hijack vector against the sync dedupe logic.
 */
public class OasisSpotRequest {

    @NotBlank
    @Size(max = 200)
    private String name;

    @NotNull
    private OasisType type;

    @NotNull
    @DecimalMin("-90")
    @DecimalMax("90")
    private Double latitude;

    @NotNull
    @DecimalMin("-180")
    @DecimalMax("180")
    private Double longitude;

    private boolean isAvailable = true;

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public OasisType getType() {
        return type;
    }

    public void setType(OasisType type) {
        this.type = type;
    }

    public Double getLatitude() {
        return latitude;
    }

    public void setLatitude(Double latitude) {
        this.latitude = latitude;
    }

    public Double getLongitude() {
        return longitude;
    }

    public void setLongitude(Double longitude) {
        this.longitude = longitude;
    }

    public boolean isAvailable() {
        return isAvailable;
    }

    public void setAvailable(boolean available) {
        isAvailable = available;
    }
}
