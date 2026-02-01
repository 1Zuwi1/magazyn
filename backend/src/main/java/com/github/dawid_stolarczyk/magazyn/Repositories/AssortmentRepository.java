package com.github.dawid_stolarczyk.magazyn.Repositories;

import com.github.dawid_stolarczyk.magazyn.Model.Entity.Assortment;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface AssortmentRepository extends JpaRepository<Assortment, Long> {
    List<Assortment> findByRackId(Long rackId);
    boolean existsByBarcode(String barcode);
    java.util.Optional<Assortment> findByBarcode(String barcode);
}
