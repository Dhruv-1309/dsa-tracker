package com.example.demo;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

import java.io.BufferedReader;
import java.io.File;
import java.io.FileReader;
import java.io.IOException;
import java.util.TimeZone;

@SpringBootApplication
public class DemoApplication {

	static {
		loadDotenv();
		normalizeDatabaseEnv();
	}

	public static void main(String[] args) {
		TimeZone.setDefault(TimeZone.getTimeZone("UTC"));
		SpringApplication.run(DemoApplication.class, args);
	}

	public static void normalizeDatabaseEnv() {
		String dbUrl = getEnvOrProperty("DATABASE_URL");
		if (dbUrl == null || dbUrl.isBlank()) {
			dbUrl = getEnvOrProperty("SPRING_DATASOURCE_URL");
		}

		if (dbUrl != null && !dbUrl.isBlank()) {
			String cleanUrl = dbUrl.trim();
			if ((cleanUrl.startsWith("\"") && cleanUrl.endsWith("\"")) ||
			    (cleanUrl.startsWith("'") && cleanUrl.endsWith("'"))) {
				cleanUrl = cleanUrl.substring(1, cleanUrl.length() - 1);
			}

			if (cleanUrl.startsWith("postgres://") || cleanUrl.startsWith("postgresql://")) {
				try {
					String uriString = cleanUrl.startsWith("postgres://")
							? "http://" + cleanUrl.substring("postgres://".length())
							: "http://" + cleanUrl.substring("postgresql://".length());
					java.net.URI uri = new java.net.URI(uriString);
					String userInfo = uri.getUserInfo();
					if (userInfo != null && !userInfo.isEmpty()) {
						String[] parts = userInfo.split(":", 2);
						if (parts.length > 0 && !parts[0].isEmpty() && getEnvOrProperty("SPRING_DATASOURCE_USERNAME") == null) {
							System.setProperty("SPRING_DATASOURCE_USERNAME", java.net.URLDecoder.decode(parts[0], java.nio.charset.StandardCharsets.UTF_8));
						}
						if (parts.length > 1 && !parts[1].isEmpty() && getEnvOrProperty("SPRING_DATASOURCE_PASSWORD") == null) {
							System.setProperty("SPRING_DATASOURCE_PASSWORD", java.net.URLDecoder.decode(parts[1], java.nio.charset.StandardCharsets.UTF_8));
						}
					}
					String host = uri.getHost();
					int port = uri.getPort() == -1 ? 5432 : uri.getPort();
					String path = uri.getPath();
					String jdbcUrl = "jdbc:postgresql://" + host + ":" + port + path;
					if (uri.getQuery() != null && !uri.getQuery().isEmpty()) {
						jdbcUrl += "?" + uri.getQuery();
					}
					System.setProperty("SPRING_DATASOURCE_URL", jdbcUrl);
				} catch (Exception ignored) {
				}
			} else if (cleanUrl.startsWith("jdbc:postgresql://")) {
				try {
					String withoutPrefix = cleanUrl.substring("jdbc:postgresql://".length());
					if (withoutPrefix.contains("@")) {
						int atIdx = withoutPrefix.indexOf('@');
						String userPass = withoutPrefix.substring(0, atIdx);
						String rest = withoutPrefix.substring(atIdx + 1);
						String[] parts = userPass.split(":", 2);
						if (parts.length > 0 && !parts[0].isEmpty() && getEnvOrProperty("SPRING_DATASOURCE_USERNAME") == null) {
							System.setProperty("SPRING_DATASOURCE_USERNAME", java.net.URLDecoder.decode(parts[0], java.nio.charset.StandardCharsets.UTF_8));
						}
						if (parts.length > 1 && !parts[1].isEmpty() && getEnvOrProperty("SPRING_DATASOURCE_PASSWORD") == null) {
							System.setProperty("SPRING_DATASOURCE_PASSWORD", java.net.URLDecoder.decode(parts[1], java.nio.charset.StandardCharsets.UTF_8));
						}
						System.setProperty("SPRING_DATASOURCE_URL", "jdbc:postgresql://" + rest);
					}
				} catch (Exception ignored) {
				}
			}
		}
	}

	private static String getEnvOrProperty(String key) {
		String val = System.getenv(key);
		if (val == null || val.isBlank()) {
			val = System.getProperty(key);
		}
		return (val == null || val.isBlank()) ? null : val;
	}

	public static void loadDotenv() {
		File[] candidates = new File[] {
			new File(".env"),
			new File("../.env"),
			new File("backend/.env")
		};

		for (File envFile : candidates) {
			if (envFile.exists() && envFile.isFile()) {
				try (BufferedReader reader = new BufferedReader(new FileReader(envFile))) {
					String line;
					while ((line = reader.readLine()) != null) {
						line = line.trim();
						if (line.isEmpty() || line.startsWith("#")) {
							continue;
						}
						int eqIdx = line.indexOf('=');
						if (eqIdx > 0) {
							String key = line.substring(0, eqIdx).trim();
							String value = line.substring(eqIdx + 1).trim();
							if ((value.startsWith("\"") && value.endsWith("\"")) ||
							    (value.startsWith("'") && value.endsWith("'"))) {
								if (value.length() >= 2) {
									value = value.substring(1, value.length() - 1);
								}
							}
							if (System.getProperty(key) == null && System.getenv(key) == null) {
								System.setProperty(key, value);
							}
						}
					}
				} catch (IOException ignored) {
				}
				break;
			}
		}
	}

}

