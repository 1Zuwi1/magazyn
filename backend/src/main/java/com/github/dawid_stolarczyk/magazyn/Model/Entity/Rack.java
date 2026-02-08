package com.github.dawid_stolarczyk.magazyn.Model.Entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Min;
import lombok.Getter;
import lombok.Setter;

import java.util.ArrayList;
import java.util.List;

@Entity
@Table(
        name = "racks",
        uniqueConstraints = {
                @UniqueConstraint(columnNames = {"warehouse_id", "marker"}, name = "uk_warehouse_marker")
        }
)
@Getter
@Setter
public class Rack {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String marker;

    @ManyToOne
    @JoinColumn(name = "warehouse_id")
    private Warehouse warehouse;

    private String comment;
    @Min(1)
    private int size_x;
    @Min(1)
    private int size_y;
    @DecimalMin("-273.15")
    private float max_temp;
    @DecimalMin("-273.15")
    private float min_temp;
    @DecimalMin("0.0")
    private float max_weight;
    @DecimalMin("0.0")
    private float max_size_x;
    @DecimalMin("0.0")
    private float max_size_y;
    @DecimalMin("0.0")
    private float max_size_z;

    private boolean acceptsDangerous;

    @OneToMany(mappedBy = "rack", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Assortment> assortments = new ArrayList<>();
}
