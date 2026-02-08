package com.github.dawid_stolarczyk.magazyn.Scheduler;

import com.github.dawid_stolarczyk.magazyn.Repositories.JPA.PositionReservationRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.sql.Timestamp;
import java.time.Instant;

@Component
@RequiredArgsConstructor
@Slf4j
public class TokenCleanupTask {

    private final PositionReservationRepository reservationRepository;

    /**
     * Czyści wygasłe rezerwacje pozycji co minutę.
     * Rezerwacje wygasają automatycznie po 5 minutach od utworzenia.
     */
    @Scheduled(fixedRate = 60000) // 60000ms = 1 minuta
    @Transactional
    public void clearExpiredPositionReservations() {
        try {
            int deleted = reservationRepository.deleteExpiredReservations(Timestamp.from(Instant.now()));
            if (deleted > 0) {
                log.debug("Cleared {} expired position reservations", deleted);
            }
        } catch (Exception e) {
            log.error("Error clearing expired position reservations", e);
        }
    }
}
