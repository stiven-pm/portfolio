package com.app.products.repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.app.products.domain.ProductLine;

@Repository
public interface ProductLineRepository extends JpaRepository<ProductLine, UUID> {

    @Query("""
            SELECT pl
            FROM ProductLine pl
            WHERE pl.subcategory.id = :subcategoryId
            ORDER BY LOWER(pl.name) ASC
            """)
    List<ProductLine> findBySubcategoryIdOrderByNameCi(@Param("subcategoryId") UUID subcategoryId);

    @Query("""
            SELECT pl FROM ProductLine pl
            WHERE pl.subcategory.id = :subcategoryId
              AND LOWER(TRIM(pl.name)) = LOWER(TRIM(:name))
            """)
    Optional<ProductLine> findBySubcategoryIdAndNameNormalized(
            @Param("subcategoryId") UUID subcategoryId,
            @Param("name") String name);

    @Query("SELECT pl FROM ProductLine pl JOIN FETCH pl.subcategory s JOIN FETCH s.category WHERE pl.id = :id")
    Optional<ProductLine> findByIdWithHierarchy(@Param("id") UUID id);
}
