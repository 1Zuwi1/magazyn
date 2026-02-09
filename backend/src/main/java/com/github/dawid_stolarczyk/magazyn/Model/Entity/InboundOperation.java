package com.github.dawid_stolarczyk.magazyn.Model.Entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.sql.Timestamp;
import java.time.Instant;

/**
 * Encja reprezentująca operację przyjęcia towaru do magazynu (audyt).
 * Każde przyjęcie jest rejestrowane z informacją o użytkowniku, czasie i lokalizacji.
 */
@Entity
@Table(name = "inbound_operations",
        indexes = {
                @Index(name = "idx_inbound_operation_user", columnList = "received_by_name"),
                @Index(name = "idx_inbound_operation_date", columnList = "operation_timestamp"),
                @Index(name = "idx_inbound_operation_rack_marker", columnList = "rack_marker"),
                @Index(name = "idx_inbound_operation_item_code", columnList = "item_code"),
                @Index(name = "idx_inbound_operation_assortment_code", columnList = "assortment_code")
        }
)
@Getter
@Setter
public class InboundOperation {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String itemName;

    private String itemCode;

    private String rackMarker;

    private String assortmentCode;

    /**
     * Data i czas wykonania operacji
     */
    @Column(name = "received_by_name", nullable = false)
    private String receivedByName;

    @Column(name = "operation_timestamp", nullable = false)
    private Timestamp operationTimestamp;

    /**
     * Pozycja X na regale
     */
    @Column(name = "position_x")
    private Integer positionX;

    /**
     * Pozycja Y na regale
     */
    @Column(name = "position_y")
    private Integer positionY;

    /**
     * Ilość przyjętego towaru (domyślnie 1 pozycja)
     */
    @Column(name = "quantity", nullable = false)
    private Integer quantity = 1;

    /**
     * Automatycznie ustawia timestamp przy tworzeniu rekordu
     */
    @PrePersist
    public void initializeTimestamp() {
        if (operationTimestamp == null) {
            operationTimestamp = Timestamp.from(Instant.now());
        }
    }
}
