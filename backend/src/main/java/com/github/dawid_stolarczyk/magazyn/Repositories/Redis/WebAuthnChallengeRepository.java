package com.github.dawid_stolarczyk.magazyn.Repositories.Redis;

import com.github.dawid_stolarczyk.magazyn.Security.Auth.Entity.WebAuthnChallenge;
import org.springframework.data.repository.CrudRepository;

public interface WebAuthnChallengeRepository extends CrudRepository<WebAuthnChallenge, String> {
}
