package com.app.catalog.repository;

import java.time.LocalDate;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import com.app.catalog.infraestructure.DailyProjectSequence;

@Repository
public interface DailyProjectSequenceRepository extends JpaRepository<DailyProjectSequence, LocalDate> {

    @Query(value = """
        WITH upsert AS (
            INSERT INTO catalog.daily_project_sequences (day, last_value)
            VALUES (CURRENT_DATE, 1)
            ON CONFLICT (day)
            DO UPDATE SET last_value = catalog.daily_project_sequences.last_value + 1
            RETURNING last_value
        )
        SELECT last_value FROM upsert
        """, nativeQuery = true)
    Integer nextDailySequence();
}
