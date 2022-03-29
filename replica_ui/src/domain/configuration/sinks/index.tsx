import { ConnectionString } from 'connection-string'
import { useState } from 'react'
import { Accordion, Table, Button } from 'react-bootstrap'
import { useNavigate, useParams } from 'react-router-dom'
import { connectorToDiagramStatus } from '../../../components/kafka'
import { KafkaConnectorInfoStatus } from '../../../components/kafka/types'
import { Node } from '../../../components/sys-data-flow/types'
import { Status, STATUSES } from '../../../components/sys-data-flow/status'
import { Sink } from './types'
import SinkPane from './sink'

function parseData(data: KafkaConnectorInfoStatus) {
    const url = new ConnectionString(data.info.config['connection.url']);
    
    let res: Sink = {
        dbHostname: typeof (url.hostname) !== "undefined" ? url.hostname : '',
        dbPort: typeof(url.port) !== "undefined" ? url.port : 5432,
        dbName: typeof (url.path) !== "undefined" ? url.path.join('/') : '',
        dbTable: data.info.config['table.name.format'],
        dbUser: data.info.config['connection.user'],
        dbPassword: '',
        status_topic: data.info.config['continuum.topic'],
        status: connectorToDiagramStatus(data),
    }

    return res
}

type Props = {
    items: Node[]
    reload: () => Promise<void>
}

export default function SinksPane(props: Props) {
    const navigate = useNavigate();
    const { nodeID } = useParams();
    const [activeKey, setActiveKey] = useState<string>(typeof (nodeID) !== 'undefined' ? "1" : "0")

    function handleRowClick(nodeID: string) {
        navigate('/configuration/KC_SNK/' + nodeID)

    }

    function handleNewClick() {
        navigate('/configuration/KC_SNK/new')
        setActiveKey('1')
    }

    function handleAccordionClick(key: string | null) {
        if ( key !== null )
            setActiveKey(key)
    }

    let selected: Sink | null = null
    
    if (nodeID === 'new') {
        selected = {
            dbHostname: 'postgres2',
            dbPort: 5432,
            dbName: 'sink',
            dbTable: 'account',
            dbUser: 'db_user',
            dbPassword: '',
            status_topic: 'replica_status',
            status: STATUSES.UNKNOWN,
        } as Sink
    } else if ( typeof(nodeID) !== 'undefined' ) {
        const search = props.items.find((node) => {
            return node.id === nodeID
        }) ?? null

        if ( search !== null )
            selected = parseData(search.data)
    }

    return (
        <Accordion className="sticky-top" activeKey={activeKey} onSelect={handleAccordionClick}>
            <Accordion.Item eventKey="0">
                <Accordion.Header><h6 className="mb-0">Sinks</h6></Accordion.Header>
                <Accordion.Body>
                    <div className="d-grid gap-2 d-md-flex justify-content-md-end">
                        <Button onClick={handleNewClick}>Add Sink</Button>
                    </div>
                    <Table hover>
                        <thead>
                            <tr>
                                <th rowSpan={2}>Connector Name</th>
                                <th colSpan={4}>Database</th>
                                <th rowSpan={2}>Status</th>
                            </tr>
                            <tr>
                                <th>Hostname</th>
                                <th>Name</th>
                                <th>Table</th>
                                <th>User</th>
                            </tr>
                        </thead>
                        <tbody>
                            {props.items.map((node) => {
                                const sink = parseData(node.data)

                                return (
                                    <tr onClick={() => handleRowClick(node.id)} key={node.id} className={nodeID === node.id ? "table-active" : ""}>
                                        <td>
                                            {node.id}
                                        </td>
                                        <td>
                                            {sink.dbHostname}
                                        </td>
                                        <td>
                                            {sink.dbName}
                                        </td>
                                        <td>
                                            {sink.dbTable}
                                        </td>
                                        <td>
                                            {sink.dbUser}
                                        </td>
                                        <td>
                                            {Status(sink.status)}
                                        </td>
                                    </tr>
                                )
                            })}
                        </tbody>
                    </Table>
                </Accordion.Body>
            </Accordion.Item>
            {selected !== null ? <SinkPane nodeIDs={props.items.map((node) => node.id)} item={selected} reload={props.reload} /> : null}
        </Accordion>
    );
}
