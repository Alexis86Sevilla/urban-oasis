package com.urbanoasis.infrastructure.client;

import com.urbanoasis.domain.model.OasisSpot;
import com.urbanoasis.domain.model.OasisType;
import com.urbanoasis.infrastructure.client.dto.OverpassElement;
import com.urbanoasis.infrastructure.client.dto.OverpassResponse;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestTemplate;

import java.util.ArrayList;
import java.util.List;

@Component
public class OverpassClient {

    private final RestTemplate restTemplate;
    private static final String OVERPASS_URL = "https://overpass-api.de/api/interpreter";

    public OverpassClient() {
        this.restTemplate = new RestTemplate();
    }

    public List<OasisSpot> getWaterFountainsInSevilla() {
        String query = getQueryForType(OasisType.WATER_FOUNTAIN);
        return getResponse(query, OasisType.WATER_FOUNTAIN);
    }

    public List<OasisSpot> getShadeSpotsInSevilla() {
        String query = getQueryForType(OasisType.SHADE);
        return getResponse(query, OasisType.SHADE);
    }

    public List<OasisSpot> getAcBuildingsInSevilla() {
        String query = getQueryForType(OasisType.AC_BUILDING);
        return getResponse(query, OasisType.AC_BUILDING);
    }

    private OasisSpot convertToOasisSpot(OverpassElement element, OasisType type) {
        OasisSpot spot = new OasisSpot();
        String name = element.getTags() != null && element.getTags().getName() != null
                ? element.getTags().getName()
                : assignTypeIfUnknown(type);
        spot.setName(name);
        spot.setType(type);
        spot.setLatitude(element.getLat());
        spot.setLongitude(element.getLon());
        spot.setAvailable(true);
        return spot;
    }

    private String assignTypeIfUnknown(OasisType type) {
        return switch (type) {
            case WATER_FOUNTAIN -> "Fuente sin nombre";
            case SHADE -> "Parque sin nombre";
            case AC_BUILDING -> "Edificio sin nombre";
        };
    }

    private String getQueryForType(OasisType type) {
        return switch (type) {
            case WATER_FOUNTAIN -> "[out:json];area[name=\"Sevilla\"]->.searchArea;node[amenity=drinking_water](area.searchArea);out;";
            case SHADE -> "[out:json];area[name=\"Sevilla\"]->.searchArea;node[leisure=park](area.searchArea);out;";
            case AC_BUILDING -> """
                    [out:json];
                    area[name="Sevilla"]->.searchArea;
                    (
                      node[amenity=library](area.searchArea);
                      node[amenity=cinema](area.searchArea);
                      node[shop=mall](area.searchArea);
                    );
                    out;
                    """;
        };
    }

    private List<OasisSpot>  getResponse(String query, OasisType type) {
        MultiValueMap<String, String> params = new LinkedMultiValueMap<>();
        params.add("data", query);

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);

        HttpEntity<MultiValueMap<String, String>> request = new HttpEntity<>(params, headers);

        OverpassResponse response = restTemplate.postForObject(
                OVERPASS_URL,
                request,
                OverpassResponse.class
        );

        List<OasisSpot> spots = new ArrayList<>();
        if (response != null && response.getElements() != null) {
            for (OverpassElement element : response.getElements()) {
                spots.add(convertToOasisSpot(element, type));
            }
        }
        return spots;
    }
}
