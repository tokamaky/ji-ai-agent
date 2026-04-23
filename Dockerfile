# ===== Stage 1: Build =====
FROM maven:3.9-eclipse-temurin-21 AS builder

WORKDIR /build

# 先拷贝 pom.xml，利用 Docker 缓存加速依赖下载
COPY pom.xml .
COPY .mvn .mvn 2>/dev/null || true
COPY mvnw mvnw 2>/dev/null || true

# 预下载依赖（失败不终止，因为此时还没源码）
RUN mvn dependency:go-offline -B || true

# 再拷贝源码构建
COPY src src

# 打包，跳过测试
RUN mvn clean package -DskipTests -B

# ===== Stage 2: Runtime =====
FROM eclipse-temurin:21-jre

WORKDIR /app

# 从构建阶段拷贝 jar
COPY --from=builder /build/target/*.jar app.jar

# Railway 会注入 PORT
EXPOSE 8123

# JVM 内存参数（Railway Hobby Plan 默认 512MB~8GB）
ENV JAVA_OPTS="-XX:+UseContainerSupport -XX:MaxRAMPercentage=75.0"

ENTRYPOINT ["sh", "-c", "java $JAVA_OPTS -jar app.jar"]
