package com.github.dawid_stolarczyk.magazyn.Services.Report;

import com.github.dawid_stolarczyk.magazyn.Controller.Dto.Report.ExpiryReportRow;
import com.github.dawid_stolarczyk.magazyn.Controller.Dto.Report.InventoryStockReportRow;
import com.github.dawid_stolarczyk.magazyn.Controller.Dto.Report.TemperatureAlertRackReportRow;
import com.github.dawid_stolarczyk.magazyn.Model.Entity.*;
import com.github.dawid_stolarczyk.magazyn.Repositories.JPA.AssortmentRepository;
import com.github.dawid_stolarczyk.magazyn.Repositories.JPA.RackReportRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.sql.Timestamp;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ReportDataServiceTest {

    @Mock
    private AssortmentRepository assortmentRepository;
    @Mock
    private RackReportRepository rackReportRepository;

    @InjectMocks
    private ReportDataService reportDataService;

    private Warehouse sampleWarehouse;
    private Rack sampleRack;
    private Item sampleItem;
    private Assortment sampleAssortment;

    @BeforeEach
    void setUp() {
        sampleWarehouse = new Warehouse();
        sampleWarehouse.setId(1L);
        sampleWarehouse.setName("Main Warehouse");

        sampleRack = new Rack();
        sampleRack.setId(10L);
        sampleRack.setMarker("A-01-01");
        sampleRack.setWarehouse(sampleWarehouse);
        sampleRack.setMin_temp(-20f);
        sampleRack.setMax_temp(30f);
        sampleRack.setAssortments(new ArrayList<>());

        sampleItem = new Item();
        sampleItem.setId(100L);
        sampleItem.setName("Test Item");
        sampleItem.setCode("0112345678901234");
        sampleItem.setMin_temp(-30f);
        sampleItem.setMax_temp(40f);

        sampleAssortment = Assortment.builder()
                .id(1L)
                .item(sampleItem)
                .rack(sampleRack)
                .code("11020126010000000000123421012345")
                .createdAt(Timestamp.from(Instant.now().minus(30, ChronoUnit.DAYS)))
                .expiresAt(Timestamp.from(Instant.now().plus(5, ChronoUnit.DAYS))) // expires in 5 days
                .positionX(1)
                .positionY(1)
                .build();
    }

    // ========================= collectExpiryData =========================

    @Nested
    @DisplayName("collectExpiryData")
    class CollectExpiryData {

        @Test
        @DisplayName("should_ReturnExpiryRows_When_ExpiringAssortmentsExist")
        void should_ReturnExpiryRows_When_ExpiringAssortmentsExist() {
            when(assortmentRepository.findAllExpiringBefore(any(Timestamp.class), eq(1L)))
                    .thenReturn(List.of(sampleAssortment));

            List<ExpiryReportRow> result = reportDataService.collectExpiryData(1L, 7);

            assertThat(result).hasSize(1);
            assertThat(result.get(0).getItemName()).isEqualTo("Test Item");
            assertThat(result.get(0).getRackMarker()).isEqualTo("A-01-01");
            assertThat(result.get(0).getWarehouseName()).isEqualTo("Main Warehouse");
            assertThat(result.get(0).getQuantity()).isEqualTo(1);
            assertThat(result.get(0).isAlreadyExpired()).isFalse();
        }

        @Test
        @DisplayName("should_GroupByItemAndRack_When_MultipleAssortments")
        void should_GroupByItemAndRack_When_MultipleAssortments() {
            // Same item, same rack, same expiry date → grouped as 1 row with quantity 2
            Assortment second = Assortment.builder()
                    .id(2L)
                    .item(sampleItem)
                    .rack(sampleRack)
                    .code("11020126010000000000123421099999")
                    .createdAt(Timestamp.from(Instant.now().minus(20, ChronoUnit.DAYS)))
                    .expiresAt(sampleAssortment.getExpiresAt()) // same expiry date
                    .positionX(2)
                    .positionY(2)
                    .build();

            when(assortmentRepository.findAllExpiringBefore(any(Timestamp.class), eq(1L)))
                    .thenReturn(List.of(sampleAssortment, second));

            List<ExpiryReportRow> result = reportDataService.collectExpiryData(1L, 7);

            assertThat(result).hasSize(1);
            assertThat(result.get(0).getQuantity()).isEqualTo(2);
        }

        @Test
        @DisplayName("should_ReturnEmptyList_When_NoExpiringAssortments")
        void should_ReturnEmptyList_When_NoExpiringAssortments() {
            when(assortmentRepository.findAllExpiringBefore(any(Timestamp.class), eq(1L)))
                    .thenReturn(Collections.emptyList());

            List<ExpiryReportRow> result = reportDataService.collectExpiryData(1L, 30);

            assertThat(result).isEmpty();
        }
    }

    // ========================= collectInventoryStockData =========================

    @Nested
    @DisplayName("collectInventoryStockData")
    class CollectInventoryStockData {

        @Test
        @DisplayName("should_ReturnStockRows_When_AssortmentsExist")
        void should_ReturnStockRows_When_AssortmentsExist() {
            when(assortmentRepository.findAllForInventoryReport(1L))
                    .thenReturn(List.of(sampleAssortment));

            List<InventoryStockReportRow> result = reportDataService.collectInventoryStockData(1L);

            assertThat(result).hasSize(1);
            assertThat(result.get(0).getWarehouseName()).isEqualTo("Main Warehouse");
            assertThat(result.get(0).getRackMarker()).isEqualTo("A-01-01");
            assertThat(result.get(0).getItemName()).isEqualTo("Test Item");
            assertThat(result.get(0).getQuantity()).isEqualTo(1);
            assertThat(result.get(0).getOldestCreatedAt()).isNotBlank();
            assertThat(result.get(0).getNearestExpiresAt()).isNotBlank();
        }

        @Test
        @DisplayName("should_ReturnEmptyList_When_NoAssortments")
        void should_ReturnEmptyList_When_NoAssortments() {
            when(assortmentRepository.findAllForInventoryReport(1L))
                    .thenReturn(Collections.emptyList());

            List<InventoryStockReportRow> result = reportDataService.collectInventoryStockData(1L);

            assertThat(result).isEmpty();
        }
    }

    // ========================= collectTemperatureAlertRacksData
    // =========================

    @Nested
    @DisplayName("collectTemperatureAlertRacksData")
    class CollectTemperatureAlertRacksData {

        @Test
        @DisplayName("should_ReturnTempAlertRows_When_AlertsExist")
        void should_ReturnTempAlertRows_When_AlertsExist() {
            RackReport report = new RackReport();
            report.setId(1L);
            report.setRack(sampleRack);
            report.setCurrentTemperature(35f); // exceeds max 30
            report.setCreatedAt(Instant.now());
            report.setSensorId("SENSOR-001");

            when(rackReportRepository.findAlertTriggeredReports(eq(1L), any(Instant.class), any(Instant.class)))
                    .thenReturn(List.of(report));

            Instant start = Instant.now().minus(1, ChronoUnit.DAYS);
            Instant end = Instant.now();

            List<TemperatureAlertRackReportRow> result = reportDataService.collectTemperatureAlertRacksData(1L, start,
                    end);

            assertThat(result).hasSize(1);
            assertThat(result.get(0).getRecordedTemperature()).isEqualTo(35f);
            assertThat(result.get(0).getAllowedMax()).isEqualTo(30f);
            assertThat(result.get(0).getViolationType()).isEqualTo("Za wysoka temperatura");
            assertThat(result.get(0).getSensorId()).isEqualTo("SENSOR-001");
        }

        @Test
        @DisplayName("should_IdentifyLowTemperature_When_BelowMin")
        void should_IdentifyLowTemperature_When_BelowMin() {
            RackReport report = new RackReport();
            report.setId(2L);
            report.setRack(sampleRack);
            report.setCurrentTemperature(-25f); // below min -20
            report.setCreatedAt(Instant.now());
            report.setSensorId("SENSOR-002");

            when(rackReportRepository.findAlertTriggeredReports(eq(1L), any(Instant.class), any(Instant.class)))
                    .thenReturn(List.of(report));

            List<TemperatureAlertRackReportRow> result = reportDataService.collectTemperatureAlertRacksData(
                    1L, Instant.now().minus(1, ChronoUnit.DAYS), Instant.now());

            assertThat(result).hasSize(1);
            assertThat(result.get(0).getViolationType()).isEqualTo("Za niska temperatura");
        }
    }
}
