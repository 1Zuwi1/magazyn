package com.github.dawid_stolarczyk.magazyn.Services.Backup;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.github.dawid_stolarczyk.magazyn.Controller.Dto.*;
import com.github.dawid_stolarczyk.magazyn.Crypto.FileCryptoService;
import com.github.dawid_stolarczyk.magazyn.Model.Entity.*;
import com.github.dawid_stolarczyk.magazyn.Model.Enums.*;
import com.github.dawid_stolarczyk.magazyn.Repositories.JPA.*;
import com.github.dawid_stolarczyk.magazyn.Scheduler.BackupSchedulerManager;
import com.github.dawid_stolarczyk.magazyn.Services.Ratelimiter.Bucket4jRateLimiter;
import com.github.dawid_stolarczyk.magazyn.Services.Ratelimiter.RateLimitOperation;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.Setter;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.context.annotation.Lazy;
import org.springframework.core.task.AsyncTaskExecutor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.sql.Timestamp;
import java.time.Instant;
import java.time.ZoneOffset;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.atomic.AtomicBoolean;


@Service
@RequiredArgsConstructor
@Slf4j
public class BackupService {

    private final BackupRecordRepository backupRecordRepository;
    private final BackupScheduleRepository backupScheduleRepository;
    private final WarehouseRepository warehouseRepository;
    private final RackRepository rackRepository;
    private final ItemRepository itemRepository;
    private final AssortmentRepository assortmentRepository;
    private final InboundOperationRepository inboundOperationRepository;
    private final BackupStorageService backupStorageService;
    private final FileCryptoService fileCryptoService;
    @org.springframework.beans.factory.annotation.Qualifier("backupObjectMapper")
    private final ObjectMapper objectMapper;
    private final Bucket4jRateLimiter rateLimiter;
    private final AsyncTaskExecutor asyncTaskExecutor;
    private final AlertRepository alertRepository;
    private final UserRepository userRepository;
    private final UserNotificationRepository userNotificationRepository;

    @Qualifier("backupStreamingExecutor")
    private final ExecutorService streamingExecutor;

    @Setter(onMethod_ = {@Autowired, @Lazy})
    private BackupSchedulerManager backupSchedulerManager;

    private final ConcurrentHashMap<Long, AtomicBoolean> warehouseLocks = new ConcurrentHashMap<>();

    private static final DateTimeFormatter TIMESTAMP_FORMAT = DateTimeFormatter
            .ofPattern("yyyyMMdd'T'HHmmss")
            .withZone(ZoneOffset.UTC);

    // --- Internal backup data records ---

    @JsonIgnoreProperties(ignoreUnknown = true)
    private record RackBackupData(Long originalId, String marker, String comment, int sizeX, int sizeY,
                                  float maxTemp, float minTemp, float maxWeight,
                                  float maxSizeX, float maxSizeY, float maxSizeZ,
                                  boolean acceptsDangerous) {
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    private record ItemBackupData(Long originalId, String name, String code, String photoUrl, String qrCode,
                                  float minTemp, float maxTemp, float weight,
                                  float sizeX, float sizeY, float sizeZ,
                                  String comment, Long expireAfterDays, boolean isDangerous) {
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    private record AssortmentBackupData(Long originalId, String code, Long originalItemId, Long originalRackId,
                                        Timestamp createdAt, Timestamp expiresAt,
                                        Integer positionX, Integer positionY) {
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    private record BackupManifest(Long backupId, Long warehouseId, String warehouseName, Instant createdAt,
                                  int schemaVersion, Map<String, ResourceInfo> resources) {
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    private record ResourceInfo(int count) {
    }

    // --- Backup operations ---

    @Transactional(rollbackFor = Exception.class)
    public BackupRecordDto initiateBackup(CreateBackupRequest request, User triggeredBy, HttpServletRequest httpRequest) {
        rateLimiter.consumeOrThrow(httpRequest.getRemoteAddr(), RateLimitOperation.BACKUP_WRITE);

        Warehouse warehouse = warehouseRepository.findById(request.getWarehouseId())
                .orElseThrow(() -> new IllegalArgumentException("WAREHOUSE_NOT_FOUND"));

        if (backupRecordRepository.existsByWarehouseIdAndStatus(warehouse.getId(), BackupStatus.IN_PROGRESS)) {
            throw new IllegalStateException("BACKUP_ALREADY_IN_PROGRESS");
        }

        AtomicBoolean lock = warehouseLocks.computeIfAbsent(warehouse.getId(), k -> new AtomicBoolean(false));
        if (!lock.compareAndSet(false, true)) {
            throw new IllegalStateException("BACKUP_ALREADY_IN_PROGRESS");
        }

        BackupRecord record = BackupRecord.builder()
                .warehouse(warehouse)
                .backupType(BackupType.MANUAL)
                .status(BackupStatus.IN_PROGRESS)
                .triggeredBy(triggeredBy)
                .build();
        record.setResourceTypeSet(request.getResourceTypes());
        record = backupRecordRepository.save(record);

        Long recordId = record.getId();
        asyncTaskExecutor.submit(() -> executeBackup(recordId));

        return toDto(record);
    }

    @Transactional(rollbackFor = Exception.class)
    public BackupRecordDto initiateScheduledBackup(Long warehouseId, Set<BackupResourceType> resourceTypes) {
        Warehouse warehouse = warehouseRepository.findById(warehouseId)
                .orElseThrow(() -> new IllegalArgumentException("WAREHOUSE_NOT_FOUND"));

        if (backupRecordRepository.existsByWarehouseIdAndStatus(warehouse.getId(), BackupStatus.IN_PROGRESS)) {
            log.info("Skipping scheduled backup for warehouse {} - backup already in progress", warehouseId);
            return null;
        }

        AtomicBoolean lock = warehouseLocks.computeIfAbsent(warehouse.getId(), k -> new AtomicBoolean(false));
        if (!lock.compareAndSet(false, true)) {
            log.info("Skipping scheduled backup for warehouse {} - lock already held", warehouseId);
            return null;
        }

        BackupRecord record = BackupRecord.builder()
                .warehouse(warehouse)
                .backupType(BackupType.SCHEDULED)
                .status(BackupStatus.IN_PROGRESS)
                .build();
        record.setResourceTypeSet(resourceTypes);
        record = backupRecordRepository.save(record);

        Long recordId = record.getId();
        asyncTaskExecutor.submit(() -> executeBackup(recordId));

        return toDto(record);
    }

    private void executeBackup(Long recordId) {
        BackupRecord record = backupRecordRepository.findById(recordId).orElse(null);
        if (record == null) return;

        Long warehouseId = record.getWarehouse().getId();
        Warehouse warehouse = warehouseRepository.findById(warehouseId)
                .orElseThrow(() -> new IllegalStateException("WAREHOUSE_NOT_FOUND_FOR_BACKUP"));
        String warehouseName = warehouse.getName();

        StreamingBackupWriter writer = new StreamingBackupWriter(objectMapper, fileCryptoService, backupStorageService, streamingExecutor);

        try {
            String timestamp = TIMESTAMP_FORMAT.format(record.getCreatedAt());
            String basePath = "backups/warehouse-" + warehouseId + "/" + timestamp + "_" + recordId + "/";
            record.setR2BasePath(basePath);

            Set<BackupResourceType> resourceTypes = record.getResourceTypeSet();
            Map<String, ResourceInfo> manifestResources = new LinkedHashMap<>();
            int totalRecords = 0;
            long totalSizeBytes = 0;

            if (resourceTypes.contains(BackupResourceType.RACKS)) {
                List<Rack> racks = rackRepository.findByWarehouseId(warehouseId);
                log.info("Backup {} — found {} racks for warehouse {}", recordId, racks.size(), warehouseId);
                List<RackBackupData> rackData = racks.stream()
                        .map(r -> new RackBackupData(r.getId(), r.getMarker(), r.getComment(),
                                r.getSize_x(), r.getSize_y(), r.getMax_temp(), r.getMin_temp(),
                                r.getMax_weight(), r.getMax_size_x(), r.getMax_size_y(), r.getMax_size_z(),
                                r.isAcceptsDangerous()))
                        .toList();

                long bytesWritten = writer.writeAndUpload(basePath, "racks.enc", rackData);
                manifestResources.put("racks", new ResourceInfo(rackData.size()));
                totalRecords += rackData.size();
                totalSizeBytes += bytesWritten;
            }

            if (resourceTypes.contains(BackupResourceType.ITEMS)) {
                List<Item> items = itemRepository.findDistinctByWarehouseId(warehouseId);
                log.info("Backup {} — found {} items for warehouse {}", recordId, items.size(), warehouseId);

                List<ItemBackupData> itemData = items.stream()
                        .map(i -> new ItemBackupData(i.getId(), i.getName(), i.getCode(), i.getPhoto_url(), i.getQrCode(),
                                i.getMin_temp(), i.getMax_temp(), i.getWeight(),
                                i.getSize_x(), i.getSize_y(), i.getSize_z(),
                                i.getComment(), i.getExpireAfterDays(), i.isDangerous()))
                        .toList();

                long bytesWritten = writer.writeAndUpload(basePath, "items.enc", itemData);
                manifestResources.put("items", new ResourceInfo(itemData.size()));
                totalRecords += itemData.size();
                totalSizeBytes += bytesWritten;
            }

            if (resourceTypes.contains(BackupResourceType.ASSORTMENTS)) {
                List<Assortment> assortments = assortmentRepository.findByRack_WarehouseId(warehouseId, Pageable.unpaged()).getContent();
                log.info("Backup {} — found {} assortments for warehouse {}", recordId, assortments.size(), warehouseId);
                List<AssortmentBackupData> assortmentData = assortments.stream()
                        .map(a -> new AssortmentBackupData(a.getId(), a.getCode(),
                                a.getItem().getId(), a.getRack().getId(),
                                a.getCreatedAt(), a.getExpiresAt(),
                                a.getPositionX(), a.getPositionY()))
                        .toList();

                long bytesWritten = writer.writeAndUpload(basePath, "assortments.enc", assortmentData);
                manifestResources.put("assortments", new ResourceInfo(assortmentData.size()));
                totalRecords += assortmentData.size();
                totalSizeBytes += bytesWritten;
            }

            // Build and upload manifest
            BackupManifest manifest = new BackupManifest(recordId, warehouseId,
                    warehouseName, record.getCreatedAt(), 1, manifestResources);
            long manifestBytes = writer.writeAndUpload(basePath, "manifest.enc", manifest);
            totalSizeBytes += manifestBytes;

            record.setStatus(BackupStatus.COMPLETED);
            record.setTotalRecords(totalRecords);
            record.setSizeBytes(totalSizeBytes);
            record.setCompletedAt(Instant.now());
            backupRecordRepository.save(record);

            log.info("Backup {} completed for warehouse {} — {} records, {} bytes",
                    recordId, warehouseId, totalRecords, totalSizeBytes);

            createBackupAlert(warehouse, record, true);

        } catch (Exception e) {
            log.error("Backup {} failed for warehouse {}", recordId, warehouseId, e);
            record.setStatus(BackupStatus.FAILED);
            record.setErrorMessage(e.getMessage() != null ? e.getMessage().substring(0, Math.min(e.getMessage().length(), 2000)) : "Unknown error");
            record.setCompletedAt(Instant.now());
            backupRecordRepository.save(record);

            createBackupAlert(warehouse, record, false);

            // Best-effort R2 cleanup
            if (record.getR2BasePath() != null) {
                backupStorageService.deleteBackup(record.getR2BasePath());
            }
        } finally {
            AtomicBoolean lock = warehouseLocks.get(warehouseId);
            if (lock != null) {
                lock.set(false);
            }
        }
    }

    // --- Restore ---

    @Transactional(rollbackFor = Exception.class)
    public RestoreResultDto restoreBackup(Long backupId) {
        BackupRecord record = backupRecordRepository.findById(backupId)
                .orElseThrow(() -> new IllegalArgumentException("BACKUP_NOT_FOUND"));

        if (record.getStatus() != BackupStatus.COMPLETED) {
            throw new IllegalStateException("BACKUP_NOT_COMPLETED");
        }

        StreamingBackupReader reader = new StreamingBackupReader(objectMapper, fileCryptoService, backupStorageService, streamingExecutor);

        try {
            String basePath = record.getR2BasePath();

            // Phase 1 — Download + decrypt manifest (GCM verifies integrity automatically)
            // Read as JsonNode to handle legacy backups that contain @class type metadata
            JsonNode manifestNode = reader.downloadAndRead(basePath, "manifest.enc", JsonNode.class);
            JsonNode resourcesNode = manifestNode.get("resources");
            Set<String> resourceKeys = new HashSet<>();
            if (resourcesNode != null) {
                resourcesNode.fieldNames().forEachRemaining(key -> {
                    if (!key.equals("@class")) resourceKeys.add(key);
                });
            }

            // Phase 2 — Download + decrypt all resource files (GCM verifies integrity)
            List<RackBackupData> rackDataList = null;
            List<ItemBackupData> itemDataList = null;
            List<AssortmentBackupData> assortmentDataList = null;

            if (resourceKeys.contains("racks")) {
                rackDataList = reader.downloadAndRead(basePath, "racks.enc", new TypeReference<List<RackBackupData>>() {
                });
            }

            if (resourceKeys.contains("items")) {
                itemDataList = reader.downloadAndRead(basePath, "items.enc", new TypeReference<List<ItemBackupData>>() {
                });
            }

            if (resourceKeys.contains("assortments")) {
                assortmentDataList = reader.downloadAndRead(basePath, "assortments.enc", new TypeReference<List<AssortmentBackupData>>() {
                });
            }

            // Phase 3 — Atomic DB restore
            Long warehouseId = record.getWarehouse().getId();
            int racksRestored = 0;
            int itemsRestored = 0;
            int assortmentsRestored = 0;

            // Clean assortments: null InboundOperation FK, then delete all warehouse assortments
            List<Assortment> existingAssortments = assortmentRepository.findByRack_WarehouseId(warehouseId, Pageable.unpaged()).getContent();
            assortmentRepository.deleteAll(existingAssortments);

            // Restore racks
            Map<Long, Long> rackIdMapping = new HashMap<>();
            if (rackDataList != null) {
                Warehouse warehouse = record.getWarehouse();
                for (RackBackupData rd : rackDataList) {
                    Optional<Rack> existingRack = rackRepository.findByWarehouseIdAndMarker(warehouseId, rd.marker());
                    Rack rack;
                    if (existingRack.isPresent()) {
                        rack = existingRack.get();
                    } else {
                        rack = new Rack();
                        rack.setWarehouse(warehouse);
                        rack.setMarker(rd.marker());
                    }
                    rack.setComment(rd.comment());
                    rack.setSize_x(rd.sizeX());
                    rack.setSize_y(rd.sizeY());
                    rack.setMax_temp(rd.maxTemp());
                    rack.setMin_temp(rd.minTemp());
                    rack.setMax_weight(rd.maxWeight());
                    rack.setMax_size_x(rd.maxSizeX());
                    rack.setMax_size_y(rd.maxSizeY());
                    rack.setMax_size_z(rd.maxSizeZ());
                    rack.setAcceptsDangerous(rd.acceptsDangerous());
                    rack = rackRepository.save(rack);
                    rackIdMapping.put(rd.originalId(), rack.getId());
                    racksRestored++;
                }
            }

            // Restore items (global, not warehouse-scoped)
            Map<Long, Long> itemIdMapping = new HashMap<>();
            if (itemDataList != null) {
                for (ItemBackupData id : itemDataList) {
                    Optional<Item> existingItem = itemRepository.findByCode(id.code());
                    Item item;
                    if (existingItem.isPresent()) {
                        item = existingItem.get();
                    } else {
                        item = new Item();
                        item.setCode(id.code());
                    }
                    item.setName(id.name());
                    item.setPhoto_url(id.photoUrl());
                    item.setQrCode(id.qrCode());
                    item.setMin_temp(id.minTemp());
                    item.setMax_temp(id.maxTemp());
                    item.setWeight(id.weight());
                    item.setSize_x(id.sizeX());
                    item.setSize_y(id.sizeY());
                    item.setSize_z(id.sizeZ());
                    item.setComment(id.comment());
                    item.setExpireAfterDays(id.expireAfterDays());
                    item.setDangerous(id.isDangerous());
                    item = itemRepository.save(item);
                    itemIdMapping.put(id.originalId(), item.getId());
                    itemsRestored++;
                }
            }

            // Restore assortments
            if (assortmentDataList != null) {
                for (AssortmentBackupData ad : assortmentDataList) {
                    Long newRackId = rackIdMapping.getOrDefault(ad.originalRackId(), ad.originalRackId());
                    Long newItemId = itemIdMapping.getOrDefault(ad.originalItemId(), ad.originalItemId());

                    Rack rack = rackRepository.findById(newRackId)
                            .orElseThrow(() -> new IllegalStateException("RACK_NOT_FOUND_DURING_RESTORE"));
                    Item item = itemRepository.findById(newItemId)
                            .orElseThrow(() -> new IllegalStateException("ITEM_NOT_FOUND_DURING_RESTORE"));

                    Assortment assortment = Assortment.builder()
                            .code(ad.code())
                            .item(item)
                            .rack(rack)
                            .createdAt(ad.createdAt())
                            .expiresAt(ad.expiresAt())
                            .positionX(ad.positionX())
                            .positionY(ad.positionY())
                            .build();
                    assortmentRepository.save(assortment);
                    assortmentsRestored++;
                }
            }

            return RestoreResultDto.builder()
                    .backupId(backupId)
                    .warehouseId(warehouseId)
                    .racksRestored(racksRestored)
                    .itemsRestored(itemsRestored)
                    .assortmentsRestored(assortmentsRestored)
                    .restoredAt(Instant.now())
                    .build();

        } catch (SecurityException | IllegalStateException e) {
            throw e;
        } catch (Exception e) {
            throw new RuntimeException("RESTORE_FAILED: " + e.getMessage(), e);
        }
    }

    // --- CRUD ---

    @Transactional(readOnly = true)
    public BackupRecordDto getBackup(Long id, HttpServletRequest httpRequest) {
        rateLimiter.consumeOrThrow(httpRequest.getRemoteAddr(), RateLimitOperation.BACKUP_READ);
        BackupRecord record = backupRecordRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("BACKUP_NOT_FOUND"));
        return toDto(record);
    }

    @Transactional(readOnly = true)
    public PagedResponse<BackupRecordDto> getBackups(Long warehouseId, Pageable pageable, HttpServletRequest httpRequest) {
        rateLimiter.consumeOrThrow(httpRequest.getRemoteAddr(), RateLimitOperation.BACKUP_READ);

        Page<BackupRecord> page;
        if (warehouseId != null) {
            page = backupRecordRepository.findByWarehouseId(warehouseId, pageable);
        } else {
            page = backupRecordRepository.findAll(pageable);
        }

        List<BackupRecordDto> dtos = page.getContent().stream()
                .map(this::toDto)
                .toList();

        return PagedResponse.fromMapped(page, dtos);
    }

    public void deleteBackup(Long id, HttpServletRequest httpRequest) {
        rateLimiter.consumeOrThrow(httpRequest.getRemoteAddr(), RateLimitOperation.BACKUP_WRITE);

        BackupRecord record = backupRecordRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("BACKUP_NOT_FOUND"));

        if (record.getR2BasePath() != null) {
            backupStorageService.deleteBackup(record.getR2BasePath());
        }
        backupRecordRepository.delete(record);
    }

    // --- Schedule operations ---

    @Transactional(readOnly = true)
    public List<BackupScheduleDto> getAllSchedules() {
        return backupScheduleRepository.findAll().stream()
                .map(this::toScheduleDto)
                .toList();
    }

    @Transactional(rollbackFor = Exception.class)
    public BackupScheduleDto upsertSchedule(Long warehouseId, CreateBackupScheduleRequest request) {
        Warehouse warehouse = warehouseRepository.findById(warehouseId)
                .orElseThrow(() -> new IllegalArgumentException("WAREHOUSE_NOT_FOUND"));

        BackupSchedule schedule = backupScheduleRepository.findByWarehouseId(warehouseId)
                .orElseGet(() -> {
                    BackupSchedule s = new BackupSchedule();
                    s.setWarehouse(warehouse);
                    return s;
                });

        schedule.setScheduleCode(request.getScheduleCode());
        schedule.setBackupHour(request.getBackupHour());
        schedule.setDayOfWeek(request.getDayOfWeek());
        schedule.setDayOfMonth(request.getDayOfMonth());
        schedule.setResourceTypeSet(request.getResourceTypes());
        schedule.setEnabled(request.isEnabled());
        schedule = backupScheduleRepository.save(schedule);

        backupSchedulerManager.registerSchedule(schedule);

        // toScheduleDto is called within the same transaction, so lazy loading will work
        return toScheduleDto(schedule);
    }

    @Transactional(rollbackFor = Exception.class)
    public void deleteSchedule(Long warehouseId) {
        if (backupScheduleRepository.findByWarehouseId(warehouseId).isEmpty()) {
            throw new IllegalArgumentException("SCHEDULE_NOT_FOUND");
        }
        backupSchedulerManager.cancelSchedule(warehouseId);
        backupScheduleRepository.deleteByWarehouseId(warehouseId);
    }

    // --- Helper methods ---

    private BackupRecordDto toDto(BackupRecord record) {
        return BackupRecordDto.builder()
                .id(record.getId())
                .warehouseId(record.getWarehouse().getId())
                .warehouseName(record.getWarehouse().getName())
                .backupType(record.getBackupType())
                .status(record.getStatus())
                .resourceTypes(new ArrayList<>(record.getResourceTypeSet()))
                .totalRecords(record.getTotalRecords())
                .sizeBytes(record.getSizeBytes())
                .createdAt(record.getCreatedAt())
                .completedAt(record.getCompletedAt())
                .errorMessage(record.getErrorMessage())
                .triggeredByName(record.getTriggeredBy() != null ? record.getTriggeredBy().getFullName() : null)
                .build();
    }

    private BackupScheduleDto toScheduleDto(BackupSchedule schedule) {
        return BackupScheduleDto.builder()
                .warehouseId(schedule.getWarehouse().getId())
                .warehouseName(schedule.getWarehouse().getName())
                .scheduleCode(schedule.getScheduleCode())
                .backupHour(schedule.getBackupHour())
                .dayOfWeek(schedule.getDayOfWeek())
                .dayOfMonth(schedule.getDayOfMonth())
                .resourceTypes(schedule.getResourceTypeSet())
                .enabled(schedule.isEnabled())
                .lastRunAt(schedule.getLastRunAt())
                .nextRunAt(schedule.getNextRunAt())
                .build();
    }

    private void createBackupAlert(Warehouse warehouse, BackupRecord record, boolean success) {
        try {
            AlertType alertType = success ? AlertType.BACKUP_COMPLETED : AlertType.BACKUP_FAILED;
            String message = buildBackupAlertMessage(warehouse, record, success);

            Alert alert = Alert.builder()
                    .warehouse(warehouse)
                    .alertType(alertType)
                    .status(AlertStatus.OPEN)
                    .message(message)
                    .createdAt(Instant.now())
                    .build();

            alertRepository.save(alert);
            log.info("Created backup alert: type={}, warehouse={}, success={}", alertType, warehouse.getId(), success);

            distributeBackupNotifications(alert, warehouse);
        } catch (Exception e) {
            log.error("Failed to create backup alert for warehouse {}", warehouse.getId(), e);
        }
    }

    private String buildBackupAlertMessage(Warehouse warehouse, BackupRecord record, boolean success) {
        if (success) {
            return String.format("Backup dla magazynu %s (ID: %d) zakończony pomyślnie. " +
                            "Rekordów: %d, Rozmiar: %d bajtów, Data: %s",
                    warehouse.getName(), warehouse.getId(),
                    record.getTotalRecords(), record.getSizeBytes(),
                    record.getCompletedAt());
        } else {
            return String.format("Backup dla magazynu %s (ID: %d) nie powiódł się. " +
                            "Błąd: %s, Data: %s",
                    warehouse.getName(), warehouse.getId(),
                    record.getErrorMessage() != null ? record.getErrorMessage() : "Nieznany błąd",
                    record.getCompletedAt());
        }
    }

    private void distributeBackupNotifications(Alert alert, Warehouse warehouse) {
        List<User> adminUsers = userRepository.findByRoleAndStatus(UserRole.ADMIN, AccountStatus.ACTIVE);

        if (adminUsers.isEmpty()) {
            log.debug("No admin users found to distribute backup notifications");
            return;
        }

        Instant now = Instant.now();
        List<UserNotification> notifications = adminUsers.stream()
                .map(user -> UserNotification.builder()
                        .user(user)
                        .alert(alert)
                        .isRead(false)
                        .createdAt(now)
                        .build())
                .toList();

        if (!notifications.isEmpty()) {
            userNotificationRepository.saveAll(notifications);
            log.info("Distributed {} backup notifications to admin users", notifications.size());
        }
    }
}
