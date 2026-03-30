import lazyload from 'modo-plugin-common/src/utils/lazyload';
import { RouteWithSubRoutesProps } from 'modo-plugin-common/src/router/RouteWithSubRoutes';

const Test = lazyload(() => import('../pages/test'));
const TestClass = lazyload(() => import('../pages/test-class'));
const Object = lazyload(() => import('../pages/object'));
const notFound = lazyload(() => import('./NotFound'));
const OntologyManager = lazyload(() => import('../pages/ontology-manager'));
const OntologySingle = lazyload(() => import('../pages/ontology-manager/single-ontology'));
const OntologyOverview = lazyload(() => import('../pages/ontology-overview'));
const ObjManager = lazyload(() => import('../pages/obj-manager'));
const AttrManager = lazyload(() => import('../pages/attr-manager'));
const ObjOverview = lazyload(() => import('../pages/obj-overview'));
const ObjAttribute = lazyload(() => import('../pages/obj-overview/pages/obj-attribute'));
const ObjAttributeCanvas = lazyload(
  () => import('../pages/obj-overview/pages/obj-attribute-canvas'),
);
const OntologyDetail = lazyload(() => import('../pages/ontology-detail'));
const FunctionDetail = lazyload(() => import('../pages/function-overview'));
const ActionTypeDetail = lazyload(() => import('../pages/action-type-detail'));

const ObjectBrowser = lazyload(() => import('../pages/object-browser'));
const ObjectTypeDetail = lazyload(() => import('../pages/object-browser/object-type-detail/index'));

const RepositoryManager = lazyload(() => import('../pages/repository-manager'));
const SharedCenter = lazyload(() => import('../pages/shared-center'));
const LogicDev = lazyload(() => import('../pages/logic-dev'));
const OntologyGraphPreview = lazyload(() => import('../pages/ontology-graph-preview'));
const OntologyGraphManager = lazyload(() => import('../pages/ontology-graph-manager'));
const SimpleOntologyGraph = lazyload(
  () => import('../pages/ontology-graph-manager/pages/simple-ontology-graph'),
);
const OntologyPublish = lazyload(() => import('../pages/ontology-publish'));
const OntologyServer = lazyload(() => import('../pages/ontology-server'));
const HomePage = lazyload(() => import('../pages/home-page'));
const Graph = lazyload(() => import('../pages/graph'));
const OntologyLogin = lazyload(() => import('../pages/login'));
const Document = lazyload(() => import('../pages/document'));
const ApiManager = lazyload(() => import('../pages/api-manager'));
const AgentEnvironment = lazyload(() => import('../pages/agent-environment'));
const TestComponentDev = lazyload(() => import('../pages/test-component-dev'));
const OntologySimulation = lazyload(() => import('../pages/ontology-simulation'));
const SimulationGraph = lazyload(() => import('../pages/simulation-graph'));

const TestChat = lazyload(() => import('../pages/chat'));
const TestChats = lazyload(() => import('../pages/chat_new/index_new'));
const routes: RouteWithSubRoutesProps[] = [
  {
    path: 'ontology_login',
    name: 'ontology_login',
    component: OntologyLogin,
  },
  {
    path: 'document',
    name: 'document',
    component: Document,
  },
  {
    path: 'graph',
    name: 'graph',
    component: Graph,
  },
  {
    path: 'test_chat/:id',
    name: 'test_chat',
    component: TestChat,
  },
  {
    path: 'test_chats/:id',
    name: 'test_chats',
    component: TestChats,
  },
  {
    path: 'object',
    name: 'object',
    component: Object,
  },
  {
    path: 'ontology_manager',
    name: 'ontology_manager',
    component: OntologyManager,
  },
  {
    path: 'ontology_detail/:id',
    name: 'ontology_single_detail',
    component: OntologySingle,
  },
  {
    path: 'ontology_overview',
    name: 'ontology_overview',
    component: OntologyOverview,
  },
  {
    path: 'ontology_detail',
    name: 'ontology_detail',
    component: OntologyDetail,
  },
  {
    path: 'obj_manager',
    name: 'obj_manager',
    component: ObjManager,
  },
  {
    path: 'attr_manager',
    name: 'attr_manager',
    component: AttrManager,
  },
  {
    path: 'obj_overview',
    name: 'obj_overview',
    component: ObjOverview,
  },
  {
    path: 'obj_attribute',
    name: 'obj_attribute',
    component: ObjAttribute,
  },
  {
    path: 'obj_attribute_canvas',
    name: 'obj_attribute_canvas',
    component: ObjAttributeCanvas,
  },
  {
    path: 'function_detail',
    name: 'function_detail',
    component: FunctionDetail,
  },
  {
    path: 'action_type_detail',
    name: 'action_type_detail',
    component: ActionTypeDetail,
  },
  {
    path: 'obj_browser',
    name: 'obj_browser',
    component: ObjectBrowser,
  },
  {
    path: 'obj_type_detail',
    name: 'obj_type_detail',
    component: ObjectTypeDetail,
  },
  {
    path: 'repository_manager',
    name: 'repository_manager',
    component: RepositoryManager,
  },
  {
    path: 'shared_center',
    name: 'shared_center',
    component: SharedCenter,
  },
  {
    path: 'logic_dev',
    name: 'logic_dev',
    component: LogicDev,
  },
  {
    path: 'ontology_graph_preview',
    name: 'ontology_graph_preview',
    component: OntologyGraphPreview,
  },
  {
    path: 'ontology_graph_mgr',
    name: 'ontology_graph_mgr',
    component: OntologyGraphManager,
  },
  {
    path: 'ontology_graph/:id',
    name: 'simple_ontology_graph',
    component: SimpleOntologyGraph,
  },
  {
    path: 'ontology_publish',
    name: 'ontology_publish',
    component: OntologyPublish,
  },
  {
    path: 'ontology_server',
    name: 'ontology_server',
    component: OntologyServer,
  },
  {
    path: 'home_page',
    name: 'home_page',
    component: HomePage,
  },
  {
    path: 'api_manager',
    name: 'api_manager',
    component: ApiManager,
  },
  {
    path: 'agent_environment',
    name: 'agent_environment',
    component: AgentEnvironment,
  },
  {
    path: 'ontology_simulation',
    name: 'ontology_simulation',
    component: OntologySimulation,
  },
  {
    path: 'ontology_simulation_demo',
    name: 'ontology_simulation_demo',
    component: OntologySimulation,
  },
  {
    path: 'test_component_dev',
    name: 'test_component_dev',
    component: TestComponentDev
  },
  {
    path: 'simulation_graph',
    name: 'simulation_graph',
    component: SimulationGraph
  }
];

export default routes;
