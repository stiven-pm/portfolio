package com.app.catalog.domain;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

import org.hibernate.annotations.BatchSize;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "variant_quote", schema = "catalog", uniqueConstraints = {
    @UniqueConstraint(name = "uk_variant_quote_project_variant", columnNames = {"project_id", "variant_id"})
})
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class VariantQuote {

    @Id
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "variant_id")
    private Variant variant;

    @Column(name = "base_id")
    private UUID baseId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "project_id")
    private Project project;

    @OneToMany(mappedBy = "variantQuote", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @BatchSize(size = 64)
    @Builder.Default
    private List<VariantQuoteComponentOverride> componentOverrides = new ArrayList<>();

    @Column(name = "quoter_id")
    private UUID quoterId;

    private String type;

    @Column(name = "critical_material")
    private String criticalMaterial;

    private String comments;

    private String image;

    @Column(name = "elaboration_time")
    private Integer elaborationTime;

    private Integer quantity;

    private Integer price;

    @Builder.Default
    private boolean effective = false;

    @Column(name = "quoted_at")
    private Instant quotedAt;

    @Column(name = "designed_at")
    private Instant designedAt;

    @Column(name = "developed_at")
    private Instant developedAt;

    @Column(name = "designer_id")
    private UUID designerId;

    @Column(name = "development_user_id")
    private UUID developmentUserId;

    @Column(name = "assigned_quoter_id")
    private UUID assignedQuoterId;

    @Column(name = "assigned_designer_id")
    private UUID assignedDesignerId;

    @Column(name = "assigned_development_user_id")
    private UUID assignedDevelopmentUserId;

    @Column(name = "plan_pdf_key")
    private String planPdfKey;
}
