package com.urbanoasis.domain.service;

import com.urbanoasis.domain.model.OasisSpot;
import com.urbanoasis.domain.repository.OasisSpotRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
public class OasisSpotService {

    private final OasisSpotRepository repository;

    public OasisSpotService(OasisSpotRepository repository) {
        this.repository = repository;
    }

    public List<OasisSpot> getAllSpots() {
        return repository.findAll();
    }

    public List<OasisSpot> getSpotsByType(String type) {
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
    public void updateType(Long id, String type) {
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
}
