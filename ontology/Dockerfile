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
RUN cd /app/ontology_deploy && gradle bootJar -Dhttp.proxyHost=${PROXY_IP} -Dhttp.proxyPort=7890  -Dhttps.proxyHost=${PROXY_IP}  -Dhttps.proxyPort=7890

RUN mkdir /app/runtime && cp -r /app/ontology_deploy/build/libs/* /app/runtime
EXPOSE 8373

# 设置环境变量，避免交互式安装提示
ENV DEBIAN_FRONTEND=noninteractive

# 安装 Node.js 16 和 Yarn
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
    curl \
    gnupg \
    ca-certificates \
    && \
    # 添加 NodeSource 仓库（Node.js 16）
    curl -fsSL https://deb.nodesource.com/setup_16.x | bash - && \
    # 安装 Node.js
    apt-get install -y nodejs && \
    # 安装 Yarn
    curl -sS https://dl.yarnpkg.com/debian/pubkey.gpg | apt-key add - && \
    echo "deb https://dl.yarnpkg.com/debian/ stable main" | tee /etc/apt/sources.list.d/yarn.list && \
    apt-get update && \
    apt-get install -y yarn && \
    # 清理缓存以减小镜像体积
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*



# 安装项目依赖
RUN cd /app/front && yarn install --frozen-lockfile 

# 复制项目所有文件到工作目录

# 构建项目（根据 README 中的命令）
RUN cd /app/front && yarn inter:build && cp -r /app/front/dist /app/runtime/build/resources/frontend/ext/ontology

#CMD ["java", "-Xmx1536m", "-Xms600m", "-DdsPath=/app", "-jar", "ontology_deploy-1.0.0.jar", "--spring.profiles.active=prod", "--appId=ontology", "--appName=ontology", "--server.servlet.context-path=/ontology", "--deployMode=${DEPLOY_MODE}", "--server.port=8373"]
CMD sh -c "cd /app/runtime && java -Xmx1536m -Xms600m -DdsPath=/app -jar ontology_deploy-1.0.0.jar --spring.profiles.active=prod --appId=ontology --appName=ontology --server.servlet.context-path=/ontology --deployMode=${DEPLOY_MODE} --server.port=8373 "
