package com.asiainfo.common;

/**
 * @Author luchao
 * @Date 2025/10/1
 * @Description
 */
public class RequestDemo {

    public static String LIST_OBJECTS_DEMO = "curl -X GET \"<host>/<context>/object/apis/list_objects?ontology_name=<name>\"";
    public static String LIST_ACTIONS_DEMO = "curl -X GET \"<host>/<context>/object/apis/list_actions?ontology_name=<name>\"";
    public static String LIST_FUNCTIONS_DEMO = "curl -X GET \"<host>/<context>/object/apis/list_functions?ontology_name=<name>\"";

    public static String LOGIC_RUN_DEMO = "curl -X POST \"<host>/<context>/object/apis/function/run\" \\\n" +
            "  -H \"Content-Type: application/json\" \\\n" +
            "  -d '{\n" +
            "    \"ontology_name\": \"<name>\",\n" +
            "    \"function_name\": \"<function>\",\n" +
            "    \"params\":<params>\n" +
            "  }'";

    public static String ACTION_RUN_DEMO = "curl -X POST \"<host>/<context>/object/apis/action/run\" \\\n" +
            "  -H \"Content-Type: application/json\" \\\n" +
            "  -d '{\n" +
            "    \"ontology_name\": \"<name>\",\n" +
            "    \"action_name\": \"<action>\",\n" +
            "    \"object_name\": \"<objectName>\", \n" +
            "    \"params\": <params>\n" +
            "  }'\n";

    public static String FIND_DEMO = "curl -X POST \"<host>/<context>/object/apis/find\" \\\n" +
            "  -H \"Content-Type: application/json\" \\\n" +
            "  -d '{\n" +
            "    \"onotlogy_name\": \"<name>\", \n" +
            "    \"object_name\":\"\",\n" +
            "    \"return_attrs\":[],\n" +
            "    \"where_sql\":\"\",\n" +
            "    \"where_params\":[],\n" +
            "    \"order_by\":\"\",\n" +
            "    \"page_size\":50, \n" +
            "    \"page_token\":\"\"\n" +
            "  }'\n";

}
