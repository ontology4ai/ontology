#!/bin/bash
cd `dirname $0`
#source /etc/profile
#source ~/.bash_profile
BASE_PATH=$(pwd)
chmod -R 755 ${BASE_PATH}

BUCKET_NAME="modo"
export APP_DB_URL="jdbc:mysql://10.19.95.33:3306/atlas_links?rewriteBatchedStatements=true&useUnicode=true&characterEncoding=UTF-8&useSSL=false&serverTimezone=Asia/Shanghai&zeroDateTimeBehavior=convertToNull"
export APP_DB_USER="prd"
export APP_DB_PWD="db!@#prd%20"
export APP_DB_DRIVER="com.mysql.jdbc.Driver"
export LINKS_DSPATH=${BASE_PATH}
export MINIO_URL="http://10.19.29.140:19002"
export MINIO_USER="modo"
export MINIO_PWD="Modo@123"
export MINIO_BUCKET="${BUCKET_NAME}"
export APISIX_ADMIN_HOST="http://10.19.29.140:9180"
export APISIX_GATEWAY_HOST="http://10.19.29.140:9080"
export APISIX_SECRET="2bfbf9a4156599844cf49f8aa75f3f4f"


export DSXPATH=$(cd `dirname $0` && pwd)/dsx-plugins
export HADOOP_HOME=$(cd `dirname $0` && pwd)/dsx-plugins/hadoop/3.x

nohup java -DdsPath=${LINKS_DSPATH} -jar modo-links-gateway-boot-1.1.0.jar --suanchou.microservice.gateway.app-secret=${APISIX_SECRET} --suanchou.microservice.gateway.upstream-nodes-expr='$.value.upstream.nodes'  > links-gateway.log  2>&1 &

