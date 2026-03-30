interface OntologyItem {
  id: string;
  ontologyName: string;
  ontologyLabel: string;
}

export interface ObjectTypeItem {
  id: string;
  objectTypeName: string;
  objectTypeLabel: string;
  objectTypeDesc: string;
  ontology: OntologyItem;
  instanceNum: number;
  status: number;
}
