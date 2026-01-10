package com.github.dawid_stolarczyk.magazyn.Services.Ratelimiter;

public enum RateLimitOperation {
    AUTH_LOGIN,
    AUTH_REGISTER,
    AUTH_LOGOUT,
    TWO_FACTOR_FREE,
    TWO_FACTOR_VERIFY,
    TWO_FACTOR_STRICT,
    USER_ACTION_FREE,

}
