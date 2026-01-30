package com.github.dawid_stolarczyk.magazyn.Model.Entity;

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

    @OneToMany(mappedBy = "item", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Assortment> assortments = new ArrayList<>();


}
