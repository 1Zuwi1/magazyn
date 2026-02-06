package com.github.dawid_stolarczyk.magazyn.Services.Inventory;

import com.github.dawid_stolarczyk.magazyn.Controller.Dto.OutboundOperationDto;
import com.github.dawid_stolarczyk.magazyn.Controller.Dto.PagedResponse;
import com.github.dawid_stolarczyk.magazyn.Model.Entity.OutboundOperation;
import com.github.dawid_stolarczyk.magazyn.Repositories.JPA.OutboundOperationRepository;
import com.github.dawid_stolarczyk.magazyn.Services.Ratelimiter.Bucket4jRateLimiter;
import com.github.dawid_stolarczyk.magazyn.Services.Ratelimiter.RateLimitOperation;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.sql.Timestamp;
import java.util.List;
import java.util.stream.Collectors;

import static com.github.dawid_stolarczyk.magazyn.Utils.InternetUtils.getClientIp;

@Service
@RequiredArgsConstructor
public class OutboundAuditService {
    private final OutboundOperationRepository outboundOperationRepository;
    private final Bucket4jRateLimiter rateLimiter;

    public PagedResponse<OutboundOperationDto> getAllOperations(HttpServletRequest request, Pageable pageable) {
        rateLimiter.consumeOrThrow(getClientIp(request), RateLimitOperation.INVENTORY_READ);
        Page<OutboundOperation> page = outboundOperationRepository.findAll(pageable);
        return mapToPagedResponse(page);
    }

    public PagedResponse<OutboundOperationDto> getOperationsByUser(Long userId, HttpServletRequest request, Pageable pageable) {
        rateLimiter.consumeOrThrow(getClientIp(request), RateLimitOperation.INVENTORY_READ);
        Page<OutboundOperation> page = outboundOperationRepository.findByIssuedById(userId, pageable);
        return mapToPagedResponse(page);
    }

    public List<OutboundOperationDto> getOperationsByItem(Long itemId, HttpServletRequest request) {
        rateLimiter.consumeOrThrow(getClientIp(request), RateLimitOperation.INVENTORY_READ);
        return outboundOperationRepository.findByItemId(itemId).stream().map(this::mapToDto).collect(Collectors.toList());
    }

    public List<OutboundOperationDto> getOperationsByRack(Long rackId, HttpServletRequest request) {
        rateLimiter.consumeOrThrow(getClientIp(request), RateLimitOperation.INVENTORY_READ);
        return outboundOperationRepository.findByRackId(rackId).stream().map(this::mapToDto).collect(Collectors.toList());
    }

    public List<OutboundOperationDto> getOperationsByDateRange(Timestamp startDate, Timestamp endDate, HttpServletRequest request) {
        rateLimiter.consumeOrThrow(getClientIp(request), RateLimitOperation.INVENTORY_READ);
        return outboundOperationRepository.findByDateRange(startDate, endDate).stream().map(this::mapToDto).collect(Collectors.toList());
    }

    public List<OutboundOperationDto> getOperationsByUserAndDateRange(Long userId, Timestamp startDate, Timestamp endDate, HttpServletRequest request) {
        rateLimiter.consumeOrThrow(getClientIp(request), RateLimitOperation.INVENTORY_READ);
        return outboundOperationRepository.findByUserAndDateRange(userId, startDate, endDate).stream().map(this::mapToDto).collect(Collectors.toList());
    }

    private OutboundOperationDto mapToDto(OutboundOperation operation) {
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

    private PagedResponse<OutboundOperationDto> mapToPagedResponse(Page<OutboundOperation> page) {
        List<OutboundOperationDto> dtos = page.getContent().stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());

        return PagedResponse.<OutboundOperationDto>builder()
                .content(dtos)
                .page(page.getNumber())
                .size(page.getSize())
                .totalElements(page.getTotalElements())
                .totalPages(page.getTotalPages())
                .first(page.isFirst())
                .last(page.isLast())
                .build();
    }
}
