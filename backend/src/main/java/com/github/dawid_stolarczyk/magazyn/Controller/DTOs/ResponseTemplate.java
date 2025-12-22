package com.github.dawid_stolarczyk.magazyn.Controller.DTOs;

public class ResponseTemplate {
    private boolean success;
    private Object data;

    public ResponseTemplate(boolean success, Object data) {
        this.success = success;
        this.data = data;
    }

    public boolean isSuccess() {
        return success;
    }

    public void setSuccess(boolean success) {
        this.success = success;
    }

    public Object getData() {
        return data;
    }

    public void setData(Object data) {
        this.data = data;
    }
}
