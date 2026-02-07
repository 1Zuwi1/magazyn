package com.github.dawid_stolarczyk.magazyn.Services.Inventory;

import com.github.dawid_stolarczyk.magazyn.Common.Enums.InventoryError;
import com.github.dawid_stolarczyk.magazyn.Controller.Dto.*;
import com.github.dawid_stolarczyk.magazyn.Model.Entity.*;
import com.github.dawid_stolarczyk.magazyn.Repositories.JPA.*;
import com.github.dawid_stolarczyk.magazyn.Security.Auth.AuthUtil;
import com.github.dawid_stolarczyk.magazyn.Services.Ratelimiter.Bucket4jRateLimiter;
import com.github.dawid_stolarczyk.magazyn.Services.Ratelimiter.RateLimitOperation;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;

import static com.github.dawid_stolarczyk.magazyn.Utils.InternetUtils.getClientIp;

@Service
@RequiredArgsConstructor
@Slf4j
public class OutboundService {

    private final AssortmentRepository assortmentRepository;
    private final ItemRepository itemRepository;
    private final UserRepository userRepository;
    private final InboundOperationRepository inboundOperationRepository;
    private final OutboundOperationRepository outboundOperationRepository;
    private final Bucket4jRateLimiter rateLimiter;

    /**
     * Plan: zwraca FIFO-ordered pick list dla podanego produktu.
     * Wyklucza wygasłe assortmenty (expires_at <= NOW()).
     * Zwraca ostrzeżenie jeśli wszystkie assortmenty wygasły.
     */
    public OutboundPlanResponse plan(OutboundPlanRequest request, HttpServletRequest httpRequest) {
        rateLimiter.consumeOrThrow(getClientIp(httpRequest), RateLimitOperation.INVENTORY_READ);

        Item item = itemRepository.findById(request.getItemId())
                .orElseThrow(() -> new IllegalArgumentException(InventoryError.ITEM_NOT_FOUND.name()));

        // Znajdź niewygasłe assortmenty w kolejności FIFO
        List<Assortment> fifoOrdered = assortmentRepository.findByItemIdFifoOrdered(item.getId());

        // Znajdź wygasłe assortmenty (dla raportowania)
        List<Assortment> expired = assortmentRepository.findExpiredByItemId(item.getId());

        int limit = Math.min(request.getQuantity(), fifoOrdered.size());
        List<OutboundPickSlot> pickSlots = fifoOrdered.stream()
                .limit(limit)
                .map(this::mapToPickSlot)
                .toList();

        // Generuj ostrzeżenie jeśli brak dostępnych assortmentów, ale są wygasłe
        String warning = null;
        if (fifoOrdered.isEmpty() && !expired.isEmpty()) {
            warning = String.format("All %d assortments have expired. Cannot fulfill outbound request.",
                    expired.size());
        } else if (fifoOrdered.size() < request.getQuantity() && !expired.isEmpty()) {
            warning = String.format("Only %d non-expired assortments available (requested: %d). %d assortments have expired.",
                    fifoOrdered.size(), request.getQuantity(), expired.size());
        }

        return OutboundPlanResponse.builder()
                .itemId(item.getId())
                .itemName(item.getName())
                .requestedQuantity(request.getQuantity())
                .availableQuantity((long) fifoOrdered.size())
                .expiredQuantity((long) expired.size())
                .warning(warning)
                .pickSlots(pickSlots)
                .build();
    }

    /**
     * Check: sprawdza czy assortment na konkretnej pozycji jest FIFO-compliant i niewygasły.
     */
    public OutboundCheckResponse check(OutboundCheckRequest request, HttpServletRequest httpRequest) {
        rateLimiter.consumeOrThrow(getClientIp(httpRequest), RateLimitOperation.INVENTORY_READ);

        Assortment assortment = assortmentRepository.findByRackIdAndPositionXAndPositionY(
                        request.getRackId(), request.getPositionX(), request.getPositionY())
                .orElseThrow(() -> new IllegalArgumentException(InventoryError.ASSORTMENT_NOT_FOUND.name()));

        // Sprawdź czy assortment jest wygasły
        boolean isExpired = assortment.getExpires_at() != null &&
                assortment.getExpires_at().toInstant().isBefore(java.time.Instant.now());

        // Znajdź starsze niewygasłe assortmenty
        List<Assortment> older = assortmentRepository.findOlderAssortments(
                assortment.getItem().getId(), assortment.getCreated_at());

        boolean fifoCompliant = older.isEmpty();
        List<OutboundPickSlot> olderSlots = older.stream().map(this::mapToPickSlot).toList();

        // Generuj ostrzeżenie
        String warning = null;
        if (isExpired) {
            warning = "EXPIRED: This assortment has expired and cannot be issued";
        } else if (!fifoCompliant) {
            warning = older.size() + " older non-expired assortments of the same item exist and should be picked first";
        }

        return OutboundCheckResponse.builder()
                .fifoCompliant(fifoCompliant && !isExpired)
                .requestedAssortment(mapToPickSlot(assortment))
                .olderAssortments(olderSlots)
                .warning(warning)
                .build();
    }

    /**
     * Execute: wydaje assortmenty z magazynu, tworzy rekordy audytu.
     * Cała operacja jest transakcyjna — albo wszystko, albo nic.
     * Blokuje wydanie wygasłych assortmentów (expires_at <= NOW()).
     */
    @Transactional(rollbackFor = Exception.class)
    public OutboundExecuteResponse execute(OutboundExecuteRequest request, HttpServletRequest httpRequest) {
        rateLimiter.consumeOrThrow(getClientIp(httpRequest), RateLimitOperation.INVENTORY_WRITE);

        User user = userRepository.findById(AuthUtil.getCurrentAuthPrincipal().getUserId())
                .orElseThrow(() -> new IllegalArgumentException(InventoryError.USER_NOT_FOUND.name()));

        List<OutboundOperationDto> operationDtos = new ArrayList<>();

        for (OutboundPickPosition position : request.getPositions()) {
            Assortment assortment = assortmentRepository.findByRackIdAndPositionXAndPositionY(
                            position.getRackId(), position.getPositionX(), position.getPositionY())
                    .orElseThrow(() -> new IllegalArgumentException(InventoryError.ASSORTMENT_NOT_FOUND.name()));

            // Sprawdź czy assortment jest wygasły
            boolean isExpired = assortment.getExpires_at() != null &&
                    assortment.getExpires_at().toInstant().isBefore(java.time.Instant.now());

            if (isExpired) {
                throw new IllegalArgumentException(InventoryError.OUTBOUND_ASSORTMENT_EXPIRED.name());
            }

            // Sprawdź FIFO compliance (tylko dla niewygasłych)
            List<Assortment> older = assortmentRepository.findOlderAssortments(
                    assortment.getItem().getId(), assortment.getCreated_at());
            boolean fifoCompliant = older.isEmpty();

            if (!fifoCompliant && !request.isSkipFifo()) {
                throw new IllegalArgumentException(InventoryError.OUTBOUND_FIFO_VIOLATION.name());
            }

            // Utwórz rekord audytu (zdenormalizowane dane, bo assortment zostanie usunięty)
            OutboundOperation operation = new OutboundOperation();
            operation.setItem(assortment.getItem());
            operation.setRack(assortment.getRack());
            operation.setIssuedBy(user);
            operation.setPositionX(assortment.getPositionX());
            operation.setPositionY(assortment.getPositionY());
            operation.setQuantity(1);
            operation.setAssortmentCode(assortment.getCode());
            operation.setItemName(assortment.getItem().getName());
            operation.setItemCode(assortment.getItem().getCode());
            operation.setFifoCompliant(fifoCompliant);

            outboundOperationRepository.save(operation);

            // Wyczyść FK w InboundOperation przed usunięciem assortmentu
            List<InboundOperation> inboundOps = inboundOperationRepository.findByAssortmentId(assortment.getId());
            for (InboundOperation inboundOp : inboundOps) {
                inboundOp.setAssortment(null);
                inboundOperationRepository.save(inboundOp);
            }

            // Usuń assortment
            assortmentRepository.delete(assortment);

            operationDtos.add(mapToOperationDto(operation));
        }

        log.info("[OUTBOUND] Issued {} assortments by user #{}", operationDtos.size(), user.getId());

        return OutboundExecuteResponse.builder()
                .issuedCount(operationDtos.size())
                .operations(operationDtos)
                .build();
    }

    private OutboundPickSlot mapToPickSlot(Assortment assortment) {
        return OutboundPickSlot.builder()
                .assortmentId(assortment.getId())
                .assortmentCode(assortment.getCode())
                .rackId(assortment.getRack().getId())
                .rackMarker(assortment.getRack().getMarker())
                .positionX(assortment.getPositionX())
                .positionY(assortment.getPositionY())
                .createdAt(assortment.getCreated_at() != null ? assortment.getCreated_at().toInstant().toString() : null)
                .expiresAt(assortment.getExpires_at() != null ? assortment.getExpires_at().toInstant().toString() : null)
                .build();
    }

    private OutboundOperationDto mapToOperationDto(OutboundOperation operation) {
        OutboundOperationDto dto = new OutboundOperationDto();
        dto.setId(operation.getId());
        dto.setItemId(operation.getItem().getId());
        dto.setItemName(operation.getItemName());
        dto.setItemCode(operation.getItemCode());
        dto.setRackId(operation.getRack().getId());
        dto.setRackMarker(operation.getRack().getMarker());
        dto.setIssuedBy(operation.getIssuedBy().getId());
        dto.setIssuedByName(operation.getIssuedBy().getFullName());
        dto.setOperationTimestamp(operation.getOperationTimestamp().toInstant().toString());
        dto.setPositionX(operation.getPositionX());
        dto.setPositionY(operation.getPositionY());
        dto.setQuantity(operation.getQuantity());
        dto.setAssortmentCode(operation.getAssortmentCode());
        dto.setFifoCompliant(operation.isFifoCompliant());
        return dto;
    }
}
