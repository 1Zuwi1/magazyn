package com.github.dawid_stolarczyk.magazyn.Repositories.JPA;

import com.github.dawid_stolarczyk.magazyn.Model.Entity.Warehouse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface WarehouseRepository extends JpaRepository<Warehouse, Long> {
    Page<Warehouse> findAll(Pageable pageable);

    List<Warehouse> findByNameContainingIgnoreCase(String name);

    Page<Warehouse> findByNameContainingIgnoreCase(String name, Pageable pageable);

    List<Warehouse> findByNameContaining(String name);

    Page<Warehouse> findByNameContaining(String name, Pageable pageable);
}
