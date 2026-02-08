package com.github.dawid_stolarczyk.magazyn.Common;

/**
 * Central configuration constants for the application.
 * This class holds various configuration values used throughout the codebase.
 */
public final class ConfigurationConstants {

    private ConfigurationConstants() {
        throw new UnsupportedOperationException("This is a utility class and cannot be instantiated");
    }

    /**
     * Maximum page size for paginated endpoints.
     * Used to prevent excessive data retrieval in a single request.
     */
    public static final int MAX_PAGE_SIZE = 100;

    /**
     * Default page size for paginated endpoints when not specified.
     */
    public static final int DEFAULT_PAGE_SIZE = 20;
}
