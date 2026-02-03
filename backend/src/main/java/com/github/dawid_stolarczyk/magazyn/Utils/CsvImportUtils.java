package com.github.dawid_stolarczyk.magazyn.Utils;

import org.springframework.web.multipart.MultipartFile;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

public final class CsvImportUtils {
    private CsvImportUtils() {
    }

    public static List<CsvRow> readRows(MultipartFile file) throws IOException {
        List<CsvRow> rows = new ArrayList<>();
        try (BufferedReader reader = new BufferedReader(
                new InputStreamReader(file.getInputStream(), StandardCharsets.UTF_8))) {
            String line;
            int lineNumber = 0;
            while ((line = reader.readLine()) != null) {
                lineNumber++;
                String trimmed = line.trim();
                if (trimmed.isEmpty() || trimmed.startsWith("#")) {
                    continue;
                }
                rows.add(new CsvRow(lineNumber, line, parseCsvLine(line)));
            }
        }
        return rows;
    }

    public static Map<String, Integer> buildHeaderIndex(String[] columns) {
        Map<String, Integer> index = new HashMap<>();
        for (int i = 0; i < columns.length; i++) {
            String key = normalize(columns[i]);
            if (key.isEmpty()) {
                throw new IllegalArgumentException("EMPTY_COLUMN_NAME");
            }
            if (index.putIfAbsent(key, i) != null) {
                throw new IllegalArgumentException("DUPLICATE_COLUMN " + key);
            }
        }
        return index;
    }

    public static String normalize(String value) {
        // Zachowujemy oryginalną wielkość liter dla zgodności z formatem
        // (Oznaczenie, TempMin, CzyNiebezpieczny itp.)
        return value == null ? "" : value.trim();
    }

    public static String[] parseCsvLine(String line) {
        List<String> tokens = new ArrayList<>();
        StringBuilder current = new StringBuilder();
        boolean inQuotes = false;

        for (int i = 0; i < line.length(); i++) {
            char c = line.charAt(i);
            if (c == '"') {
                if (inQuotes && i + 1 < line.length() && line.charAt(i + 1) == '"') {
                    // Escaped quote: "" -> "
                    current.append('"');
                    i++;
                } else {
                    inQuotes = !inQuotes;
                }
                continue;
            }
            // Zmiana separatora z ',' na ';'
            if (c == ';' && !inQuotes) {
                tokens.add(current.toString());
                current.setLength(0);
                continue;
            }
            current.append(c);
        }
        tokens.add(current.toString());

        return tokens.toArray(new String[0]);
    }

    public record CsvRow(int lineNumber, String rawLine, String[] columns) {
    }
}
