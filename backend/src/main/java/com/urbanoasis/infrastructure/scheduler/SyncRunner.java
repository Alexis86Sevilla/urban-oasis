package com.urbanoasis.infrastructure.scheduler;

import com.urbanoasis.domain.repository.OasisSpotRepository;
import com.urbanoasis.domain.service.OasisSpotService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.stereotype.Component;

@Slf4j
@Component
public class SyncRunner implements ApplicationRunner {

    private final OasisSpotService oasisSpotService;
    private final OasisSpotRepository oasisSpotRepository;

    public SyncRunner(OasisSpotService oasisSpotService, OasisSpotRepository oasisSpotRepository) {
        this.oasisSpotService = oasisSpotService;
        this.oasisSpotRepository = oasisSpotRepository;
    }

    public void run(ApplicationArguments args) throws Exception {
        long count = oasisSpotRepository.count();
        if(count == 0) {
            log.info("Database empty, running initial sync");
            oasisSpotService.executeFullSync();
            log.info("Initial sync completed");
        } else {
            log.info("Database has {} spots, skipping initial sync", count);
        }
    }
}
