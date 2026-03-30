#!/bin/bash
cd `dirname $0`
BASE_PATH=`cd "$(pwd)/../"; pwd`
log_dir="${BASE_PATH}/app-logs"
mkdir -p ${log_dir}
#mkdir -p h2
rm -f h2*.db
APP_NAME=`echo $(pwd)|rev|cut -d '/' -f 1|rev`
BUCKET_NAME="modo"
case ${APP_NAME} in
    _common_)
        PORT=21133
        #export H2_PORT=31133
        ;;
    dataex)
        PORT=21134
        export MODO_TAPE_URI_PREFIX="dataex_api"
        export H2_PORT=31134
        ;;
    dataflow)
        PORT=21135
        export H2_PORT=31135
        ;;
    datago)
        PORT=21136
        export H2_PORT=31136
        ;;
    dataos_datastash)
        PORT=21137
        export RUNDATASTASH_PATH=""
        export H2_PORT=31137
        ;;
    dataps)
        PORT=21138
        export H2_PORT=31138
        ;;
    dataos_stream)
        PORT=21132
        export H2_PORT=31132
        mkdir -p ${BASE_PATH}/dataos_stream/script/sql/{prod,test}
        mkdir -p ${BASE_PATH}/dataos_stream/script/yml/{prod,test}
        export SQL_PATH=${BASE_PATH}/dataos_stream/script/sql
        export YAML_PATH=${BASE_PATH}/dataos_stream/script/yml
        ;;
    *)
        echo "app文件目录名称不对(仅能为:_common_,dataex,dataflow,datago,dataos_datastash,dataps),请检查."
        exit -1
        ;;
esac

export APP_DB_URL="jdbc:mysql://10.1.9.3:3306/dataos_dev?useSSL=false"
export APP_DB_USER="user"
export APP_DB_PWD="wUl7YobA=="
export APP_DB_PRO_URL="jdbc:mysql://10.1.9.3:3306/dataos_pro?useSSL=false"
export APP_DB_PRO_USER="user"
export APP_DB_PRO_PWD="wUl7YobA=="
export APP_DB_DRIVER="com.mysql.jdbc.Driver"
export CONF_DB_URL="${APP_DB_URL}"
export CONF_DB_USER="${APP_DB_USER}"
export CONF_DB_PWD="${APP_DB_PWD}"
export CONF_DB_DRIVER="${APP_DB_DRIVER}"
export MINIO_URL="http://10.1.2.1:9002"
export MINIO_USER="modo"
export MINIO_PWD="Modo@123"
export MINIO_BUCKET="${BUCKET_NAME}"

export LINKS_DSPATH="/data/dataos/modo-links"
export REDIS_HOST="10.1.2.1:26379,10.1.2.2:26379,10.1.2.3:26379"
export REDIS_PASSWD="redispassword"
export REDIS_SENTINEL_MASTER="mymaster"
export APISIX_ADMIN_HOST="http://10.1.2.10:9180"
export APISIX_GATEWAY_HOST="http://10.1.2.10:9080"
export APISIX_SECRET="2bfbf9"
export APISIX_UPSTREAM_NODES_EXPR='$.value.upstream.nodes'

export MAGIC_API_PATH=""

export DB_TYPE="mysql"
export DB_DIALECT="org.hibernate.dialect.MySQL5InnoDBDialect"

cpu_architecture=`uname -i`
if [ "${cpu_architecture}" = "aarch64" ];then
    export DOCKER_USER="root"
    export DOCKER_PWD="dataos@root"
else
    export DOCKER_USER="dataos"
    export DOCKER_PWD="1qaz@WSX"
fi


nohup java -Xmx1536m -Xms600m \
-DdsPath=${LINKS_DSPATH} \
-jar modo-dataos-dataps-deploy-1.0.0.jar  --spring.profiles.active=prod --appId=${APP_NAME} --appName=${APP_NAME} --server.servlet.context-path=/${APP_NAME} --server.port=${PORT} >  ${log_dir}/${APP_NAME}_runtime.log  2>&1 &