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
            Long rackId) {

        return (root, query, criteriaBuilder) -> {
            List<Predicate> predicates = new ArrayList<>();

            // Text search on item name or item code
            if (search != null && !search.isBlank()) {
                String searchPattern = "%" + search.toLowerCase() + "%";
                Predicate namePredicate = criteriaBuilder.like(
                        criteriaBuilder.lower(root.get("item").get("name")), searchPattern);
                Predicate codePredicate = criteriaBuilder.like(
                        criteriaBuilder.lower(root.get("item").get("code")), searchPattern);
                predicates.add(criteriaBuilder.or(namePredicate, codePredicate));
            }

            // Week to expire filter (expires within 7 days)
            if (weekToExpire != null && weekToExpire) {
                Instant now = Instant.now();
                Instant weekFromNow = now.plus(7, ChronoUnit.DAYS);
                Timestamp weekThreshold = Timestamp.from(weekFromNow);
                Timestamp nowTimestamp = Timestamp.from(now);

                predicates.add(criteriaBuilder.and(
                        criteriaBuilder.isNotNull(root.get("expires_at")),
                        criteriaBuilder.greaterThan(root.get("expires_at"), nowTimestamp),
                        criteriaBuilder.lessThanOrEqualTo(root.get("expires_at"), weekThreshold)
                ));
            }

            // Rack filter (for /racks/{rackId}/assortments endpoint)
            if (rackId != null) {
                predicates.add(criteriaBuilder.equal(root.get("rack").get("id"), rackId));
            }

            return criteriaBuilder.and(predicates.toArray(new Predicate[0]));
        };
    }
}
