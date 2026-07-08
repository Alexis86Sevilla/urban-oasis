package com.urbanoasis.domain.service;

import com.urbanoasis.domain.model.OasisSpot;
import com.urbanoasis.domain.model.OasisType;
import com.urbanoasis.domain.repository.OasisSpotRepository;
import com.urbanoasis.infrastructure.client.OverpassClient;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@Service
public class OasisSpotService {

    private static final Logger log = LoggerFactory.getLogger(OasisSpotService.class);

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

    @Transactional
    public void truncateAll() {
        repository.truncateAll();
    }

    @Transactional
    public void executeFullSync() {
        int created = 0;
        int updated = 0;
        int skipped = 0;

        List<OasisSpot> allSpots = new ArrayList<>();
        allSpots.addAll(overpassClient.getFountainsInSevilla());

        sleepBetweenQueries();

        allSpots.addAll(overpassClient.getShadeInSevilla());

        sleepBetweenQueries();

        allSpots.addAll(overpassClient.getAcBuildingsInSevilla());

        LocalDateTime now = LocalDateTime.now();
        for (OasisSpot incoming : allSpots) {
            SyncResult result = saveOrUpdateSpot(incoming, now);
            switch (result) {
                case CREATED -> created++;
                case UPDATED -> updated++;
                case SKIPPED -> skipped++;
            }
        }

        log.info("Sync complete: {} created, {} updated, {} skipped", created, updated, skipped);
    }

    @Transactional
    public void syncFountainsAndShadesFromOverpass() {
        LocalDateTime now = LocalDateTime.now();
        overpassClient.getFountainsInSevilla().forEach(spot -> saveOrUpdateSpot(spot, now));
        overpassClient.getShadeInSevilla().forEach(spot -> saveOrUpdateSpot(spot, now));
    }

    @Transactional
    public void syncACBuildingsFromOverpass() {
        LocalDateTime now = LocalDateTime.now();
        overpassClient.getAcBuildingsInSevilla().forEach(spot -> saveOrUpdateSpot(spot, now));
    }

    private SyncResult saveOrUpdateSpot(OasisSpot incoming, LocalDateTime now) {
        if (incoming.getOsmNodeId() == null) {
            log.warn("Skipping spot without osmNodeId: {}", incoming);
            return SyncResult.SKIPPED;
        }

        Optional<OasisSpot> existing = repository.findByOsmNodeId(incoming.getOsmNodeId());
        if (existing.isPresent()) {
            OasisSpot spot = existing.get();
            spot.setName(incoming.getName());
            spot.setType(incoming.getType());
            spot.setLatitude(incoming.getLatitude());
            spot.setLongitude(incoming.getLongitude());
            spot.setAvailable(incoming.isAvailable());
            spot.setUpdatedAt(now);
            repository.save(spot);
            return SyncResult.UPDATED;
        }

        incoming.setUpdatedAt(now);
        repository.save(incoming);
        return SyncResult.CREATED;
    }

    private void sleepBetweenQueries() {
        try {
            Thread.sleep(30_000);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            log.warn("Sleep between Overpass queries interrupted");
        }
    }

    private enum SyncResult {
        CREATED,
        UPDATED,
        SKIPPED
    }

    @Transactional
    public int seedSpots(List<OasisSpot> spots) {
        int saved = 0;
        LocalDateTime now = LocalDateTime.now();
        for (OasisSpot spot : spots) {
            SyncResult result = saveOrUpdateSpot(spot, now);
            if (result != SyncResult.SKIPPED) {
                saved++;
            }
        }
        log.info("Seed complete: {} spots saved out of {}", saved, spots.size());
        return saved;
    }
}
