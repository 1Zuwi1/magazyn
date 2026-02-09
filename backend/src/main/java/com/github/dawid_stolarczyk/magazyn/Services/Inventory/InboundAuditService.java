package com.github.dawid_stolarczyk.magazyn.Services.Inventory;

import com.github.dawid_stolarczyk.magazyn.Controller.Dto.InboundOperationDto;
import com.github.dawid_stolarczyk.magazyn.Controller.Dto.PagedResponse;
import com.github.dawid_stolarczyk.magazyn.Model.Entity.InboundOperation;
import com.github.dawid_stolarczyk.magazyn.Repositories.JPA.InboundOperationRepository;
import com.github.dawid_stolarczyk.magazyn.Services.Ratelimiter.Bucket4jRateLimiter;
import com.github.dawid_stolarczyk.magazyn.Services.Ratelimiter.RateLimitOperation;
import jakarta.persistence.criteria.Predicate;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;

import java.sql.Timestamp;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

import static com.github.dawid_stolarczyk.magazyn.Utils.InternetUtils.getClientIp;

@Service
@RequiredArgsConstructor
public class InboundAuditService {
    private final InboundOperationRepository inboundOperationRepository;
    private final Bucket4jRateLimiter rateLimiter;

    /**
     * Get inbound operations with optional filters and pagination
     */
    public PagedResponse<InboundOperationDto> getOperations(
            Long userId,
            Long itemId,
            Long rackId,
            Timestamp startDate,
            Timestamp endDate,
            HttpServletRequest request,
            Pageable pageable) {

        rateLimiter.consumeOrThrow(getClientIp(request), RateLimitOperation.INVENTORY_READ);

        Specification<InboundOperation> spec = (root, query, criteriaBuilder) -> {
            List<Predicate> predicates = new ArrayList<>();

            if (userId != null) {
                predicates.add(criteriaBuilder.equal(root.get("receivedBy").get("id"), userId));
            }

            if (itemId != null) {
                predicates.add(criteriaBuilder.equal(root.get("item").get("id"), itemId));
            }

            if (rackId != null) {
                predicates.add(criteriaBuilder.equal(root.get("rack").get("id"), rackId));
            }

            if (startDate != null && endDate != null) {
                predicates.add(criteriaBuilder.between(root.get("operationTimestamp"), startDate, endDate));
            } else if (startDate != null) {
                predicates.add(criteriaBuilder.greaterThanOrEqualTo(root.get("operationTimestamp"), startDate));
            } else if (endDate != null) {
                predicates.add(criteriaBuilder.lessThanOrEqualTo(root.get("operationTimestamp"), endDate));
            }

            return criteriaBuilder.and(predicates.toArray(new Predicate[0]));
        };

        Page<InboundOperation> page = inboundOperationRepository.findAll(spec, pageable);
        return mapToPagedResponse(page);
    }

    private InboundOperationDto mapToDto(InboundOperation operation) {
        InboundOperationDto dto = new InboundOperationDto();
        dto.setId(operation.getId());
        dto.setItemName(operation.getItemName());
        dto.setItemCode(operation.getItemCode());
        dto.setRackMarker(operation.getRackMarker());
        dto.setReceivedByName(operation.getReceivedByName());
        dto.setOperationTimestamp(operation.getOperationTimestamp().toInstant().toString());
        dto.setPositionX(operation.getPositionX());
        dto.setPositionY(operation.getPositionY());
        dto.setQuantity(operation.getQuantity());
        dto.setAssortmentCode(operation.getAssortmentCode());
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
