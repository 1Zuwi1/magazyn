package com.github.dawid_stolarczyk.magazyn.Model.Enums;

/**
 * Confidence level tiers for visual identification results.
 */
public enum ConfidenceLevel {
    /**
     * Score >= high threshold (default 0.9). Single best match returned.
     */
    HIGH_CONFIDENCE,

    /**
     * Score between low and high thresholds (default 0.7-0.9).
     * Single best match returned, but manual verification is recommended.
     */
    NEEDS_VERIFICATION,

    /**
     * Score below low threshold (default 0.7).
     * Top-K candidates returned for user selection.
     */
    LOW_CONFIDENCE
}
