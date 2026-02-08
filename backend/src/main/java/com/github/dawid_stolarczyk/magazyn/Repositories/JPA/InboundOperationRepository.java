package com.github.dawid_stolarczyk.magazyn.Repositories.JPA;

import com.github.dawid_stolarczyk.magazyn.Model.Entity.InboundOperation;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.sql.Timestamp;
import java.util.List;

/**
 * Repository dla operacji przyjęć towaru (audyt magazynowy)
 */
public interface InboundOperationRepository extends JpaRepository<InboundOperation, Long>, JpaSpecificationExecutor<InboundOperation> {

    /**
     * Znajdź operację przyjęcia powiązaną z danym assortmentem (do wyczyszczenia FK przed usunięciem)
     */
    List<InboundOperation> findByAssortmentId(Long assortmentId);
}
