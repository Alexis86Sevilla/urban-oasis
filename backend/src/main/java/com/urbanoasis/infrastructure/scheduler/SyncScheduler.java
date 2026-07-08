package com.urbanoasis.infrastructure.scheduler;

import com.urbanoasis.domain.service.OasisSpotService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Slf4j
@Component
public class SyncScheduler {

    private final OasisSpotService oasisSpotService;

    public SyncScheduler(OasisSpotService oasisSpotService) {
        this.oasisSpotService = oasisSpotService;
    }

    @Scheduled(cron = "${overpass.sync.cron}")
    public void scheduledSync() {
        log.info("Starting scheduled sync");
        this.oasisSpotService.executeFullSync();
    }
}
