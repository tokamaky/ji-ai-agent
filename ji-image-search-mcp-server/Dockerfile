# ===== Stage 1: Build =====
FROM maven:3.9-eclipse-temurin-21 AS builder

WORKDIR /build

# 只拷贝 MCP 子模块的内容
COPY pom.xml .
COPY src src

RUN mvn clean package -DskipTests -B

# ===== Stage 2: Runtime =====
FROM eclipse-temurin:21-jre

WORKDIR /app

COPY --from=builder /build/target/*.jar app.jar

EXPOSE 8127

ENV JAVA_OPTS="-XX:+UseContainerSupport -XX:MaxRAMPercentage=75.0"

ENTRYPOINT ["sh", "-c", "java $JAVA_OPTS -jar app.jar"]
