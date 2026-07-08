package com.urbanoasis.api.controller;

import com.urbanoasis.domain.model.OasisSpot;
import com.urbanoasis.domain.model.OasisType;
import com.urbanoasis.domain.service.OasisSpotService;
import com.urbanoasis.infrastructure.client.dto.OverpassElement;
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
        return ResponseEntity.ok().body(oasisSpot);
    }

    @PostMapping
    public ResponseEntity<OasisSpot> create(@RequestBody OasisSpot spot) {
        OasisSpot savedSpot = oasisSpotService.save(spot);
        return ResponseEntity.ok().body(savedSpot);
    }

    @PutMapping("/{id}")
    public ResponseEntity<OasisSpot> update(@PathVariable Long id, @RequestBody OasisSpot spot) {
        return oasisSpotService.updateById(id, spot)
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

    @PostMapping("/seed")
    public ResponseEntity<String> seed(@RequestBody List<OverpassElement> elements, @RequestParam OasisType type) {
        int saved = oasisSpotService.seedFromOverpass(elements, type);
        return ResponseEntity.ok("Seeded " + saved + " " + type + " spots");
    }

    @DeleteMapping("/type/{type}")
    public ResponseEntity<String> deleteByType(@PathVariable OasisType type) {
        oasisSpotService.deleteByType(type);
        return ResponseEntity.ok("Deleted all " + type + " spots");
    }
}
