package com.app.products.graphql;

import java.util.List;
import java.util.Objects;
import java.util.UUID;
import java.util.stream.Collectors;

import org.springframework.graphql.data.method.annotation.Argument;
import org.springframework.graphql.data.method.annotation.MutationMapping;
import org.springframework.graphql.data.method.annotation.QueryMapping;
import org.springframework.graphql.data.method.annotation.SchemaMapping;
import org.springframework.stereotype.Controller;

import com.app.products.dto.CreateBaseInitialComponentInput;
import com.app.products.domain.Base;
import com.app.products.domain.Component;
import com.app.products.domain.ProductCategory;
import com.app.products.domain.ProductLine;
import com.app.products.domain.ProductSubcategory;
import com.app.products.domain.VariableDefinition;
import com.app.products.domain.Variant;
import com.app.products.domain.VariantScope;
import com.app.products.service.BaseService;
import com.app.products.service.ComponentService;
import com.app.products.service.TaxonomyService;
import com.app.products.service.VariableDefinitionService;
import com.app.products.service.VariantService;

import lombok.RequiredArgsConstructor;

@Controller
@RequiredArgsConstructor
public class ProductsGraphQLController {

    private final BaseService baseService;
    private final VariantService variantService;
    private final ComponentService componentService;
    private final TaxonomyService taxonomyService;
    private final VariableDefinitionService variableDefinitionService;

    @QueryMapping
    public List<Base> bases() {
        return baseService.findAll();
    }

    @QueryMapping
    public List<ProductDto> products() {
        return baseService.findAll().stream()
                .map(base -> {
                    List<Variant> variants = variantService.findByBaseId(base.getId());
                    return new ProductDto(
                            base.getId(),
                            base.getName(),
                            base.getCategoryId(),
                            base.getSubcategoryId(),
                            base.getLineId(),
                            base.getCategory(),
                            base.getSubcategory(),
                            base.getLine(),
                            variants);
                })
                .filter(p -> p.variants() != null && !p.variants().isEmpty())
                .toList();
    }

    @QueryMapping
    public List<ProductCategory> productCategories() {
        return taxonomyService.listCategories();
    }

    @QueryMapping
    public List<ProductSubcategory> productSubcategories(@Argument("categoryId") String categoryId) {
        return taxonomyService.listSubcategories(UUID.fromString(categoryId));
    }

    @QueryMapping
    public List<ProductLine> productLines(@Argument("subcategoryId") String subcategoryId) {
        return taxonomyService.listLines(UUID.fromString(subcategoryId));
    }

    @QueryMapping
    public List<VariableDefinition> variableDefinitions() {
        return variableDefinitionService.listAllOrdered();
    }

    @QueryMapping
    public List<Variant> variantsByBase(@Argument("baseId") String baseId) {
        return variantService.findByBaseId(UUID.fromString(baseId));
    }

    @QueryMapping
    public List<Component> componentsByVariant(@Argument("variantId") String variantId) {
        return componentService.findByVariantId(UUID.fromString(variantId));
    }

    @SchemaMapping(typeName = "Variant", field = "variables")
    public List<Component> variantVariables(Variant variant) {
        return variant.getComponents();
    }

    @MutationMapping
    public Base createBase(@Argument("input") CreateBaseGraphQLInput input) {
        return baseService.create(InputMapper.toCreateBaseInput(input));
    }

    @MutationMapping
    public Base updateBase(@Argument("input") UpdateBaseGraphQLInput input) {
        return baseService.update(InputMapper.toUpdateBaseInput(input));
    }

    @MutationMapping
    public Boolean deleteBase(@Argument("baseId") String baseId) {
        baseService.delete(UUID.fromString(baseId));
        return true;
    }

    @MutationMapping
    public Variant createVariant(@Argument("input") CreateVariantGraphQLInput input) {
        return variantService.create(InputMapper.toCreateVariantInput(input));
    }

    @MutationMapping
    public Variant updateVariant(@Argument("input") UpdateVariantGraphQLInput input) {
        return variantService.update(InputMapper.toUpdateVariantInput(input));
    }

    @MutationMapping
    public Boolean deleteVariant(@Argument("variantId") String variantId) {
        variantService.deleteById(UUID.fromString(variantId));
        return true;
    }

    @MutationMapping
    public Component createComponent(@Argument("input") CreateComponentGraphQLInput input) {
        return componentService.create(InputMapper.toCreateComponentInput(input));
    }

    @MutationMapping
    public Component updateComponent(@Argument("input") UpdateComponentGraphQLInput input) {
        return componentService.update(InputMapper.toUpdateComponentInput(input));
    }

    @MutationMapping
    public Boolean deleteComponent(@Argument("componentId") String componentId) {
        componentService.delete(UUID.fromString(componentId));
        return true;
    }

    @MutationMapping
    public ProductCategory updateCategory(@Argument("id") String id, @Argument("name") String name) {
        return taxonomyService.updateCategoryName(UUID.fromString(id), name);
    }

    @MutationMapping
    public ProductSubcategory updateSubcategory(@Argument("id") String id, @Argument("name") String name) {
        return taxonomyService.updateSubcategoryName(UUID.fromString(id), name);
    }

    @MutationMapping
    public ProductLine updateProductLine(@Argument("id") String id, @Argument("name") String name) {
        return taxonomyService.updateLineName(UUID.fromString(id), name);
    }

    @MutationMapping
    public ProductCategory ensureProductCategory(@Argument("name") String name) {
        return taxonomyService.ensureCategory(name);
    }

    @MutationMapping
    public ProductSubcategory ensureProductSubcategory(
            @Argument("categoryId") String categoryId,
            @Argument("name") String name) {
        return taxonomyService.ensureSubcategory(UUID.fromString(categoryId), name);
    }

    @MutationMapping
    public ProductLine ensureProductLine(
            @Argument("subcategoryId") String subcategoryId,
            @Argument("name") String name) {
        return taxonomyService.ensureLine(UUID.fromString(subcategoryId), name);
    }

    @MutationMapping
    public VariableDefinition updateVariableDefinition(@Argument("id") String id, @Argument("name") String name) {
        return variableDefinitionService.updateName(UUID.fromString(id), name);
    }

    public record CreateBaseGraphQLInput(
            String name,
            String categoryId,
            String subcategoryId,
            String lineId,
            String creatorName,
            String creatorId,
            List<CreateBaseInitialVariantGraphQLInput> initialVariants) {
    }

    public record CreateBaseInitialVariantGraphQLInput(
            String sapRef,
            String image,
            String model,
            VariantScope variantScope,
            List<CreateBaseInitialComponentGraphQLInput> components) {
    }

    public record CreateBaseInitialComponentGraphQLInput(
            String componentId,
            String variableDefinitionId,
            String componentName,
            String componentSapRef,
            String componentSapCode,
            String componentValue,
            Boolean componentEditable,
            Boolean componentListOnly) {
    }

    public record UpdateBaseGraphQLInput(
            String id,
            String name,
            String categoryId,
            String subcategoryId,
            String lineId) {
    }

    public record CreateVariantGraphQLInput(
            String baseId,
            String sapRef,
            String image,
            String model,
            VariantScope variantScope,
            List<CreateBaseInitialComponentGraphQLInput> components) {
    }

    public record UpdateVariantGraphQLInput(
            String id,
            String sapRef,
            String image,
            String model,
            VariantScope variantScope,
            List<CreateBaseInitialComponentGraphQLInput> components) {
    }

    public record CreateComponentGraphQLInput(
            String variantId,
            String sapRef,
            String sapCode,
            String variableDefinitionId,
            String name,
            String value) {
    }

    public record UpdateComponentGraphQLInput(
            String id,
            String sapRef,
            String sapCode,
            String variableDefinitionId,
            String name,
            String value) {
    }

    public record ProductDto(
            UUID id,
            String name,
            UUID categoryId,
            UUID subcategoryId,
            UUID lineId,
            String category,
            String subcategory,
            String line,
            List<Variant> variants) {
    }

    static final class InputMapper {

        static UUID parseUuid(String s) {
            return s != null && !s.isBlank() ? UUID.fromString(s.trim()) : null;
        }

        static com.app.products.dto.CreateBaseInput toCreateBaseInput(CreateBaseGraphQLInput input) {
            if (input == null) return null;
            List<com.app.products.dto.CreateBaseInitialVariantInput> initialVariants =
                    input.initialVariants() == null ? List.of()
                            : input.initialVariants().stream()
                                    .map(InputMapper::toCreateBaseInitialVariantInput)
                                    .filter(Objects::nonNull)
                                    .collect(Collectors.toList());
            return new com.app.products.dto.CreateBaseInput(
                    input.name(),
                    parseUuid(input.categoryId()),
                    parseUuid(input.subcategoryId()),
                    parseUuid(input.lineId()),
                    input.creatorName(),
                    parseUuid(input.creatorId()),
                    initialVariants);
        }

        static com.app.products.dto.CreateBaseInitialVariantInput toCreateBaseInitialVariantInput(
                CreateBaseInitialVariantGraphQLInput in) {
            if (in == null) return null;
            List<CreateBaseInitialComponentInput> components =
                    in.components() == null ? List.of()
                            : in.components().stream()
                                    .map(InputMapper::toCreateBaseInitialComponentInput)
                                    .filter(Objects::nonNull)
                                    .collect(Collectors.toList());
            return new com.app.products.dto.CreateBaseInitialVariantInput(
                    in.sapRef(), in.image(), in.model(), in.variantScope() != null ? in.variantScope() : VariantScope.LINE, components);
        }

        static CreateBaseInitialComponentInput toCreateBaseInitialComponentInput(
                CreateBaseInitialComponentGraphQLInput in) {
            if (in == null) return null;
            return new CreateBaseInitialComponentInput(
                    in.componentId() != null && !in.componentId().isBlank() ? UUID.fromString(in.componentId()) : null,
                    parseUuid(in.variableDefinitionId()),
                    in.componentName(),
                    in.componentSapRef(),
                    in.componentSapCode(),
                    in.componentValue(),
                    in.componentEditable(),
                    in.componentListOnly());
        }

        static com.app.products.dto.UpdateBaseInput toUpdateBaseInput(UpdateBaseGraphQLInput input) {
            if (input == null) return null;
            return new com.app.products.dto.UpdateBaseInput(
                    UUID.fromString(input.id()),
                    input.name(),
                    parseUuid(input.categoryId()),
                    parseUuid(input.subcategoryId()),
                    parseUuid(input.lineId()));
        }

        static com.app.products.dto.CreateVariantInput toCreateVariantInput(CreateVariantGraphQLInput input) {
            if (input == null) return null;
            List<CreateBaseInitialComponentInput> components =
                    input.components() == null ? List.of()
                            : input.components().stream()
                                    .map(InputMapper::toCreateBaseInitialComponentInput)
                                    .filter(Objects::nonNull)
                                    .collect(Collectors.toList());
            return new com.app.products.dto.CreateVariantInput(
                    UUID.fromString(input.baseId()),
                    input.sapRef(),
                    input.image(),
                    input.model(),
                    input.variantScope() != null ? input.variantScope() : VariantScope.LINE,
                    components);
        }

        static com.app.products.dto.UpdateVariantInput toUpdateVariantInput(UpdateVariantGraphQLInput input) {
            if (input == null) return null;
            List<CreateBaseInitialComponentInput> components =
                    input.components() == null ? null
                            : input.components().stream()
                                    .map(InputMapper::toCreateBaseInitialComponentInput)
                                    .filter(Objects::nonNull)
                                    .collect(Collectors.toList());
            return new com.app.products.dto.UpdateVariantInput(
                    UUID.fromString(input.id()),
                    input.sapRef(),
                    input.image(),
                    input.model(),
                    input.variantScope(),
                    components);
        }

        static com.app.products.dto.CreateComponentInput toCreateComponentInput(CreateComponentGraphQLInput input) {
            if (input == null) return null;
            return new com.app.products.dto.CreateComponentInput(
                    UUID.fromString(input.variantId()),
                    input.sapRef(),
                    input.sapCode(),
                    parseUuid(input.variableDefinitionId()),
                    input.name(),
                    input.value());
        }

        static com.app.products.dto.UpdateComponentInput toUpdateComponentInput(UpdateComponentGraphQLInput input) {
            if (input == null) return null;
            return new com.app.products.dto.UpdateComponentInput(
                    UUID.fromString(input.id()),
                    input.sapRef(),
                    input.sapCode(),
                    parseUuid(input.variableDefinitionId()),
                    input.name(),
                    input.value());
        }
    }
}
