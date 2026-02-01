package com.github.dawid_stolarczyk.magazyn.Repositories;

import com.github.dawid_stolarczyk.magazyn.Model.Entity.Rack;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface RackRepository extends JpaRepository<Rack, Long> {
    List<Rack> findByWarehouseId(Long warehouseId);
}
