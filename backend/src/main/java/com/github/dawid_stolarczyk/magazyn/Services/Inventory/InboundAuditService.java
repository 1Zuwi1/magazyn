package com.github.dawid_stolarczyk.magazyn.Services.Inventory;

import com.github.dawid_stolarczyk.magazyn.Controller.Dto.InboundOperationDto;
import com.github.dawid_stolarczyk.magazyn.Controller.Dto.PagedResponse;
import com.github.dawid_stolarczyk.magazyn.Model.Entity.InboundOperation;
import com.github.dawid_stolarczyk.magazyn.Repositories.JPA.InboundOperationRepository;
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
public class InboundAuditService {
    private final InboundOperationRepository inboundOperationRepository;
    private final Bucket4jRateLimiter rateLimiter;

    public PagedResponse<InboundOperationDto> getAllOperations(HttpServletRequest request, Pageable pageable) {
        rateLimiter.consumeOrThrow(getClientIp(request), RateLimitOperation.INVENTORY_READ);
        Page<InboundOperation> page = inboundOperationRepository.findAll(pageable);
        return mapToPagedResponse(page);
    }

    public PagedResponse<InboundOperationDto> getOperationsByUser(Long userId, HttpServletRequest request, Pageable pageable) {
        rateLimiter.consumeOrThrow(getClientIp(request), RateLimitOperation.INVENTORY_READ);
        Page<InboundOperation> page = inboundOperationRepository.findByReceivedById(userId, pageable);
        return mapToPagedResponse(page);
    }

    public List<InboundOperationDto> getOperationsByItem(Long itemId, HttpServletRequest request) {
        rateLimiter.consumeOrThrow(getClientIp(request), RateLimitOperation.INVENTORY_READ);
        return inboundOperationRepository.findByItemId(itemId).stream().map(this::mapToDto).collect(Collectors.toList());
    }

    public List<InboundOperationDto> getOperationsByRack(Long rackId, HttpServletRequest request) {
        rateLimiter.consumeOrThrow(getClientIp(request), RateLimitOperation.INVENTORY_READ);
        return inboundOperationRepository.findByRackId(rackId).stream().map(this::mapToDto).collect(Collectors.toList());
    }

    public List<InboundOperationDto> getOperationsByDateRange(Timestamp startDate, Timestamp endDate, HttpServletRequest request) {
        rateLimiter.consumeOrThrow(getClientIp(request), RateLimitOperation.INVENTORY_READ);
        return inboundOperationRepository.findByDateRange(startDate, endDate).stream().map(this::mapToDto).collect(Collectors.toList());
    }

    public List<InboundOperationDto> getOperationsByUserAndDateRange(Long userId, Timestamp startDate, Timestamp endDate, HttpServletRequest request) {
        rateLimiter.consumeOrThrow(getClientIp(request), RateLimitOperation.INVENTORY_READ);
        return inboundOperationRepository.findByUserAndDateRange(userId, startDate, endDate).stream().map(this::mapToDto).collect(Collectors.toList());
    }

    private InboundOperationDto mapToDto(InboundOperation operation) {
        InboundOperationDto dto = new InboundOperationDto();
        dto.setId(operation.getId());
        dto.setItemId(operation.getItem().getId());
        dto.setItemName(operation.getItem().getName());
        dto.setItemCode(operation.getItem().getCode());
        dto.setRackId(operation.getRack().getId());
        dto.setRackMarker(operation.getRack().getMarker());
        dto.setReceivedBy(operation.getReceivedBy().getId());
        dto.setReceivedByName(operation.getReceivedBy().getFullName());
        dto.setOperationTimestamp(operation.getOperationTimestamp().toInstant().toString());
        dto.setPositionX(operation.getPositionX());
        dto.setPositionY(operation.getPositionY());
        dto.setQuantity(operation.getQuantity());
        if (operation.getAssortment() != null) {
            dto.setAssortmentId(operation.getAssortment().getId());
            dto.setAssortmentCode(operation.getAssortment().getCode());
        }
        return dto;
    }

    private PagedResponse<InboundOperationDto> mapToPagedResponse(Page<InboundOperation> page) {
        List<InboundOperationDto> dtos = page.getContent().stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());

        return PagedResponse.<InboundOperationDto>builder()
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
