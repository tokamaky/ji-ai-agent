# ===== Stage 1: Build =====
FROM maven:3.9-eclipse-temurin-21 AS builder

WORKDIR /build

# 拷贝 Maven wrapper 和 pom
COPY pom.xml .
COPY .mvn .mvn
COPY mvnw mvnw
COPY mvnw.cmd mvnw.cmd

# 预下载依赖（加速构建缓存）
RUN mvn dependency:go-offline -B || true

# 拷贝源码
COPY src src

# 打包，跳过测试
RUN mvn clean package -DskipTests -B

# ===== Stage 2: Runtime =====
FROM eclipse-temurin:21-jre

WORKDIR /app

# 从构建阶段拷贝 jar
COPY --from=builder /build/target/*.jar app.jar

# Railway 会注入 PORT 环境变量
EXPOSE 8123

# JVM 内存参数
ENV JAVA_OPTS="-XX:+UseContainerSupport -XX:MaxRAMPercentage=75.0"

ENTRYPOINT ["sh", "-c", "java $JAVA_OPTS -jar app.jar"]