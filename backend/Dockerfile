# ---- build stage ----
# Required environment variables:
# - DB_CONNECTION_URL (default: jdbc:mysql://localhost:3306/magazyn)
# - DB_USERNAME (default: root)
# - DB_PASSWORD (no default - required for production)
FROM maven:3.9-eclipse-temurin-17 AS build
WORKDIR /app

COPY pom.xml .
COPY src ./src
RUN mv src/main/resources/application.properties.prod src/main/resources/application.properties
RUN mvn -B -DskipTests clean package

# ---- runtime stage ----
FROM eclipse-temurin:17-jre
WORKDIR /app

COPY --from=build /app/target/*.jar /app/app.jar

EXPOSE 8080
ENTRYPOINT ["java","-jar","/app/app.jar"]
