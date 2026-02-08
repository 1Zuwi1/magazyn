package com.github.dawid_stolarczyk.magazyn.Repositories.Specification;

import com.github.dawid_stolarczyk.magazyn.Model.Entity.Item;
import jakarta.persistence.criteria.Predicate;
import org.springframework.data.jpa.domain.Specification;

import java.util.ArrayList;
import java.util.List;

public class ItemSpecifications {

    public static Specification<Item> withFilters(
            String search,
            Boolean dangerous,
            Float minTempFrom,
            Float minTempTo,
            Float maxTempFrom,
            Float maxTempTo,
            Float weightFrom,
            Float weightTo,
            Long expireAfterDaysFrom,
            Long expireAfterDaysTo) {

        return (root, query, criteriaBuilder) -> {
            List<Predicate> predicates = new ArrayList<>();

            // Text search on name or code
            if (search != null && !search.isBlank()) {
                String searchPattern = "%" + search.toLowerCase() + "%";
                Predicate namePredicate = criteriaBuilder.like(
                        criteriaBuilder.lower(root.get("name")), searchPattern);
                Predicate codePredicate = criteriaBuilder.like(
                        criteriaBuilder.lower(root.get("code")), searchPattern);
                predicates.add(criteriaBuilder.or(namePredicate, codePredicate));
            }

            // Dangerous filter
            if (dangerous != null) {
                predicates.add(criteriaBuilder.equal(root.get("isDangerous"), dangerous));
            }

            // Min temp range
            if (minTempFrom != null) {
                predicates.add(criteriaBuilder.greaterThanOrEqualTo(root.get("min_temp"), minTempFrom));
            }
            if (minTempTo != null) {
                predicates.add(criteriaBuilder.lessThanOrEqualTo(root.get("min_temp"), minTempTo));
            }

            // Max temp range
            if (maxTempFrom != null) {
                predicates.add(criteriaBuilder.greaterThanOrEqualTo(root.get("max_temp"), maxTempFrom));
            }
            if (maxTempTo != null) {
                predicates.add(criteriaBuilder.lessThanOrEqualTo(root.get("max_temp"), maxTempTo));
            }

            // Weight range
            if (weightFrom != null) {
                predicates.add(criteriaBuilder.greaterThanOrEqualTo(root.get("weight"), weightFrom));
            }
            if (weightTo != null) {
                predicates.add(criteriaBuilder.lessThanOrEqualTo(root.get("weight"), weightTo));
            }

            // Expire after days range
            if (expireAfterDaysFrom != null) {
                predicates.add(criteriaBuilder.greaterThanOrEqualTo(root.get("expireAfterDays"), expireAfterDaysFrom));
            }
            if (expireAfterDaysTo != null) {
                predicates.add(criteriaBuilder.lessThanOrEqualTo(root.get("expireAfterDays"), expireAfterDaysTo));
            }

            return criteriaBuilder.and(predicates.toArray(new Predicate[0]));
        };
    }
}
