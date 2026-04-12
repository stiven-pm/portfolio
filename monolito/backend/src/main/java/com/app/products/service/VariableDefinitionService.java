package com.app.products.service;

import java.util.List;
import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.app.products.domain.VariableDefinition;
import com.app.products.repository.VariableDefinitionRepository;

import lombok.AllArgsConstructor;

@Service
@AllArgsConstructor
public class VariableDefinitionService {

    private static final String PLACEHOLDER_NAME = "—";

    private final VariableDefinitionRepository variableDefinitionRepository;

    public List<VariableDefinition> listAllOrdered() {
        return variableDefinitionRepository.findAll().stream()
                .sorted((a, b) -> a.getName().compareToIgnoreCase(b.getName()))
                .toList();
    }

    @Transactional
    public VariableDefinition findOrCreateByNormalizedName(String name) {
        String t = name.trim();
        return variableDefinitionRepository.findByNormalizedName(t)
                .orElseGet(() -> variableDefinitionRepository.save(
                        VariableDefinition.builder()
                                .id(UUID.randomUUID())
                                .name(t)
                                .build()));
    }

    public VariableDefinition getPlaceholderDefinition() {
        return variableDefinitionRepository.findByNormalizedName(PLACEHOLDER_NAME)
                .orElseThrow(() -> new IllegalStateException(
                        "Falta definición placeholder «" + PLACEHOLDER_NAME + "» en BD"));
    }

    public VariableDefinition getReference(UUID id) {
        return variableDefinitionRepository.getReferenceById(id);
    }

    public VariableDefinition requireById(UUID id) {
        return variableDefinitionRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Definición de variable no encontrada"));
    }

    @Transactional
    public VariableDefinition updateName(UUID id, String name) {
        VariableDefinition v = variableDefinitionRepository.findById(id)
                .orElseThrow(() -> new IllegalStateException("Definición no encontrada"));
        if (name == null || name.isBlank()) {
            throw new IllegalArgumentException("Nombre inválido");
        }
        v.setName(name.trim());
        return variableDefinitionRepository.save(v);
    }
}
