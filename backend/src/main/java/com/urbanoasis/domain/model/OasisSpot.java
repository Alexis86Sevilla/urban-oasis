package com.urbanoasis.domain.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.Objects;

@Entity
@Table(name = "oasis_spots")
public class OasisSpot {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false)
    private OasisType type;

    @Column(nullable = false)
    private Double latitude;

    @Column(nullable = false)
    private Double longitude;

    @Column(nullable = false)
    private boolean isAvailable = true;

    @Column(unique = true, nullable = true)
    private Long osmNodeId;

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

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

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public Long getOsmNodeId() {
        return osmNodeId;
    }

    public void setOsmNodeId(Long osmNodeId) {
        this.osmNodeId = osmNodeId;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(LocalDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }

    @Override
    public boolean equals(Object o) {
        if (o == null || getClass() != o.getClass()) return false;
        OasisSpot oasisSpot = (OasisSpot) o;
        return isAvailable == oasisSpot.isAvailable && Objects.equals(id, oasisSpot.id) && Objects.equals(osmNodeId, oasisSpot.osmNodeId) && Objects.equals(name, oasisSpot.name) && Objects.equals(type, oasisSpot.type) && Objects.equals(latitude, oasisSpot.latitude) && Objects.equals(longitude, oasisSpot.longitude) && Objects.equals(createdAt, oasisSpot.createdAt) && Objects.equals(updatedAt, oasisSpot.updatedAt);
    }

    @Override
    public int hashCode() {
        return Objects.hash(id, osmNodeId, name, type, latitude, longitude, isAvailable, createdAt, updatedAt);
    }

    @Override
    public String toString() {
        return "OasisSpot{" +
                "id=" + id +
                ", osmNodeId=" + osmNodeId +
                ", name='" + name + '\'' +
                ", type='" + type + '\'' +
                ", latitude=" + latitude +
                ", longitude=" + longitude +
                ", isAvailable=" + isAvailable +
                ", createdAt=" + createdAt +
                ", updatedAt=" + updatedAt +
                '}';
    }
}
