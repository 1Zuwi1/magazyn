package com.github.dawid_stolarczyk.magazyn.Model.Entities;

public class EncryptionError extends RuntimeException {
  public EncryptionError(String message) {
    super(message);
  }

  public EncryptionError(String message, Throwable cause) {
    super(message, cause);
  }
}
