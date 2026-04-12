package com.app.catalog.dto.variant;

import java.util.UUID;

import com.app.catalog.domain.TypologyStandard;

public record TypologyStandardResponse(
        UUID id,
        String tipologia,
        int daysCotiz,
        int daysDiseno,
        Integer daysDesarrollo,
        Integer hoursPerWeek) {

    public static TypologyStandardResponse from(TypologyStandard s) {
        return new TypologyStandardResponse(
                s.getId(),
                s.getTipologia(),
                s.getDaysCotiz(),
                s.getDaysDiseno(),
                s.getDaysDesarrollo(),
                s.getHoursPerWeek());
    }
}
