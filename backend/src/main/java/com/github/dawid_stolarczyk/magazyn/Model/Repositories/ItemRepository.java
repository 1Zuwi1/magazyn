package com.github.dawid_stolarczyk.magazyn.Model.Repositories;

import com.github.dawid_stolarczyk.magazyn.Model.Entities.Item;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ItemRepository extends JpaRepository<Item, Long> {
}
