# Magazyn

## Uruchomienie produkcyjne

### Wymagania

- Java 17 (backend).
- Bun (frontend) oraz dostęp do instalacji paczek.
- Baza danych (np. MySQL), Redis i SMTP skonfigurowane w środowisku produkcyjnym.

### Backend (Spring Boot)

1. Przygotuj plik z konfiguracją środowiskową, np. `backend/.env.production`, z poniższymi
   zmiennymi:

   - `DB_CONNECTION_URL`
   - `DB_USERNAME`
   - `DB_PASSWORD`
   - `MAIL_HOST`
   - `MAIL_PORT`
   - `MAIL_USERNAME`
   - `MAIL_PASSWORD`
   - `DOMAIN`
   - `APP_NAME`
   - `APP_URL`
   - `REDIS_PASSWORD` (opcjonalnie)
   - `REDIS_HOST` (opcjonalnie, domyślnie `redis`)
   - `REDIS_PORT` (opcjonalnie, domyślnie `6379`)

2. Zbuduj aplikację:

   ```bash
   cd backend
   ./mvnw clean package -DskipTests
   ```

3. Uruchom w profilu produkcyjnym:

   ```bash
   SPRING_PROFILES_ACTIVE=prod java -jar target/magazyn-0.0.1.jar
   ```

### Frontend (Next.js)

1. Skopiuj `frontend/.env.example` do `frontend/.env.production` i ustaw:

   - `NEXT_PUBLIC_API_URL` (publiczny URL backendu, np. `https://api.example.com`)
   - `INTERNAL_API_URL` (opcjonalny adres wewnętrzny, np. `http://localhost:8080`)

2. Zbuduj i uruchom aplikację:

   ```bash
   cd frontend
   bun install
   bun run build
   PORT=3001 bun run start
   ```

### Automatyczny start backendu i frontendu

Skrypt buduje obie aplikacje, a następnie uruchamia je równolegle:

```bash
./scripts/start-production.sh
```

Opcjonalnie możesz wskazać własne pliki konfiguracyjne oraz port frontendu:

```bash
BACKEND_ENV_FILE=backend/.env.production \
FRONTEND_ENV_FILE=frontend/.env.production \
FRONTEND_PORT=3001 \
./scripts/start-production.sh
```
