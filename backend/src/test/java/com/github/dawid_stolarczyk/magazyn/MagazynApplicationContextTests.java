package com.github.dawid_stolarczyk.magazyn;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.mail.javamail.JavaMailSender;


@SpringBootTest
class MagazynApplicationContextTests {
	@Mock
	private JavaMailSender javaMailSender;


	@BeforeEach
	void setUp() {
		MockitoAnnotations.openMocks(this);
	}
	@Test
	void contextLoads() {
	}
}
