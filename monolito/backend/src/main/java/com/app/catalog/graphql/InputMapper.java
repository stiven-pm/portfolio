package com.app.catalog.graphql;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

import com.app.catalog.dto.component.CreateComponent;
import com.app.catalog.dto.p3.CreateP3Component;
import com.app.catalog.dto.p3.CreateP3Request;
import com.app.catalog.dto.project.CreateProject;
import com.app.catalog.dto.variant.CreateVariant;
import com.app.catalog.dto.variant.QuoteVariant;
import com.app.catalog.graphql.CatalogGraphQLController.*;

final class InputMapper {

    private InputMapper() {}

    static CreateProject toCreateProject(CreateProjectInput input) {
        if (input == null) return null;
        List<CreateVariant> variants = input.variants() == null ? List.of()
                : input.variants().stream().map(InputMapper::toCreateVariant).collect(Collectors.toList());
        List<CreateP3Request> p3s = input.p3s() == null ? List.of()
                : input.p3s().stream().map(InputMapper::toP3).collect(Collectors.toList());
        return new CreateProject(
                input.name(), input.client(), input.region(),
                input.salesName(), input.salesEmail(), input.salesPhone(),
                input.salesSignature(), input.salesJobTitle(),
                input.salesId() != null ? UUID.fromString(input.salesId()) : null,
                input.quoterName(), input.quoterEmail(),
                input.quoterId() != null ? UUID.fromString(input.quoterId()) : null,
                variants, p3s);
    }

    private static CreateVariant toCreateVariant(CreateVariantInput in) {
        if (in == null) return null;
        List<CreateComponent> components = in.components() == null ? List.of()
                : in.components().stream().map(InputMapper::toComponent).collect(Collectors.toList());
        return new CreateVariant(
                in.variantId() != null ? UUID.fromString(in.variantId()) : null,
                in.baseId() != null ? UUID.fromString(in.baseId()) : null,
                in.variantSapRef(), in.type(), in.comments(), in.quantity(), in.image(),
                components);
    }

    private static CreateComponent toComponent(CreateComponentInput in) {
        if (in == null) return null;
        return new CreateComponent(
                in.componentId() != null ? UUID.fromString(in.componentId()) : null,
                in.componentValue(),
                Boolean.TRUE.equals(in.modified()),
                in.componentName());
    }

    private static CreateP3Request toP3(CreateP3Input in) {
        if (in == null) return null;
        List<CreateP3Component> components = in.components() == null ? List.of()
                : in.components().stream().map(InputMapper::toP3Component).collect(Collectors.toList());
        return new CreateP3Request(components, in.comment(), in.image());
    }

    private static CreateP3Component toP3Component(CreateComponentInput in) {
        if (in == null) return null;
        String name = (in.componentName() != null && !in.componentName().isBlank())
                ? in.componentName().trim() : "";
        return new CreateP3Component(
                in.componentId() != null ? UUID.fromString(in.componentId()) : null,
                name, in.componentValue());
    }

    static QuoteVariant toQuoteVariant(QuoteVariantInput input) {
        if (input == null) return null;
        UUID vqId = null;
        if (input.variantQuoteId() != null && !input.variantQuoteId().isBlank()) {
            vqId = UUID.fromString(input.variantQuoteId().trim());
        }
        UUID varId = null;
        if (input.variantId() != null && !input.variantId().isBlank()) {
            varId = UUID.fromString(input.variantId().trim());
        }
        if (vqId == null && varId == null) {
            throw new IllegalArgumentException("variantQuoteId o variantId es obligatorio");
        }
        return new QuoteVariant(
                UUID.fromString(input.projectId()),
                varId, vqId,
                input.value(), input.elaborationTime(),
                input.criticalMaterial(), input.price(),
                UUID.fromString(input.quoterId()));
    }
}
