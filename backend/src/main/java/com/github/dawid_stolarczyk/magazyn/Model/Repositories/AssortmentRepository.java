package com.github.dawid_stolarczyk.magazyn.Model.Repositories;

import com.github.dawid_stolarczyk.magazyn.Model.Entities.Assortment;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AssortmentRepository extends JpaRepository<Assortment, Long> {
}
