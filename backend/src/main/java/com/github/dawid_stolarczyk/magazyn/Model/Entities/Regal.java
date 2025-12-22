package com.github.dawid_stolarczyk.magazyn.Model.Entities;

import jakarta.persistence.*;

import java.util.List;

@Entity
@Table(name = "regals")
public class Regal {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private String marker;
    private String comment;
    private int size_x;
    private int size_y;
    private float max_temp;
    private float min_temp;
    private float max_weight;
    private float max_size_x;
    private float max_size_y;
    private float max_size_z;

    @OneToMany(mappedBy = "regal", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Assortment> assortments;

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getMarker() {
        return marker;
    }

    public void setMarker(String marker) {
        this.marker = marker;
    }

    public String getComment() {
        return comment;
    }

    public void setComment(String comment) {
        this.comment = comment;
    }

    public int getSize_x() {
        return size_x;
    }

    public void setSize_x(int size_x) {
        this.size_x = size_x;
    }

    public int getSize_y() {
        return size_y;
    }

    public void setSize_y(int size_y) {
        this.size_y = size_y;
    }

    public float getMax_temp() {
        return max_temp;
    }

    public void setMax_temp(float max_temp) {
        this.max_temp = max_temp;
    }

    public float getMin_temp() {
        return min_temp;
    }

    public void setMin_temp(float min_temp) {
        this.min_temp = min_temp;
    }

    public float getMax_weight() {
        return max_weight;
    }

    public void setMax_weight(float max_weight) {
        this.max_weight = max_weight;
    }

    public float getMax_size_x() {
        return max_size_x;
    }

    public void setMax_size_x(float max_size_x) {
        this.max_size_x = max_size_x;
    }

    public float getMax_size_y() {
        return max_size_y;
    }

    public void setMax_size_y(float max_size_y) {
        this.max_size_y = max_size_y;
    }

    public float getMax_size_z() {
        return max_size_z;
    }

    public void setMax_size_z(float max_size_z) {
        this.max_size_z = max_size_z;
    }

    public List<Assortment> getAssortments() {
        return assortments;
    }

    public void setAssortments(List<Assortment> assortments) {
        this.assortments = assortments;
    }
}
