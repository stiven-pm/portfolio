package com.app.products.repository;

import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.app.products.domain.VariableDefinition;

@Repository
public interface VariableDefinitionRepository extends JpaRepository<VariableDefinition, UUID> {

    @Query("SELECT v FROM VariableDefinition v WHERE upper(trim(v.name)) = upper(trim(:n))")
    Optional<VariableDefinition> findByNormalizedName(@Param("n") String n);
}
