package com.github.dawid_stolarczyk.magazyn.Model.Repositories;

import com.github.dawid_stolarczyk.magazyn.Model.Entities.Regal;
import org.springframework.data.jpa.repository.JpaRepository;

public interface RegalRepository extends JpaRepository<Regal, Long> {
}
