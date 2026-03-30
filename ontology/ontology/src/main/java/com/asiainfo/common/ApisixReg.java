package com.asiainfo.common;

/**
 * @Author luchao
 * @Date 2025/10/9
 * @Description
 */
public class ApisixReg {

    public static final String AAP_REG = "{\n" +
            "  \"uri\": \"<context-path>/*\",\n" +
            "  \"name\": \"aap\",\n" +
            "  \"methods\": [\n" +
            "    \"GET\",\n" +
            "    \"POST\",\n" +
            "    \"PUT\",\n" +
            "    \"DELETE\",\n" +
            "    \"PATCH\",\n" +
            "    \"HEAD\",\n" +
            "    \"OPTIONS\",\n" +
            "    \"CONNECT\",\n" +
            "    \"TRACE\",\n" +
            "    \"PURGE\"\n" +
            "  ],\n" +
            "  \"upstream\": {\n" +
            "    \"nodes\": [\n" +
            "      {\n" +
            "        \"host\": \"<host>\",\n" +
            "        \"port\": <port>,\n" +
            "        \"weight\": 1\n" +
            "      }\n" +
            "    ],\n" +
            "    \"timeout\": {\n" +
            "      \"connect\": 60,\n" +
            "      \"send\": 60,\n" +
            "      \"read\": 60\n" +
            "    },\n" +
            "    \"type\": \"roundrobin\",\n" +
            "    \"scheme\": \"http\",\n" +
            "    \"pass_host\": \"node\",\n" +
            "    \"keepalive_pool\": {\n" +
            "      \"idle_timeout\": 60,\n" +
            "      \"requests\": 1000,\n" +
            "      \"size\": 320\n" +
            "    }\n" +
            "  },\n" +
            "  \"enable_websocket\": true,\n" +
            "  \"status\": 1\n" +
            "}";

    public final static String LOGO_REG = "{\n" +
            "  \"uri\": \"/_common_/_file/ext/_common_/setting/dataos_logo.png\",\n" +
            "  \"name\": \"logo\",\n" +
            "  \"methods\": [\n" +
            "    \"GET\",\n" +
            "    \"POST\",\n" +
            "    \"PUT\",\n" +
            "    \"DELETE\",\n" +
            "    \"PATCH\",\n" +
            "    \"HEAD\",\n" +
            "    \"OPTIONS\",\n" +
            "    \"CONNECT\",\n" +
            "    \"TRACE\",\n" +
            "    \"PURGE\"\n" +
            "  ],\n" +
            "  \"plugins\": {\n" +
            "    \"proxy-rewrite\": {\n" +
            "      \"uri\": \"/ontology/_file/ext/ontology/setting/logo-ontology.png\"\n" +
            "    }\n" +
            "  },\n" +
            "  \"upstream\": {\n" +
            "    \"nodes\": [\n" +
            "      {\n" +
            "        \"host\": \"<host>\",\n" +
            "        \"port\": <port>,\n" +
            "        \"weight\": 1\n" +
            "      }\n" +
            "    ],\n" +
            "    \"timeout\": {\n" +
            "      \"connect\": 6,\n" +
            "      \"send\": 6,\n" +
            "      \"read\": 6\n" +
            "    },\n" +
            "    \"type\": \"roundrobin\",\n" +
            "    \"scheme\": \"http\",\n" +
            "    \"pass_host\": \"pass\",\n" +
            "    \"keepalive_pool\": {\n" +
            "      \"idle_timeout\": 60,\n" +
            "      \"requests\": 1000,\n" +
            "      \"size\": 320\n" +
            "    }\n" +
            "  },\n" +
            "  \"status\": 1\n" +
            "}";

    public final static String SANDBOX_PRO = "{\n" +
            "  \"uri\": \"/sandbox_pro/*\",\n" +
            "  \"name\": \"sandbox_pro\",\n" +
            "  \"desc\": \"本体执行沙箱\",\n" +
            "  \"methods\": [\n" +
            "    \"GET\",\n" +
            "    \"POST\",\n" +
            "    \"PUT\",\n" +
            "    \"DELETE\",\n" +
            "    \"PATCH\",\n" +
            "    \"HEAD\",\n" +
            "    \"OPTIONS\",\n" +
            "    \"CONNECT\",\n" +
            "    \"TRACE\",\n" +
            "    \"PURGE\"\n" +
            "  ],\n" +
            "  \"plugins\": {\n" +
            "    \"proxy-rewrite\": {\n" +
            "      \"regex_uri\": [\n" +
            "        \"/sandbox_pro/(.*)\",\n" +
            "        \"/$1\"\n" +
            "      ]\n" +
            "    }\n" +
            "  },\n" +
            "  \"upstream\": {\n" +
            "    \"nodes\": [\n" +
            "      {\n" +
            "        \"host\": \"<host>\",\n" +
            "        \"port\": <port>,\n" +
            "        \"weight\": 1\n" +
            "      }\n" +
            "    ],\n" +
            "    \"timeout\": {\n" +
            "      \"connect\": 600,\n" +
            "      \"send\": 600,\n" +
            "      \"read\": 600\n" +
            "    },\n" +
            "    \"type\": \"roundrobin\",\n" +
            "    \"scheme\": \"http\",\n" +
            "    \"pass_host\": \"pass\",\n" +
            "    \"keepalive_pool\": {\n" +
            "      \"idle_timeout\": 60,\n" +
            "      \"requests\": 1000,\n" +
            "      \"size\": 320\n" +
            "    }\n" +
            "  },\n" +
            "  \"status\": 1\n" +
            "}";

    public final static String ONTOLOGY_SANDBOX = "{\n" +
            "  \"uri\": \"/ontology_sandbox/*\",\n" +
            "  \"name\": \"ontology_sandbox\",\n" +
            "  \"desc\": \"本体执行沙箱\",\n" +
            "  \"methods\": [\n" +
            "    \"GET\",\n" +
            "    \"POST\",\n" +
            "    \"PUT\",\n" +
            "    \"DELETE\",\n" +
            "    \"PATCH\",\n" +
            "    \"HEAD\",\n" +
            "    \"OPTIONS\",\n" +
            "    \"CONNECT\",\n" +
            "    \"TRACE\",\n" +
            "    \"PURGE\"\n" +
            "  ],\n" +
            "  \"plugins\": {\n" +
            "    \"proxy-rewrite\": {\n" +
            "      \"regex_uri\": [\n" +
            "        \"/ontology_sandbox/(.*)\",\n" +
            "        \"/$1\"\n" +
            "      ]\n" +
            "    }\n" +
            "  },\n" +
            "  \"upstream\": {\n" +
            "    \"nodes\": [\n" +
            "      {\n" +
            "        \"host\": \"<host>\",\n" +
            "        \"port\": <port>,\n" +
            "        \"weight\": 1\n" +
            "      }\n" +
            "    ],\n" +
            "    \"timeout\": {\n" +
            "      \"connect\": 600,\n" +
            "      \"send\": 600,\n" +
            "      \"read\": 600\n" +
            "    },\n" +
            "    \"type\": \"roundrobin\",\n" +
            "    \"scheme\": \"http\",\n" +
            "    \"pass_host\": \"pass\",\n" +
            "    \"keepalive_pool\": {\n" +
            "      \"idle_timeout\": 60,\n" +
            "      \"requests\": 1000,\n" +
            "      \"size\": 320\n" +
            "    }\n" +
            "  },\n" +
            "  \"status\": 1\n" +
            "}";

    public final static String ONTOLOGY_SANDBOX_DEV_DEV = "{\n" +
            "  \"uri\": \"/ontology_ontology_dev_dev/*\",\n" +
            "  \"name\": \"ontology_ontology_dev_dev\",\n" +
            "  \"plugins\": {\n" +
            "    \"proxy-rewrite\": {\n" +
            "      \"headers\": {\n" +
            "        \"Connection\": \"upgrade\",\n" +
            "        \"Host\": \"$host:$server_port\",\n" +
            "        \"Origin\": \"\",\n" +
            "        \"Upgrade\": \"$http_upgrade\",\n" +
            "        \"X-Forwarded-For\": \"$proxy_add_x_forwarded_for\",\n" +
            "        \"X-Forwarded-Proto\": \"$scheme\",\n" +
            "        \"X-Real-IP\": \"$remote_addr\"\n" +
            "      },\n" +
            "      \"regex_uri\": [\n" +
            "        \"^/ontology_ontology_dev_dev/(.*)\",\n" +
            "        \"/$1\"\n" +
            "      ],\n" +
            "      \"scheme\": \"http\"\n" +
            "    }\n" +
            "  },\n" +
            "  \"upstream\": {\n" +
            "    \"nodes\": [\n" +
            "      {\n" +
            "        \"host\": \"<host>\",\n" +
            "        \"port\": <port>,\n" +
            "        \"weight\": 1\n" +
            "      }\n" +
            "    ],\n" +
            "    \"timeout\": {\n" +
            "      \"connect\": 60,\n" +
            "      \"send\": 600,\n" +
            "      \"read\": 600\n" +
            "    },\n" +
            "    \"type\": \"roundrobin\",\n" +
            "    \"scheme\": \"http\",\n" +
            "    \"pass_host\": \"pass\",\n" +
            "    \"keepalive_pool\": {\n" +
            "      \"idle_timeout\": 60,\n" +
            "      \"requests\": 1000,\n" +
            "      \"size\": 320\n" +
            "    }\n" +
            "  },\n" +
            "  \"enable_websocket\": true,\n" +
            "  \"status\": 1\n" +
            "}";

    public final static String ONTOLOGY_SANDBOX_DEV_PRO = "{\n" +
            "  \"uri\": \"/ontology_ontology_dev_pro/*\",\n" +
            "  \"name\": \"ontology_ontology_dev_pro\",\n" +
            "  \"plugins\": {\n" +
            "    \"proxy-rewrite\": {\n" +
            "      \"headers\": {\n" +
            "        \"Connection\": \"upgrade\",\n" +
            "        \"Host\": \"$host:$server_port\",\n" +
            "        \"Origin\": \"\",\n" +
            "        \"Upgrade\": \"$http_upgrade\",\n" +
            "        \"X-Forwarded-For\": \"$proxy_add_x_forwarded_for\",\n" +
            "        \"X-Forwarded-Proto\": \"$scheme\",\n" +
            "        \"X-Real-IP\": \"$remote_addr\"\n" +
            "      },\n" +
            "      \"regex_uri\": [\n" +
            "        \"^/ontology_ontology_dev_pro/(.*)\",\n" +
            "        \"/$1\"\n" +
            "      ],\n" +
            "      \"scheme\": \"http\"\n" +
            "    }\n" +
            "  },\n" +
            "  \"upstream\": {\n" +
            "    \"nodes\": [\n" +
            "      {\n" +
            "        \"host\": \"<host>\",\n" +
            "        \"port\": <port>,\n" +
            "        \"weight\": 1\n" +
            "      }\n" +
            "    ],\n" +
            "    \"timeout\": {\n" +
            "      \"connect\": 60,\n" +
            "      \"send\": 600,\n" +
            "      \"read\": 600\n" +
            "    },\n" +
            "    \"type\": \"roundrobin\",\n" +
            "    \"hash_on\": \"vars\",\n" +
            "    \"scheme\": \"http\",\n" +
            "    \"pass_host\": \"pass\",\n" +
            "    \"keepalive_pool\": {\n" +
            "      \"idle_timeout\": 60,\n" +
            "      \"requests\": 1000,\n" +
            "      \"size\": 320\n" +
            "    }\n" +
            "  },\n" +
            "  \"enable_websocket\": true,\n" +
            "  \"status\": 1\n" +
            "}";
}
