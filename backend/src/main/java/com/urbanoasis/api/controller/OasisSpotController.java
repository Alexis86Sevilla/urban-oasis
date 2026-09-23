package com.urbanoasis.api.controller;

import com.urbanoasis.api.dto.OasisSpotRequest;
import com.urbanoasis.domain.model.OasisSpot;
import com.urbanoasis.domain.model.OasisType;
import com.urbanoasis.domain.service.OasisSpotService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/oasis")
public class OasisSpotController {

    private final OasisSpotService oasisSpotService;

    public OasisSpotController(OasisSpotService oasisSpotService) {
        this.oasisSpotService = oasisSpotService;
    }

    @GetMapping
    public ResponseEntity<List<OasisSpot>> getAll() {
        List<OasisSpot> oasisSpots = oasisSpotService.getAllSpots();
        return ResponseEntity.ok().body(oasisSpots);
    }

    @GetMapping("/{id}")
    public ResponseEntity<OasisSpot> getById(@PathVariable Long id) {
        OasisSpot oasisSpot = oasisSpotService.getSpotById(id);
        if (oasisSpot == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok().body(oasisSpot);
    }

    @PostMapping
    public ResponseEntity<OasisSpot> create(@Valid @RequestBody OasisSpotRequest request) {
        OasisSpot savedSpot = oasisSpotService.save(toEntity(request));
        return ResponseEntity.ok().body(savedSpot);
    }

    @PutMapping("/{id}")
    public ResponseEntity<OasisSpot> update(@PathVariable Long id, @Valid @RequestBody OasisSpotRequest request) {
        return oasisSpotService.updateById(id, toEntity(request))
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        oasisSpotService.delete(id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/syncFountainsAndShades")
    public ResponseEntity<String> syncFountainsAndShadesFromOverpass() {
        oasisSpotService.syncFountainsAndShadesFromOverpass();
        return ResponseEntity.ok("Data synchronized from Overpass API");
    }

    @PostMapping("/syncACBuildings")
    public ResponseEntity<String> syncACBuildingsFromOverpass() {
        oasisSpotService.syncACBuildingsFromOverpass();
        return ResponseEntity.ok("Data synchronized from Overpass API");
    }

    @DeleteMapping("/type/{type}")
    public ResponseEntity<String> deleteByType(@PathVariable OasisType type) {
        oasisSpotService.deleteByType(type);
        return ResponseEntity.ok("Deleted all " + type + " spots");
    }

    private OasisSpot toEntity(OasisSpotRequest request) {
        OasisSpot spot = new OasisSpot();
        spot.setName(request.getName());
        spot.setType(request.getType());
        spot.setLatitude(request.getLatitude());
        spot.setLongitude(request.getLongitude());
        spot.setAvailable(request.isAvailable());
        return spot;
    }
}
