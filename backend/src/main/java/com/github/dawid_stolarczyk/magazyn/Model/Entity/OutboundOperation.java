package com.github.dawid_stolarczyk.magazyn.Model.Entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.sql.Timestamp;
import java.time.Instant;

/**
 * Encja reprezentująca operację wydania towaru z magazynu (audyt).
 * Pola itemName, itemCode, assortmentCode są zdenormalizowane,
 * ponieważ assortment jest usuwany przy wydaniu.
 */
@Entity
@Table(name = "outbound_operations",
        indexes = {
                @Index(name = "idx_outbound_operation_user", columnList = "issued_by"),
                @Index(name = "idx_outbound_operation_date", columnList = "operation_timestamp"),
                @Index(name = "idx_outbound_operation_rack", columnList = "rack_id"),
                @Index(name = "idx_outbound_operation_item", columnList = "item_id")
        }
)
@Getter
@Setter
public class OutboundOperation {
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
    @JoinColumn(name = "issued_by", nullable = false)
    private User issuedBy;

    @Column(name = "operation_timestamp", nullable = false)
    private Timestamp operationTimestamp;

    @Column(name = "batch_arrival_date", nullable = false)
    private Timestamp batchArrivalDate;

    @Column(name = "position_x")
    private Integer positionX;

    @Column(name = "position_y")
    private Integer positionY;

    @Column(name = "quantity", nullable = false)
    private Integer quantity = 1;

    /** Zdenormalizowany kod assortmentu (barcode format, assortment jest usuwany) */
    @Column(name = "assortment_code", length = 32)
    private String assortmentCode;

    /** Zdenormalizowana nazwa produktu */
    @Column(name = "item_name")
    private String itemName;

    /** Zdenormalizowany kod produktu (barcode format) */
    @Column(name = "item_code", length = 32)
    private String itemCode;

    /** Czy wydanie było zgodne z FIFO */
    @Column(name = "fifo_compliant", nullable = false)
    private boolean fifoCompliant = true;

    /** Czy podczas wydania napotkano naruszenie FIFO */
    @Column(name = "fifo_violation", nullable = false)
    private boolean fifoViolation = false;

    @PrePersist
    public void initializeTimestamps() {
        if (operationTimestamp == null) {
            operationTimestamp = Timestamp.from(Instant.now());
        }
        if (batchArrivalDate == null) {
            batchArrivalDate = Timestamp.from(Instant.now());
        }
    }
}
