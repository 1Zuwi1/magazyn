package com.github.dawid_stolarczyk.magazyn.Repositories.Specification;

import com.github.dawid_stolarczyk.magazyn.Model.Entity.Assortment;
import jakarta.persistence.criteria.Predicate;
import org.springframework.data.jpa.domain.Specification;

import java.sql.Timestamp;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.List;

public class AssortmentSpecifications {

    public static Specification<Assortment> withFilters(
            String search,
            Boolean weekToExpire,
            Long rackId,
            Integer positionX,
            Integer positionY,
            Long warehouseId) {

        return (root, query, criteriaBuilder) -> {
            List<Predicate> predicates = new ArrayList<>();

            // Text search on assortment code
            if (search != null && !search.isBlank()) {
                String searchPattern = "%" + search.toLowerCase() + "%";
                predicates.add(criteriaBuilder.like(
                        criteriaBuilder.lower(root.get("code")), searchPattern));
            }

            // Week to expire filter (expires within 7 days)
            if (weekToExpire != null && weekToExpire) {
                Instant now = Instant.now();
                Instant weekFromNow = now.plus(7, ChronoUnit.DAYS);
                Timestamp weekThreshold = Timestamp.from(weekFromNow);
                Timestamp nowTimestamp = Timestamp.from(now);

                predicates.add(criteriaBuilder.and(
                        criteriaBuilder.isNotNull(root.get("expiresAt")),
                        criteriaBuilder.greaterThan(root.get("expiresAt"), nowTimestamp),
                        criteriaBuilder.lessThanOrEqualTo(root.get("expiresAt"), weekThreshold)
                ));
            }

            // Rack filter (for /racks/{rackId}/assortments endpoint)
            if (rackId != null) {
                predicates.add(criteriaBuilder.equal(root.get("rack").get("id"), rackId));
            }

            // Position X filter
            if (positionX != null) {
                predicates.add(criteriaBuilder.equal(root.get("positionX"), positionX));
            }

            // Position Y filter
            if (positionY != null) {
                predicates.add(criteriaBuilder.equal(root.get("positionY"), positionY));
            }

            // Warehouse filter (for /warehouses/{warehouseId}/assortments endpoint)
            if (warehouseId != null) {
                predicates.add(criteriaBuilder.equal(root.get("rack").get("warehouse").get("id"), warehouseId));
            }

            return criteriaBuilder.and(predicates.toArray(new Predicate[0]));
        };
    }
}
