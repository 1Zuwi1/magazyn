package com.github.dawid_stolarczyk.magazyn.Repositories;

import com.github.dawid_stolarczyk.magazyn.Model.Entity.PositionReservation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.sql.Timestamp;
import java.util.List;
import java.util.Optional;

public interface PositionReservationRepository extends JpaRepository<PositionReservation, Long> {

    /**
     * Znajduje aktywną rezerwację dla konkretnej pozycji.
     */
    @Query("SELECT pr FROM PositionReservation pr WHERE pr.rack.id = :rackId " +
            "AND pr.positionX = :positionX AND pr.positionY = :positionY " +
            "AND pr.expiresAt > :now")
    Optional<PositionReservation> findActiveReservation(
            @Param("rackId") Long rackId,
            @Param("positionX") int positionX,
            @Param("positionY") int positionY,
            @Param("now") Timestamp now
    );

    /**
     * Znajduje wszystkie aktywne rezerwacje dla regału.
     */
    @Query("SELECT pr FROM PositionReservation pr WHERE pr.rack.id = :rackId AND pr.expiresAt > :now")
    List<PositionReservation> findActiveReservationsForRack(@Param("rackId") Long rackId, @Param("now") Timestamp now);

    /**
     * Znajduje wszystkie aktywne rezerwacje użytkownika.
     */
    @Query("SELECT pr FROM PositionReservation pr WHERE pr.reservedBy = :userId AND pr.expiresAt > :now")
    List<PositionReservation> findActiveReservationsForUser(@Param("userId") Long userId, @Param("now") Timestamp now);

    /**
     * Usuwa wygasłe rezerwacje.
     */
    @Modifying
    @Query("DELETE FROM PositionReservation pr WHERE pr.expiresAt < :now")
    int deleteExpiredReservations(@Param("now") Timestamp now);

    /**
     * Usuwa rezerwacje użytkownika dla konkretnych pozycji (po potwierdzeniu placement).
     */
    @Modifying
    @Query("DELETE FROM PositionReservation pr WHERE pr.rack.id = :rackId " +
            "AND pr.positionX = :positionX AND pr.positionY = :positionY " +
            "AND pr.reservedBy = :userId")
    int deleteByPosition(@Param("rackId") Long rackId, @Param("positionX") int positionX,
                         @Param("positionY") int positionY, @Param("userId") Long userId);

    /**
     * Sprawdza czy pozycja jest zarezerwowana przez innego użytkownika.
     */
    @Query("SELECT COUNT(pr) > 0 FROM PositionReservation pr WHERE pr.rack.id = :rackId " +
            "AND pr.positionX = :positionX AND pr.positionY = :positionY " +
            "AND pr.reservedBy != :userId AND pr.expiresAt > :now")
    boolean isReservedByOther(@Param("rackId") Long rackId, @Param("positionX") int positionX,
                              @Param("positionY") int positionY, @Param("userId") Long userId,
                              @Param("now") Timestamp now);

    /**
     * Sprawdza czy pozycja jest zarezerwowana (przez kogokolwiek).
     */
    @Query("SELECT COUNT(pr) > 0 FROM PositionReservation pr WHERE pr.rack.id = :rackId " +
            "AND pr.positionX = :positionX AND pr.positionY = :positionY " +
            "AND pr.expiresAt > :now")
    boolean isReserved(@Param("rackId") Long rackId, @Param("positionX") int positionX,
                       @Param("positionY") int positionY, @Param("now") Timestamp now);
}
