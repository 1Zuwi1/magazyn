package com.github.dawid_stolarczyk.magazyn.Model.Entity;


import com.github.dawid_stolarczyk.magazyn.Common.Converter.PgVectorType;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.Type;

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
    @Column(nullable = false)
    private String name;
    @Column(unique = true, length = 32)
    private String code;
    @Column(unique = true, length = 32)
    private String qrCode;
    private String photo_url;
    private float min_temp;
    private float max_temp;
    private float weight;
    private float size_x;
    private float size_y;
    private float size_z;
    private String comment;
    private Long expireAfterDays;
    private boolean isDangerous;

    /**
     * 1000-dimensional vector embedding from ResNet model for image similarity search.
     * Stored as PostgreSQL vector type using pgvector extension.
     * ResNet models output 1000-dimensional vectors corresponding to ImageNet classes.
     */
    @Column(name = "image_embedding", columnDefinition = "vector(1000)")
    @Type(PgVectorType.class)
    private float[] imageEmbedding;

    @OneToMany(mappedBy = "item", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Assortment> assortments = new ArrayList<>();


}
