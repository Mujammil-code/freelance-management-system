# Stage 1: Build the Spring Boot application using Maven and JDK 21
FROM maven:3.9.6-eclipse-temurin-21 AS build
WORKDIR /app

# Copy the pom.xml and source code
COPY pom.xml .
COPY src ./src

# Build the application package (excluding unit tests for speed)
RUN mvn clean package -DskipTests

# Stage 2: Create a lightweight runtime image using JRE 21
FROM eclipse-temurin:21-jre-jammy
WORKDIR /app

# Copy the compiled JAR file from the build stage
# Note the version matches pom.xml (version is 1.0.0 in pom.xml, artifactId is backend)
COPY --from=build /app/target/backend-1.0.0.jar app.jar

# Expose the application port
EXPOSE 8080

# Execute the application
ENTRYPOINT ["java", "-jar", "app.jar"]
