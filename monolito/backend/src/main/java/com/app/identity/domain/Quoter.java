package com.app.identity.domain;

import java.util.UUID;

import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "quoters", schema = "identity")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Quoter {

    @Id
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private User user;

    private Integer quoted;
    private Integer projects;
    private Integer products;

    public UUID getUserId() {
        return user != null ? user.getId() : null;
    }
}
