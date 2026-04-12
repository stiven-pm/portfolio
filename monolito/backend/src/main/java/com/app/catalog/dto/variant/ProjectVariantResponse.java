package com.app.catalog.dto.variant;

import java.util.List;
import java.util.UUID;

import com.app.catalog.domain.VariantQuote;
import com.app.catalog.dto.component.ComponentResponse;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class ProjectVariantResponse {
    private UUID id;
    private String sapRef;
    private String sapCode;
    private String type;
    private String criticalMaterial;
    private String comments;
    private Integer elaborationTime;
    private Integer quantity;
    private Integer price;
    private String quotedAt;
    private String designedAt;
    private String developedAt;
    private List<ComponentResponse> components;
    private UUID baseId;
    private String baseName;
    private String baseImage;
    private String category;
    private String subcategory;
    private String line;
    private boolean effective;
    private UUID productVariantId;
    private UUID assignedQuoterId;
    private UUID assignedDesignerId;
    private UUID assignedDevelopmentUserId;
    private String planPdfKey;
    private UUID variantQuoteId;

    public ProjectVariantResponse(UUID id, String sapRef, String sapCode, VariantQuote vq,
            List<ComponentResponse> components, UUID baseId, String baseName, String baseImage,
            String category, String subcategory, String line) {
        this.id = id;
        this.sapRef = sapRef;
        this.sapCode = sapCode;
        this.type = vq != null ? vq.getType() : null;
        this.criticalMaterial = vq != null ? vq.getCriticalMaterial() : null;
        this.comments = vq != null ? vq.getComments() : null;
        this.elaborationTime = vq != null ? vq.getElaborationTime() : null;
        this.quantity = vq != null ? vq.getQuantity() : null;
        this.price = vq != null ? vq.getPrice() : null;
        this.quotedAt = vq != null && vq.getQuotedAt() != null ? vq.getQuotedAt().toString() : null;
        this.designedAt = vq != null && vq.getDesignedAt() != null ? vq.getDesignedAt().toString() : null;
        this.developedAt = vq != null && vq.getDevelopedAt() != null ? vq.getDevelopedAt().toString() : null;
        this.effective = vq != null && vq.isEffective();
        this.components = components;
        this.baseId = baseId;
        this.baseName = baseName;
        this.baseImage = baseImage;
        this.category = category;
        this.subcategory = subcategory;
        this.line = line;
        this.productVariantId = vq != null && vq.getVariant() != null ? vq.getVariant().getProductVariantId() : null;
        this.assignedQuoterId = vq != null ? vq.getAssignedQuoterId() : null;
        this.assignedDesignerId = vq != null ? vq.getAssignedDesignerId() : null;
        this.assignedDevelopmentUserId = vq != null ? vq.getAssignedDevelopmentUserId() : null;
        this.planPdfKey = vq != null ? vq.getPlanPdfKey() : null;
        this.variantQuoteId = vq != null ? vq.getId() : null;
    }

    public List<ComponentResponse> getVariables() {
        return components;
    }
}
