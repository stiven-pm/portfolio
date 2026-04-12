package com.app.catalog.repository;

import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.app.catalog.domain.Base;

@Repository
public interface BaseRepository extends JpaRepository<Base, UUID> {
}
