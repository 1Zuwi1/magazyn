package com.github.dawid_stolarczyk.magazyn.Repositories;

import com.github.dawid_stolarczyk.magazyn.Model.Entity.Assortment;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AssortmentRepository extends JpaRepository<Assortment, Long> {
}
