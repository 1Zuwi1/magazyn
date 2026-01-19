package com.github.dawid_stolarczyk.magazyn.Repositories.Redis;

import com.github.dawid_stolarczyk.magazyn.Security.Auth.RememberMeData;
import org.springframework.data.repository.CrudRepository;

public interface RememberMeRepository extends CrudRepository<RememberMeData, String> {
}
