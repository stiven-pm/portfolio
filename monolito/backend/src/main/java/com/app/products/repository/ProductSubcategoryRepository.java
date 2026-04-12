package com.app.products.repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.app.products.domain.ProductSubcategory;

@Repository
public interface ProductSubcategoryRepository extends JpaRepository<ProductSubcategory, UUID> {

    @Query("""
            SELECT s
            FROM ProductSubcategory s
            WHERE s.category.id = :categoryId
            ORDER BY LOWER(s.name) ASC
            """)
    List<ProductSubcategory> findByCategoryIdOrderByNameCi(@Param("categoryId") UUID categoryId);

    @Query("""
            SELECT s FROM ProductSubcategory s
            WHERE s.category.id = :categoryId
              AND LOWER(TRIM(s.name)) = LOWER(TRIM(:name))
            """)
    Optional<ProductSubcategory> findByCategoryIdAndNameNormalized(
            @Param("categoryId") UUID categoryId,
            @Param("name") String name);
}
