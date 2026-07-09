package com.urbanoasis.infrastructure.client;

import com.urbanoasis.domain.model.OasisSpot;
import com.urbanoasis.domain.model.OasisType;
import com.urbanoasis.infrastructure.client.dto.OverpassElement;
import com.urbanoasis.infrastructure.client.dto.OverpassResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Component;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;

import java.time.Duration;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.function.Function;

@Component
public class OverpassClient {

    private static final Logger log = LoggerFactory.getLogger(OverpassClient.class);

    private final RestTemplate restTemplate;
    private static final String OVERPASS_URL = "https://overpass-api.de/api/interpreter";

    public OverpassClient() {
        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(Duration.ofSeconds(10));
        factory.setReadTimeout(Duration.ofSeconds(60));
        this.restTemplate = new RestTemplate(factory);
    }

    public List<OasisSpot> getFountainsInSevilla() {
        String query = """
                [out:json];
                area[name="Sevilla"]->.searchArea;
                (
                  node[amenity=drinking_water](area.searchArea);
                  way[amenity=drinking_water](area.searchArea);
                  relation[amenity=drinking_water](area.searchArea);
                );
                out center;
                """;
        return executeQuery(query, element -> OasisType.WATER_FOUNTAIN);
    }

    public List<OasisSpot> getShadeInSevilla() {
        String query = """
                [out:json];
                area[name="Sevilla"]->.searchArea;
                (
                  node[leisure=park](area.searchArea);
                  node[leisure=garden](area.searchArea);
                  node[leisure=playground](area.searchArea);
                  node[leisure=recreation_ground](area.searchArea);
                );
                out;
                """;
        return executeQuery(query, element -> OasisType.SHADE);
    }

    public List<OasisSpot> getAcBuildingsInSevilla() {
        String query = """
                [out:json];
                area[name="Sevilla"]->.searchArea;
                (
                  node[amenity=library](area.searchArea);
                  way[amenity=library](area.searchArea);
                  relation[amenity=library](area.searchArea);
                  node[shop=mall](area.searchArea);
                  way[shop=mall](area.searchArea);
                  relation[shop=mall](area.searchArea);
                  node[shop=supermarket](area.searchArea);
                  way[shop=supermarket](area.searchArea);
                  relation[shop=supermarket](area.searchArea);
                );
                out center;
                """;
        return executeQuery(query, element -> OasisType.AC_BUILDING);
    }

    public OasisSpot convertToOasisSpot(OverpassElement element, OasisType type) {
        Double lat;
        Double lon;

        if ("node".equals(element.getType())) {
            lat = element.getLat();
            lon = element.getLon();
        } else {
            lat = element.getCenter() != null ? element.getCenter().getLat() : null;
            lon = element.getCenter() != null ? element.getCenter().getLon() : null;
        }

        if (lat == null || lon == null) {
            log.warn("Skipping Overpass element without coordinates. type={}, id={}", element.getType(), element.getId());
            return null;
        }

        OasisSpot spot = new OasisSpot();
        spot.setOsmNodeId(element.getId());
        String name = element.getTags() != null && element.getTags().getName() != null
                ? element.getTags().getName()
                : assignTypeIfUnknown(type);
        spot.setName(name);
        spot.setType(type);
        spot.setLatitude(lat);
        spot.setLongitude(lon);
        spot.setAvailable(true);
        return spot;
    }

    private String assignTypeIfUnknown(OasisType type) {
        return switch (type) {
            case WATER_FOUNTAIN -> "Fuente";
            case SHADE -> "Parque";
            case AC_BUILDING -> "Edificio";
        };
    }

    private List<OasisSpot> executeQuery(String query, Function<OverpassElement, OasisType> typeResolver) {
        try {
            MultiValueMap<String, String> params = new LinkedMultiValueMap<>();
            params.add("data", query);

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);
            headers.set("User-Agent", "UrbanOasis/1.0");

            HttpEntity<MultiValueMap<String, String>> request = new HttpEntity<>(params, headers);

            OverpassResponse response = restTemplate.postForObject(
                    OVERPASS_URL,
                    request,
                    OverpassResponse.class
            );

            return mapResponse(response, typeResolver);
        } catch (RestClientException e) {
            log.error("Overpass API call failed: {}", e.getMessage());
            return Collections.emptyList();
        }
    }

    private List<OasisSpot> mapResponse(OverpassResponse response, Function<OverpassElement, OasisType> typeResolver) {
        List<OasisSpot> spots = new ArrayList<>();
        if (response == null || response.getElements() == null) {
            return spots;
        }

        for (OverpassElement element : response.getElements()) {
            if (element.getId() == null) {
                log.warn("Skipping Overpass element without id. tags={}", element.getTags());
                continue;
            }

            OasisType type = typeResolver.apply(element);
            if (type == null) {
                log.warn("Skipping Overpass element with unrecognized tags. id={}, tags={}", element.getId(), element.getTags());
                continue;
            }

            OasisSpot spot = convertToOasisSpot(element, type);
            if (spot != null) {
                spots.add(spot);
            }
        }
        return spots;
    }
}
