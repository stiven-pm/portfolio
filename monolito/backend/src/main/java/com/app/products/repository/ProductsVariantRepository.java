package com.app.products.repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.app.products.domain.Variant;

@Repository
public interface ProductsVariantRepository extends JpaRepository<Variant, UUID> {

    @Query("""
            SELECT DISTINCT v FROM ProductsVariant v
            JOIN FETCH v.base b
            LEFT JOIN FETCH b.productCategory
            LEFT JOIN FETCH b.productSubcategory
            LEFT JOIN FETCH b.productLine
            LEFT JOIN FETCH v.components c
            LEFT JOIN FETCH c.variableDefinition
            WHERE b.id = :baseId
            """)
    List<Variant> findByBaseIdWithComponents(@Param("baseId") UUID baseId);

    @Query("""
            SELECT DISTINCT v FROM ProductsVariant v
            JOIN FETCH v.base b
            LEFT JOIN FETCH b.productCategory
            LEFT JOIN FETCH b.productSubcategory
            LEFT JOIN FETCH b.productLine
            LEFT JOIN FETCH v.components c
            LEFT JOIN FETCH c.variableDefinition
            WHERE v.id = :id
            """)
    Optional<Variant> findByIdWithComponents(@Param("id") UUID id);

    List<Variant> findByBaseId(UUID baseId);

    long countByBaseId(UUID baseId);
}
