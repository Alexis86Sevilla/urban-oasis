package com.urbanoasis.domain.service;

import com.urbanoasis.domain.model.OasisSpot;
import com.urbanoasis.domain.model.OasisType;
import com.urbanoasis.domain.repository.OasisSpotRepository;
import com.urbanoasis.infrastructure.client.OverpassClient;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@Service
public class OasisSpotService {

    private final OasisSpotRepository repository;

    private final OverpassClient overpassClient;

    public OasisSpotService(OasisSpotRepository repository, OverpassClient overpassClient) {
        this.repository = repository;
        this.overpassClient = overpassClient;
    }

    public List<OasisSpot> getAllSpots() {
        return repository.findAll();
    }

    public List<OasisSpot> getSpotsByType(OasisType type) {
        return repository.findByType(type);
    }

    public List<OasisSpot> getAvailableSpots() {
        return repository.findByIsAvailableTrue();
    }

    public OasisSpot getSpotById(Long id) {
        return repository.findById(id).orElse(null);
    }

    public OasisSpot save(OasisSpot spot) {
        return repository.save(spot);
    }

    public void delete(Long id) {
        repository.deleteById(id);
    }

    public void update(OasisSpot spot) {
        repository.save(spot);
    }

    public Optional<OasisSpot> updateById(Long id, OasisSpot newData) {
        return repository.findById(id).map(existing -> {
            existing.setName(newData.getName());
            existing.setType(newData.getType());
            existing.setLatitude(newData.getLatitude());
            existing.setLongitude(newData.getLongitude());
            existing.setAvailable(newData.isAvailable());
            return repository.save(existing);
        });
    }

    @Transactional
    public void updateAvailability(Long id, boolean availability) {
        repository.findById(id).ifPresent(spot -> spot.setAvailable(availability));
    }

    @Transactional
    public void updateType(Long id, OasisType type) {
        repository.findById(id).ifPresent(spot -> spot.setType(type));
    }

    @Transactional
    public void updateName(Long id, String name) {
        repository.findById(id).ifPresent(spot -> spot.setName(name));
    }

    @Transactional
    public void updateLocation(Long id, Double latitude, Double longitude) {
        repository.findById(id).ifPresent(spot -> {
            spot.setLatitude(latitude);
            spot.setLongitude(longitude);
        });
    }

    public void syncFountainsAndShadesFromOverpass() {
        List<OasisSpot> allSpots = new ArrayList<>();

        allSpots.addAll(overpassClient.getWaterFountainsInSevilla());
        allSpots.addAll(overpassClient.getShadeSpotsInSevilla());

        repository.saveAll(allSpots);
    }

    public void syncACBuildingsFromOverpass() {
        List<OasisSpot> acBuildings = overpassClient.getAcBuildingsInSevilla();

        repository.saveAll(acBuildings);
    }
}
