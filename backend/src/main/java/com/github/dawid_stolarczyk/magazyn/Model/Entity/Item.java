package com.github.dawid_stolarczyk.magazyn.Model.Entity;


import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.BatchSize;

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
    private boolean imageUploaded = false;

    @OneToMany(mappedBy = "item", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("displayOrder ASC")
    @BatchSize(size = 20)
    private List<ItemImage> images = new ArrayList<>();

    @OneToMany(mappedBy = "item", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Assortment> assortments = new ArrayList<>();

}
