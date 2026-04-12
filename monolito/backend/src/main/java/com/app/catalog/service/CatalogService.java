package com.app.catalog.service;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.function.Predicate;
import java.util.stream.Collectors;

import jakarta.persistence.EntityManager;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.app.catalog.domain.Base;
import com.app.catalog.domain.Component;
import com.app.catalog.domain.Project;
import com.app.catalog.domain.Variant;
import com.app.catalog.domain.VariantQuote;
import com.app.catalog.domain.VariantQuoteComponentOverride;
import com.app.catalog.dto.component.ComponentIdValue;
import com.app.catalog.dto.component.ComponentResponse;
import com.app.catalog.dto.component.CreateBaseInitialComponent;
import com.app.catalog.dto.component.CreateComponent;
import com.app.catalog.dto.component.ModifyComponent;
import com.app.catalog.dto.p3.CreateP3Request;
import com.app.catalog.dto.project.CreateProject;
import com.app.catalog.dto.project.ProjectResponse;
import com.app.catalog.dto.variant.BaseResponse;
import com.app.catalog.dto.variant.CreateVariant;
import com.app.catalog.dto.variant.ProjectVariantResponse;
import com.app.catalog.dto.variant.QuoteVariant;
import com.app.catalog.dto.variant.TypologyStandardResponse;
import com.app.catalog.dto.variant.VariantResponse;
import com.app.catalog.repository.ProjectRepository;
import com.app.catalog.repository.TypologyStandardRepository;
import com.app.catalog.repository.VariantQuoteRepository;
import com.app.shared.events.ProductQuotedEvent;
import com.app.shared.events.ProjectCreatedEvent;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class CatalogService {

    private final VariantService variantService;
    private final ComponentService componentService;
    private final VariantQuoteService variantQuoteService;
    private final ProjectService projectService;
    private final BaseService baseService;
    private final ApplicationEventPublisher eventPublisher;
    private final ProjectRepository projectRepository;
    private final VariantQuoteRepository variantQuoteRepo;
    private final TypologyStandardRepository typologyStandardRepo;
    private final EntityManager entityManager;

    // ─── Project creation ───────────────────────────────────────────────

    @Transactional
    @CacheEvict(value = {"projects", "products"}, allEntries = true)
    public Project createProject(CreateProject createProject) {
        boolean hasVariants = createProject.variants() != null && !createProject.variants().isEmpty();
        boolean hasP3s = createProject.p3s() != null && !createProject.p3s().isEmpty();

        if (!hasVariants && !hasP3s) {
            throw new IllegalArgumentException("At least one variant or P3 is required to create a project");
        }

        String consecutive = projectService.generateNextConsecutivo();
        Project projectSaved = projectService.create(createProject, consecutive);

        if (hasVariants) {
            for (CreateVariant variantDto : createProject.variants()) {
                processStandardVariant(variantDto, projectSaved.getId(), createProject.quoterId());
            }
        }
        if (hasP3s) {
            for (CreateP3Request p3 : createProject.p3s()) {
                processP3(p3, projectSaved.getId(), createProject.quoterId());
            }
        }

        int totalItems = (hasVariants ? createProject.variants().size() : 0)
                + (hasP3s ? createProject.p3s().size() : 0);

        eventPublisher.publishEvent(new ProjectCreatedEvent(
                UUID.randomUUID(),
                projectSaved.getCreatedAt(),
                projectSaved.getId(),
                projectSaved.getSalesId(),
                projectSaved.getQuoterId(),
                totalItems));

        return projectRepository.findById(projectSaved.getId()).orElse(projectSaved);
    }

    private void processStandardVariant(CreateVariant variantDto, UUID projectId, UUID quoterId) {
        Variant sourceVariant = variantDto.variantId() != null
                ? variantService.findByIdWithComponents(variantDto.variantId()).orElse(null)
                : null;

        Base baseEntity = variantDto.baseId() != null
                ? baseService.findById(variantDto.baseId()).orElse(null)
                : null;
        Variant savedVariant = sourceVariant != null
                ? variantService.cloneVariantCopyingComponents(sourceVariant)
                : (baseEntity != null
                        ? variantService.create(baseEntity, variantDto.variantSapRef())
                        : variantService.createOrphanProjectLine(variantDto.variantSapRef()));

        if (variantDto.components() != null && !variantDto.components().isEmpty()) {
            if (sourceVariant == null) {
                applyCreateVariantComponentsToVariant(savedVariant, List.of(), variantDto.components());
            } else {
                var originals = variantService.findByIdWithComponents(savedVariant.getId())
                        .map(Variant::getComponents).orElse(List.of());
                var byId = new HashMap<UUID, String>();
                for (var dto : variantDto.components()) {
                    if (dto.componentId() != null) {
                        byId.put(dto.componentId(), dto.componentValue() != null ? dto.componentValue() : "");
                    }
                }
                for (Component oc : originals) {
                    String next = byId.get(oc.getId());
                    if (next != null) {
                        oc.setValue(next);
                        componentService.save(oc);
                    }
                }
            }
        }

        Project project = projectService.getById(projectId);
        project.getVariants().add(savedVariant);
        projectRepository.save(project);

        String quoteType = (variantDto.type() != null && !variantDto.type().isBlank()) ? variantDto.type() : "p4";
        UUID productsBaseId = baseEntity != null ? null : variantDto.baseId();
        variantQuoteService.create(savedVariant.getId(), projectId, quoterId, quoteType,
                variantDto.comments(), variantDto.image(), variantDto.quantity(), productsBaseId);
    }

    private void applyCreateVariantComponentsToVariant(Variant savedVariant,
            List<Component> catalogComponents, List<CreateComponent> componentDtos) {
        if (componentDtos == null || componentDtos.isEmpty()) return;
        List<Component> comps = new ArrayList<>();
        int ordinal = 0;
        for (var dto : componentDtos) {
            ordinal++;
            Component orig = dto.componentId() != null
                    ? ComponentService.findOriginalById(catalogComponents, dto.componentId()).orElse(null)
                    : null;
            String name = ComponentVariableKeys.displayNamePreferInput(dto.componentName(), orig);
            String newVal = ComponentVariableKeys.valuePreferInput(dto.componentValue(), orig);
            String sapRef = orig != null ? orig.getSapRef()
                    : ComponentVariableKeys.uniqueStub(savedVariant.getSapRef(), ordinal);
            String sapCode = orig != null && orig.getSapCode() != null && !orig.getSapCode().isBlank()
                    ? orig.getSapCode() : sapRef;
            String origVal = orig != null
                    ? (orig.getValue() != null ? orig.getValue() : orig.getOriginalValue())
                    : newVal;
            comps.add(componentService.createForVariant(savedVariant, sapRef, sapCode, name, newVal, origVal));
        }
        variantService.setComponents(savedVariant.getId(), comps);
    }

    private void copyComponentOverridesFromQuote(VariantQuote source, VariantQuote target) {
        if (source.getComponentOverrides() == null || source.getComponentOverrides().isEmpty()) return;
        var targetComponents = target.getVariant() != null ? target.getVariant().getComponents() : List.<Component>of();
        for (var ov : source.getComponentOverrides()) {
            if (ov == null || ov.getComponent() == null || ov.getComponent().getId() == null) continue;
            UUID componentId = ov.getComponent().getId();
            Component targetComp = ComponentService.findOriginalById(targetComponents, componentId).orElse(null);
            if (targetComp == null) continue;
            target.getComponentOverrides().add(
                    componentService.createOverride(target, targetComp, ov.getValue(), ov.getOriginalValue()));
        }
        variantQuoteRepo.save(target);
    }

    private void processP3(CreateP3Request request, UUID projectId, UUID quoterId) {
        Variant variantSaved = variantService.createOrphanP3();
        if (request.components() != null && !request.components().isEmpty()) {
            List<Component> comps = new ArrayList<>();
            for (var dto : request.components()) {
                String name = (dto.componentName() != null && !dto.componentName().isBlank())
                        ? dto.componentName().trim() : "";
                String value = dto.componentValue() != null ? dto.componentValue() : "";
                comps.add(componentService.createForP3Variant(variantSaved, name, value));
            }
            variantService.setComponents(variantSaved.getId(), comps);
        }
        Project project = projectService.getById(projectId);
        project.getVariants().add(variantSaved);
        projectRepository.save(project);
        variantQuoteService.create(variantSaved.getId(), projectId, quoterId, "p3",
                request.comment(), request.image(), null);
    }

    // ─── Queries ────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public List<ProjectResponse> getProjectsAndVariants() {
        return projectService.getAll().stream()
                .map(p -> toProjectResponse(p, false, null))
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<ProjectResponse> getProjectsBySalesAndVariants(UUID salesId) {
        return projectService.getBySalesId(salesId).stream()
                .map(p -> toProjectResponse(p, false, null))
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<ProjectResponse> getProjectsByQuoterAndVariants(UUID quoterId) {
        return projectService.getByQuoterId(quoterId).stream()
                .map(p -> toProjectResponse(p, false, null))
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<ProjectResponse> getEffectiveProjects() {
        return projectService.getAll().stream()
                .filter(Project::isEffective)
                .map(p -> toProjectResponse(p, true, null))
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<ProjectResponse> getProjectsForDevelopment() {
        return getEffectiveProjects();
    }

    @Transactional(readOnly = true)
    public List<ProjectResponse> getProjectsByAssignedQuoter(UUID quoterId) {
        List<UUID> projectIds = variantQuoteRepo.findProjectIdsByAssignedQuoterId(quoterId);
        if (projectIds.isEmpty()) return List.of();
        return projectRepository.findAllByIdWithVariantsAndQuotes(projectIds).stream()
                .map(p -> toProjectResponse(p, false, null))
                .filter(r -> r.variants() != null && !r.variants().isEmpty())
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<ProjectResponse> getProjectsByAssignedDesigner(UUID designerId) {
        List<UUID> projectIds = variantQuoteRepo.findProjectIdsByAssignedDesignerId(designerId);
        if (projectIds.isEmpty()) return List.of();
        return projectRepository.findAllByIdWithVariantsAndQuotes(projectIds).stream()
                .map(p -> toProjectResponse(p, true, null))
                .filter(r -> r.variants() != null && !r.variants().isEmpty())
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<ProjectResponse> getProjectsByAssignedDevelopment(UUID userId) {
        List<UUID> projectIds = variantQuoteRepo.findProjectIdsByAssignedDevelopmentUserId(userId);
        if (projectIds.isEmpty()) return List.of();
        return projectRepository.findAllByIdWithVariantsAndQuotes(projectIds).stream()
                .map(p -> toProjectResponse(p, true, null))
                .filter(r -> r.variants() != null && !r.variants().isEmpty())
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<ProjectResponse> getProjectsForAssignment(String role) {
        List<Project> projects = projectService.getAll();
        Predicate<VariantQuote> variantFilter = assignmentVariantFilter(role);
        return projects.stream()
                .filter(p -> !p.getVariantQuotes().isEmpty())
                .filter(p -> filterByAssignmentRole(p, role))
                .map(p -> toProjectResponse(p, p.isEffective(), variantFilter))
                .filter(r -> r.variants() != null && !r.variants().isEmpty())
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<TypologyStandardResponse> getTypologyStandards() {
        return typologyStandardRepo.findAll().stream()
                .map(TypologyStandardResponse::from)
                .collect(Collectors.toList());
    }

    // ─── Mutations ──────────────────────────────────────────────────────

    @Transactional
    @CacheEvict(value = "projects", allEntries = true)
    public void quoteVariant(QuoteVariant quoteProduct) {
        variantQuoteService.quote(quoteProduct);
        List<VariantQuote> variantQuotes = variantQuoteService.findByProjectId(quoteProduct.projectId());
        var update = projectService.updateStateByQuote(quoteProduct.projectId(), variantQuotes);
        if (update.becameQuoted()) {
            eventPublisher.publishEvent(new ProductQuotedEvent(
                    UUID.randomUUID(), java.time.LocalDateTime.now(), quoteProduct.quoterId(), true));
        }
    }

    @Transactional
    @CacheEvict(value = {"projects", "products"}, allEntries = true)
    public Boolean updateVariantAndReopen(UUID projectId, UUID variantQuoteId, UUID variantId,
            Integer quantity, String comments, String type, List<ComponentIdValue> components) {
        Project project = projectService.getById(projectId);
        if (project.isEffective()) {
            reopenEffectiveProject(projectId, variantQuoteId, variantId, quantity, comments, type, components);
            return true;
        }
        VariantQuote quote = variantQuoteService.requireQuoteLine(projectId, variantQuoteId, variantId);
        UUID linePk = quote.getId();
        UUID catalogVariantId = quote.getVariant().getId();
        Variant variant = variantService.findByIdWithComponents(catalogVariantId)
                .orElseThrow(() -> new IllegalStateException("Variant not found"));
        if (project.getVariants().stream().noneMatch(v -> v.getId().equals(catalogVariantId))) {
            throw new IllegalStateException("Variant not in project");
        }
        quote.getComponentOverrides().clear();
        boolean isClone = isCloneType(quote.getType());
        boolean allComponentsReverted = false;
        if (components != null && !components.isEmpty()) {
            var originals = variant.getComponents();
            int revertCount = 0;
            for (ComponentIdValue c : components) {
                if (c.componentId() == null) continue;
                Component vc = ComponentService.findOriginalById(originals, c.componentId()).orElse(null);
                if (vc == null) continue;
                String newVal = (c.value() != null ? c.value() : "").trim();
                String origVal = vc.getValue() != null ? vc.getValue() : vc.getOriginalValue();
                String origValTrim = (origVal != null ? origVal : "").trim();
                boolean isRevert = Boolean.FALSE.equals(c.modified()) || newVal.equals(origValTrim);
                if (isRevert) {
                    revertCount++;
                    if (isClone) {
                        String current = vc.getValue() != null ? vc.getValue() : "";
                        if (!newVal.equals(current)) {
                            vc.setValue(newVal);
                            componentService.save(vc);
                            entityManager.flush();
                        }
                    }
                }
                if (!isRevert) {
                    quote.getComponentOverrides().add(
                            componentService.createOverride(quote, vc, newVal, origVal));
                }
            }
            allComponentsReverted = (revertCount == components.size()) && revertCount > 0;
        }
        variantQuoteRepo.save(quote);
        entityManager.flush();
        if (quantity != null) variantQuoteService.updateQuantity(projectId, linePk, null, quantity);
        if (allComponentsReverted && isClone) {
            variantQuoteService.clearType(projectId, linePk, null);
            if (comments != null) variantQuoteService.updateCommentsAndType(projectId, linePk, null, comments, null);
        } else {
            variantQuoteService.updateCommentsAndType(projectId, linePk, null, comments, type);
        }
        variantQuoteService.resetQuoteByProject(projectId);
        projectService.reOpen(projectId);
        List<VariantQuote> variantQuotes = variantQuoteService.findByProjectId(projectId);
        projectService.updateStateByQuote(projectId, variantQuotes);
        return true;
    }

    @Transactional
    @CacheEvict(value = "projects", allEntries = true)
    public Boolean updateVariantQuoteQuantity(UUID projectId, UUID variantQuoteId, UUID variantId, Integer quantity) {
        if (quantity == null || quantity < 1) {
            throw new IllegalArgumentException("Quantity must be at least 1");
        }
        variantQuoteService.updateQuantity(projectId, variantQuoteId, variantId, quantity);
        List<VariantQuote> variantQuotes = variantQuoteService.findByProjectId(projectId);
        projectService.updateStateByQuote(projectId, variantQuotes);
        return true;
    }

    @Transactional
    @CacheEvict(value = {"projects", "products"}, allEntries = true)
    public Boolean deleteProject(UUID projectId) {
        projectService.getById(projectId);
        List<VariantQuote> quotes = variantQuoteService.findByProjectId(projectId);
        List<UUID> quoteVariantIdsToDelete = quotes.stream()
                .filter(vq -> vq.getVariant() != null && shouldDeleteProjectLineVariant(vq))
                .map(vq -> vq.getVariant().getId())
                .distinct()
                .toList();
        try {
            entityManager.createNativeQuery("DELETE FROM catalog.project_threads WHERE project_id = ?1")
                    .setParameter(1, projectId)
                    .executeUpdate();
        } catch (Exception ignored) {
        }
        projectService.delete(projectId);
        for (UUID vid : quoteVariantIdsToDelete) {
            variantService.deleteById(vid);
        }
        return true;
    }

    @Transactional
    @CacheEvict(value = {"projects", "products"}, allEntries = true)
    public Boolean removeVariantFromProject(UUID projectId, UUID variantQuoteId, UUID variantId) {
        Project project = projectService.getById(projectId);
        VariantQuote vq = variantQuoteService.requireQuoteLine(projectId, variantQuoteId, variantId);
        UUID catalogVariantId = vq.getVariant() != null ? vq.getVariant().getId() : null;
        boolean deleteCatalogCopy = catalogVariantId != null && shouldDeleteProjectLineVariant(vq);
        variantQuoteRepo.delete(vq);
        if (catalogVariantId != null) {
            project.getVariants().stream()
                    .filter(v -> v.getId().equals(catalogVariantId))
                    .findFirst()
                    .ifPresent(v -> {
                        project.getVariants().remove(v);
                        projectRepository.save(project);
                    });
        }
        if (deleteCatalogCopy) {
            variantService.deleteById(catalogVariantId);
        }
        List<VariantQuote> remaining = variantQuoteService.findByProjectId(projectId);
        projectService.updateStateByQuote(projectId, remaining);
        return true;
    }

    @Transactional
    @CacheEvict(value = {"projects", "products"}, allEntries = true)
    public Boolean reOpenProject(UUID projectId) {
        variantQuoteService.resetQuoteByProject(projectId);
        projectService.reOpen(projectId);
        List<VariantQuote> variantQuotes = variantQuoteService.findByProjectId(projectId);
        projectService.updateStateByQuote(projectId, variantQuotes);
        return true;
    }

    @Transactional
    @CacheEvict(value = {"projects", "products"}, allEntries = true)
    public Boolean reopenEffectiveProject(UUID projectId, UUID editedVariantQuoteId, UUID editedVariantId,
            Integer quantity, String comments, String type, List<ComponentIdValue> components) {
        Project original = projectService.getById(projectId);
        if (!original.isEffective()) {
            throw new IllegalStateException("reopenEffectiveProject solo aplica a proyectos efectivos");
        }
        List<VariantQuote> originalQuotes = variantQuoteService.findByProjectId(projectId);

        Project newProject = projectService.createCopy(original);
        UUID quoterId = original.getQuoterId();

        var effectiveQuotes = originalQuotes.stream().filter(VariantQuote::isEffective).toList();
        java.util.Optional<VariantQuote> editedQuoteOpt;
        if (editedVariantQuoteId != null) {
            editedQuoteOpt = originalQuotes.stream()
                    .filter(q -> q.getId().equals(editedVariantQuoteId)).findFirst();
        } else {
            editedQuoteOpt = originalQuotes.stream()
                    .filter(vq -> vq.getVariant() != null && vq.getVariant().getId().equals(editedVariantId))
                    .findFirst();
        }

        VariantQuote editedQuote = editedQuoteOpt
                .orElseThrow(() -> new IllegalStateException("VariantQuote not found"));
        UUID editedLineId = editedQuote.getId();

        for (VariantQuote oq : effectiveQuotes) {
            if (oq.getId().equals(editedLineId)) continue;
            if (oq.getVariant() == null) continue;
            Variant v = oq.getVariant();
            newProject.getVariants().add(v);
            projectRepository.save(newProject);
            VariantQuote newQuote = variantQuoteService.create(v.getId(), newProject.getId(), quoterId,
                    oq.getType(), oq.getComments(), oq.getImage(), oq.getQuantity());
            copyComponentOverridesFromQuote(oq, newQuote);
        }

        UUID editedCatalogVariantId = editedQuote.getVariant().getId();
        Variant editedVariant = variantService.findByIdWithComponents(editedCatalogVariantId)
                .orElseThrow(() -> new IllegalStateException("Variant not found"));

        boolean isClone = isCloneType(editedQuote.getType());
        Variant variantToAdd;

        if (isClone) {
            Variant cloned = variantService.cloneVariant(editedVariant);
            List<Component> comps = new ArrayList<>();
            var originals = editedVariant.getComponents();
            var modById = new HashMap<UUID, String>();
            if (components != null) {
                for (ComponentIdValue c : components) {
                    if (c.componentId() == null) continue;
                    modById.put(c.componentId(), (c.value() != null ? c.value() : "").trim());
                }
            }
            for (Component oc : originals) {
                String newVal = modById.getOrDefault(oc.getId(),
                        oc.getValue() != null ? oc.getValue() : "");
                String origVal = oc.getOriginalValue() != null ? oc.getOriginalValue()
                        : (oc.getValue() != null ? oc.getValue() : "");
                comps.add(componentService.createForVariant(cloned, oc.getSapRef(),
                        oc.getSapCode() != null ? oc.getSapCode() : oc.getSapRef(),
                        oc.getName(), newVal, origVal));
            }
            variantService.setComponents(cloned.getId(), comps);
            variantToAdd = cloned;
        } else {
            variantToAdd = editedVariant;
        }

        newProject.getVariants().add(variantToAdd);
        projectRepository.save(newProject);

        VariantQuote newQuote = variantQuoteService.create(variantToAdd.getId(), newProject.getId(), quoterId,
                type != null ? type : editedQuote.getType(),
                comments != null ? comments : editedQuote.getComments(),
                editedQuote.getImage(), quantity);

        if (!isClone && components != null && !components.isEmpty()) {
            var originals = editedVariant.getComponents();
            for (ComponentIdValue c : components) {
                if (Boolean.TRUE.equals(c.modified())) {
                    if (c.componentId() == null) continue;
                    Component o = ComponentService.findOriginalById(originals, c.componentId()).orElse(null);
                    if (o == null) continue;
                    String newVal = (c.value() != null ? c.value() : "").trim();
                    String origVal = o.getValue() != null ? o.getValue() : o.getOriginalValue();
                    newQuote.getComponentOverrides().add(
                            componentService.createOverride(newQuote, o, newVal, origVal));
                }
            }
            variantQuoteRepo.save(newQuote);
        }

        variantQuoteService.resetQuoteByProject(newProject.getId());
        List<VariantQuote> newQuotes = variantQuoteService.findByProjectId(newProject.getId());
        projectService.updateStateByQuote(newProject.getId(), newQuotes);

        eventPublisher.publishEvent(new ProjectCreatedEvent(
                UUID.randomUUID(), newProject.getCreatedAt(),
                newProject.getId(), newProject.getSalesId(), newProject.getQuoterId(), newQuotes.size()));

        original.setEffective(false);
        projectRepository.save(original);

        return true;
    }

    @Transactional
    @CacheEvict(value = "projects", allEntries = true)
    public Boolean makeVariantQuoteEffective(UUID projectId, UUID variantQuoteId, UUID variantId, boolean effective) {
        Project project = projectService.getById(projectId);
        if (!project.isEffective()) {
            throw new IllegalStateException("Solo se pueden marcar variantes efectivas en proyectos ya efectivos.");
        }
        variantQuoteService.setEffective(projectId, variantQuoteId, variantId, effective);
        return true;
    }

    @Transactional
    @CacheEvict(value = "projects", allEntries = true)
    public Boolean toggleP3P5(UUID projectId, UUID variantQuoteId, UUID variantId) {
        variantQuoteService.toggleP3P5(projectId, variantQuoteId, variantId);
        return true;
    }

    @Transactional
    @CacheEvict(value = "projects", allEntries = true)
    public Boolean markVariantAsDesigned(UUID projectId, UUID variantQuoteId, UUID variantId,
            UUID designerId, String planPdfKey) {
        variantQuoteService.markAsDesigned(projectId, variantQuoteId, variantId, designerId, planPdfKey);
        return true;
    }

    @Transactional
    @CacheEvict(value = "projects", allEntries = true)
    public Boolean markVariantAsDeveloped(UUID projectId, UUID variantQuoteId, UUID variantId, UUID developmentUserId) {
        variantQuoteService.markAsDeveloped(projectId, variantQuoteId, variantId, developmentUserId);
        return true;
    }

    @Transactional
    @CacheEvict(value = {"projects", "products"}, allEntries = true)
    public Boolean assignVariantToUser(UUID projectId, UUID variantQuoteId, UUID assigneeId, String roleType) {
        variantQuoteService.assignVariantToUser(projectId, variantQuoteId, assigneeId, roleType);
        return true;
    }

    // ─── Base / Variant catalog management ──────────────────────────────

    @Transactional(readOnly = true)
    public List<BaseResponse> getVariants() {
        var quoteVariantIds = new HashSet<>(variantQuoteRepo.findVariantIdsWithQuoteType());
        return baseService.findAll().stream()
                .map(base -> {
                    List<VariantResponse> variantResponses = variantService.findByBaseId(base.getId()).stream()
                            .filter(v -> v.getSourceVariantId() == null)
                            .filter(v -> !quoteVariantIds.contains(v.getId()))
                            .filter(v -> hasSapAndRef(v.getSapRef(), v.getSapCode()))
                            .map(v -> {
                                List<ComponentResponse> comps = v.getComponents().stream()
                                        .filter(c -> hasSapAndRef(c.getSapRef(), c.getSapCode()))
                                        .map(this::toComponentResponse)
                                        .collect(Collectors.toList());
                                return new VariantResponse(v.getId(), v.getSapRef(), v.getSapCode(), comps);
                            })
                            .collect(Collectors.toList());
                    return new BaseResponse(base.getId(), base.getName(), base.getImage(), base.getModel(),
                            base.getCategory(), base.getSubcategory(), base.getLine(), variantResponses);
                })
                .filter(b -> b.getVariants() != null && !b.getVariants().isEmpty())
                .collect(Collectors.toList());
    }

    @Transactional
    @CacheEvict(value = "products", allEntries = true)
    public VariantResponse addVariantToBase(UUID baseId, String sapRef,
            List<CreateBaseInitialComponent> components) {
        Base base = baseService.findById(baseId)
                .orElseThrow(() -> new IllegalStateException("Base not found"));
        String ref = sapRef != null && !sapRef.isBlank() ? sapRef
                : base.getId().toString().substring(0, 8) + "-V"
                        + (variantService.findByBaseId(baseId).size() + 1);
        Variant variant = variantService.create(base, ref);
        if (components != null && !components.isEmpty()) {
            List<Component> comps = buildComponentsFromInitialInput(variant, ref, components);
            variantService.setComponents(variant.getId(), comps);
        }
        return toVariantResponse(variantService.findByIdWithComponents(variant.getId()).orElse(variant));
    }

    @Transactional
    @CacheEvict(value = "products", allEntries = true)
    public VariantResponse updateVariant(UUID variantId, String sapRef,
            List<CreateBaseInitialComponent> components) {
        Variant variant = variantService.findByIdWithComponents(variantId)
                .orElseThrow(() -> new IllegalStateException("Variant not found"));
        if (sapRef != null) {
            variant = variantService.updateSapRef(variantId, sapRef);
        }
        if (components != null && !components.isEmpty()) {
            String variantSapRef = variant.getSapRef() != null ? variant.getSapRef() : "";
            List<Component> comps = buildComponentsFromInitialInput(variant, variantSapRef, components);
            variantService.setComponents(variantId, comps);
        }
        return toVariantResponse(variantService.findByIdWithComponents(variantId).orElse(variant));
    }

    @Transactional
    @CacheEvict(value = {"products", "projects"}, allEntries = true)
    public void deleteVariant(UUID variantId) {
        Variant variant = variantService.findById(variantId)
                .orElseThrow(() -> new IllegalStateException("Variant not found"));
        variantQuoteService.deleteByVariantId(variant.getId());
        for (Project p : projectRepository.findProjectsContainingVariantWithVariants(variant.getId())) {
            p.getVariants().remove(variant);
            projectRepository.save(p);
        }
        variantService.deleteById(variant.getId());
    }

    @Transactional
    @CacheEvict(value = "products", allEntries = true)
    public void deleteBaseCascade(UUID baseId) {
        baseService.findById(baseId).orElseThrow(() -> new IllegalStateException("Base not found"));
        for (Variant variant : variantService.findByBaseId(baseId)) {
            variantQuoteService.deleteByVariantId(variant.getId());
            for (Project p : projectRepository.findProjectsContainingVariantWithVariants(variant.getId())) {
                p.getVariants().remove(variant);
                projectRepository.save(p);
            }
            variantService.deleteById(variant.getId());
        }
        baseService.delete(baseId);
    }

    @Transactional
    @CacheEvict(value = {"projects", "products"}, allEntries = true)
    public void modifyVariants(List<ModifyComponent> modifiesVariants) {
        for (ModifyComponent mod : modifiesVariants) {
            Variant variant = variantService.findByIdWithComponents(mod.variantId())
                    .orElseThrow(() -> new IllegalStateException("Variant not found"));
            VariantQuote quote = variantQuoteService
                    .findByVariantIdAndProjectId(mod.variantId(), mod.projectId()).orElse(null);
            if (quote != null && mod.componentId() != null && mod.value() != null) {
                ComponentService.findOriginalById(variant.getComponents(), mod.componentId())
                        .ifPresent(o -> {
                            var existing = quote.getComponentOverrides().stream()
                                    .filter(ov -> ov.getComponent() != null
                                            && o.getId().equals(ov.getComponent().getId()))
                                    .findFirst();
                            String origVal = o.getValue() != null ? o.getValue() : o.getOriginalValue();
                            if (existing.isPresent()) {
                                existing.get().setValue(mod.value());
                            } else {
                                quote.getComponentOverrides().add(
                                        componentService.createOverride(quote, o, mod.value(), origVal));
                            }
                            variantQuoteRepo.save(quote);
                        });
            }
            variantQuoteService.resetQuote(mod.variantId());
            projectService.reOpen(mod.projectId());
            List<VariantQuote> products = variantQuoteService.findByProjectId(mod.projectId());
            projectService.updateStateByQuote(mod.projectId(), products);
        }
    }

    // ─── Private helpers ────────────────────────────────────────────────

    private List<Component> buildComponentsFromInitialInput(Variant variant, String variantSapRef,
            List<CreateBaseInitialComponent> components) {
        List<Component> comps = new ArrayList<>();
        int compOrdinal = 0;
        for (CreateBaseInitialComponent c : components) {
            if (c.componentId() == null
                    && (c.componentSapRef() == null || c.componentSapRef().isBlank())
                    && (c.componentSapCode() == null || c.componentSapCode().isBlank())) continue;
            compOrdinal++;
            Component orig = c.componentId() != null ? componentService.findById(c.componentId()).orElse(null) : null;
            String sapRefC, sapCode;
            if (c.componentId() != null) {
                boolean hasSapRef = c.componentSapRef() != null && !c.componentSapRef().isBlank();
                boolean hasSapCode = c.componentSapCode() != null && !c.componentSapCode().isBlank();
                sapRefC = hasSapRef ? c.componentSapRef().trim()
                        : (orig != null ? orig.getSapRef()
                                : ComponentVariableKeys.uniqueStub(variantSapRef, compOrdinal));
                sapCode = hasSapCode ? c.componentSapCode().trim()
                        : (orig != null ? orig.getSapCode() : sapRefC);
            } else {
                sapCode = c.componentSapCode() != null && !c.componentSapCode().isBlank()
                        ? c.componentSapCode().trim()
                        : (c.componentSapRef() != null ? c.componentSapRef().trim()
                                : ComponentVariableKeys.uniqueStub(variantSapRef, compOrdinal));
                sapRefC = c.componentSapRef() != null && !c.componentSapRef().isBlank()
                        ? c.componentSapRef().trim()
                        : sapCode;
            }
            String name = ComponentVariableKeys.displayNamePreferInput(c.componentName(), orig);
            String val = ComponentVariableKeys.valuePreferInput(c.componentValue(), orig);
            comps.add(componentService.createForVariant(variant, sapRefC, sapCode, name, val, val));
        }
        return comps;
    }

    private ProjectResponse toProjectResponse(Project project, boolean filterByEffective,
            Predicate<VariantQuote> assignmentFilter) {
        boolean projectEffective = project.isEffective();
        List<ProjectVariantResponse> variants = new ArrayList<>();
        var quotes = project.getVariantQuotes() != null ? project.getVariantQuotes() : List.<VariantQuote>of();
        for (VariantQuote quote : quotes) {
            if (filterByEffective && projectEffective && !quote.isEffective()) continue;
            if (assignmentFilter != null && !assignmentFilter.test(quote)) continue;
            if (quote.getVariant() != null) {
                Variant variant = quote.getVariant();
                List<ComponentResponse> components = toEffectiveComponentResponses(variant, quote);
                Base baseEntity = variant.getBase();
                UUID baseIdVal = baseEntity != null ? baseEntity.getId() : quote.getBaseId();
                String baseName = baseEntity != null ? baseEntity.getName() : null;
                String baseImage = baseEntity != null ? baseEntity.getImage() : null;
                String category = baseEntity != null ? baseEntity.getCategory() : null;
                String subcategory = baseEntity != null ? baseEntity.getSubcategory() : null;
                String line = baseEntity != null ? baseEntity.getLine() : null;
                if (baseImage == null && quote.getImage() != null) baseImage = quote.getImage();
                String sapCode = variant.getSapCode();
                if (sapCode != null && sapCode.isBlank()) sapCode = null;
                variants.add(new ProjectVariantResponse(variant.getId(), variant.getSapRef(), sapCode, quote,
                        components, baseIdVal, baseName, baseImage, category, subcategory, line));
            }
        }
        return new ProjectResponse(project, variants);
    }

    private boolean filterByAssignmentRole(Project p, String role) {
        if (role == null || role.isBlank()) return true;
        String r = role.trim().toLowerCase();
        if ("cotizador".equals(r) || "quoter".equals(r)) return true;
        if ("disenador".equals(r) || "designer".equals(r)) {
            return p.getVariantQuotes().stream().anyMatch(q -> q.getQuotedAt() != null);
        }
        if ("desarrollo".equals(r) || "development".equals(r)) {
            return p.getVariantQuotes().stream().anyMatch(q -> q.getDesignedAt() != null);
        }
        return true;
    }

    private Predicate<VariantQuote> assignmentVariantFilter(String role) {
        if (role == null || role.isBlank()) return null;
        String r = role.trim().toLowerCase();
        if ("cotizador".equals(r) || "quoter".equals(r)) return null;
        if ("disenador".equals(r) || "designer".equals(r)) return q -> q.getQuotedAt() != null;
        if ("desarrollo".equals(r) || "development".equals(r)) return q -> q.getDesignedAt() != null;
        return null;
    }

    private Map<UUID, VariantQuoteComponentOverride> overridesByComponentId(VariantQuote quote) {
        if (quote == null || quote.getComponentOverrides() == null || quote.getComponentOverrides().isEmpty()) {
            return Map.of();
        }
        var m = new HashMap<UUID, VariantQuoteComponentOverride>();
        for (VariantQuoteComponentOverride ov : quote.getComponentOverrides()) {
            if (ov != null && ov.getComponent() != null && ov.getComponent().getId() != null) {
                m.put(ov.getComponent().getId(), ov);
            }
        }
        return m;
    }

    private List<ComponentResponse> toEffectiveComponentResponses(Variant variant, VariantQuote quote) {
        var ovs = overridesByComponentId(quote);
        var out = new ArrayList<ComponentResponse>();
        for (Component c : variant.getComponents() != null ? variant.getComponents() : List.<Component>of()) {
            VariantQuoteComponentOverride ov = ovs.get(c.getId());
            String value = ov != null ? ov.getValue() : c.getValue();
            String originalValue = ov != null ? ov.getOriginalValue() : c.getOriginalValue();
            out.add(new ComponentResponse(c.getId(), c.getSapRef(), c.getSapCode(), c.getName(),
                    value, originalValue, null));
        }
        return out;
    }

    private ComponentResponse toComponentResponse(Component c) {
        return new ComponentResponse(c.getId(), c.getSapRef(), c.getSapCode(), c.getName(),
                c.getValue(), c.getOriginalValue(), null);
    }

    private VariantResponse toVariantResponse(Variant v) {
        List<ComponentResponse> comps = v.getComponents().stream()
                .map(this::toComponentResponse)
                .collect(Collectors.toList());
        return new VariantResponse(v.getId(), v.getSapRef(), v.getSapCode(), comps);
    }

    private static boolean hasSapAndRef(String sapRef, String sapCode) {
        return sapRef != null && !sapRef.isBlank() && sapCode != null && !sapCode.isBlank();
    }

    static boolean isCloneType(String type) {
        if (type == null) return false;
        String t = type.trim().toLowerCase();
        return "p1".equals(t) || "p2".equals(t) || "p3".equals(t) || "p5".equals(t);
    }

    private static boolean shouldDeleteProjectLineVariant(VariantQuote vq) {
        if (vq.getVariant() == null) return false;
        Variant v = vq.getVariant();
        if (isCloneType(vq.getType())) return true;
        return v.getSourceVariantId() != null || v.getProductVariantId() != null;
    }
}
