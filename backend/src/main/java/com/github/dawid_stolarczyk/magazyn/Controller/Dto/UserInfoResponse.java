package com.github.dawid_stolarczyk.magazyn.Controller.Dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.Getter;
import lombok.Setter;

@JsonInclude(JsonInclude.Include.NON_NULL)
@Getter
@Setter
public class UserInfoResponse {
    private int id;
    private String full_name;
    private String email;
    private String role;
    private String account_status;

    public UserInfoResponse() {
    }

    public UserInfoResponse(int id, String full_name, String email, String role, String account_status) {
        this.id = id;
        this.full_name = full_name;
        this.email = email;
        this.role = role;
        this.account_status = account_status;
    }

}
