
export type DiagramConnectors = {
    [nodeGrp: string]: string
}

export type Diagram = {
    connectors?: DiagramConnectors
}

export type KafkaConnectorConfig = {
    [property: string]: any
}

export type KafkaConnectorInfoStatus = {
    info: {
        config: KafkaConnectorConfig
        name: string
        tasks: {
            connector: string
            task: number
        }[]
        type: string
    },
    status: {
        connector: {
            state: string
            worker_id: string
        }
        name: string
        tasks: {
            connector: string
            task: number
            worker_id: string
        }[]
        type: string
    }
}

export type KafkaConnectorsInfoStatus = {
    [connector: string]: KafkaConnectorInfoStatus
}
