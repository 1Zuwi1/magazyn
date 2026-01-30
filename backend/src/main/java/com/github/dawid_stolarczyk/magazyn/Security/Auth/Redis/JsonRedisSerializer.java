package com.github.dawid_stolarczyk.magazyn.Security.Auth.Redis;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.data.redis.serializer.RedisSerializer;
import org.springframework.data.redis.serializer.SerializationException;

public class JsonRedisSerializer<T> implements RedisSerializer<T> {

    private final ObjectMapper objectMapper;
    private final Class<T> type;

    public JsonRedisSerializer(Class<T> type, ObjectMapper objectMapper) {
        this.type = type;
        this.objectMapper = objectMapper;
    }

    @Override
    public byte[] serialize(T value) throws SerializationException {
        if (value == null) return new byte[0];
        try {
            return objectMapper.writeValueAsBytes(value);
        } catch (Exception e) {
            throw new SerializationException("Redis serialization error", e);
        }
    }

    @Override
    public T deserialize(byte[] bytes) throws SerializationException {
        if (bytes == null || bytes.length == 0) return null;
        try {
            return objectMapper.readValue(bytes, type);
        } catch (Exception e) {
            throw new SerializationException("Redis deserialization error", e);
        }
    }
}
