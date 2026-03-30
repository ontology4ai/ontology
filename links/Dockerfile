FROM debian:bullseye-slim

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

# 环境变量配置
ENV LANG=zh_CN.UTF-8 \
    LANGUAGE=zh_CN:zh \
    LC_ALL=zh_CN.UTF-8 \
    TZ=Asia/Shanghai
# 创建工作目录
WORKDIR /app

# 清理
RUN apt-get clean && \
    rm -rf /var/lib/apt/lists/* && \
    ln -snf /usr/share/zoneinfo/$TZ /etc/localtime && \
    echo $TZ > /etc/timezone

COPY . .
RUN tar -zxvf links.tar && rm -rf links.tar 

RUN mkdir /app/runtime && cp -r /app/modo-links/* /app/runtime && rm -rf /app/modo-links
EXPOSE 8373


CMD sh -c "cd /app/runtime && java -DdsPath=${LINKS_DSPATH} -jar modo-links-gateway-boot-1.1.0.jar --suanchou.microservice.gateway.app-secret=${APISIX_SECRET} --suanchou.microservice.gateway.upstream-nodes-expr='$.value.upstream.nodes'  & tail -f /dev/null"
