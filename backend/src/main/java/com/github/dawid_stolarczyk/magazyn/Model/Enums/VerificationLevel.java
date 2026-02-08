package com.github.dawid_stolarczyk.magazyn.Model.Enums;

/**
 * Hierarchical verification levels for user access control.
 * Higher ordinal = higher privileges.
 */
public enum VerificationLevel {
    /**
     * Public endpoints accessible without authentication.
     */
    PUBLIC,

    /**
     * User is verified by admin (ACTIVE) but 2FA not configured.
     * Can access 2FA setup endpoints.
     */
    VERIFIED_NO_2FA,

    /**
     * user is not verified by admin yet (PENDING_VERIFICATION) but authenticated.
     */
    AUTHENTICATED_UNVERIFIED, // Not verified by admin yet
    /**
     * User is fully verified (ACTIVE + 2FA VERIFIED).
     * Full access to all endpoints.
     */
    FULLY_VERIFIED;

    /**
     * Check if this level satisfies the required level.
     * Uses ordinal comparison - higher ordinal = higher privilege.
     */
    public boolean satisfies(VerificationLevel required) {
        return this.ordinal() >= required.ordinal();
    }
}
