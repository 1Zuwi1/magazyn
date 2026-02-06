package com.github.dawid_stolarczyk.magazyn.Repositories.JPA;

import com.github.dawid_stolarczyk.magazyn.Model.Entity.OutboundOperation;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.sql.Timestamp;
import java.util.List;

public interface OutboundOperationRepository extends JpaRepository<OutboundOperation, Long> {

    List<OutboundOperation> findByIssuedById(Long userId);

    List<OutboundOperation> findByItemId(Long itemId);

    List<OutboundOperation> findByRackId(Long rackId);

    @Query("SELECT o FROM OutboundOperation o WHERE o.operationTimestamp BETWEEN :startDate AND :endDate ORDER BY o.operationTimestamp DESC")
    List<OutboundOperation> findByDateRange(@Param("startDate") Timestamp startDate, @Param("endDate") Timestamp endDate);

    @Query("SELECT o FROM OutboundOperation o WHERE o.issuedBy.id = :userId AND o.operationTimestamp BETWEEN :startDate AND :endDate ORDER BY o.operationTimestamp DESC")
    List<OutboundOperation> findByUserAndDateRange(@Param("userId") Long userId, @Param("startDate") Timestamp startDate, @Param("endDate") Timestamp endDate);

    Page<OutboundOperation> findAll(Pageable pageable);

    Page<OutboundOperation> findByIssuedById(Long userId, Pageable pageable);
}
