package com.github.dawid_stolarczyk.magazyn;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

import java.util.TimeZone;

@SpringBootApplication
public class MagazynApplication {

	public static void main(String[] args) {
		TimeZone.setDefault(TimeZone.getTimeZone("Europe/Warsaw"));
		SpringApplication.run(MagazynApplication.class, args);
	}

}
