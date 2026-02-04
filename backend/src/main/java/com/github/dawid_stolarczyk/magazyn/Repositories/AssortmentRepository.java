package com.github.dawid_stolarczyk.magazyn.Repositories;

import com.github.dawid_stolarczyk.magazyn.Model.Entity.Assortment;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface AssortmentRepository extends JpaRepository<Assortment, Long> {
    List<Assortment> findByRackId(Long rackId);

    boolean existsByBarcode(String barcode);

    Optional<Assortment> findByBarcode(String barcode);

    long countByRack_WarehouseId(Long warehouseId);

    Page<Assortment> findAll(Pageable pageable);
}
