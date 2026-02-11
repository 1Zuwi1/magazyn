# Architektura systemu Magazyn

## Spis treści

1. [System Context (C4 Level 1)](#1-system-context)
2. [Container Diagram — Docker Compose](#2-container-diagram)
3. [Backend — Architektura warstwowa](#3-backend)
4. [Frontend — Struktura aplikacji](#4-frontend)
5. [Przepływ danych — Operacje magazynowe](#5-przepływ-danych)
6. [Architektura zabezpieczeń](#6-architektura-zabezpieczeń)
7. [CI/CD — Pipeline wdrożeniowy](#7-cicd)
8. [Model danych — Encje](#8-model-danych)

---

## 1. System Context

```mermaid
flowchart TD
    subgraph Users["Użytkownicy"]
        Worker["<b>Pracownik magazynu</b><br/><i>skanowanie, przyjęcia, wydania</i>"]
        Admin["<b>Administrator</b><br/><i>zarządzanie, raporty, backupy</i>"]
    end

    subgraph Magazyn["System Magazyn"]
        FE["<b>Frontend - Next.js</b><br/>shadcn/ui, SSR, i18n"]
        BE["<b>Backend API - Spring Boot</b><br/>REST, Java 17, Security"]
        DB[("<b>PostgreSQL</b><br/>+ pgvector")]
        Cache[("<b>Redis</b><br/>sesje, cache")]
    end

    subgraph External["Serwisy zewnętrzne"]
        S3["<b>AWS S3</b><br/>zdjęcia produktów"]
        KMS["<b>AWS KMS</b><br/>szyfrowanie"]
        SMTP["<b>SMTP Server</b><br/>e-maile 2FA"]
        GHCR["<b>GHCR</b><br/>Docker Registry"]
    end

    Worker -->|HTTPS| FE
    Admin -->|HTTPS| FE
    FE -->|REST API + JWT| BE
    BE -->|JDBC| DB
    BE -->|Lettuce| Cache
    BE -->|AWS SDK| S3
    BE -->|AWS SDK| KMS
    BE -->|Spring Mail| SMTP
    BE -.->|pull| GHCR

    classDef users fill:#f5f3ff,stroke:#7c3aed,stroke-width:2px,color:#1e1b4b
    classDef frontend fill:#f0f9ff,stroke:#0284c7,stroke-width:2px,color:#082f49
    classDef backend fill:#ecfdf5,stroke:#059669,stroke-width:2px,color:#064e3b
    classDef db fill:#fffbeb,stroke:#d97706,stroke-width:2px,color:#451a03
    classDef external fill:#f8fafc,stroke:#475569,stroke-width:2px,stroke-dasharray: 5 5,color:#0f172a

    class Worker,Admin users
    class FE frontend
    class BE backend
    class DB,Cache db
    class S3,KMS,SMTP,GHCR external
```

---

## 2. Container Diagram

```mermaid
flowchart LR
    subgraph Public["Public Access"]
        Proxy["<b>Reverse Proxy</b><br/>nginx-proxy"]
    end

    subgraph Apps["Application Containers"]
        WEB["<b>web</b><br/>Next.js standalone<br/><small>:3001</small>"]
        API["<b>api</b><br/>Spring Boot<br/><small>:8080</small>"]
    end

    subgraph Storage["Data & Cache"]
        REDIS[("<b>redis</b><br/>7-alpine<br/>AOF persistence")]
        PG[("<b>postgres</b><br/>pgvector<br/>healthcheck")]
        ADMINER["<b>adminer</b><br/>DB Management UI<br/><small>:8081</small>"]
    end

    Proxy --- WEB
    Proxy --- API
    WEB --- API
    API --- REDIS
    API --- PG
    ADMINER --- PG

    classDef infra fill:#f8fafc,stroke:#475569,stroke-width:2px,color:#0f172a
    classDef web fill:#f0f9ff,stroke:#0284c7,stroke-width:2px,color:#082f49
    classDef api fill:#ecfdf5,stroke:#059669,stroke-width:2px,color:#064e3b
    classDef db fill:#fffbeb,stroke:#d97706,stroke-width:2px,color:#451a03

    class Proxy infra
    class WEB web
    class API api
    class REDIS,PG,ADMINER db
```

---

## 3. Backend

```mermaid
flowchart TB
    subgraph Request["Wejście"]
        SF["SessionAuthFilter"]
        VLF["VerificationLevelFilter"]
        RL["<b>Rate Limiter</b><br/>Bucket4j + Caffeine"]
    end

    subgraph Controllers["Kontrolery REST"]
        AuthCtrl["<b>Auth</b><br/>2FA, WebAuthn"]
        InvCtrl["<b>Inventory</b><br/>Items, Racks, Warehouse"]
        AlertCtrl["<b>Alerts</b><br/>Reports, Notifications"]
        AdminCtrl["<b>Admin</b><br/>Users, Backups, Reports"]
    end

    subgraph Services["Logika Biznesowa"]
        AuthSvc["<b>AuthService</b><br/>Security logic"]
        InvSvc["<b>InventoryService</b><br/>Core operations"]
        SupportSvc["<b>Support</b><br/>Email, Crypto, Backup"]
    end

    subgraph AI["AI / ML"]
        AiSvc["<b>AI/ML Service</b><br/>Embeddings, Image ID"]
    end

    subgraph Persistence["Warstwa Danych"]
        JPA[("<b>JPA Repositories</b><br/>17 repos")]
        RedisRepo[("<b>Redis Repos</b><br/>Sessions, 2FA")]
        Entities["<b>Entities</b><br/>19 JPA Entities"]
    end

    Request --> Controllers
    Controllers --> Services
    Services --> Persistence
    InvSvc -.->|embedding| AiSvc
    AiSvc -.-> Persistence

    classDef filter fill:#f1f5f9,stroke:#64748b,stroke-width:1px
    classDef ctrl fill:#f0f9ff,stroke:#0284c7,stroke-width:2px
    classDef svc fill:#ecfdf5,stroke:#059669,stroke-width:2px
    classDef ai fill:#faf5ff,stroke:#9333ea,stroke-width:2px,stroke-dasharray: 4 2
    classDef repo fill:#fffbeb,stroke:#d97706,stroke-width:2px

    class SF,VLF,RL filter
    class AuthCtrl,InvCtrl,AlertCtrl,AdminCtrl ctrl
    class AuthSvc,InvSvc,SupportSvc svc
    class AiSvc ai
    class JPA,RedisRepo,Entities repo
```

---

## 4. Frontend

```mermaid
flowchart TB
    subgraph Routing["App Router"]
        Public["<b>Publiczne</b><br/>Landing, Verify"]
        Auth["<b>Auth (layout)</b><br/>Login, Register, Pwd"]
        Dashboard["<b>Dashboard (layout)</b><br/>Home, Warehouse, Items"]
        AdminPage["<b>Admin (layout)</b><br/>Users, Backups, Alerts"]
    end

    subgraph Shared["Komponenty & Logic"]
        UI["<b>UI Components</b><br/>shadcn/ui (~42)"]
        Scanner["<b>Scanner</b><br/>Camera, AI ID"]
        Voice["<b>Voice Assistant</b><br/>Listening..."]
    end

    subgraph Data["Data Layer"]
        Hooks["<b>Hooks</b><br/>TanStack Query"]
        Schemas["<b>Schemas</b><br/>Zod validation"]
        Fetcher["<b>Fetcher</b><br/>apiFetch()"]
    end

    subgraph Server["Serwer"]
        BENode["<b>Backend API</b><br/>Spring Boot"]
    end

    Routing --> Shared
    Shared --> Data
    Data -->|REST API| BENode

    classDef route fill:#f8fafc,stroke:#475569,stroke-width:2px
    classDef comp fill:#f0f9ff,stroke:#0284c7,stroke-width:2px
    classDef logic fill:#ecfdf5,stroke:#059669,stroke-width:2px
    classDef server fill:#fef2f2,stroke:#dc2626,stroke-width:2px,stroke-dasharray: 5 5

    class Public,Auth,Dashboard,AdminPage route
    class UI,Scanner,Voice comp
    class Hooks,Schemas,Fetcher logic
    class BENode server
```

---

## 5. Przepływ danych

```mermaid
sequenceDiagram
    autonumber
    participant U as Pracownik
    participant FE as Frontend
    participant API as Backend API
    participant AI as AI Engine
    participant DB as PostgreSQL

    Note over U,DB: PRZYJĘCIE TOWARU (Inbound)

    U->>FE: Skanuje produkt / Zdjęcie
    FE->>API: POST /api/items/identify
    API->>AI: Generuj embedding
    AI-->>API: Wektor (1000d)
    API->>DB: Wyszukiwanie wektorowe
    DB-->>API: Dopasowane produkty
    API-->>FE: Lista kandydatów

    U->>FE: Wybiera i zatwierdza
    FE->>API: POST /api/inbound
    API->>DB: Zapisz Assortment + InboundOperation
    API-->>FE: Sukces

    Note over U,DB: WYDANIE TOWARU (Outbound)

    U->>FE: Planuje wydanie
    FE->>API: POST /api/outbound/plan
    API->>DB: Sprawdź dostępność (FIFO)
    DB-->>API: Pozycje posortowane wg daty
    API-->>FE: Lista pozycji do pobrania

    U->>FE: Potwierdza wydanie
    FE->>API: POST /api/outbound
    API->>DB: Usuń Assortment + Zapisz OutboundOperation
    API-->>FE: Sukces (FIFO status)
```

---

## 6. Architektura zabezpieczeń

```mermaid
flowchart TD
    subgraph Access["Kontrola dostępu"]
        WAF["<b>WAF / Rate Limit</b><br/>Bucket4j"]
        AuthG["<b>Auth Guard</b><br/>Middleware Next.js"]
    end

    subgraph Identity["Uwierzytelnianie"]
        direction LR
        PWD["Hasło<br/>BCrypt"]
        MFA["2FA<br/>TOTP / Email"]
        PASS["Passkeys<br/>WebAuthn"]
    end

    subgraph Authorization["Autoryzacja"]
        direction LR
        RBAC["<b>RBAC</b><br/>USER / ADMIN"]
        PreAuth["<b>@PreAuthorize</b><br/>Method Security"]
        WarehouseACL["<b>Warehouse ACL</b><br/>assignedWarehouses"]
    end

    subgraph DataSec["Ochrona Danych"]
        AES["<b>AES-256</b><br/>Sensitive fields"]
        TLS["<b>TLS 1.3</b><br/>In transit"]
    end

    Access --> Identity
    Identity --> Authorization
    Authorization --> DataSec

    classDef access fill:#fff7ed,stroke:#ea580c,stroke-width:2px,color:#431407
    classDef auth fill:#fef2f2,stroke:#dc2626,stroke-width:2px,color:#7f1d1d
    classDef authz fill:#faf5ff,stroke:#9333ea,stroke-width:2px,color:#3b0764
    classDef data fill:#ecfdf5,stroke:#059669,stroke-width:2px,color:#064e3b

    class WAF,AuthG access
    class PWD,MFA,PASS auth
    class RBAC,PreAuth,WarehouseACL authz
    class AES,KMSNode,TLS data
```

## 7. CI/CD

```mermaid
flowchart LR
    subgraph Code["Source"]
        Commit["<b>Git Push</b><br/>main / PR"]
    end

    subgraph CI["Quality Gate"]
        FE_CI["<b>Frontend CI</b><br/>Lint, Test"]
        BE_CI["<b>Backend CI</b><br/>Maven, Checkstyle"]
    end

    subgraph CD["Deployment"]
        Build["<b>Docker Build</b><br/>GHCR Images"]
        Deploy["<b>SSH Deploy</b><br/>SSH Action"]
    end

    subgraph Prod["Production"]
        Run["<b>Docker Compose</b><br/>Running App"]
    end

    Commit --> CI
    CI -->|Success| CD
    CD --> Prod

    classDef code fill:#f5f3ff,stroke:#7c3aed,stroke-width:2px
    classDef ci fill:#fff7ed,stroke:#ea580c,stroke-width:2px
    classDef cd fill:#f0f9ff,stroke:#0284c7,stroke-width:2px
    classDef prod fill:#ecfdf5,stroke:#059669,stroke-width:2px

    class Commit code
    class FE_CI,BE_CI ci
    class Build,Deploy cd
    class Run prod
```

---

## 8. Model danych

```mermaid
erDiagram
    User {
        Long id PK
        String email UK
        String fullName
        String password
        String role
        String status
    }

    Warehouse {
        Long id PK
        String name
    }

    Rack {
        Long id PK
        String marker
        float min_temp
        float max_temp
        float max_weight
        boolean acceptsDangerous
    }

    Item {
        Long id PK
        String name
        String code UK
        String qrCode UK
        float weight
        Long expireAfterDays
        boolean isDangerous
    }

    Assortment {
        Long id PK
        String code UK
        Timestamp createdAt
        Timestamp expiresAt
        Integer positionX
        Integer positionY
    }

    InboundOperation {
        Long id PK
        String itemName
        String itemCode
        String rackMarker
        String receivedByName
        Timestamp operationTimestamp
        Integer quantity
    }

    OutboundOperation {
        Long id PK
        String itemName
        String itemCode
        String rackMarker
        String issuedByName
        Timestamp operationTimestamp
        Integer quantity
        boolean fifoCompliant
    }

    AuditLog {
        Long id PK
        String action
        Timestamp timestamp
    }

    Alert {
        Long id PK
        String type
        String message
    }

    User ||--o{ Assortment : "tworzy"
    User }o--o{ Warehouse : "przypisany do"
    Warehouse ||--o{ Rack : "zawiera"
    Rack ||--o{ Assortment : "przechowuje"
    Item ||--o{ Assortment : "reprezentuje"
    Warehouse ||--o{ Alert : "generuje"
    Rack ||--o{ Alert : "dotyczy"
```