package com.app.catalog.service;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.app.catalog.domain.Project;
import com.app.catalog.domain.Variant;
import com.app.catalog.domain.VariantQuote;
import com.app.catalog.dto.variant.QuoteVariant;
import com.app.catalog.repository.ProjectRepository;
import com.app.catalog.repository.VariantQuoteRepository;
import com.app.catalog.repository.VariantRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class VariantQuoteService {

    private final VariantQuoteRepository variantQuoteRepository;
    private final VariantRepository variantRepo;
    private final ProjectRepository projectRepository;

    @Transactional
    public VariantQuote create(UUID variantId, UUID projectId, UUID quoterId, String type,
            String comments, String image, Integer quantity) {
        return create(variantId, projectId, quoterId, type, comments, image, quantity, null);
    }

    @Transactional
    public VariantQuote create(UUID variantId, UUID projectId, UUID quoterId, String type,
            String comments, String image, Integer quantity, UUID productsBaseId) {
        Variant variant = variantRepo.findById(variantId)
                .orElseThrow(() -> new IllegalStateException("Variant not found"));
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new IllegalStateException("Project not found"));
        int qty = (quantity != null && quantity > 0) ? quantity : 1;
        VariantQuote quote = VariantQuote.builder()
                .id(UUID.randomUUID())
                .variant(variant)
                .project(project)
                .quoterId(quoterId)
                .type(type)
                .comments(comments)
                .image(image)
                .quantity(qty)
                .effective(false)
                .baseId(productsBaseId)
                .build();
        return variantQuoteRepository.save(quote);
    }

    public VariantQuote requireQuoteLine(UUID projectId, UUID variantQuoteId, UUID variantId) {
        if (variantQuoteId != null) {
            return variantQuoteRepository.findByIdAndProject_Id(variantQuoteId, projectId)
                    .orElseThrow(() -> new IllegalStateException("VariantQuote not found"));
        }
        if (variantId == null) {
            throw new IllegalArgumentException("Se requiere variantId o variantQuoteId");
        }
        return findByVariantIdAndProjectId(variantId, projectId)
                .orElseThrow(() -> new IllegalStateException("VariantQuote not found"));
    }

    @Transactional
    public VariantQuote quote(QuoteVariant quoteProduct) {
        VariantQuote vq = requireQuoteLine(
                quoteProduct.projectId(), quoteProduct.variantQuoteId(), quoteProduct.variantId());
        vq.setPrice(quoteProduct.price());
        vq.setElaborationTime(quoteProduct.elaborationTime());
        vq.setCriticalMaterial(quoteProduct.criticalMaterial());
        vq.setQuotedAt(Instant.now());
        if (typologyRequiresNoDesign(vq.getType())) {
            vq.setDesignedAt(Instant.now());
        }
        VariantQuote saved = variantQuoteRepository.save(vq);
        syncProjectDesignedAt(quoteProduct.projectId());
        return saved;
    }

    public List<VariantQuote> findByProjectId(UUID projectId) {
        return variantQuoteRepository.findByProjectId(projectId);
    }

    public Optional<VariantQuote> findById(UUID id) {
        return variantQuoteRepository.findById(id);
    }

    public List<VariantQuote> findByVariantId(UUID variantId) {
        return variantQuoteRepository.findByVariantId(variantId);
    }

    public Optional<VariantQuote> findByVariantIdAndProjectId(UUID variantId, UUID projectId) {
        return variantQuoteRepository.findByVariantIdAndProjectId(variantId, projectId);
    }

    @Transactional
    public void resetQuote(UUID variantId) {
        variantQuoteRepository.resetQuoteByVariantId(variantId);
    }

    @Transactional
    public void resetQuoteByProject(UUID projectId) {
        variantQuoteRepository.resetQuoteByProjectId(projectId);
    }

    @Transactional
    public void deleteByVariantId(UUID variantId) {
        variantQuoteRepository.deleteByVariantId(variantId);
    }

    @Transactional
    public VariantQuote updateQuantity(UUID projectId, UUID variantQuoteId, UUID variantId, Integer quantity) {
        VariantQuote vq = requireQuoteLine(projectId, variantQuoteId, variantId);
        int qty = quantity != null && quantity > 0 ? quantity : 1;
        vq.setQuantity(qty);
        return variantQuoteRepository.save(vq);
    }

    @Transactional
    public VariantQuote updateCommentsAndType(UUID projectId, UUID variantQuoteId, UUID variantId,
            String comments, String type) {
        VariantQuote vq = requireQuoteLine(projectId, variantQuoteId, variantId);
        if (comments != null) vq.setComments(comments);
        if (type != null) vq.setType(type);
        return variantQuoteRepository.save(vq);
    }

    @Transactional
    public void clearType(UUID projectId, UUID variantQuoteId, UUID variantId) {
        VariantQuote vq = requireQuoteLine(projectId, variantQuoteId, variantId);
        vq.setType(null);
        variantQuoteRepository.save(vq);
    }

    @Transactional
    public VariantQuote setEffective(UUID projectId, UUID variantQuoteId, UUID variantId, boolean effective) {
        VariantQuote vq = requireQuoteLine(projectId, variantQuoteId, variantId);
        vq.setEffective(effective);
        return variantQuoteRepository.save(vq);
    }

    @Transactional
    public VariantQuote toggleP3P5(UUID projectId, UUID variantQuoteId, UUID variantId) {
        VariantQuote vq = requireQuoteLine(projectId, variantQuoteId, variantId);
        String t = vq.getType() != null ? vq.getType().trim().toLowerCase() : "";
        if ("p3".equals(t)) {
            vq.setType("p5");
        } else if ("p5".equals(t)) {
            vq.setType("p3");
        } else {
            throw new IllegalArgumentException("Solo variantes P3 o P5 pueden alternar tipología. Actual: " + t);
        }
        return variantQuoteRepository.save(vq);
    }

    @Transactional
    public VariantQuote markAsDesigned(UUID projectId, UUID variantQuoteId, UUID variantId,
            UUID designerId, String planPdfKey) {
        VariantQuote vq = requireQuoteLine(projectId, variantQuoteId, variantId);
        if (vq.getQuotedAt() == null) {
            throw new IllegalStateException("La variante debe estar cotizada antes de marcar como diseñada");
        }
        if (planPdfKey != null && !planPdfKey.isBlank()) {
            vq.setPlanPdfKey(planPdfKey.trim());
        }
        vq.setDesignedAt(Instant.now());
        vq.setDesignerId(designerId);
        VariantQuote saved = variantQuoteRepository.save(vq);
        syncProjectDesignedAt(projectId);
        return saved;
    }

    @Transactional
    public VariantQuote markAsDeveloped(UUID projectId, UUID variantQuoteId, UUID variantId, UUID developmentUserId) {
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new IllegalStateException("Project not found"));
        if (!project.isEffective()) {
            throw new IllegalStateException("Solo se puede marcar desarrollado en proyectos efectivos");
        }
        VariantQuote vq = requireQuoteLine(projectId, variantQuoteId, variantId);
        if (!vq.isEffective()) {
            throw new IllegalStateException("Solo se puede marcar desarrollado en variantes efectivas");
        }
        if (vq.getDesignedAt() == null) {
            throw new IllegalStateException("La variante debe estar diseñada antes de marcar como desarrollada");
        }
        List<VariantQuote> projectQuotes = variantQuoteRepository.findByProjectId(projectId);
        for (VariantQuote q : projectQuotes) {
            if (typologyRequiresDesign(q.getType()) && q.getDesignedAt() == null) {
                throw new IllegalStateException(
                    "No se puede marcar desarrollado: todas las variantes P2, P3 y P4 del proyecto deben estar diseñadas primero.");
            }
        }
        vq.setDevelopedAt(Instant.now());
        vq.setDevelopmentUserId(developmentUserId);
        return variantQuoteRepository.save(vq);
    }

    @Transactional
    public VariantQuote assignVariantToUser(UUID projectId, UUID lineId, UUID assigneeId, String roleType) {
        VariantQuote vq = variantQuoteRepository.findByIdAndProject_Id(lineId, projectId)
                .or(() -> findByVariantIdAndProjectId(lineId, projectId))
                .orElseThrow(() -> new IllegalStateException("VariantQuote not found"));
        switch (roleType != null ? roleType.toUpperCase() : "") {
            case "QUOTER" -> {
                if (vq.getAssignedQuoterId() != null) {
                    throw new IllegalStateException("El cotizador ya está asignado y no se puede cambiar");
                }
                vq.setAssignedQuoterId(assigneeId);
            }
            case "DESIGNER" -> {
                if (vq.getAssignedDesignerId() != null) {
                    throw new IllegalStateException("El diseñador ya está asignado y no se puede cambiar");
                }
                vq.setAssignedDesignerId(assigneeId);
            }
            case "DEVELOPMENT" -> {
                if (vq.getAssignedDevelopmentUserId() != null) {
                    throw new IllegalStateException("El desarrollo ya está asignado y no se puede cambiar");
                }
                vq.setAssignedDevelopmentUserId(assigneeId);
            }
            default -> throw new IllegalArgumentException("roleType debe ser QUOTER, DESIGNER o DEVELOPMENT");
        }
        return variantQuoteRepository.save(vq);
    }

    private static boolean typologyRequiresNoDesign(String type) {
        if (type == null) return false;
        String t = type.trim().toLowerCase();
        return "p1".equals(t) || "p5".equals(t) || "p".equals(t);
    }

    static boolean typologyRequiresDesign(String type) {
        if (type == null) return false;
        String t = type.trim().toLowerCase();
        return "p2".equals(t) || "p3".equals(t) || "p4".equals(t);
    }

    private void syncProjectDesignedAt(UUID projectId) {
        List<VariantQuote> projectQuotes = variantQuoteRepository.findByProjectId(projectId);
        boolean allDesigned = projectQuotes.stream()
                .allMatch(q -> !typologyRequiresDesign(q.getType()) || q.getDesignedAt() != null);
        Project project = projectRepository.findById(projectId).orElseThrow();
        if (allDesigned) {
            if (project.getProjectDesignedAt() == null) {
                project.setProjectDesignedAt(Instant.now());
            }
        } else {
            project.setProjectDesignedAt(null);
        }
        projectRepository.save(project);
    }
}
