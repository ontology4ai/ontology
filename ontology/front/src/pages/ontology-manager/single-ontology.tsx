import React from 'react';
import { useParams } from 'react-router-dom';
import OntologyManager from '@/pages/ontology-manager';
function OntologyManagerWrapper(props) {
    const params = useParams();
    return <OntologyManager {...props} params={params} />;
}

export default OntologyManagerWrapper;
