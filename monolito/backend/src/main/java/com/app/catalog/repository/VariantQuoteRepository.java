package com.app.catalog.repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.app.catalog.domain.VariantQuote;

@Repository
public interface VariantQuoteRepository extends JpaRepository<VariantQuote, UUID> {

    Optional<VariantQuote> findByIdAndProject_Id(UUID id, UUID projectId);

    @Query("SELECT vq FROM VariantQuote vq WHERE vq.project.id = :projectId")
    List<VariantQuote> findByProjectId(@Param("projectId") UUID projectId);

    @Query("SELECT vq FROM VariantQuote vq WHERE vq.variant.id = :variantId")
    List<VariantQuote> findByVariantId(@Param("variantId") UUID variantId);

    @Query("SELECT vq FROM VariantQuote vq WHERE vq.variant.id = :variantId AND vq.project.id = :projectId")
    Optional<VariantQuote> findByVariantIdAndProjectId(
            @Param("variantId") UUID variantId,
            @Param("projectId") UUID projectId);

    @Modifying
    @Query("DELETE FROM VariantQuote vq WHERE vq.variant.id = :variantId")
    void deleteByVariantId(@Param("variantId") UUID variantId);

    @Modifying
    @Query("DELETE FROM VariantQuote vq WHERE vq.variant.id = :variantId AND vq.project.id = :projectId")
    void deleteByVariantIdAndProjectId(@Param("variantId") UUID variantId, @Param("projectId") UUID projectId);

    @Query("SELECT vq.variant.id FROM VariantQuote vq WHERE vq.type IS NOT NULL AND LOWER(TRIM(vq.type)) IN ('p1', 'p2', 'p3', 'p5')")
    List<UUID> findVariantIdsWithQuoteType();

    @Modifying(clearAutomatically = true)
    @Query("UPDATE VariantQuote vq SET vq.price = 0, vq.elaborationTime = 0, vq.criticalMaterial = null WHERE vq.variant.id = :variantId")
    int resetQuoteByVariantId(@Param("variantId") UUID variantId);

    @Modifying(clearAutomatically = true)
    @Query("UPDATE VariantQuote vq SET vq.price = 0, vq.elaborationTime = 0, vq.criticalMaterial = null WHERE vq.project.id = :projectId")
    int resetQuoteByProjectId(@Param("projectId") UUID projectId);

    @Query("SELECT DISTINCT vq.project.id FROM VariantQuote vq WHERE vq.assignedQuoterId = :quoterId")
    List<UUID> findProjectIdsByAssignedQuoterId(@Param("quoterId") UUID quoterId);

    @Query("SELECT DISTINCT vq.project.id FROM VariantQuote vq WHERE vq.assignedDesignerId = :designerId")
    List<UUID> findProjectIdsByAssignedDesignerId(@Param("designerId") UUID designerId);

    @Query("SELECT DISTINCT vq.project.id FROM VariantQuote vq WHERE vq.assignedDevelopmentUserId = :userId")
    List<UUID> findProjectIdsByAssignedDevelopmentUserId(@Param("userId") UUID userId);
}
