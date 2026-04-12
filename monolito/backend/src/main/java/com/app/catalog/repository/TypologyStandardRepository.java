package com.app.catalog.repository;

import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.app.catalog.domain.TypologyStandard;

@Repository
public interface TypologyStandardRepository extends JpaRepository<TypologyStandard, UUID> {

    Optional<TypologyStandard> findByTipologiaIgnoreCase(String tipologia);
}
