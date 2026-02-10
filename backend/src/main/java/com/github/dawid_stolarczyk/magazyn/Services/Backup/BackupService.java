package com.github.dawid_stolarczyk.magazyn.Services.Backup;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.github.dawid_stolarczyk.magazyn.Controller.Dto.*;
import com.github.dawid_stolarczyk.magazyn.Crypto.FileCryptoService;
import com.github.dawid_stolarczyk.magazyn.Exceptions.BackupAlreadyInProgressException;
import com.github.dawid_stolarczyk.magazyn.Exceptions.BackupError;
import com.github.dawid_stolarczyk.magazyn.Exceptions.BackupException;
import com.github.dawid_stolarczyk.magazyn.Exceptions.RestoreAlreadyInProgressException;
import com.github.dawid_stolarczyk.magazyn.Model.Entity.*;
import com.github.dawid_stolarczyk.magazyn.Model.Enums.*;
import com.github.dawid_stolarczyk.magazyn.Repositories.JPA.*;
import com.github.dawid_stolarczyk.magazyn.Scheduler.BackupSchedulerManager;
import com.github.dawid_stolarczyk.magazyn.Services.EmailService;
import com.github.dawid_stolarczyk.magazyn.Services.Ratelimiter.Bucket4jRateLimiter;
import com.github.dawid_stolarczyk.magazyn.Services.Ratelimiter.RateLimitOperation;
import com.github.dawid_stolarczyk.magazyn.Utils.LinksUtils;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.Setter;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Lazy;
import org.springframework.core.task.AsyncTaskExecutor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.sql.Timestamp;
import java.text.SimpleDateFormat;
import java.time.Instant;
import java.time.ZoneOffset;
import java.time.format.DateTimeFormatter;
import java.time.temporal.ChronoUnit;
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
    private final EmailService emailService;

    @Qualifier("backupStreamingExecutor")
    private final ExecutorService streamingExecutor;

    @Setter(onMethod_ = {@Autowired, @Lazy})
    private BackupSchedulerManager backupSchedulerManager;

    private final ConcurrentHashMap<Long, AtomicBoolean> warehouseLocks = new ConcurrentHashMap<>();

    @Value("${app.backup.retention-days:30}")
    private int backupRetentionDays;

    @Value("${app.backup.min-keep-count:3}")
    private int minBackupKeepCount;

    private static final DateTimeFormatter TIMESTAMP_FORMAT = DateTimeFormatter
            .ofPattern("yyyyMMdd'T'HHmmss")
            .withZone(ZoneOffset.UTC);

    private static final int MAX_ERROR_MESSAGE_LENGTH = 2000;

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
                .orElseThrow(() -> new BackupException(BackupError.WAREHOUSE_NOT_FOUND));

        if (backupRecordRepository.existsByWarehouseIdAndStatus(warehouse.getId(), BackupStatus.IN_PROGRESS)) {
            throw new BackupAlreadyInProgressException();
        }

        AtomicBoolean lock = warehouseLocks.computeIfAbsent(warehouse.getId(), k -> new AtomicBoolean(false));
        if (!lock.compareAndSet(false, true)) {
            throw new BackupException(BackupError.BACKUP_LOCK_ACQUISITION_FAILED, "Backup operation already in progress for warehouse " + warehouse.getId());
        }

        BackupRecord record = BackupRecord.builder()
                .warehouse(warehouse)
                .backupType(BackupType.MANUAL)
                .status(BackupStatus.IN_PROGRESS)
                .triggeredBy(triggeredBy)
                .build();
        record.setResourceTypeSet(request.getResourceTypes());
        record.setBackupProgressPercentage(0);
        record.setRestoreProgressPercentage(null);
        record = backupRecordRepository.save(record);

        Long recordId = record.getId();
        asyncTaskExecutor.submit(() -> executeBackup(recordId));

        return toDto(record);
    }

    @Transactional(rollbackFor = Exception.class)
    public BackupRecordDto initiateScheduledBackup(Long warehouseId, Set<BackupResourceType> resourceTypes) {
        Warehouse warehouse = warehouseRepository.findById(warehouseId)
                .orElseThrow(() -> new BackupException(BackupError.WAREHOUSE_NOT_FOUND));

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
        record.setBackupProgressPercentage(0);
        record.setRestoreProgressPercentage(null);
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
                .orElseThrow(() -> new BackupException(BackupError.WAREHOUSE_NOT_FOUND, "Warehouse not found during backup execution"));
        String warehouseName = warehouse.getName();

        StreamingBackupWriter writer = new StreamingBackupWriter(objectMapper, fileCryptoService, backupStorageService, streamingExecutor);

        try {
            String timestamp = TIMESTAMP_FORMAT.format(record.getCreatedAt());
            String basePath = "backups/warehouse-" + warehouseId + "/" + timestamp + "_" + recordId + "/";
            record.setR2BasePath(basePath);
            record.setBackupProgressPercentage(0);
            record.setRestoreProgressPercentage(null);
            record = backupRecordRepository.save(record);

            Set<BackupResourceType> resourceTypes = record.getResourceTypeSet();
            int totalPhases = resourceTypes.size() + 1;
            int currentPhase = 0;
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
                currentPhase++;
                int progress = (currentPhase * 100) / totalPhases;
                record.setBackupProgressPercentage(progress);
                record = backupRecordRepository.save(record);
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
                currentPhase++;
                int progress = (currentPhase * 100) / totalPhases;
                record.setBackupProgressPercentage(progress);
                record = backupRecordRepository.save(record);
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
                currentPhase++;
                int progress = (currentPhase * 100) / totalPhases;
                record.setBackupProgressPercentage(progress);
                record = backupRecordRepository.save(record);
            }

            // Build and upload manifest
            BackupManifest manifest = new BackupManifest(recordId, warehouseId,
                    warehouseName, record.getCreatedAt(), 1, manifestResources);
            long manifestBytes = writer.writeAndUpload(basePath, "manifest.enc", manifest);
            totalSizeBytes += manifestBytes;

            record.setStatus(BackupStatus.COMPLETED);
            record.setTotalRecords(totalRecords);
            record.setSizeBytes(totalSizeBytes);
            record.setBackupProgressPercentage(100);
            record.setCompletedAt(Instant.now());
            backupRecordRepository.save(record);

            log.info("Backup {} completed for warehouse {} — {} records, {} bytes",
                    recordId, warehouseId, totalRecords, totalSizeBytes);

            createBackupAlert(warehouse, record, true);

        } catch (BackupException e) {
            log.error("Backup {} failed for warehouse {} - Error: {}", recordId, warehouseId, e.getCode(), e);
            record.setStatus(BackupStatus.FAILED);
            record.setErrorMessage(e.getError().getDescription() + (e.getMessage() != null && e.getMessage().contains(":") ? e.getMessage().substring(e.getMessage().indexOf(":") + 1).trim() : ""));
            record.setCompletedAt(Instant.now());
            backupRecordRepository.save(record);

            createBackupAlert(warehouse, record, false);

            // Best-effort R2 cleanup
            if (record.getR2BasePath() != null) {
                backupStorageService.deleteBackup(record.getR2BasePath());
            }
        } catch (Exception e) {
            log.error("Backup {} failed for warehouse {}", recordId, warehouseId, e);
            record.setStatus(BackupStatus.FAILED);
            record.setErrorMessage(e.getMessage() != null ? e.getMessage().substring(0, Math.min(e.getMessage().length(), MAX_ERROR_MESSAGE_LENGTH)) : "Unknown error");
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
                warehouseLocks.remove(warehouseId);
            }
        }
    }

    // --- Restore ---

    @Transactional(rollbackFor = Exception.class)
    public RestoreResultDto restoreBackup(Long backupId, User currentUser) {
        BackupRecord record = backupRecordRepository.findById(backupId)
                .orElseThrow(() -> new BackupException(BackupError.BACKUP_NOT_FOUND));

        if (record.getStatus() != BackupStatus.COMPLETED) {
            throw new BackupException(BackupError.BACKUP_NOT_COMPLETED, "Backup status is " + record.getStatus());
        }

        Long warehouseId = record.getWarehouse().getId();
        if (!currentUser.getRole().equals(UserRole.ADMIN) && !currentUser.hasAccessToWarehouse(warehouseId)) {
            log.warn("User {} (role: {}) attempted to restore backup for unauthorized warehouse {}", currentUser.getId(), currentUser.getRole(), warehouseId);
            throw new BackupException(BackupError.WAREHOUSE_ACCESS_DENIED);
        }

        AtomicBoolean lock = warehouseLocks.computeIfAbsent(warehouseId, k -> new AtomicBoolean(false));
        if (!lock.compareAndSet(false, true)) {
            throw new BackupException(BackupError.RESTORE_LOCK_ACQUISITION_FAILED, "Restore operation already in progress for warehouse " + warehouseId);
        }

        record.setStatus(BackupStatus.RESTORING);
        record.setRestoreStartedAt(Instant.now());
        record.setRacksRestored(0);
        record.setItemsRestored(0);
        record.setAssortmentsRestored(0);
        record.setRestoreCompletedAt(null);
        record.setErrorMessage(null);
        record = backupRecordRepository.save(record);

        Long recordId = record.getId();
        asyncTaskExecutor.submit(() -> executeRestore(recordId));

        return RestoreResultDto.builder()
                .backupId(backupId)
                .warehouseId(warehouseId)
                .racksRestored(0)
                .itemsRestored(0)
                .assortmentsRestored(0)
                .restoredAt(Instant.now())
                .build();
    }

    private void executeRestore(Long recordId) {
        BackupRecord record = backupRecordRepository.findById(recordId).orElse(null);
        if (record == null) return;

        Long warehouseId = record.getWarehouse().getId();
        Long backupId = record.getId();

        record.setRestoreProgressPercentage(0);
        record = backupRecordRepository.save(record);

        StreamingBackupReader reader = new StreamingBackupReader(objectMapper, fileCryptoService, backupStorageService, streamingExecutor);

        try {
            String basePath = record.getR2BasePath();

            // Phase 1 — Download + decrypt manifest (GCM verifies integrity automatically)
            JsonNode manifestNode = reader.downloadAndRead(basePath, "manifest.enc", JsonNode.class);
            JsonNode resourcesNode = manifestNode.get("resources");
            Set<String> resourceKeys = new HashSet<>();
            if (resourcesNode != null) {
                resourcesNode.fieldNames().forEachRemaining(key -> {
                    if (!key.equals("@class")) resourceKeys.add(key);
                });
            }

            record.setRestoreProgressPercentage(10);
            record = backupRecordRepository.save(record);

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

            record.setRestoreProgressPercentage(30);
            record = backupRecordRepository.save(record);

            // Phase 3 — Atomic DB restore
            int racksRestored = 0;
            int itemsRestored = 0;
            int assortmentsRestored = 0;

            // Clean existing data: delete assortments, then racks for the warehouse
            List<Assortment> existingAssortments = assortmentRepository.findByRack_WarehouseId(warehouseId, Pageable.unpaged()).getContent();
            if (!existingAssortments.isEmpty()) {
                log.info("Deleting {} existing assortments for warehouse {}", existingAssortments.size(), warehouseId);
                assortmentRepository.deleteAll(existingAssortments);
            }

            List<Rack> existingRacks = rackRepository.findByWarehouseId(warehouseId);
            if (!existingRacks.isEmpty()) {
                log.info("Deleting {} existing racks for warehouse {}", existingRacks.size(), warehouseId);
                rackRepository.deleteAll(existingRacks);
            }

            record.setRestoreProgressPercentage(40);
            record = backupRecordRepository.save(record);

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

            record.setRestoreProgressPercentage(60);
            record = backupRecordRepository.save(record);

            // Restore items (global, not warehouse-scoped) - create if absent only
            Map<Long, Long> itemIdMapping = new HashMap<>();
            if (itemDataList != null) {
                for (ItemBackupData id : itemDataList) {
                    Optional<Item> existingItem = itemRepository.findByCode(id.code());
                    Item item;
                    if (existingItem.isPresent()) {
                        item = existingItem.get();
                        log.info("Item with code {} already exists globally, using existing item ID {}", id.code(), item.getId());
                    } else {
                        item = new Item();
                        item.setCode(id.code());
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
                        log.info("Created new item with code {} (ID: {}) from backup", id.code(), item.getId());
                        itemsRestored++;
                    }
                    itemIdMapping.put(id.originalId(), item.getId());
                }
            }

            record.setRestoreProgressPercentage(80);
            record = backupRecordRepository.save(record);

            // Restore assortments
            if (assortmentDataList != null) {
                for (AssortmentBackupData ad : assortmentDataList) {
                    Long newRackId = rackIdMapping.get(ad.originalRackId());
                    Long newItemId = itemIdMapping.get(ad.originalItemId());

                    if (newRackId == null) {
                        throw new BackupException(BackupError.RACK_MAPPING_NOT_FOUND,
                                String.format("Rack ID mapping not found for original rack ID %d. " +
                                                "This may indicate corrupted backup data or missing rack in the backup.",
                                        ad.originalRackId()));
                    }
                    if (newItemId == null) {
                        throw new BackupException(BackupError.ITEM_MAPPING_NOT_FOUND,
                                String.format("Item ID mapping not found for original item ID %d. " +
                                                "This may indicate corrupted backup data or missing item in the backup.",
                                        ad.originalItemId()));
                    }

                    Rack rack = rackRepository.findById(newRackId)
                            .orElseThrow(() -> new BackupException(BackupError.RACK_MAPPING_NOT_FOUND, "Rack not found during restore: ID=" + newRackId));
                    Item item = itemRepository.findById(newItemId)
                            .orElseThrow(() -> new BackupException(BackupError.ITEM_MAPPING_NOT_FOUND, "Item not found during restore: ID=" + newItemId));

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

            // Update record with restore results
            record.setStatus(BackupStatus.COMPLETED);
            record.setRacksRestored(racksRestored);
            record.setItemsRestored(itemsRestored);
            record.setAssortmentsRestored(assortmentsRestored);
            record.setRestoreProgressPercentage(100);
            record.setRestoreCompletedAt(Instant.now());
            backupRecordRepository.save(record);

            log.info("Restore {} completed for warehouse {} — {} racks, {} items, {} assortments",
                    recordId, warehouseId, racksRestored, itemsRestored, assortmentsRestored);

            createRestoreAlert(record, true);

        } catch (BackupException e) {
            log.error("Restore {} failed for warehouse {} - Error: {}", recordId, warehouseId, e.getCode(), e);
            record.setStatus(BackupStatus.FAILED);
            record.setErrorMessage(e.getError().getDescription() + (e.getMessage() != null && e.getMessage().contains(":") ? e.getMessage().substring(e.getMessage().indexOf(":") + 1).trim() : ""));
            record.setRestoreCompletedAt(Instant.now());
            backupRecordRepository.save(record);
            createRestoreAlert(record, false);
        } catch (Exception e) {
            log.error("Restore {} failed for warehouse {}", recordId, warehouseId, e);
            record.setStatus(BackupStatus.FAILED);
            record.setErrorMessage(e.getMessage() != null ? e.getMessage().substring(0, Math.min(e.getMessage().length(), MAX_ERROR_MESSAGE_LENGTH)) : "Unknown error");
            record.setRestoreCompletedAt(Instant.now());
            backupRecordRepository.save(record);
            createRestoreAlert(record, false);
        } finally {
            AtomicBoolean lock = warehouseLocks.get(warehouseId);
            if (lock != null) {
                lock.set(false);
                warehouseLocks.remove(warehouseId);
            }
        }
    }

    // --- CRUD ---

    @Transactional(readOnly = true)
    public BackupRecordDto getBackup(Long id, HttpServletRequest httpRequest) {
        rateLimiter.consumeOrThrow(httpRequest.getRemoteAddr(), RateLimitOperation.BACKUP_READ);
        BackupRecord record = backupRecordRepository.findWithEagerById(id)
                .orElseThrow(() -> new BackupException(BackupError.BACKUP_NOT_FOUND));
        return toDto(record);
    }

    @Transactional(readOnly = true)
    public PagedResponse<BackupRecordDto> getBackups(Long warehouseId, Pageable pageable, HttpServletRequest httpRequest) {
        rateLimiter.consumeOrThrow(httpRequest.getRemoteAddr(), RateLimitOperation.BACKUP_READ);

        Page<BackupRecord> page;
        if (warehouseId != null) {
            page = backupRecordRepository.findByWarehouseId(warehouseId, pageable);
        } else {
            page = backupRecordRepository.findAllWithEager(pageable);
        }

        List<BackupRecordDto> dtos = page.getContent().stream()
                .map(this::toDto)
                .toList();

        return PagedResponse.fromMapped(page, dtos);
    }

    @Transactional(rollbackFor = Exception.class)
    public void deleteBackup(Long id, HttpServletRequest httpRequest) {
        rateLimiter.consumeOrThrow(httpRequest.getRemoteAddr(), RateLimitOperation.BACKUP_WRITE);

        BackupRecord record = backupRecordRepository.findById(id)
                .orElseThrow(() -> new BackupException(BackupError.BACKUP_NOT_FOUND));

        String r2BasePath = record.getR2BasePath();
        try {
            if (r2BasePath != null) {
                backupStorageService.deleteBackup(r2BasePath);
                log.info("Deleted R2 backup files for backup record {}", id);
            }
            backupRecordRepository.delete(record);
            log.info("Deleted database record for backup {}", id);
        } catch (BackupException e) {
            throw e;
        } catch (Exception e) {
            if (r2BasePath != null) {
                log.error("R2 files were already deleted for backup {} but database deletion failed. Manual cleanup may be required. Error: {}", id, e.getMessage(), e);
            } else {
                log.error("Failed to delete backup {} from database. Error: {}", id, e.getMessage(), e);
            }
            throw new BackupException(BackupError.R2_CLEANUP_FAILED, e.getMessage(), e);
        }
    }

    @Transactional(rollbackFor = Exception.class)
    public List<BackupRecordDto> backupAllWarehouses(User triggeredBy, HttpServletRequest httpRequest) {
        rateLimiter.consumeOrThrow(httpRequest.getRemoteAddr(), RateLimitOperation.BACKUP_WRITE);

        List<Warehouse> warehouses = warehouseRepository.findAll();
        if (warehouses.isEmpty()) {
            throw new BackupException(BackupError.NO_WAREHOUSES_FOUND);
        }

        Set<BackupResourceType> allResourceTypes = Set.of(
                BackupResourceType.RACKS,
                BackupResourceType.ITEMS,
                BackupResourceType.ASSORTMENTS
        );

        List<BackupRecordDto> initiatedBackups = new ArrayList<>();

        for (Warehouse warehouse : warehouses) {
            try {
                CreateBackupRequest request = new CreateBackupRequest();
                request.setWarehouseId(warehouse.getId());
                request.setResourceTypes(allResourceTypes);
                BackupRecordDto dto = initiateBackup(request, triggeredBy, httpRequest);
                initiatedBackups.add(dto);
            } catch (BackupAlreadyInProgressException e) {
                log.warn("Backup already in progress for warehouse {}, skipping", warehouse.getId());
            } catch (IllegalStateException e) {
                throw e;
            }
        }

        log.info("Initiated backup for {} warehouses", initiatedBackups.size());
        return initiatedBackups;
    }

    @Transactional(rollbackFor = Exception.class)
    public RestoreAllWarehousesResult restoreAllWarehouses(User currentUser, HttpServletRequest httpRequest) {
        rateLimiter.consumeOrThrow(httpRequest.getRemoteAddr(), RateLimitOperation.BACKUP_WRITE);

        List<Warehouse> warehouses = warehouseRepository.findAll();
        if (warehouses.isEmpty()) {
            throw new BackupException(BackupError.NO_WAREHOUSES_FOUND);
        }

        List<RestoreResultDto> successfulRestores = new ArrayList<>();
        List<RestoreAllWarehousesResult.SkippedWarehouse> skippedWarehouses = new ArrayList<>();

        for (Warehouse warehouse : warehouses) {
            try {
                Page<BackupRecord> completedBackups = backupRecordRepository.findByWarehouseId(
                        warehouse.getId(), PageRequest.of(0, 1, Sort.by("completedAt").descending()));

                if (completedBackups.isEmpty()) {
                    log.warn("No completed backup found for warehouse {}, skipping restore", warehouse.getId());
                    skippedWarehouses.add(RestoreAllWarehousesResult.SkippedWarehouse.builder()
                            .warehouseId(warehouse.getId())
                            .warehouseName(warehouse.getName())
                            .reason("NO_COMPLETED_BACKUP")
                            .build());
                    continue;
                }

                BackupRecord latestBackup = completedBackups.getContent().get(0);
                RestoreResultDto dto = restoreBackup(latestBackup.getId(), currentUser);
                successfulRestores.add(dto);
            } catch (RestoreAlreadyInProgressException e) {
                log.warn("Restore already in progress for warehouse {}, skipping", warehouse.getId());
                skippedWarehouses.add(RestoreAllWarehousesResult.SkippedWarehouse.builder()
                        .warehouseId(warehouse.getId())
                        .warehouseName(warehouse.getName())
                        .reason("RESTORE_ALREADY_IN_PROGRESS")
                        .build());
            } catch (IllegalArgumentException | SecurityException e) {
                log.warn("Cannot restore warehouse {}: {}", warehouse.getId(), e.getMessage());
                skippedWarehouses.add(RestoreAllWarehousesResult.SkippedWarehouse.builder()
                        .warehouseId(warehouse.getId())
                        .warehouseName(warehouse.getName())
                        .reason(e.getClass().getSimpleName() + ": " + e.getMessage())
                        .build());
            }
        }

        log.info("Initiated restore for {} warehouses, skipped {} warehouses",
                successfulRestores.size(), skippedWarehouses.size());
        return RestoreAllWarehousesResult.builder()
                .successful(successfulRestores)
                .skipped(skippedWarehouses)
                .build();
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
                .orElseThrow(() -> new BackupException(BackupError.WAREHOUSE_NOT_FOUND));

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
            throw new BackupException(BackupError.SCHEDULE_NOT_FOUND);
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
                .backupProgressPercentage(record.getBackupProgressPercentage())
                .restoreProgressPercentage(record.getRestoreProgressPercentage())
                .createdAt(record.getCreatedAt())
                .completedAt(record.getCompletedAt())
                .errorMessage(record.getErrorMessage())
                .restoreStartedAt(record.getRestoreStartedAt())
                .restoreCompletedAt(record.getRestoreCompletedAt())
                .racksRestored(record.getRacksRestored())
                .itemsRestored(record.getItemsRestored())
                .assortmentsRestored(record.getAssortmentsRestored())
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

            distributeBackupNotifications(alert, warehouse, record, success);
        } catch (Exception e) {
            log.error("Failed to create backup alert for warehouse {}", warehouse.getId(), e);
        }
    }

    private void createRestoreAlert(BackupRecord record, boolean success) {
        try {
            Warehouse warehouse = record.getWarehouse();
            AlertType alertType = success ? AlertType.RESTORE_COMPLETED : AlertType.RESTORE_FAILED;
            String message = buildRestoreAlertMessage(warehouse, record, success);

            Alert alert = Alert.builder()
                    .warehouse(warehouse)
                    .alertType(alertType)
                    .status(AlertStatus.OPEN)
                    .message(message)
                    .createdAt(Instant.now())
                    .build();

            alertRepository.save(alert);
            log.info("Created restore alert: type={}, warehouse={}, success={}", alertType, warehouse.getId(), success);

            distributeBackupNotifications(alert, warehouse, null, success);
        } catch (Exception e) {
            log.error("Failed to create restore alert for record {}", record.getId(), e);
        }
    }

    private String buildRestoreAlertMessage(Warehouse warehouse, BackupRecord record, boolean success) {
        if (success) {
            return String.format("Restore dla magazynu %s (ID: %d) z kopii zapasowej %d zakończony pomyślnie. " +
                            "Regały: %d, Produkty: %d, Przypisania: %d",
                    warehouse.getName(), warehouse.getId(), record.getId(),
                    record.getRacksRestored(), record.getItemsRestored(), record.getAssortmentsRestored());
        } else {
            return String.format("Restore dla magazynu %s (ID: %d) z kopii zapasowej %d nie powiódł się. " +
                            "Błąd: %s",
                    warehouse.getName(), warehouse.getId(), record.getId(),
                    record.getErrorMessage() != null ? record.getErrorMessage() : "Nieznany błąd");
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

    private void distributeBackupNotifications(Alert alert, Warehouse warehouse, BackupRecord backupRecord, boolean success) {
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

        String backupLink = LinksUtils.getWebAppUrl("/backups", null);
        String triggeredByName = null;
        if (backupRecord != null && backupRecord.getTriggeredBy() != null) {
            try {
                User triggeredBy = userRepository.findById(backupRecord.getTriggeredBy().getId()).orElse(null);
                triggeredByName = triggeredBy != null ? triggeredBy.getFullName() : null;
            } catch (Exception e) {
                log.warn("Could not load triggered by user for backup notification", e);
            }
        }

        for (User admin : adminUsers) {
            if (admin.getEmail() != null) {
                if (backupRecord != null && alert.getAlertType() != AlertType.RESTORE_COMPLETED && alert.getAlertType() != AlertType.RESTORE_FAILED) {
                    SimpleDateFormat dateFormat = new SimpleDateFormat("yyyy-MM-dd HH:mm:ss");
                    String formattedCompletedAt = backupRecord.getCompletedAt() != null
                            ? dateFormat.format(Date.from(backupRecord.getCompletedAt())) : "N/A";
                    emailService.sendBackupNotificationEmail(
                            admin.getEmail(),
                            warehouse.getName(),
                            success,
                            backupRecord.getTotalRecords() != null ? backupRecord.getTotalRecords().longValue() : null,
                            backupRecord.getSizeBytes(),
                            formattedCompletedAt,
                            backupRecord.getBackupType() != null ? backupRecord.getBackupType().name() : null,
                            triggeredByName,
                            backupRecord.getErrorMessage(),
                            backupLink
                    );
                    log.info("Sent backup notification email to {}", admin.getEmail());
                } else {
                    emailService.sendBatchNotificationEmail(admin.getEmail(), List.of(alert.getMessage()), backupLink);
                    log.info("Sent notification email to {}", admin.getEmail());
                }
            }
        }
    }

    @Transactional
    @Scheduled(fixedRate = 1800000, initialDelay = 60000)
    public void cleanupStuckBackups() {
        Instant oneHourAgo = Instant.now().minus(1, ChronoUnit.HOURS);
        List<BackupRecord> stuckBackups = backupRecordRepository.findByStatusAndCreatedAtBefore(BackupStatus.IN_PROGRESS, oneHourAgo);

        if (!stuckBackups.isEmpty()) {
            log.warn("Found {} stuck backup(s) older than 1 hour", stuckBackups.size());
            for (BackupRecord record : stuckBackups) {
                Long warehouseId = record.getWarehouse().getId();
                log.warn("Marking stuck backup {} (warehouse {}) as FAILED", record.getId(), warehouseId);
                record.setStatus(BackupStatus.FAILED);
                record.setErrorMessage(BackupError.BACKUP_TIMEOUT.getDescription() + " - stuck in IN_PROGRESS status for over 1 hour");
                record.setCompletedAt(Instant.now());
                backupRecordRepository.save(record);

                // Release lock if held
                AtomicBoolean lock = warehouseLocks.get(warehouseId);
                if (lock != null) {
                    lock.set(false);
                    warehouseLocks.remove(warehouseId);
                    log.info("Released lock for warehouse {}", warehouseId);
                }

                // Best-effort R2 cleanup
                if (record.getR2BasePath() != null) {
                    try {
                        backupStorageService.deleteBackup(record.getR2BasePath());
                        log.info("Cleaned up R2 path for stuck backup {}", record.getId());
                    } catch (Exception e) {
                        log.error("Failed to cleanup R2 path for stuck backup {}", record.getId(), e);
                    }
                }
            }
        }
    }

    @Transactional
    @Scheduled(cron = "0 0 2 * * ?")
    public void cleanupOldBackups() {
        Instant cutoffDate = Instant.now().minus(backupRetentionDays, ChronoUnit.DAYS);
        log.info("Starting cleanup of backups older than {} days (before {}), keeping minimum {} per warehouse",
                backupRetentionDays, cutoffDate, minBackupKeepCount);

        // Get all completed backups, grouped by warehouse
        List<Warehouse> warehouses = warehouseRepository.findAll();

        int totalDeleted = 0;
        int totalFailed = 0;

        for (Warehouse warehouse : warehouses) {
            try {
                List<BackupRecord> warehouseBackups = backupRecordRepository
                        .findByWarehouseIdAndStatusOrderByCompletedAtDesc(warehouse.getId(), BackupStatus.COMPLETED);

                if (warehouseBackups.size() <= minBackupKeepCount) {
                    log.debug("Warehouse {} has {} backups (<= min keep count), skipping cleanup",
                            warehouse.getId(), warehouseBackups.size());
                    continue;
                }

                // Delete backups older than cutoff date, but keep at least minBackupKeepCount
                List<BackupRecord> toDelete = warehouseBackups.stream()
                        .skip(minBackupKeepCount)  // Keep the N most recent
                        .filter(backup -> backup.getCompletedAt() != null && backup.getCompletedAt().isBefore(cutoffDate))
                        .toList();

                if (toDelete.isEmpty()) {
                    log.debug("No eligible backups to delete for warehouse {}", warehouse.getId());
                    continue;
                }

                log.info("Deleting {} old backups for warehouse {}", toDelete.size(), warehouse.getId());

                for (BackupRecord record : toDelete) {
                    try {
                        if (record.getR2BasePath() != null) {
                            backupStorageService.deleteBackup(record.getR2BasePath());
                            log.debug("Deleted R2 backup files for record {}", record.getId());
                        }
                        backupRecordRepository.delete(record);
                        totalDeleted++;
                    } catch (Exception e) {
                        log.error("Failed to delete old backup record {} (warehouse {}): {}",
                                record.getId(), warehouse.getId(), e.getMessage(), e);
                        totalFailed++;
                    }
                }
            } catch (Exception e) {
                log.error("Error processing cleanup for warehouse {}", warehouse.getId(), e);
            }
        }

        log.info("Backup cleanup completed: {} deleted, {} failed", totalDeleted, totalFailed);
    }
}
