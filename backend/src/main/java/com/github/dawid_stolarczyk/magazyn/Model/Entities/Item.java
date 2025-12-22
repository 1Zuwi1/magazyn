package com.github.dawid_stolarczyk.magazyn.Model.Entities;

import jakarta.persistence.*;

import java.util.List;

@Entity
@Table(name = "items")
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
    private int expireAfter;
    private boolean isDangerous;

    @OneToMany(mappedBy = "item", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Assortment> assortments;

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getPhoto_url() {
        return photo_url;
    }

    public void setPhoto_url(String photo_url) {
        this.photo_url = photo_url;
    }

    public float getMin_temp() {
        return min_temp;
    }

    public void setMin_temp(float min_temp) {
        this.min_temp = min_temp;
    }

    public float getMax_temp() {
        return max_temp;
    }

    public void setMax_temp(float max_temp) {
        this.max_temp = max_temp;
    }

    public float getWeight() {
        return weight;
    }

    public void setWeight(float weight) {
        this.weight = weight;
    }

    public float getSize_x() {
        return size_x;
    }

    public void setSize_x(float size_x) {
        this.size_x = size_x;
    }

    public float getSize_y() {
        return size_y;
    }

    public void setSize_y(float size_y) {
        this.size_y = size_y;
    }

    public float getSize_z() {
        return size_z;
    }

    public void setSize_z(float size_z) {
        this.size_z = size_z;
    }

    public String getComment() {
        return comment;
    }

    public void setComment(String comment) {
        this.comment = comment;
    }

    public int getExpireAfter() {
        return expireAfter;
    }

    public void setExpireAfter(int expireAfter) {
        this.expireAfter = expireAfter;
    }

    public boolean isDangerous() {
        return isDangerous;
    }

    public void setDangerous(boolean dangerous) {
        isDangerous = dangerous;
    }

    public List<Assortment> getAssortments() {
        return assortments;
    }

    public void setAssortments(List<Assortment> assortments) {
        this.assortments = assortments;
    }
}
