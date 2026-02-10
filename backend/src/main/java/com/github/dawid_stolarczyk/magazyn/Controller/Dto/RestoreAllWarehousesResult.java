package com.github.dawid_stolarczyk.magazyn.Controller.Dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RestoreAllWarehousesResult {
    private List<RestoreResultDto> successful;
    private List<SkippedWarehouse> skipped;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class SkippedWarehouse {
        private Long warehouseId;
        private String warehouseName;
        private String reason;
    }
}
