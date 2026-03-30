#!/bin/bash
echo "`date '+%Y-%m-%d %H:%M:%S'` params: $@"

# for help
declare -a help_opts=("-h" "--help")  

#Environment options
declare -a env_opts=("CLUSTER_NAME" \
        "HADOOP_CATEGORY" \ 
        "HADOOP_VERSION" \ 
        "HADOOP_CONFIG_VERSION" \ 
        "HADOOP_CONFIG_PATH" \
        "SPARK_CATEGORY" \
        "SPARK_VERSION" \
        "SPARK_CONFIG_VERSION" \
        "SPARK_CONFIG_PATH" \
        "PLUGIN_PATH" \
        "DS_CLUSTER_PATH" \
        "DSX_PATH" \
        "HADOOP_USER_NAME" \
        "DEFAULTFS" \
        "KRB5_FILE" \
        "KEYTAB_FILE" \
        "PRINCIPAL" \
        "KERBEROS_CONFIG_VERSION" \
        "DS_ID" \
        "TEAM_NAME" \
        "REQUEST_ID" \
        "SQL_LOCAL_PATH" \
        "APP_NAME" \
        "ASYNC" \
        "--spark.driver.extraJavaOptions" \
        "--spark.executor.extraJavaOptions" \
)
  
#options that should be put in confMap(startupMap)
declare -a execute_opts=(\
        "--master" \
        "--deploy-mode" \
        "--class" \
        "--name" \
        "--jars" \
        "--packages" \
        "--exclude-packages" \
        "--repositories" \
        "--py-files" \
        "--files" \
        "--conf" \
        "--driver-memory" \
        "--driver-java-options" \
        "--driver-library-path" \
        "--driver-class-path" \
        "--executor-memory" \
        "--proxy-user" \
        "--verbose" \
        #"--version" \
        #cluster mode
        "--driver-cores" \
        #Spark standalone and Mesos only:
        # ['--total-executor-cores']=true \ #not supported
        #Spark standalone and YARN only:
        "--executor-cores" \
        #Spark on YARN and Kubernetes only:
        "--num-executors" \
        "--archives" \
        "--principal" \
        "--keytab" \
        #YARN only:
        "--queue" \
)
  
function contains() {
    local n=$#
    local value=${!n}
    for ((i=1;i < $#;i++)) {
        if [ "${!i}" == "${value}" ]; then
            echo "y"
            return 1
        fi
    }
    echo "n"
    return 0
}

i=0
for arg in "$@"
do
    ARGS[i]=${arg}
    ((i++))
done
NUM_ARGS=$i

declare -a EXECUTE_CMD
declare -a MIAN_ARGS_CMD

declare HADOOP_CATEGORY 
declare HADOOP_VERSION
declare HADOOP_CONFIG_VERSION=1
declare HADOOP_CONFIG_PATH
declare SPARK_CATEGORY
declare SPARK_VERSION
declare SPARK_CONFIG_VERSION=1
declare SPARK_CONFIG_PATH
declare PLUGIN_PATH
declare DS_CLUSTER_PATH
declare DSX_PATH
declare HADOOP_USER_NAME
declare DEFAULTFS
declare KRB5_FILE
declare KEYTAB_FILE
declare PRINCIPAL
declare KERBEROS_CONFIG_VERSION=1
declare DS_ID
declare TEAM_NAME
declare REQUEST_ID
declare SQL_LOCAL_PATH
declare APP_NAME
declare ASYNC=true
j=0
exitCode=0
function parse() {
    for((i=0;i<NUM_ARGS;i++));
    do
        arg=${ARGS[${i}]}
        if [ $(contains "${help_opts[@]}" "${arg}") == "y" ]; then
            echo "not supported help now."
            break
        fi
        if [ $((${i}+1)) -lt ${NUM_ARGS} ]; then
                val=${ARGS[${i}+1]}
                if [ $(contains "${execute_opts[@]}" "${arg}") == "y" ]; then
                        EXECUTE_CMD[$j]=${arg}
                        EXECUTE_CMD[$j+1]=$val
                        ((j=j+2))
                elif [ $(contains "${env_opts[@]}" "${arg}") == "y" ]; then
                        case ${arg} in
                          HADOOP_CATEGORY)
                              HADOOP_CATEGORY=$val
                              ;;
                          HADOOP_VERSION)
                              HADOOP_VERSION=$val
                              ;;
                          HADOOP_CONFIG_VERSION)
                              HADOOP_CONFIG_VERSION=$val
                              ;;
                          HADOOP_CONFIG_PATH)
                              HADOOP_CONFIG_PATH=$val
                              ;;
                          SPARK_CATEGORY)
                              SPARK_CATEGORY=$val
                              ;;
                          SPARK_VERSION)
                              SPARK_VERSION=$val
                              ;;
                          SPARK_CONFIG_VERSION)
                              SPARK_CONFIG_VERSION=$val
                              ;;
                          SPARK_CONFIG_PATH)
                              SPARK_CONFIG_PATH=$val
                              ;;
                          PLUGIN_PATH)
                              PLUGIN_PATH=$val
                              ;;
                          DS_CLUSTER_PATH)
                              DS_CLUSTER_PATH=$val
                              ;;
                          DSX_PATH)
                              DSX_PATH=$val
                              ;;
                          HADOOP_USER_NAME)
                              HADOOP_USER_NAME=$val
                              ;;
                          DEFAULTFS)
                              DEFAULTFS=$val
                              ;;
                          CLUSTER_NAME)
                            CLUSTER_NAME=$val
                            ;;
                          KRB5_FILE)
                            KRB5_FILE=$val
                            ;;
                          KEYTAB_FILE)
                            KEYTAB_FILE=$val
                            ;;
                          PRINCIPAL)
                            PRINCIPAL=$val
                            ;;
                          KERBEROS_CONFIG_VERSION)
                            KERBEROS_CONFIG_VERSION=$val
                            ;;
                          TEAM_NAME)
                            TEAM_NAME=$val
                            ;;
                          DS_ID)
                            DS_ID=$val
                            ;;
                          REQUEST_ID)
                            REQUEST_ID=$val
                            ;;
                          SQL_LOCAL_PATH)
                            SQL_LOCAL_PATH=$val
                            ;;
                          APP_NAME)
                            APP_NAME=$val
                            EXECUTE_CMD[$j]="--name"
                            EXECUTE_CMD[$j+1]=$val
                            MIAN_ARGS_CMD[$j]="--appName"
                            MIAN_ARGS_CMD[$j+1]=$val
                            ;;
                          ASYNC)
                            ASYNC=$val
                            ;;
                          *)
                            ;;
                        esac
                        ((j=j+2))
                else
                        MIAN_ARGS_CMD[$j]=$arg
                        MIAN_ARGS_CMD[$j+1]=$val
                        ((j=j+2))
                fi
                ((i++))
        else
                MIAN_ARGS_CMD[$j]=$arg
                ((j++))
        fi
    done
}

if (( NUM_ARGS == 0 )); then
    echo "自定义help: 参数为空"
    exit 1
else
    parse
    #PYTHON env
    #SCALA_HOME env
    #export JAVA_HOME=/data/moda/jdk1.8.0_221
    export HADOOP_HOME=$DSX_PATH/$HADOOP_CATEGORY/$HADOOP_VERSION
    #export HADOOP_CONF_DIR=$DS_CLUSTER_PATH/config/$CLUSTER_NAME/$HADOOP_CATEGORY/$HADOOP_VERSION/conf_${HADOOP_CONFIG_VERSION}
    export HADOOP_CONF_DIR=$HADOOP_CONFIG_PATH
    export SPARK_DIST_CLASSPATH=$($HADOOP_HOME/bin/hadoop classpath)
    export SPARK_HOME=$DSX_PATH/$SPARK_CATEGORY/$SPARK_VERSION
    #export SPARK_CONF_DIR=$DS_CLUSTER_PATH/config/$CLUSTER_NAME/$SPARK_CATEGORY/$SPARK_VERSION/conf_${SPARK_CONFIG_VERSION}
    export SPARK_CONF_DIR=$SPARK_CONFIG_PATH
    export HADOOP_USER_NAME=$HADOOP_USER_NAME
    echo "JAVA_HOME: $JAVA_HOME"
    echo "HADOOP_HOME: $HADOOP_HOME"
    echo "HADOOP_CONF_DIR: $HADOOP_CONF_DIR"
    echo "SPARK_DIST_CLASSPATH: $SPARK_DIST_CLASSPATH"
    echo "SPARK_HOME: $SPARK_HOME"
    echo "SPARK_CONF_DIR: $SPARK_CONF_DIR"
    echo "HADOOP_USER_NAME: $HADOOP_USER_NAME"
#    export SPARK_LOG_DIR=/var/log/spark
    # async or sync submit task
    if [[ "$ASYNC" == "true" ]]; then
      EXECUTE_CMD[$j]="--conf"
      EXECUTE_CMD[$j+1]="spark.yarn.submit.waitAppCompletion=false"
      ((j=j+2))
    else
      echo "同步提交任务... ASYNC is $ASYNC"
    fi
    # kerberos
    if [[ -n $KEYTAB_FILE && -n $KRB5_FILE && -n $PRINCIPAL ]]; then
        #export KRB5_CONFIG=$DS_CLUSTER_PATH/keytabs/${DS_ID}_${KERBEROS_CONFIG_VERSION}/$KRB5_FILE
        #export KEYTAB_CONFIG=$DS_CLUSTER_PATH/keytabs/${DS_ID}_${KERBEROS_CONFIG_VERSION}/$KEYTAB_FILE
        export KRB5_CONFIG=$KRB5_FILE
        export KEYTAB_CONFIG=$KEYTAB_FILE
        export HADOOP_OPTS="-Djava.security.krb5.conf=$KRB5_CONFIG"
        export SPARK_SUBMIT_OPTS="-Djava.security.krb5.conf=$KRB5_CONFIG"
        echo "begin $PRINCIPAL kerberos login by $KRB5_CONFIG and $KEYTAB_CONFIG!!!"
        kinit -kt $KEYTAB_CONFIG $PRINCIPAL
        klist
        #driver 和 excutor认证参数配置
        EXECUTE_CMD[$j+1]="--keytab"
        EXECUTE_CMD[$j+2]="$KEYTAB_CONFIG"
        EXECUTE_CMD[$j+3]="--principal"
        EXECUTE_CMD[$j+4]="$PRINCIPAL"
        EXECUTE_CMD[$j+5]="--conf"
        EXECUTE_CMD[$j+6]="spark.driver.extraJavaOptions='-Djava.security.krb5.conf=$KRB5_FILE'"
        EXECUTE_CMD[$j+7]="--conf"
        EXECUTE_CMD[$j+8]="spark.executor.extraJavaOptions='-Djava.security.krb5.conf=$KRB5_FILE'"
        EXECUTE_CMD[$j+9]="--conf"
        EXECUTE_CMD[$j+10]="spark.yarn.dist.archives=$KRB5_CONFIG"
    fi
    #上传sql文件到用户集群
    HDFS_SQL_PATH=/user/$HADOOP_USER_NAME/$TEAM_NAME/$REQUEST_ID/sql
    if [[ -z $DEFAULTFS ]]; then
      echo "cluster defaultFS is empty, so can not read sql from hdfs: $HDFS_SQL_PATH !!!"
      exitCode=66
    else
      echo "upload local sql file $SQL_LOCAL_PATH to hdfs: $HDFS_SQL_PATH ..."
      ${HADOOP_HOME}/bin/hadoop fs -mkdir -p $HDFS_SQL_PATH
      ${HADOOP_HOME}/bin/hadoop fs -put -f $SQL_LOCAL_PATH $HDFS_SQL_PATH
      if [ $? -ne 0 ]; then
        echo "upload local sql file to hdfs failed!!!"
        exitCode=255
      else
        echo "upload local sql file to hdfs success!!!"
      fi
      MIAN_ARGS_CMD[$j+1]="--sql"
      MIAN_ARGS_CMD[$j+2]="$HDFS_SQL_PATH/$APP_NAME.sql"
      MIAN_ARGS_CMD[$j+3]="--defaultFS"
      MIAN_ARGS_CMD[$j+4]=$DEFAULTFS
    fi
fi
EXEC_JAR="$PLUGIN_PATH/plugins/$SPARK_CATEGORY/$SPARK_VERSION/modo-links-spark-3.x.jar"
MAIN_CLASS="com.asiainfo.modo.links.SqlExecute"
LOGFILE="$APP_NAME-`date +%Y%m%d-%H%M%S`.log"
WORK_DIR=`dirname "$0"`/../
LOG_PATH=`cd ${WORK_DIR};pwd`/logs/$CLUSTER_NAME
if [[ ! -d $LOG_PATH ]];then
    mkdir -p $LOG_PATH
fi
echo " <==: EXEC :==> $SPARK_HOME/bin/spark-submit ${EXECUTE_CMD[@]} --class $MAIN_CLASS $EXEC_JAR ${MIAN_ARGS_CMD[@]}" 2>&1 | tee -a $LOG_PATH/$LOGFILE
if [ $exitCode -eq 0 ]; then
  $SPARK_HOME/bin/spark-submit ${EXECUTE_CMD[@]} --class $MAIN_CLASS $EXEC_JAR ${MIAN_ARGS_CMD[@]} 2>&1 | tee -a $LOG_PATH/$LOGFILE
  exitCode=${PIPESTATUS[0]}
fi

# -f 参数判断本地的sql临时脚本是否存在
if [ -f "$SQL_LOCAL_PATH" ]; then
    rm -f $SQL_LOCAL_PATH
    echo "rm -f $SQL_LOCAL_PATH temp local sql file success!!"
fi

echo $exitCode | tee -a $LOG_PATH/$LOGFILE
exit $exitCode
