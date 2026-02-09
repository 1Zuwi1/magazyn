package com.github.dawid_stolarczyk.magazyn.Model.Entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.Builder;

import java.time.Instant;

/**
 * Entity representing a physical report from a rack sensor/measurement.
 * Contains actual measured values from the rack at a specific point in time.
 */
@Entity
@Table(name = "rack_reports", indexes = {
        @Index(name = "idx_rack_reports_rack_id", columnList = "rack_id"),
        @Index(name = "idx_rack_reports_created_at", columnList = "createdAt")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RackReport {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "rack_id", nullable = false)
    private Rack rack;

    /**
     * Current measured weight on the rack (in kg)
     */
    @Column(nullable = false)
    private float currentWeight;

    /**
     * Current measured temperature (in °C)
     */
    @Column(nullable = false)
    private float currentTemperature;

    /**
     * Timestamp when the report was received
     */
    @Column(nullable = false)
    private Instant createdAt;

    /**
     * Optional: Source/sensor identifier that sent this report
     */
    @Column(length = 100)
    private String sensorId;

    /**
     * Flag indicating if this report triggered any alerts
     */
    @Column(nullable = false)
    private boolean alertTriggered;

    @PrePersist
    protected void onCreate() {
        if (createdAt == null) {
            createdAt = Instant.now();
        }
    }
}
