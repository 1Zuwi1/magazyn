package com.github.dawid_stolarczyk.magazyn.Exceptions;

public class ReportException extends RuntimeException {
    private final ReportError error;

    public ReportException(ReportError error) {
        super(error.getCode());
        this.error = error;
    }

    public ReportException(ReportError error, String message) {
        super(error.getCode() + ": " + message);
        this.error = error;
    }

    public ReportException(ReportError error, Throwable cause) {
        super(error.getCode(), cause);
        this.error = error;
    }

    public ReportException(ReportError error, String message, Throwable cause) {
        super(error.getCode() + ": " + message, cause);
        this.error = error;
    }

    public ReportError getError() {
        return error;
    }

    public String getCode() {
        return error.getCode();
    }
}
