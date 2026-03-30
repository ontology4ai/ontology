import React, {useEffect,useState,useRef} from "react";
import {
    Button,
    Form,
    Layout,
    Message, Spin,
} from "@arco-design/web-react";
import ModoTabs from '@/components/Tabs';
import {
    IconImageCircleColor
} from "modo-design/icon";
import './simple-index.less'
import {getOntologyList, getOntologyById} from "@/pages/ontology-graph-preview/api";

import {useParams} from "react-router-dom";
import GraphDetail from '@/pages/ontology-graph-manager/pages/graph-detail/graph-detail';

const OntologyGraph = ()=>{

    let { id } = useParams();
    const [ontology,setOntology]=useState(null);
    const [loading,setLoading]=useState(false);
    const getData = ()=>{
       // const param = {status:1,published:1};
        setLoading(true);
        getOntologyById({ontologyId:id}).then(res=>{
            if(res.data.success){
                const data = res.data.data;//.find(item=>item.id === id);
                data && setOntology(data);
            }
        }).finally(()=>{
            setLoading(false);
        })
    };

    useEffect(()=>{
        id && getData()
    },[id]);
    return (
      <div className='graph-container'>
          <ModoTabs
            title='图谱预览'
            icon={<IconImageCircleColor/>}>
              <div className="filter-table">
                  <Spin style={{display: 'block', width: '100%', height: '100%'}} loading={loading}>
                      {ontology && <GraphDetail
                          key={id}
                          ontology={ontology}
                          pubVersion={false}
                          onChange={() => {
                              getData();
                          }}
                      />}
                  </Spin>
              </div>
          </ModoTabs>
      </div>
    )
};
export default OntologyGraph;
