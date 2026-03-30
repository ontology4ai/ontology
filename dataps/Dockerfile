FROM debian:bullseye-slim

ARG PROXY_IP

# 环境变量配置
ENV LANG=zh_CN.UTF-8 \
    LANGUAGE=zh_CN:zh \
    LC_ALL=zh_CN.UTF-8 \
    TZ=Asia/Shanghai


# 3. 【关键】为 apt-get 创建专用代理配置文件
# 这步能解决 90% 的 apt-get 不走代理的问题
ENV http_proxy=http://${PROXY_IP}:7890
ENV https_proxy=http://${PROXY_IP}:7890
ENV HTTP_PROXY=http://${PROXY_IP}:7890
ENV HTTPS_PROXY=http://${PROXY_IP}:7890
ENV NO_PROXY=localhost,127.0.0.1,.local,.internal
# 系统配置阶段
RUN chmod -R 777 /tmp && \
    sed -i 's/deb.debian.org/mirrors.ustc.edu.cn/g' /etc/apt/sources.list && \
    apt-get update --allow-unauthenticated && \
    apt-get install -y wget fontconfig locales openssh-server  openjdk-11-jdk  fonts-wqy-zenhei unzip --allow-unauthenticated

# 配置中文locale
RUN sed -i 's/# zh_CN.UTF-8 UTF-8/zh_CN.UTF-8 UTF-8/' /etc/locale.gen && \
    locale-gen && \
    update-locale LANG=zh_CN.UTF-8 && \
    echo "LANG=zh_CN.UTF-8" > /etc/default/locale && \
    echo "LANGUAGE=zh_CN:zh" >> /etc/default/locale && \
    echo "LC_ALL=zh_CN.UTF-8" >> /etc/default/locale


# SSH配置
RUN sed -i 's/#PermitRootLogin prohibit-password/PermitRootLogin yes/' /etc/ssh/sshd_config && \
    sed -i '/AcceptEnv/d' /etc/ssh/sshd_config && \
    echo "AcceptEnv LANG LC_*" >> /etc/ssh/sshd_config && \
    echo 'root:Qwer78__' | chpasswd && \
    mkdir /var/run/sshd


ENV http_proxy=http://${PROXY_IP}:7890
ENV https_proxy=http://${PROXY_IP}:7890
ENV HTTP_PROXY=http://${PROXY_IP}:7890
ENV HTTPS_PROXY=http://${PROXY_IP}:7890
ENV NO_PROXY=localhost,127.0.0.1,.local,.internal
# 安装 Gradle（使用官方公开下载链接）
ENV GRADLE_VERSION 7.6.4
RUN wget https://mirrors.huaweicloud.com/gradle/gradle-${GRADLE_VERSION}-bin.zip -O /tmp/gradle.zip && \
    unzip -d /opt /tmp/gradle.zip && \
    rm /tmp/gradle.zip && \
    ln -s /opt/gradle-${GRADLE_VERSION} /opt/gradle && \
    ln -s /opt/gradle/bin/gradle /usr/bin/gradle

# 设置 Gradle 缓存目录（可选，避免每次重新下载依赖）
ENV GRADLE_USER_HOME /gradle_cache
VOLUME /gradle_cache

# 创建工作目录
WORKDIR /app

# 清理
RUN apt-get clean && \
    rm -rf /var/lib/apt/lists/* && \
    ln -snf /usr/share/zoneinfo/$TZ /etc/localtime && \
    echo $TZ > /etc/timezone

COPY . .
RUN cd /app/modo-dataos-dataps-deploy && gradle bootJar -Dhttp.proxyHost=${PROXY_IP} -Dhttp.proxyPort=7890  -Dhttps.proxyHost=${PROXY_IP}  -Dhttps.proxyPort=7890

RUN mkdir /app/runtime && cp -r /app/modo-dataos-dataps-deploy/build/dataps/* /app/runtime
EXPOSE 8373


# 构建项目（根据 README 中的命令）
RUN  cp -r /app/front/dist /app/runtime/build/resources/frontend/ext/dataps && cp -r /app/dsx-plugins /app/runtime/

#CMD ["java", "-Xmx1536m", "-Xms600m", "-DdsPath=/app", "-jar", "ontology_deploy-1.0.0.jar", "--spring.profiles.active=prod", "--appId=ontology", "--appName=ontology", "--server.servlet.context-path=/ontology", "--deployMode=${DEPLOY_MODE}", "--server.port=8373"]
CMD sh -c "cd /app/runtime && java -Xmx1536m -Xms600m -DdsPath=${LINKS_DSPATH} -jar modo-dataos-dataps-deploy-1.0.0.jar  --spring.profiles.active=prod --appId=${APP_NAME} --appName=${APP_NAME} --server.servlet.context-path=/${APP_NAME} --server.port=${SERVER_PORT}  "
