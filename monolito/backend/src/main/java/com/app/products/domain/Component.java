package com.app.products.domain;

import java.util.UUID;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity(name = "ProductsComponent")
@Table(name = "components", schema = "products")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Component {

    @Id
    private UUID id;

    @Column(name = "sap_ref")
    private String sapRef;

    @Column(name = "sap_code")
    private String sapCode;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "variable_definition_id", nullable = false)
    private VariableDefinition variableDefinition;

    private String value;

    @Column(name = "original_value")
    private String originalValue;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "variant_id", nullable = false)
    private Variant variant;

    @Column(name = "editable")
    @Builder.Default
    private boolean editable = true;

    @Column(name = "list_only")
    @Builder.Default
    private boolean listOnly = false;

    public String getCatalogOriginalValue() {
        return originalValue;
    }

    public String getName() {
        return variableDefinition != null && variableDefinition.getName() != null
                ? variableDefinition.getName()
                : "";
    }

    public UUID getVariableDefinitionId() {
        return variableDefinition != null ? variableDefinition.getId() : null;
    }
}
