package com.urbanoasis.domain.repository;

import com.urbanoasis.domain.model.OasisSpot;
import com.urbanoasis.domain.model.OasisType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface OasisSpotRepository extends JpaRepository<OasisSpot, Long> {

    List<OasisSpot> findByType(OasisType type);

    List<OasisSpot> findByIsAvailableTrue();
}
