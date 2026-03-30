#!/bin/bash
echo "`date '+%Y-%m-%d %H:%M:%S'` params: $@"

# for help
declare -a help_opts=("-h" "--help")  

# only support hadoop , yarn connect test.
declare -a comp_types=("hadoop" "yarn")  

#Environment options
declare -a env_opts=("COMP_TYPE" \
        "CLUSTER_NAME" \ 
        "HADOOP_CATEGORY" \ 
        "HADOOP_VERSION" \ 
        "HADOOP_CONFIG_VERSION" \ 
        "DS_CLUSTER_PATH" \
        "DSX_PATH" \
        "HADOOP_USER_NAME" \
        "KRB5_FILE" \
        "KEYTAB_FILE" \
        "PRINCIPAL" \
        "KERBEROS_CONFIG_VERSION" \
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

declare COMP_TYPE 
declare CLUSTER_NAME 
declare HADOOP_CATEGORY 
declare HADOOP_VERSION
declare HADOOP_CONFIG_VERSION=1
declare DS_CLUSTER_PATH
declare DSX_PATH
declare HADOOP_USER_NAME
declare KRB5_FILE
declare KEYTAB_FILE
declare PRINCIPAL
declare KERBEROS_CONFIG_VERSION=1
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
                if [ $(contains "${env_opts[@]}" "${arg}") == "y" ]; then
                        case ${arg} in
                          COMP_TYPE)
                              COMP_TYPE=$val
                              ;;
                          HADOOP_CATEGORY)
                              HADOOP_CATEGORY=$val
                              ;;
                          HADOOP_VERSION)
                              HADOOP_VERSION=$val
                              ;;
                          HADOOP_CONFIG_VERSION)
                              HADOOP_CONFIG_VERSION=$val
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
                          *)
                            ;;
                        esac
                fi
                ((i++))
        fi
    done
}

if (( NUM_ARGS == 0 )); then
    echo "自定义help: 参数为空"
    exit 1
else
    parse
    if [ $(contains "${comp_types[@]}" "${COMP_TYPE}") == "n" ]; then
      echo "only support hadoop , yarn connect test now."
      exit 1
    fi
    export JAVA_HOME=/data/moda/jdk1.8.0_221
    export HADOOP_HOME=$DSX_PATH/$HADOOP_CATEGORY/$HADOOP_VERSION
    export HADOOP_CONF_DIR=$DS_CLUSTER_PATH/config/$CLUSTER_NAME/$HADOOP_CATEGORY/$HADOOP_VERSION/conf_${HADOOP_CONFIG_VERSION}
    export HADOOP_USER_NAME=$HADOOP_USER_NAME
    echo "JAVA_HOME: $JAVA_HOME"
    echo "HADOOP_HOME: $HADOOP_HOME"
    echo "HADOOP_CONF_DIR: $HADOOP_CONF_DIR"
    echo "HADOOP_USER_NAME: $HADOOP_USER_NAME"
    if [[ -n $KEYTAB_FILE && -n $KRB5_FILE && -n $PRINCIPAL ]]; then
        export KRB5_CONFIG=$DS_CLUSTER_PATH/keytabs/${CLUSTER_NAME}_${KERBEROS_CONFIG_VERSION}/$KRB5_FILE
        export KEYTAB_CONFIG=$DS_CLUSTER_PATH/keytabs/${CLUSTER_NAME}_${KERBEROS_CONFIG_VERSION}/$KEYTAB_FILE
        export HADOOP_OPTS="-Djava.security.krb5.conf=$KRB5_CONFIG"
        echo "begin $PRINCIPAL kerberos login by $KRB5_CONFIG and $KEYTAB_CONFIG!!!"
        kinit -kt $KEYTAB_CONFIG $PRINCIPAL
        klist
    fi
    echo "COMP_TYPE: $COMP_TYPE"
    if [[ "$COMP_TYPE" == "hadoop" ]]; then
      #查看用户集群上用户目录是否存在
      HDFS_USER_PATH=/user/$HADOOP_USER_NAME/"modo-links"
      echo "if hadoop_user directory exists : ${HADOOP_HOME}/bin/hadoop fs -test -e $HDFS_USER_PATH ..."  
      ${HADOOP_HOME}/bin/hadoop fs -test -e $HDFS_USER_PATH
      if [ $? -eq 0 ]; then
        exitCode=$?
        echo "$HDFS_USER_PATH is exists,return $exitCode!!!"
      else
        echo "$HDFS_USER_PATH is not exists, return $?!!!"
        ${HADOOP_HOME}/bin/hadoop fs -mkdir -p $HDFS_USER_PATH
        exitCode=$?
        if [ $? -eq 0 ]; then
          echo "mkdir -p $HDFS_USER_PATH success, return $exitCode!!!"
        else
          echo "mkdir -p $HDFS_USER_PATH failed, return $exitCode!!!"
        fi
      fi
    elif [[ "$COMP_TYPE" == "yarn" ]]; then
#      export HADOOP_YARN_HOME=$HADOOP_HOME
#      ${HADOOP_HOME}/bin/yarn application -list -appStates ALL
      ${HADOOP_HOME}/bin/yarn queue -status default
      exitCode=$?
    fi
fi

echo $exitCode
exit $exitCode
