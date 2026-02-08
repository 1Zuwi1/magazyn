package com.github.dawid_stolarczyk.magazyn.Repositories.JPA;

import com.github.dawid_stolarczyk.magazyn.Model.Entity.TwoFactorMethod;
import org.springframework.data.jpa.repository.JpaRepository;

public interface TwoFactorMethodRepository extends JpaRepository<TwoFactorMethod, Long> {
}
