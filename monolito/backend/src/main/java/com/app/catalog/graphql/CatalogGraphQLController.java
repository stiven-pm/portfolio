package com.app.catalog.graphql;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

import org.springframework.graphql.data.method.annotation.Argument;
import org.springframework.graphql.data.method.annotation.MutationMapping;
import org.springframework.graphql.data.method.annotation.QueryMapping;
import org.springframework.stereotype.Controller;

import com.app.catalog.domain.Project;
import com.app.catalog.dto.project.ProjectResponse;
import com.app.catalog.dto.variant.TypologyStandardResponse;
import com.app.catalog.service.CatalogService;
import com.app.catalog.service.ProjectService;

import lombok.RequiredArgsConstructor;

@Controller
@RequiredArgsConstructor
public class CatalogGraphQLController {

    private final CatalogService catalogService;
    private final ProjectService projectService;

    private static UUID uuidArg(String s) {
        return (s == null || s.isBlank()) ? null : UUID.fromString(s.trim());
    }

    // ─── Queries ────────────────────────────────────────────────────────

    @QueryMapping
    public List<ProjectResponse> projects() {
        return catalogService.getProjectsAndVariants();
    }

    @QueryMapping
    public List<ProjectResponse> projectsBySales(@Argument("salesId") String salesId) {
        if (salesId == null || salesId.isBlank()) return List.of();
        try {
            return catalogService.getProjectsBySalesAndVariants(UUID.fromString(salesId));
        } catch (IllegalArgumentException ignored) {
            return List.of();
        }
    }

    @QueryMapping
    public List<ProjectResponse> projectsByQuoter(@Argument("quoterId") String quoterId) {
        if (quoterId == null || quoterId.isBlank()) return List.of();
        try {
            return catalogService.getProjectsByQuoterAndVariants(UUID.fromString(quoterId));
        } catch (IllegalArgumentException ignored) {
            return List.of();
        }
    }

    @QueryMapping
    public List<ProjectResponse> projectsEffective() {
        return catalogService.getEffectiveProjects();
    }

    @QueryMapping
    public List<ProjectResponse> projectsForDevelopment() {
        return catalogService.getProjectsForDevelopment();
    }

    @QueryMapping
    public List<ProjectResponse> projectsByAssignedQuoter(@Argument("quoterId") String quoterId) {
        return catalogService.getProjectsByAssignedQuoter(UUID.fromString(quoterId));
    }

    @QueryMapping
    public List<ProjectResponse> projectsByAssignedDesigner(@Argument("designerId") String designerId) {
        return catalogService.getProjectsByAssignedDesigner(UUID.fromString(designerId));
    }

    @QueryMapping
    public List<ProjectResponse> projectsByAssignedDevelopment(@Argument("userId") String userId) {
        if (userId == null || userId.isBlank()) return List.of();
        try {
            return catalogService.getProjectsByAssignedDevelopment(UUID.fromString(userId));
        } catch (IllegalArgumentException ignored) {
            return List.of();
        }
    }

    @QueryMapping
    public List<ProjectResponse> projectsForAssignment(@Argument("role") String role) {
        return catalogService.getProjectsForAssignment(role);
    }

    @QueryMapping
    public List<TypologyStandardResponse> typologyStandards() {
        return catalogService.getTypologyStandards();
    }

    // ─── Mutations ──────────────────────────────────────────────────────

    @MutationMapping
    public Project createProject(@Argument("input") CreateProjectInput input) {
        return catalogService.createProject(InputMapper.toCreateProject(input));
    }

    @MutationMapping
    public Project updateProject(@Argument("input") UpdateProjectInput input) {
        Project p = projectService.getById(UUID.fromString(input.id()));
        if (input.name() != null) p.setName(input.name());
        if (input.client() != null) p.setClient(input.client());
        if (input.region() != null) p.setRegion(input.region());
        if (input.state() != null) p.setState(input.state());
        if (input.totalCost() != null) p.setTotalCost(input.totalCost());
        if (input.estimatedTime() != null) p.setEstimatedTime(input.estimatedTime());
        return projectService.update(p);
    }

    @MutationMapping
    public Boolean reOpenProject(@Argument("projectId") String projectId) {
        return catalogService.reOpenProject(UUID.fromString(projectId));
    }

    @MutationMapping
    public Boolean updateVariantAndReopen(@Argument("input") UpdateVariantAndReopenInput input) {
        var components = input.components() == null ? null
                : input.components().stream()
                        .map(c -> new com.app.catalog.dto.component.ComponentIdValue(
                                c.componentId() != null ? UUID.fromString(c.componentId()) : null,
                                c.componentName(),
                                c.value(),
                                c.modified() != null && c.modified()))
                        .collect(Collectors.toList());
        return catalogService.updateVariantAndReopen(
                UUID.fromString(input.projectId()),
                uuidArg(input.variantQuoteId()),
                uuidArg(input.variantId()),
                input.quantity(),
                input.comments(),
                input.type(),
                components);
    }

    @MutationMapping
    public Boolean makeProjectEffective(@Argument("projectId") String projectId) {
        return projectService.makeEffectiveOnly(UUID.fromString(projectId));
    }

    @MutationMapping
    public Boolean quitarProjectEffective(@Argument("projectId") String projectId) {
        return projectService.quitarEffectiveOnly(UUID.fromString(projectId));
    }

    @MutationMapping
    public Boolean deleteProject(@Argument("projectId") String projectId) {
        return catalogService.deleteProject(UUID.fromString(projectId));
    }

    @MutationMapping
    public Boolean quoteVariant(@Argument("input") QuoteVariantInput input) {
        catalogService.quoteVariant(InputMapper.toQuoteVariant(input));
        return true;
    }

    @MutationMapping
    public Boolean updateVariantQuoteQuantity(@Argument("input") UpdateVariantQuoteQuantityInput input) {
        return catalogService.updateVariantQuoteQuantity(
                UUID.fromString(input.projectId()),
                uuidArg(input.variantQuoteId()),
                uuidArg(input.variantId()),
                input.quantity());
    }

    @MutationMapping
    public Boolean removeVariantFromProject(
            @Argument("projectId") String projectId,
            @Argument("variantId") String variantId,
            @Argument("variantQuoteId") String variantQuoteId) {
        return catalogService.removeVariantFromProject(
                UUID.fromString(projectId),
                uuidArg(variantQuoteId),
                uuidArg(variantId));
    }

    @MutationMapping
    public Boolean makeVariantQuoteEffective(
            @Argument("projectId") String projectId,
            @Argument("variantId") String variantId,
            @Argument("variantQuoteId") String variantQuoteId,
            @Argument("effective") Boolean effective) {
        return catalogService.makeVariantQuoteEffective(
                UUID.fromString(projectId),
                uuidArg(variantQuoteId),
                uuidArg(variantId),
                effective != null && effective);
    }

    @MutationMapping
    public Boolean toggleP3P5(
            @Argument("projectId") String projectId,
            @Argument("variantId") String variantId,
            @Argument("variantQuoteId") String variantQuoteId) {
        return catalogService.toggleP3P5(
                UUID.fromString(projectId),
                uuidArg(variantQuoteId),
                uuidArg(variantId));
    }

    @MutationMapping
    public Boolean markVariantAsDesigned(
            @Argument("projectId") String projectId,
            @Argument("variantId") String variantId,
            @Argument("variantQuoteId") String variantQuoteId,
            @Argument("designerId") String designerId,
            @Argument("planPdfKey") String planPdfKey) {
        return catalogService.markVariantAsDesigned(
                UUID.fromString(projectId),
                uuidArg(variantQuoteId),
                uuidArg(variantId),
                UUID.fromString(designerId),
                planPdfKey);
    }

    @MutationMapping
    public Boolean markVariantAsDeveloped(
            @Argument("projectId") String projectId,
            @Argument("variantId") String variantId,
            @Argument("variantQuoteId") String variantQuoteId,
            @Argument("developmentUserId") String developmentUserId) {
        return catalogService.markVariantAsDeveloped(
                UUID.fromString(projectId),
                uuidArg(variantQuoteId),
                uuidArg(variantId),
                UUID.fromString(developmentUserId));
    }

    @MutationMapping
    public Boolean assignVariantToUser(
            @Argument("projectId") String projectId,
            @Argument("variantQuoteId") String variantQuoteId,
            @Argument("assigneeId") String assigneeId,
            @Argument("roleType") String roleType) {
        return catalogService.assignVariantToUser(
                UUID.fromString(projectId),
                UUID.fromString(variantQuoteId),
                UUID.fromString(assigneeId),
                roleType);
    }

    // ─── GraphQL Input Records ──────────────────────────────────────────

    public record CreateProjectInput(
            String name, String client, String region,
            String salesName, String salesEmail, String salesPhone,
            String salesSignature, String salesJobTitle, String salesId,
            String quoterName, String quoterEmail, String quoterId,
            List<CreateVariantInput> variants,
            List<CreateP3Input> p3s) {}

    public record CreateVariantInput(
            String variantId, String baseId, String variantSapRef,
            String type, String comments, Integer quantity, String image,
            List<CreateComponentInput> components) {}

    public record CreateComponentInput(
            String componentId, String componentValue,
            Boolean modified, String componentName) {}

    public record CreateP3Input(
            String comment, String image,
            List<CreateComponentInput> components) {}

    public record QuoteVariantInput(
            String projectId, String variantId, String variantQuoteId,
            String quoterId, String value, Integer elaborationTime,
            String criticalMaterial, Integer price) {}

    public record UpdateProjectInput(
            String id, String name, String client, String region,
            Integer state, Integer totalCost, Integer estimatedTime) {}

    public record UpdateVariantAndReopenInput(
            String projectId, String variantId, String variantQuoteId,
            Integer quantity, String comments, String type,
            List<ComponentIdValueInput> components) {}

    public record ComponentIdValueInput(
            String componentId, String componentName,
            String value, Boolean modified) {}

    public record UpdateVariantQuoteQuantityInput(
            String projectId, String variantId,
            String variantQuoteId, Integer quantity) {}
}
