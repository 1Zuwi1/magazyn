package com.github.dawid_stolarczyk.magazyn.Services.Storage;

import java.io.InputStream;

public interface StorageService {
    void uploadStream(String fileName, InputStream inputStream, String contentType) throws Exception;
    InputStream download(String fileName) throws Exception;
    void delete(String fileName) throws Exception;
}
