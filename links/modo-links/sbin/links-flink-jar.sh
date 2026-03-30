#!/bin/bash
echo "params: $@"

# for help
declare -a help_opts=("-h" "--help")  

#Environment options
declare -a env_opts=("CLUSTER_NAME" \
        "HADOOP_CATEGORY" \ 
        "HADOOP_VERSION" \ 
        "HADOOP_CONFIG_VERSION" \ 
        "FLINK_CATEGORY" \
        "FLINK_VERSION" \
        "FLINK_CONFIG_VERSION" \
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
        "ExecJar" \
        "MainClass" \
        "DependLocalPath" \
)
  
#options that should be put in confMap(startupMap)
declare -a execute_opts=(\
        #"-d,--detached" \
        "-c,--class" \
        "-C,--classpath" \
        "-n,--allowNonRestoredState" \
        "-p,--parallelism" \
        "-py,--python" \
        "-pyarch,--pyArchives" \
        "-pyexec,--pyExecutable" \
        "-pyfs,--pyFiles" \
        "-pym,--pyModule" \
        "-pyreq,--pyRequirements" \
        "-s,--fromSavepoint" \
        #Options for yarn-cluster mode
        "-m,--jobmanager" \
        "-yat,--yarnapplicationType" \
        "-yD" \
        #"-yh,--yarnhelp"  
        #"-yd,--yarndetached" \
        "-yid,--yarnapplicationId" \
        "-yj,--yarnjar" \
        "-yjm,--yarnjobManagerMemory" \
        "-ynl,--yarnnodeLabel" \
        "-ynm,--yarnname" \
        "-yq,--yarnquery" \
        "-yqu,--yarnqueue" \
        "-ys,--yarnslots" \
        "-yt,--yarnship" \
        "-ytm,--yarntaskManagerMemory" \
        "-yz,--yarnzookeeperNamespace" \
        "-z,--zookeeperNamespace" \
)
  
function contains() {
    local n=$#
    local value=${!n}
    for ((i=1;i < $#;i++)) {
        local array=(${!i//,/ }) 
        for var in ${array[@]}
        do
          if [ "${var}" == "${value}" ]; then
            echo "y"
            return 1
          fi
        done
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
declare FLINK_CATEGORY
declare FLINK_VERSION
declare FLINK_CONFIG_VERSION=1
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
declare ExecJar
declare MainClass
declare DependLocalPath
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
                          FLINK_CATEGORY)
                              FLINK_CATEGORY=$val
                              ;;
                          FLINK_VERSION)
                              FLINK_VERSION=$val
                              ;;
                          FLINK_CONFIG_VERSION)
                            FLINK_CONFIG_VERSION=$val
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
                          DS_ID)
                            DS_ID=$val
                            ;;
                          TEAM_NAME)
                            TEAM_NAME=$val
                            ;;
                          REQUEST_ID)
                            REQUEST_ID=$val
                            ;;
                          SQL_LOCAL_PATH)
                            SQL_LOCAL_PATH=$val
                            ;;
                          APP_NAME)
                            APP_NAME=$val
                            EXECUTE_CMD[$j]="-ynm"
                            EXECUTE_CMD[$j+1]=$val
                            ;;
                          ASYNC)
                            ASYNC=$val
                            ;;
                          ExecJar)
                            ExecJar=$val
                            ;;
                          MainClass)
                            MainClass=$val
                            ;;
                          DependLocalPath)
                            DependLocalPath=$val
                            EXECUTE_CMD[$j]="-yt"
                            EXECUTE_CMD[$j+1]=$val
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

replaceFromConfig() {
    local key=$1
    local replaceValue=$2
    local configFile=$3
    # 如果用的是macos系统，在-i指令后面多加一个'.back'备份即可
    sed -i "/^[ ]*${key}[ ]*: [^#]*.*$/d" "${configFile}" && echo $replaceValue >> ${configFile}
    echo "replaceFromConfig status: $?"
}

if (( NUM_ARGS == 0 )); then
    echo "自定义help: 参数为空"
    exit 1
else
    parse
    #PYTHON env
    #SCALA_HOME env
    #任务日志路径
    LOGFILE="$APP_NAME-`date +%Y%m%d-%H%M%S`.log"
    WORK_DIR=`dirname "$0"`/../
    LOG_PATH=`cd ${WORK_DIR};pwd`/logs/$CLUSTER_NAME
    if [[ ! -d $LOG_PATH ]];then
        mkdir -p $LOG_PATH
    fi
    export JAVA_HOME=/data/moda/jdk1.8.0_221
    export HADOOP_HOME=$DSX_PATH/$HADOOP_CATEGORY/$HADOOP_VERSION
    export HADOOP_CONF_DIR=$DS_CLUSTER_PATH/config/$CLUSTER_NAME/$HADOOP_CATEGORY/$HADOOP_VERSION/conf_${HADOOP_CONFIG_VERSION}
    export HADOOP_CLASSPATH=$($HADOOP_HOME/bin/hadoop classpath)
    export FLINK_HOME=$DSX_PATH/$FLINK_CATEGORY/$FLINK_VERSION
    export FLINK_LOG_DIR=$LOG_PATH/flink
    export HADOOP_USER_NAME=$HADOOP_USER_NAME
    echo "JAVA_HOME: $JAVA_HOME"
    echo "HADOOP_HOME: $HADOOP_HOME"
    echo "HADOOP_CONF_DIR: $HADOOP_CONF_DIR"
    echo "HADOOP_CLASSPATH: $HADOOP_CLASSPATH"
    echo "FLINK_HOME: $FLINK_HOME"
    echo "FLINK_LOG_DIR: $FLINK_LOG_DIR"
    echo "HADOOP_USER_NAME: $HADOOP_USER_NAME"
    FLINK_CONF_PATH=$DS_CLUSTER_PATH/config/$CLUSTER_NAME/$FLINK_CATEGORY/$FLINK_VERSION/conf_${FLINK_CONFIG_VERSION}
    # async or sync submit task
    if [[ "$ASYNC" == "true" ]]; then
      EXECUTE_CMD[$j]="-d"
      ((j=j+1))
    else
      echo "同步提交任务... ASYNC is $ASYNC"
    fi
    if [[ -n $KEYTAB_FILE && -n $KRB5_FILE && -n $PRINCIPAL ]]; then
        KERBEROS_PATH=$DS_CLUSTER_PATH/keytabs/${DS_ID}_${KERBEROS_CONFIG_VERSION}
        export KRB5_CONFIG=$KERBEROS_PATH/$KRB5_FILE
        export KEYTAB_CONFIG=$KERBEROS_PATH/$KEYTAB_FILE
        export HADOOP_OPTS="-Djava.security.krb5.conf=$KRB5_CONFIG"
        echo "begin $PRINCIPAL kerberos login by $KRB5_CONFIG and $KEYTAB_CONFIG!!!"
        kinit -kt $KEYTAB_CONFIG $PRINCIPAL
        klist
        FLINK_CONF_FILE="flink-conf.yaml"
        UUID=$(uuidgen |sed 's/-//g')
        FLINK_CONF_TEMP_PATH=$FLINK_LOG_DIR/"conf-`date +%Y%m%d-%H%M%S`-$UUID"
        if [[ ! -d $FLINK_CONF_TEMP_PATH ]];then
          mkdir -p $FLINK_CONF_TEMP_PATH
        fi
        cp $FLINK_CONF_PATH/* $FLINK_CONF_TEMP_PATH
        YAML_CONF=$FLINK_CONF_TEMP_PATH/$FLINK_CONF_FILE
        # -f 参数判断 $file 是否存在
        if [ ! -f "$YAML_CONF" ]; then
            echo "$YAML_CONF 不存在"
            exitCode=66
        fi
        USE_TICKET_CACHE_KEY="security.kerberos.login.use-ticket-cache"
        PRINCIPAL_KEY="security.kerberos.login.principal"
        KEYTAB_KEY="security.kerberos.login.keytab"
        KRB5_KEY="security.kerberos.krb5-conf.path"
        CHECK_LEAKED_CLASSLOADER_KEY="classloader.check-leaked-classloader"
        JVM_KRB5_KEY="-Djava.security.krb5.conf"
        replaceFromConfig "$USE_TICKET_CACHE_KEY" "$USE_TICKET_CACHE_KEY: false" "${YAML_CONF}"
        replaceFromConfig "$PRINCIPAL_KEY" "$PRINCIPAL_KEY: $PRINCIPAL" "${YAML_CONF}"
        replaceFromConfig "$KEYTAB_KEY" "$KEYTAB_KEY: $KEYTAB_CONFIG" "${YAML_CONF}"
        replaceFromConfig "$KRB5_KEY" "$KRB5_KEY: $KRB5_CONFIG" "${YAML_CONF}"
        replaceFromConfig "$CHECK_LEAKED_CLASSLOADER_KEY" "$CHECK_LEAKED_CLASSLOADER_KEY: false" "${YAML_CONF}"
        export FLINK_CONF_DIR=$FLINK_CONF_TEMP_PATH
        echo "FLINK_CONF_DIR: $FLINK_CONF_DIR"
        export FLINK_ENV_JAVA_OPTS="$JVM_KRB5_KEY=$KRB5_CONFIG"
#        export FLINK_ENV_JAVA_OPTS_JM="$JVM_KRB5_KEY=$KRB5_CONFIG"
#        export FLINK_ENV_JAVA_OPTS_TM="$JVM_KRB5_KEY=$KRB5_CONFIG"
    else 
        export FLINK_CONF_DIR=$FLINK_CONF_PATH
        echo "FLINK_CONF_DIR: $FLINK_CONF_DIR"
    fi
fi
if [[ -z $ExecJar ]]; then
  echo "execJar is empty: $ExecJar !!!"
  exitCode=66
fi
EXEC_JAR="${DependLocalPath}${ExecJar}"
echo "execJar is exists: $EXEC_JAR!!"
if [ ! -f "$EXEC_JAR" ]; then
    echo "execJar not exists: $EXEC_JAR!!"
    exitCode=66
fi
if [[ -z $MainClass ]]; then
  echo "execJar MainClass is empty, so can not submit jar task: $MainClass !!!"
  exitCode=66
fi 
MAIN_CLASS=$MainClass
echo "execJar MainClass is : $MainClass!!"

echo " <==: EXEC :==> $FLINK_HOME/bin/flink run ${EXECUTE_CMD[@]} --class $MAIN_CLASS $EXEC_JAR ${MIAN_ARGS_CMD[@]}" 2>&1 | tee -a $LOG_PATH/$LOGFILE
if [ $exitCode -eq 0 ]; then
  $FLINK_HOME/bin/flink run ${EXECUTE_CMD[@]} --class $MAIN_CLASS $EXEC_JAR ${MIAN_ARGS_CMD[@]} 2>&1 | tee -a $LOG_PATH/$LOGFILE
  exitCode=${PIPESTATUS[0]}
fi

# -d 判断本地的临时conf是否存在并删除
if [[ -d $FLINK_CONF_TEMP_PATH ]];then
  rm -rf $FLINK_CONF_TEMP_PATH
  echo "rm -rf $FLINK_CONF_TEMP_PATH temp flink conf dir success!!" | tee -a $LOG_PATH/$LOGFILE
fi

echo $exitCode | tee -a $LOG_PATH/$LOGFILE
exit $exitCode
