import { Card } from 'react-bootstrap'
import { ConnectionString } from 'connection-string'
import { Node } from '../../../components/sys-data-flow/types'
import { Status, STATUSES } from '../../../components/sys-data-flow/status'
import { connectorToDiagramStatus } from '../../../components/kafka'
import { KafkaConnectorInfoStatus } from '../../../components/kafka/types'
import { Source } from './types'
import SourcePane from './source'

function parseData(data: KafkaConnectorInfoStatus) {
    const url = new ConnectionString(data.info.config['connection.url']);

    let res: Source = {
        dbHostname: typeof (url.hostname) !== "undefined" ? url.hostname : '',
        dbPort: typeof(url.port) !== "undefined" ? url.port : 5432,
        dbName: typeof (url.path) !== "undefined" ? url.path.join('/') : '',
        dbUser: data.info.config['connection.user'],
        dbPassword: '',
        pollInterval: 500,
        status_topic: '',
        status: connectorToDiagramStatus(data),
    }

    return res
}

type Props = {
    items: Node[],
}

export default function SourcesPane(props: Props) {
    let selected: Source = {
        dbHostname: 'postgres1',
        dbPort: 5432,
        dbName: 'source',
        dbUser: 'db_user',
        dbPassword: '',
        status_topic: 'replica_status',
        status: STATUSES.UNKNOWN,
        pollInterval: 500,
    } as Source

    if (props.items.length > 0) {
        const item = props.items[0]

        if (typeof(item) !== "undefined")
            selected = parseData(item.data)
    }

    return <Card className="sticky-top">
        <Card.Header>Source {Status(selected.status)}</Card.Header>
        <Card.Body>
            <SourcePane item={selected} />
        </Card.Body>
    </Card>
}
