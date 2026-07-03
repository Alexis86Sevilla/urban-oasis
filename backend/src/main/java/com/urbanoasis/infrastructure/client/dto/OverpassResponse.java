package com.urbanoasis.infrastructure.client.dto;

import java.util.List;

public class OverpassResponse {
    private double version;
    private List<OverpassElement> elements;

    public double getVersion() {
        return version;
    }

    public void setVersion(double version) {
        this.version = version;
    }

    public List<OverpassElement> getElements() {
        return elements;
    }

    public void setElements(List<OverpassElement> elements) {
        this.elements = elements;
    }
}
