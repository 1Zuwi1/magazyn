package com.github.dawid_stolarczyk.magazyn.Repositories.Redis;

import com.github.dawid_stolarczyk.magazyn.Security.Auth.SessionData;
import org.springframework.data.repository.CrudRepository;

public interface SessionRepository extends CrudRepository<SessionData, String> {
}
