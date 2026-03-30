package com.asiainfo.feign;

import com.asiainfo.feign.request.DataAccessParam;
import com.asiainfo.feign.response.*;
import feign.Headers;
import feign.Param;
import feign.RequestLine;
import io.github.suanchou.web.Response;
import org.springframework.web.bind.annotation.RequestBody;

import com.asiainfo.feign.request.DifyBatchRequest;
import com.asiainfo.feign.request.DifyChatRequest;
import com.asiainfo.feign.request.DifyConversationRequest;
import com.asiainfo.feign.request.DifyMessageRequest;
import com.asiainfo.feign.request.OntologyFileExportRequest;
import com.asiainfo.feign.request.OntologyFileImportRequest;
import com.asiainfo.feign.request.OntologyGraphRequest;
import com.asiainfo.feign.request.OntologyMigrateInRequest;
import com.asiainfo.feign.request.OntologyMigrateOutRequest;
import com.asiainfo.feign.request.OntologyObjectCreateRequest;

import java.util.List;
import java.util.Map;

/**
 * @author WangYu
 * @date 2023/8/15 18:25
 */
public interface DataosFeign extends FeignInterface {

        @RequestLine("GET /dataps/_api/_/dataaccess/getDsTablesSense?teamName={teamName}&runEnv=METADB&dsName={dsName}&dsType={dsType}&dsUserId=&dsSchema={dsSchema}&dsProfile={dsProfile}")
        @Headers({ "Cookie:{cookie}" })
        Response<Map<String, Object>> findTables(@Param("teamName") String teamName,
                        @Param("dsName") String dsName,
                        @Param("dsType") String dsType,
                        @Param("dsSchema") String dsSchema,
                        @Param("dsProfile") String dsProfile,
                        @Param("cookie") String cookie);

        @RequestLine("GET /dataps/_api/_/dataaccess/getDsViews?teamName={teamName}&runEnv=METADB&dsName={dsName}&dsType={dsType}&dsUserId=&dsSchema={dsSchema}&dsProfile={dsProfile}")
        @Headers({ "Cookie:{cookie}" })
        Response<Map<String, Object>> getDsViews(@Param("teamName") String teamName,
                        @Param("dsName") String dsName,
                        @Param("dsType") String dsType,
                        @Param("dsSchema") String dsSchema,
                        @Param("dsProfile") String dsProfile,
                        @Param("cookie") String cookie);

        @RequestLine("GET /dataps/_api/_/dataaccess/getTableInfoSense?teamName={teamName}&runEnv=METADB&dsName={dsName}&dsType={dsType}&dsUserId=&dsSchema={dsSchema}&dsProfile={dsProfile}&tableName={tableName}")
        @Headers({ "Cookie:{cookie}" })
        Response<Map<String, Object>> findTableInfo(@Param("teamName") String teamName,
                        @Param("dsName") String dsName,
                        @Param("dsType") String dsType,
                        @Param("dsSchema") String dsSchema,
                        @Param("dsProfile") String dsProfile,
                        @Param("tableName") String tableName,
                        @Param("cookie") String cookie);

        @RequestLine("GET /dataps/_api/_/dataaccess/getDsViewColumns?teamName={teamName}&runEnv=METADB&dsName={dsName}&dsType={dsType}&dsUserId=&dsSchema={dsSchema}&dsProfile={dsProfile}&viewName={viewName}")
        @Headers({ "Cookie:{cookie}" })
        Response<Map<String, Object>> getDsViewColumns(@Param("teamName") String teamName,
                        @Param("dsName") String dsName,
                        @Param("dsType") String dsType,
                        @Param("dsSchema") String dsSchema,
                        @Param("dsProfile") String dsProfile,
                        @Param("viewName") String viewName,
                        @Param("cookie") String cookie);

        @RequestLine("POST /dataps/_api/_/dataaccess/execute")
        @Headers({ "Cookie: {cookie}", "Content-Type: application/json" })
        Response<List<Map<String, Object>>> executeSql(@RequestBody DataAccessParam param,
                        @Param("cookie") String cookie);

        /**
         * 查询工作空间信息
         */
        @RequestLine("GET /_common_/_api/_/workspace/find-by-name/{name}")
        @Headers({"Cookie: {cookie}", "Content-Type: application/json"})
        Response<Map<String, Object>> findWorkspaceInfoByName(@Param("name") String name,
                                                              @Param("cookie") String cookie);

        /**
         * 创建程序
         */
        @RequestLine("POST /dataps/_api/_/modoProc/save")
        @Headers({"Cookie: {cookie}", "Content-Type: application/json"})
        Response<Map<String, Object>> createProc(@RequestBody Map<String, Object> param,
                                                 @Param("cookie") String cookie);

        /**
         * 保存多表任务
         */
        @RequestLine("POST /dataos_datastash/_api/_/datastash/proc/save")
        @Headers({"Cookie: {cookie}", "Content-Type: application/json"})
        Response<Map<String, Object>> saveProc(@RequestBody Map<String, Object> param,
                                               @Param("cookie") String cookie);

        /**
         * 保存创建表
         */
        @RequestLine("POST /dataos_datastash/_api/_/datastash/table/saveList")
        @Headers({"Cookie: {cookie}", "Content-Type: application/json"})
        Response<Map<String, Object>> saveList(@RequestBody List<Map<String, Object>> param,
                                               @Param("cookie") String cookie);

        /**
         * 查询调度工作组
         */
        @RequestLine("GET /dataflow/_api/_/dataflow/permit/broker/list?teamName={teamName}")
        @Headers({"Cookie: {cookie}", "Content-Type: application/json"})
        Response<List<Map<String, Object>>> listBroker(@Param("teamName") String teamName,
                                                 @Param("cookie") String cookie);

        /**
         * 查询调度任务状态
         */
        @RequestLine("POST /dataflow/open/dataflow/monitor/post/getTableData")
        @Headers({"Cookie: {cookie}", "Content-Type: application/json"})
        Response<Map<String, Object>> getJobData(@RequestBody Map<String, Object> param,
                                                       @Param("cookie") String cookie);

        /**
         * 创建本体对象
         * POST /ontology_back/api/v1/ontology/object/create
         * Content-Type: application/json
         */
        @RequestLine("POST /ontology_back/api/v1/ontology/object/create")
        @Headers("Content-Type: application/json")
        OntologyObjectCreateResponse createOntologyObject(@RequestBody OntologyObjectCreateRequest request);

        @RequestLine("POST /ontology_sandbox/api/v1/ontology/object/delete_ontology")
        @Headers("Content-Type: application/json")
        Map<String, Object> deleteOntology(@RequestBody Map<String, Object> request);

        @RequestLine("POST /ontology_sandbox/api/v1/ontology/object/exchange")
        @Headers("Content-Type: application/json")
        Response<Map<String, Object>> refreshOntology(@RequestBody Map<String, Object> request);

        @RequestLine("POST /ontology_sandbox/api/v1/ontology/object/update")
        @Headers("Content-Type: application/json")
        Map<String, Object> updateOntologyObject(@RequestBody Map<String, Object> request);

        @RequestLine("POST /ontology_sandbox/api/v1/ontology/object/delete")
        @Headers("Content-Type: application/json")
        Map<String, Object> deleteOntologyObject(@RequestBody Map<String, Object> request);

        @RequestLine("GET /ontology_sandbox/functions/refresh?ontology_id={ontology_id}")
        @Headers("Content-Type: application/json")
        CommonResponse registerFunction(@Param("ontology_id") String ontology_id);

        @RequestLine("GET /ontology_sandbox/functions/list_files?ontology_id={ontology_id}")
        @Headers("Content-Type: application/json")
        Map<String, Object> listFunctionFiles(@Param("ontology_id") String ontology_id);

        @RequestLine("POST /ontology_sandbox/functions/create")
        @Headers("Content-Type: application/json")
        Map<String, Object> createFunction(@RequestBody Map<String, Object> request);

        @RequestLine("POST /ontology_sandbox/functions/delete")
        @Headers("Content-Type: application/json")
        Map<String, Object> deleteFunction(@RequestBody Map<String, Object> request);

        @RequestLine("POST /ontology_sandbox/api/v1/ontology/object/sync_to_user")
        @Headers("Content-Type: application/json")
        Map<String, Object> publishOntology(@RequestBody Map<String, Object> request);

        @RequestLine("GET /ontology_sandbox/actions/list_files?ontology_id={ontology_id}")
        @Headers("Content-Type: application/json")
        Map<String, Object> listActionFiles(@Param("ontology_id") String ontology_id);

        @RequestLine("POST /ontology_sandbox/actions/create_fun")
        @Headers("Content-Type: application/json")
        Map<String, Object> createActionFunction(@RequestBody Map<String, Object> request);

        @RequestLine("POST /ontology_sandbox/actions/delete")
        @Headers("Content-Type: application/json")
        Map<String, Object> deleteActionFunction(@RequestBody Map<String, Object> request);

        @RequestLine("GET /ontology_sandbox/actions/refresh?ontology_id={ontology_id}")
        @Headers("Content-Type: application/json")
        CommonResponse registerActionFunction(@Param("ontology_id") String ontology_id);

        @RequestLine("POST /ontology_sandbox/actions/create_obj")
        @Headers("Content-Type: application/json")
        CommonResponse createActionObject(@RequestBody Map<String, Object> request);

        /**
         * 对象类型属性名称推荐
         * 
         * @param request 字段列表
         * @return 推荐的属性名称
         */
        @RequestLine("POST /ontology_back/api/v1/ontology/object/get_zh_name")
        @Headers("Content-Type: application/json")

        ObjectTypeAttributeSuggestResponse suggestAttribute(@RequestBody List<String> request);

        @RequestLine("POST /ontology_back/api/v1/ontology/object/import_owl")
        @Headers("Content-Type: application/json")
        OntologyFileImportResponse importOntologyFile(@RequestBody OntologyFileImportRequest request);

        @RequestLine("POST /ontology_back/api/v1/ontology/object/export_owl")
        @Headers("Content-Type: application/json")
        OntologyFileExportResponse exportOntologyFile(@RequestBody OntologyFileExportRequest request);

        @RequestLine("POST /ontology_back/api/v1/ontology/ontology/migrate_in")
        @Headers("Content-Type: application/json")
        OntologyMigrateInResponse ontologyMigrateIn(@RequestBody OntologyMigrateInRequest request);

        @RequestLine("POST /ontology_back/api/v1/ontology/ontology/migrate_out")
        @Headers("Content-Type: application/json")
        OntologyMigrateOutResponse ontologyMigrateOut(@RequestBody OntologyMigrateOutRequest request);

        @RequestLine("POST /ontology_back/api/v1/ontology/get_graph_data")
        @Headers("Content-Type: application/json")
        OntologyGraphResponse getGraphByOntologyId(@RequestBody OntologyGraphRequest request);

        @RequestLine("GET /ontology_back/api/v1/ontology/expand_node?object_type_id={object_type_id}&pub_version={pub_version}")
        @Headers("Content-Type: application/json")
        OntologyGraphResponse expandGraphNodeByTypeId(@Param("object_type_id") String object_type_id,
                        @Param("pub_version") String pub_version);

        @RequestLine("GET /ontology_back/api/v1/ontology/prompt/common")
        @Headers("Content-Type: application/json")
        CommonResponse getPrompt();

        @RequestLine("GET /ontology_back/api/v1/ontology/prompt/oag?ontology_id={ontologyId}")
        @Headers("Content-Type: application/json")
        CommonResponse getOagPrompt(@Param("ontologyId") String ontologyId);

        /**
         * 修改API
         * POST /functions/update/api_definition
         * Content-Type: application/json
         */
        @RequestLine("POST /ontology_sandbox/functions/update/api_definition")
        @Headers("Content-Type: application/json")
        CommonResponse updateFunctionsApiDefinition(@RequestBody Map<String, Object> request);

        /**
         * 修改API
         * POST /functions/update/api_definition
         * Content-Type: application/json
         */
        @RequestLine("POST /ontology_sandbox/actions/update/api_definition")
        @Headers("Content-Type: application/json")
        CommonResponse updateActionsApiDefinition(@RequestBody Map<String, Object> request);

        @RequestLine("POST /ontology_sandbox/actions/create_api")
        @Headers("Content-Type: application/json")
        Map<String, Object> createActionApi(@RequestBody Map<String, Object> request);

        @RequestLine("POST /ontology_sandbox/object/apis/find")
        @Headers("Content-Type: application/json")
        Object findObject(@RequestBody Map<String, Object> request);
        
        @RequestLine("GET /ontology_sandbox/utils/refresh")
        @Headers("Content-Type: application/json")
        CommonResponse syncApiFunction();

        @RequestLine("POST /ontology_back/api/v1/ontology/agent/messages")
        @Headers("Content-Type: application/json")
        CommonDifyResponse getDifyMessages(@RequestBody DifyMessageRequest request);

        @RequestLine("POST /ontology_back/api/v1/ontology/agent/conversations")
        @Headers("Content-Type: application/json")
        CommonDifyResponse getDifyConversations(@RequestBody DifyConversationRequest request);

        @RequestLine("POST /ontology_back/api/v1/ontology/agent/chat/{taskId}/stop")
        @Headers("Content-Type: application/json")
        CommonDifyResponse stopChatWithDify(@Param("taskId") String taskId, @RequestBody DifyChatRequest request);

        @RequestLine("POST /ontology_back/api/v1/ontology/agent/conversations/delete")
        @Headers("Content-Type: application/json")
        ConversationDeleteResponse deleteConversationById(@RequestBody DifyConversationRequest request);

        @RequestLine("POST /ontology_back/api/v1/ontology/agent/batch_test/submit")
        @Headers("Content-Type: application/json")
        CommonDifyResponse startBatchWithDify(@RequestBody DifyBatchRequest request);

        @RequestLine("POST /ontology_back/api/v1/ontology/agent/batch_test/stop")
        @Headers("Content-Type: application/json")
        CommonDifyResponse stopBatchWithDify(@RequestBody DifyBatchRequest request);


        @RequestLine("POST /ontology_back/api/v1/ontology/task/import")
        @Headers("Content-Type: application/json")
        Map<String, Object> runProccessImport(@RequestBody Map<String, Object> request);

}
