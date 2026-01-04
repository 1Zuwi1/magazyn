package com.github.dawid_stolarczyk.magazyn;

import com.github.dawid_stolarczyk.magazyn.Controller.Dto.ResponseTemplate;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

class MagazynApplicationTests {

	@Test
	void responseTemplateStoresPayloadAndSuccessFlag() {
		ResponseTemplate<String> response = new ResponseTemplate<>(true, "ok");

		assertTrue(response.isSuccess());
		assertEquals("ok", response.getData());

		response.setSuccess(false);
		response.setData("42");

		assertFalse(response.isSuccess());
		assertEquals("42", response.getData());
	}

}
