package com.urbanoasis.infrastructure.client.dto;

public class OverpassElement {

    private String type;
    private Long id;
    private Double lat;
    private Double lon;
    private OverpassTags tags;

    public String getType() {
        return type;
    }

    public void setType(String type) {
        this.type = type;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Double getLat() {
        return lat;
    }

    public void setLat(Double lat) {
        this.lat = lat;
    }

    public Double getLon() {
        return lon;
    }

    public void setLon(Double lon) {
        this.lon = lon;
    }

    public OverpassTags getTags() {
        return tags;
    }

    public void setTags(OverpassTags tags) {
        this.tags = tags;
    }
}
