package com.app.products.repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.app.products.domain.Component;

@Repository
public interface ProductsComponentRepository extends JpaRepository<Component, UUID> {

    @Query("SELECT c FROM ProductsComponent c JOIN FETCH c.variableDefinition WHERE c.variant.id = :variantId ORDER BY c.sapRef")
    List<Component> findByVariantId(@Param("variantId") UUID variantId);

    @Query("SELECT c FROM ProductsComponent c JOIN FETCH c.variableDefinition WHERE c.id = :id")
    Optional<Component> findByIdWithDefinition(@Param("id") UUID id);
}
