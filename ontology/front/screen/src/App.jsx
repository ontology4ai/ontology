import React from 'react'
import './App.css'
import Frame from './components/Frame';
import Home from './pages/Home';
import OntologyPlatform from './pages/OntologyPlatform';
import OntologyBuild from './pages/OntologyBuild';
import AgentAppNew from './pages/AgentAppNew';

import { withTranslation } from 'react-i18next';

class App extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            navActive: 'home'
            // navActive: 'ontology-platform'
            // navActive: 'ontology-build'
            // navActive: 'agent-app'
        };
        this.ontologyPlatformRef = React.createRef();
    }
    render() {
        const {
            navActive
        } = this.state;
        const { t } = this.props;
        return (
            <>
            <div
                id="app"
                className="copilot-screen">
                <Frame
                    title={t('ontology.platform')}
                    navList={[
                        { label: t('homepage'), name: 'home' },
                        { label: t('platform.intro'), name: 'ontology-platform' },
                        { label: t('ontology.builder'), name: 'ontology-build' },
                        { label: t('ai.agents'), name: 'agent-app' }
                    ]}
                    navActive={navActive}
                    bgSrc={new URL('./imgs/image.png', import.meta.url).href}
                    push={nav => {
                        this.setState({
                            navActive: nav.name
                        })
                    }}
                    contentScroll={() => {}}
                    handleClick={(e) => {
                        this.ontologyPlatformRef.current?.handlePos(e)
                    }}
                    handleBackHome={() => {
                        this.setState({
                            navActive: 'home'
                        })
                    }}>
                    {navActive === 'home' ? <Home/> : null}
                    {navActive === 'ontology-platform' ? <OntologyPlatform ref={this.ontologyPlatformRef}/> : null}
                    {navActive === 'ontology-build' ? <OntologyBuild
                        push={key => {
                            this.setState({
                                navActive: key
                            })
                        }}/> : null}
                    {navActive === 'agent-app' ? <AgentAppNew/> : null}
                </Frame>
            </div>
            </>
        )
    }
}

export default withTranslation()(App);
