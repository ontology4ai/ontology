import axios from 'modo-plugin-common/src/core/src/http';

const base='';

export const removeRel = (interfaceId, objId) => {
  return axios.post(`${base}/_api/ontology/interface/removeObj/${interfaceId}`, 
  	[objId]
  )
};

export const updateAttr = (id, data) => {
  return axios.post(`${base}/_api/ontology/object/type/update/attr/${id}`, data)
}

