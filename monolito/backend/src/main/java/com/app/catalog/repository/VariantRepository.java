package com.app.catalog.repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.app.catalog.domain.Variant;

@Repository
public interface VariantRepository extends JpaRepository<Variant, UUID> {

    @EntityGraph(attributePaths = {"components"})
    List<Variant> findByBase_Id(UUID baseId);

    @EntityGraph(attributePaths = {"components"})
    @Query("SELECT v FROM CatalogVariant v")
    List<Variant> findAllWithComponents();

    @EntityGraph(attributePaths = {"components"})
    @Query("SELECT v FROM CatalogVariant v WHERE v.id = :id")
    Optional<Variant> findByIdWithComponents(@Param("id") UUID id);
}
