package com.app.catalog.repository;

import java.util.List;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.app.catalog.domain.Component;

@Repository
public interface ComponentRepository extends JpaRepository<Component, UUID> {

    List<Component> findByVariant_Id(UUID variantId);
}
