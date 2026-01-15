package com.github.dawid_stolarczyk.magazyn.Repositories.Redis;

import com.github.dawid_stolarczyk.magazyn.Security.Auth.TwoFactorAuth;
import org.springframework.data.repository.CrudRepository;

public interface TwoFactorAuthRepository extends CrudRepository<TwoFactorAuth, String> {
}
