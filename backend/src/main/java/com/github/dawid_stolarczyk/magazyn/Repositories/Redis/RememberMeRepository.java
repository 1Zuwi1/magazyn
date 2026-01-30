package com.github.dawid_stolarczyk.magazyn.Repositories.Redis;

import com.github.dawid_stolarczyk.magazyn.Security.Auth.Entity.RememberMeData;
import org.springframework.data.repository.CrudRepository;

public interface RememberMeRepository extends CrudRepository<RememberMeData, String> {
}
