package com.github.dawid_stolarczyk.magazyn.Model.Entity;

import jakarta.persistence.*;

import java.sql.Timestamp;
import java.time.Instant;

@Entity
public class Assortment {
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
    @JoinColumn(name = "created_by", nullable = false)
    private User user;
    private Timestamp created_at;
    private Timestamp expires_at;
    private Integer position_x;
    private Integer position_y;

    @PrePersist
    public void initializeCreatedAt() {
        if (created_at == null) {
            created_at = Timestamp.from(Instant.now());
        }
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Item getItem() {
        return item;
    }

    public void setItem(Item item) {
        this.item = item;
    }

    public Rack getRack() {
        return rack;
    }

    public void setRack(Rack rack) {
        this.rack = rack;
    }

    public Timestamp getCreated_at() {
        return created_at;
    }

    public void setCreated_at(Timestamp created_at) {
        this.created_at = created_at;
    }

    public Timestamp getExpires_at() {
        return expires_at;
    }

    public void setExpires_at(Timestamp expires_at) {
        this.expires_at = expires_at;
    }

    public Integer getPosition_x() {
        return position_x;
    }

    public void setPosition_x(Integer position_x) {
        this.position_x = position_x;
    }

    public Integer getPosition_y() {
        return position_y;
    }

    public void setPosition_y(Integer position_y) {
        this.position_y = position_y;
    }

    public User getUser() {
        return user;
    }

    public void setUser(User user) {
        this.user = user;
    }
}
