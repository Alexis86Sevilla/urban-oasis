package com.urbanoasis.infrastructure.client.dto;

public class OverpassElement {

    private String type;
    private Long id;
    private Double lat;
    private Double lon;
    private Center center;
    private OverpassTags tags;

    public static class Center {
        private Double lat;
        private Double lon;

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
    }

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

    public Center getCenter() {
        return center;
    }

    public void setCenter(Center center) {
        this.center = center;
    }

    public OverpassTags getTags() {
        return tags;
    }

    public void setTags(OverpassTags tags) {
        this.tags = tags;
    }
}
