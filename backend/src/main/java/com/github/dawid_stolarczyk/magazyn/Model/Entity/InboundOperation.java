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
                @Index(name = "idx_inbound_operation_user", columnList = "received_by"),
                @Index(name = "idx_inbound_operation_date", columnList = "operation_timestamp"),
                @Index(name = "idx_inbound_operation_rack", columnList = "rack_id"),
                @Index(name = "idx_inbound_operation_item", columnList = "item_id")
        }
)
@Getter
@Setter
public class InboundOperation {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /**
     * Produkt, który został przyjęty
     */
    @ManyToOne
    @JoinColumn(name = "item_id", nullable = false)
    private Item item;

    /**
     * Regał, na który umieszczono towar
     */
    @ManyToOne
    @JoinColumn(name = "rack_id", nullable = false)
    private Rack rack;

    /**
     * Przypisanie (Assortment) stworzone podczas tej operacji
     */
    @OneToOne
    @JoinColumn(name = "assortment_id")
    private Assortment assortment;

    /**
     * Użytkownik, który wykonał operację przyjęcia
     */
    @ManyToOne
    @JoinColumn(name = "received_by", nullable = false)
    private User receivedBy;

    /**
     * Data i czas wykonania operacji
     */
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
