package com.github.dawid_stolarczyk.magazyn.Model.Entity;

import jakarta.persistence.*;
import lombok.*;

import java.sql.Timestamp;
import java.time.Instant;

@Entity
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Assortment {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @ManyToOne
    @JoinColumn(name = "item_id", nullable = false)
    private Item item;
    @ManyToOne
    @JoinColumn(name = "rack_id", nullable = false)
    private Rack rack;
    @ManyToOne
    @JoinColumn(name = "created_by")
    private User user;
    private Timestamp created_at;
    private Timestamp expires_at;
    private Integer position_x;
    private Integer position_y;

    @PrePersist
    public void initializeCreatedAt() {
        if (created_at == null) {
            created_at = Timestamp.from(Instant.now());
        }
    }
}
