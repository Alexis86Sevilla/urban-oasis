package com.urbanoasis.domain.repository;

import com.urbanoasis.domain.model.OasisSpot;
import com.urbanoasis.domain.model.OasisType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Repository
public interface OasisSpotRepository extends JpaRepository<OasisSpot, Long> {

    List<OasisSpot> findByType(OasisType type);

    List<OasisSpot> findByIsAvailableTrue();

    Optional<OasisSpot> findByOsmNodeId(Long osmNodeId);

    @Modifying
    @Query("DELETE FROM OasisSpot")
    @Transactional
    void truncateAll();
}
