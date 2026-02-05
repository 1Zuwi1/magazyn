package com.github.dawid_stolarczyk.magazyn.Common.Converter;

import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

/**
 * JPA AttributeConverter for converting between float[] and PostgreSQL vector type.
 * This converter handles the serialization/deserialization of embedding vectors.
 * Works with both PostgreSQL (using pgvector) and H2 (using string representation).
 */
@Converter
public class VectorConverter implements AttributeConverter<float[], Object> {

    @Override
    public String convertToDatabaseColumn(float[] attribute) {
        if (attribute == null) {
            return null;
        }
        // Convert to PostgreSQL vector string format for native query compatibility
        StringBuilder sb = new StringBuilder("[");
        for (int i = 0; i < attribute.length; i++) {
            sb.append(attribute[i]);
            if (i < attribute.length - 1) {
                sb.append(",");
            }
        }
        sb.append("]");
        return sb.toString();
    }

    @Override
    public float[] convertToEntityAttribute(Object dbData) {
        if (dbData == null || ((String) dbData).isEmpty()) {
            return null;
        }

        String str;
        str = (String) dbData;

        // Handle string representation like "[0.1,0.2,0.3]"
        str = str.trim();
        if (str.startsWith("[") && str.endsWith("]")) {
            str = str.substring(1, str.length() - 1);
            if (str.isEmpty()) {
                return new float[0];
            }
            String[] parts = str.split(",");
            float[] result = new float[parts.length];
            for (int i = 0; i < parts.length; i++) {
                result[i] = Float.parseFloat(parts[i].trim());
            }
            return result;
        }

        throw new IllegalArgumentException("Cannot convert '" + str + "' to float[]");
    }


}
