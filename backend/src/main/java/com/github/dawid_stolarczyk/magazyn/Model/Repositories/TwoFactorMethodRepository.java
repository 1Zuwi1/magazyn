package com.github.dawid_stolarczyk.magazyn.Model.Repositories;

import com.github.dawid_stolarczyk.magazyn.Model.Entities.TwoFactorMethod;
import org.springframework.data.jpa.repository.JpaRepository;

public interface TwoFactorMethodRepository extends JpaRepository<TwoFactorMethod, Long> {
}
