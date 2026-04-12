package com.app.products.domain;

import java.util.UUID;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "product_variable_definitions", schema = "products")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class VariableDefinition {

    @Id
    private UUID id;

    @Column(nullable = false, length = 512)
    private String name;
}
