package com.github.dawid_stolarczyk.magazyn.Repositories;

import com.github.dawid_stolarczyk.magazyn.Model.Entity.Warehouse;
import org.springframework.data.jpa.repository.JpaRepository;

public interface WarehouseRepository extends JpaRepository<Warehouse, Long> {
}
