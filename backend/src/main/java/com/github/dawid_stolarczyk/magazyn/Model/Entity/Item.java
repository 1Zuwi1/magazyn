package com.github.dawid_stolarczyk.magazyn.Model.Entity;

import com.github.dawid_stolarczyk.magazyn.Common.Converter.VectorConverter;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "items")
@Getter
@Setter
public class Item {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private String name;
    @Column(unique = true, length = 32)
    private String barcode;
    private String photo_url;
    private float min_temp;
    private float max_temp;
    private float weight;
    private float size_x;
    private float size_y;
    private float size_z;
    private String comment;
    private long expireAfterDays;
    private boolean isDangerous;

    /**
     * 512-dimensional vector embedding from CLIP model for image similarity search.
     * Stored as PostgreSQL vector type using pgvector extension.
     * For H2 testing, this is stored as a simple string representation.
     */
    @Column(name = "image_embedding", columnDefinition = "vector(512)")
    @Convert(converter = VectorConverter.class)
    private float[] imageEmbedding;

    @OneToMany(mappedBy = "item", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Assortment> assortments = new ArrayList<>();


}
