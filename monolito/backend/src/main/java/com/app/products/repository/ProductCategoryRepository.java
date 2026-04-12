package com.app.products.repository;

import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.app.products.domain.ProductCategory;

@Repository
public interface ProductCategoryRepository extends JpaRepository<ProductCategory, UUID> {

    @Query("SELECT c FROM ProductCategory c WHERE LOWER(TRIM(c.name)) = LOWER(TRIM(:name))")
    Optional<ProductCategory> findByNameNormalized(@Param("name") String name);
}
