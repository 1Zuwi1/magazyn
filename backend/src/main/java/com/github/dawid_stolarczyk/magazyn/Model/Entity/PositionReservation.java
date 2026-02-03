package com.github.dawid_stolarczyk.magazyn.Model.Entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.sql.Timestamp;
import java.time.Instant;

/**
 * Reprezentuje rezerwację konkretnej pozycji w regale.
 * Rezerwacje wygasają automatycznie po określonym czasie.
 */
@Entity
@Table(name = "position_reservations",
        uniqueConstraints = @UniqueConstraint(
                name = "uk_position_reservation",
                columnNames = {"rack_id", "position_x", "position_y"}
        ),
        indexes = {
                @Index(name = "idx_reservation_expires", columnList = "expires_at"),
                @Index(name = "idx_reservation_user", columnList = "reserved_by")
        }
)
@Getter
@Setter
@NoArgsConstructor
public class PositionReservation {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "rack_id", nullable = false)
    private Rack rack;

    @Column(name = "position_x", nullable = false)
    private int positionX;

    @Column(name = "position_y", nullable = false)
    private int positionY;

    @ManyToOne
    @JoinColumn(name = "reserved_by")
    private User reservedBy;

    @Column(name = "expires_at", nullable = false)
    private Timestamp expiresAt;

    @Column(name = "created_at", nullable = false)
    private Timestamp createdAt;

    public PositionReservation(Rack rack, int positionX, int positionY, User reservedBy, Timestamp expiresAt) {
        this.rack = rack;
        this.positionX = positionX;
        this.positionY = positionY;
        this.reservedBy = reservedBy;
        this.expiresAt = expiresAt;
        this.createdAt = Timestamp.from(Instant.now());
    }

    /**
     * Sprawdza czy rezerwacja jest wciąż aktywna.
     */
    public boolean isActive() {
        return expiresAt != null && expiresAt.toInstant().isAfter(Instant.now());
    }

    /**
     * Sprawdza czy rezerwacja należy do danego użytkownika.
     */
    public boolean belongsTo(Long userId) {
        return reservedBy != null && reservedBy.getId().equals(userId);
    }
}
