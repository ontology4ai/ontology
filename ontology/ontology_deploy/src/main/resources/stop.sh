#!/bin/bash

keyword=ontology_deploy-1.0.0.jar

# 查找 Java 进程
pids=$(ps -ef | grep java | grep "$keyword" | grep -v grep | awk '{print $2}')

# 检查是否找到进程
if [ -z "$pids" ]; then
    echo "未找到包含 '$keyword' 的 Java 进程。"
    exit 0
fi

# 终止进程
for pid in $pids; do
    echo "正在终止进程 $pid..."
    kill -9 $pid
    if [ $? -eq 0 ]; then
        echo "进程 $pid 已成功终止。"
    else
        echo "终止进程 $pid 时出错。"
    fi
done