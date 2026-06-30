package com.urbanoasis.domain.repository;

import com.urbanoasis.domain.model.OasisSpot;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface OasisSpotRepository extends JpaRepository<OasisSpot, Long> {

    List<OasisSpot> findByType(String type);

    List<OasisSpot> findByIsAvailableTrue();
}
