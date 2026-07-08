package com.urbanoasis.infrastructure.scheduler;

import com.urbanoasis.domain.repository.OasisSpotRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.stereotype.Component;

@Slf4j
@Component
public class SyncRunner implements ApplicationRunner {

    private final OasisSpotRepository oasisSpotRepository;

    public SyncRunner(OasisSpotRepository oasisSpotRepository) {
        this.oasisSpotRepository = oasisSpotRepository;
    }

    public void run(ApplicationArguments args) throws Exception {
        long count = oasisSpotRepository.count();
        if(count == 0) {
            log.info("Database empty - use POST /api/oasis/seed to populate it");
        }else {
            log.info("Database has {} spots, skipping initial sync", count);
        }

    }
}
