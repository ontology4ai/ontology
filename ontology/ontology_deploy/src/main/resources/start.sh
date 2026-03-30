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
        ;;
    dataex)
        PORT=21134
        export MODO_TAPE_URI_PREFIX="dataex_api"
        ;;
    dataflow)
        PORT=21135
        ;;
    datago)
        PORT=21136
        ;;
    dataos_datastash)
        PORT=21137
        export RUNDATASTASH_PATH=""
        ;;
    dataps)
        PORT=21138
        ;;
    dataos_stream)
        PORT=21132
        mkdir -p ${BASE_PATH}/dataos_stream/script/sql/{prod,test}
        mkdir -p ${BASE_PATH}/dataos_stream/script/yml/{prod,test}
        export SQL_PATH=${BASE_PATH}/dataos_stream/script/sql
        export YAML_PATH=${BASE_PATH}/dataos_stream/script/yml
        ;;
    dmg_copilot)
        PORT=21139
        ;;
    ontology)
        PORT=21140
        ;;
    *)
        echo "app文件目录名称不对(仅能为:_common_,dataex,dataflow,datago,dataos_datastash,dataps,dmg_copilot, ontology),请检查."
        exit -1
        ;;
esac

export APP_DB_URL="jdbc:mysql://10.1.1.1:3306/dataos_dev?useSSL=false"
export APP_DB_PRO_URL="jdbc:mysql://10.1.1.1:3306/dataos_pro?useSSL=false"
export APP_DB_USER="qa"
export APP_DB_PWD="8cDzzazDA=="
export APP_DB_DRIVER="com.mysql.jdbc.Driver"

export VECTOR_DB_URL="jdbc:postgresql://10.2.2.1:5541/postgres"
export VECTOR_DB_USER="postgres"
export VECTOR_DB_PWD="password"
export VECTOR_DB_DRIVER="org.postgresql.Driver"

export MINIO_URL="http://10.1.1.1:19002"
export MINIO_USER="modo"
export MINIO_PWD="Modo@123"
export MINIO_BUCKET="${BUCKET_NAME}"

export MODO_LINKS_HOST="http://10.1.1.1:9380"
export LINKS_DSPATH="/data/dataos/modo-links"
export REDIS_HOST="10.1.1.1"
export REDIS_PORT="6389"
export REDIS_PASSWD="redispassword"
export APISIX_ADMIN_HOST="http://10.1.1.1:9480"
export APISIX_GATEWAY_HOST="http://10.1.1.1:9380"
export APISIX_SECRET="2bfbf9a4156f3f4f"
export APISIX_UPSTREAM_NODES_EXPR='$.value.upstream.nodes'

export DB_TYPE="mysql"
export DB_DIALECT="org.hibernate.dialect.MySQL5InnoDBDialect"

nohup java -Xmx1536m -Xms600m \
-DdsPath=${LINKS_DSPATH} \
-jar ontology_deploy-1.0.0.jar  --spring.profiles.active=prod --appId=${APP_NAME} --appName=${APP_NAME}  >  ${log_dir}/${APP_NAME}_runtime.log  2>&1 &