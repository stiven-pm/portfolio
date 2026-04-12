package com.app.catalog.domain;

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
@Table(name = "typology_standards", schema = "catalog")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TypologyStandard {

    @Id
    private UUID id;

    @Column(name = "tipologia", unique = true, nullable = false)
    private String tipologia;

    @Column(name = "days_cotiz", nullable = false)
    private int daysCotiz;

    @Column(name = "days_diseno", nullable = false)
    private int daysDiseno;

    @Column(name = "days_desarrollo")
    private Integer daysDesarrollo;

    @Column(name = "hours_per_week")
    private Integer hoursPerWeek;
}
