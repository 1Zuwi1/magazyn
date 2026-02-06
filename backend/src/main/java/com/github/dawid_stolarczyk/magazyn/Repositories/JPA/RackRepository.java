package com.github.dawid_stolarczyk.magazyn.Repositories.JPA;

import com.github.dawid_stolarczyk.magazyn.Model.Entity.Rack;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface RackRepository extends JpaRepository<Rack, Long> {
    List<Rack> findByWarehouseId(Long warehouseId);

    Page<Rack> findAll(Pageable pageable);

    Page<Rack> findByWarehouseId(Long warehouseId, Pageable pageable);
}
