package com.github.dawid_stolarczyk.magazyn.Repositories.JPA;

import com.github.dawid_stolarczyk.magazyn.Model.Entity.OutboundOperation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

public interface OutboundOperationRepository extends JpaRepository<OutboundOperation, Long>, JpaSpecificationExecutor<OutboundOperation> {
}
