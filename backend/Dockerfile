# Stage 1: Build
FROM eclipse-temurin:17-jdk AS build
WORKDIR /app
COPY . .
RUN chmod +x ./gradlew
RUN ./gradlew bootJar -x test

# Stage 2: Runtime
FROM eclipse-temurin:17-jre
RUN useradd -r -u 1001 appuser            # Non-root-User anlegen
WORKDIR /app
COPY --from=build --chown=appuser:appuser /app/build/libs/backend-0.0.1-SNAPSHOT.jar app.jar
USER appuser                              # nicht mehr als root laufen
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]