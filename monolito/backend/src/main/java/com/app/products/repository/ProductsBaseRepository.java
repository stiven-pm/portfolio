package com.app.products.repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.app.products.domain.Base;

@Repository
public interface ProductsBaseRepository extends JpaRepository<Base, UUID> {

    @Query("SELECT DISTINCT b FROM ProductsBase b LEFT JOIN FETCH b.productCategory LEFT JOIN FETCH b.productSubcategory LEFT JOIN FETCH b.productLine")
    List<Base> findAllWithTaxonomy();

    @Query("SELECT b FROM ProductsBase b LEFT JOIN FETCH b.productCategory LEFT JOIN FETCH b.productSubcategory LEFT JOIN FETCH b.productLine WHERE b.id = :id")
    Optional<Base> findByIdWithTaxonomy(@Param("id") UUID id);
}
