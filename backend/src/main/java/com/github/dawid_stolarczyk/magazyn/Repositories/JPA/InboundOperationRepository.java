package com.github.dawid_stolarczyk.magazyn.Repositories.JPA;

import com.github.dawid_stolarczyk.magazyn.Model.Entity.InboundOperation;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.sql.Timestamp;
import java.util.List;

/**
 * Repository dla operacji przyjęć towaru (audyt magazynowy)
 */
public interface InboundOperationRepository extends JpaRepository<InboundOperation, Long> {

    /**
     * Znajdź wszystkie operacje dla danego użytkownika
     */
    List<InboundOperation> findByReceivedById(Long userId);

    /**
     * Znajdź wszystkie operacje dla danego produktu
     */
    List<InboundOperation> findByItemId(Long itemId);

    /**
     * Znajdź wszystkie operacje dla danego regału
     */
    List<InboundOperation> findByRackId(Long rackId);

    /**
     * Znajdź operacje w określonym zakresie czasowym
     */
    @Query("SELECT io FROM InboundOperation io WHERE io.operationTimestamp BETWEEN :startDate AND :endDate ORDER BY io.operationTimestamp DESC")
    List<InboundOperation> findByDateRange(@Param("startDate") Timestamp startDate, @Param("endDate") Timestamp endDate);

    /**
     * Znajdź operacje dla użytkownika w określonym zakresie czasowym
     */
    @Query("SELECT io FROM InboundOperation io WHERE io.receivedBy.id = :userId AND io.operationTimestamp BETWEEN :startDate AND :endDate ORDER BY io.operationTimestamp DESC")
    List<InboundOperation> findByUserAndDateRange(@Param("userId") Long userId, @Param("startDate") Timestamp startDate, @Param("endDate") Timestamp endDate);

    /**
     * Stronicowane wyniki operacji
     */
    Page<InboundOperation> findAll(Pageable pageable);

    /**
     * Stronicowane wyniki dla użytkownika
     */
    Page<InboundOperation> findByReceivedById(Long userId, Pageable pageable);
}
