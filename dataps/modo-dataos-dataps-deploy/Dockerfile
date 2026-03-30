FROM harbor-apaas-dnc.asiainfo.com.cn/public/openjdk:8-jdk-with-font
COPY . /app/
WORKDIR /app

EXPOSE 8373

CMD ["java", "-Xmx1536m", "-Xms600m", "-jar", "dmg_copilot_deploy-1.0.0.jar", "--server.servlet.context-path=/dmg_copilot", "--server.port=8373"]
