package com.github.dawid_stolarczyk.magazyn;

import com.github.dawid_stolarczyk.magazyn.Controller.Dto.ResponseTemplate;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

class MagazynApplicationTests {

    @Test
    void responseTemplateStoresPayloadAndSuccessFlag() {
        ResponseTemplate<String> response = ResponseTemplate.success("ok");

        assertTrue(response.isSuccess());
        assertEquals("ok", response.getData());
        assertNull(response.getMessage());

        ResponseTemplate<String> error = ResponseTemplate.error("ERROR_CODE");

        assertFalse(error.isSuccess());
        assertEquals("ERROR_CODE", error.getMessage());
        assertNull(error.getData());
    }

}
