import { useEffect, useState } from 'react';
import { Container } from 'react-bootstrap'
import SourcesPane from './sources'
import SinksPane from './sinks'
import TargetPane from './database_targets'
import Diagram from '../../components/sys-data-flow'
import { NodeGroups, Node, NodeEdgesTo } from '../../components/sys-data-flow/types'
import { getConnectors } from '../../services/api'

async function loadData() {
    let res: NodeGroups = {}

    const push = (nodeGrp: string, node: Node) => {
        if ( !(nodeGrp in res) )
            res[nodeGrp] = []
    
        res[nodeGrp].push(node)
    }

    const connectors = await getConnectors()

    for ( const [name, config] of Object.entries(connectors) ) {
        const nameParts = name.split('_')

        if ( nameParts[0] === 'replica' ) {
            const kcNodeGrp = 'KC_' + nameParts[1].toUpperCase()

            switch ( nameParts[1] ) {
                case 'src':
                    push(kcNodeGrp, { id: name, data: config })
                    break
                case 'snk':
                    const ktNodeGrp = 'KT_SNK'
                    { // KTBL_SNK-->KT_SNK
                        const ktblNodeGrp = 'KTBL_SNK'
    
                        let edgesTo: NodeEdgesTo = {}
                        edgesTo[ktNodeGrp] = [name]
    
                        push(ktblNodeGrp, { id: name, edgesTo: edgesTo })
                    }
                    { // KT_SNK-->KC_SNK
                        let edgesTo: NodeEdgesTo = {}
                        edgesTo[kcNodeGrp] = [name]
    
                        push(ktNodeGrp, { id: name, edgesTo: edgesTo })
                    }
                    { // KC_SNK-->DB_SNK
                        const dbNodeGrp = 'DB_SNK'
    
                        let edgesTo: NodeEdgesTo = {}
                        edgesTo[dbNodeGrp] = [name]
    
                        push(kcNodeGrp, { id: name, data: config, edgesTo: edgesTo })
                        push(dbNodeGrp, { id: name, data: config.info.config['connection.url'] })
                    }
                    break
            }
        }
    }

    return res
}

function nodeLabeler(id: string, num: number) {
    const parts = id.split('_')

    if ( parts.length === 5 && parts[1] === 'snk' ) {
        return parts[2] + '/' + parts[3]
    }

    return id
}

function Page() {
    const [nodeGroups, setNodeGroups] = useState<NodeGroups>({})

    const load = async () => {
        const data = await loadData()
        setNodeGroups(data)
    }

    useEffect(() => {
        load()
    }, [setNodeGroups])

    return (
        <Container fluid className="pt-2">
            <Diagram chartTemplate={`
                flowchart
                    RUI[Replica\\nUI]
                    RAPI(Replica\\nAPI)
                    RB[Replica Broadcast\\nWeb Socket API]
                    KT_STAT(Replica Status\\nKafka Topic)
                    DB_SRC[(DB)]
                    KC_SRC{{Source\\nKafka Connector}}
                    KT_ACCT(Accounts\\nKafka Topic)
                    KTBL_ACCT(Accounts\\nKSQL Table)
                    KT_TRG(Account Target Databses\\nKafka Topic)
                    KTBL_TRG(Account Target Databases\\nKSQL Table)
                    KTBL_SNK($nodeLabel\\nDB Accounts\\nKSQL Table)
                    KT_SNK($nodeLabel\\nDB Accounts\\nKafka Topic)
                    KC_SNK{{$nodeLabel\\nSink DB\\nKafka Connector}}
                    DB_SNK[($nodeLabel\\nDB)]

                    style KT_ACCT fill:#9370DB,color: #fff
                    style KT_TRG fill:#9370DB,color: #fff
                    style KT_SNK fill:#9370DB,color: #fff
                    style KT_STAT fill:#9370DB,color: #fff
                    style KC_SRC fill:#4319DF,color: #fff
                    style KC_SNK fill:#4319DF,color: #fff

                    RUI-->RAPI
                    RAPI-->DB_SRC
                    RAPI-->KT_TRG
                    DB_SRC-->KC_SRC
                    KC_SRC-->KT_ACCT
                    KC_SRC-->KT_STAT
                    KT_ACCT-->KTBL_ACCT
                    KTBL_ACCT-->KTBL_SNK
                    KT_TRG-->KTBL_TRG
                    KTBL_TRG-->KTBL_SNK
                    KTBL_SNK-->KT_SNK
                    KT_SNK-->KC_SNK
                    KC_SNK-->DB_SNK
                    KC_SNK-->KT_STAT
                    KT_STAT-->RB
                    RB<-->RUI
            `} nodeGrps={nodeGroups} nodePanes={{
                'KC_SRC': SourcesPane,
                'KC_SNK': SinksPane,
                'KT_TRG': TargetPane,
            }} nodeLabeler={nodeLabeler} reload={load} />
        </Container>
    );
}

export default Page;
