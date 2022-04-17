import axios, { AxiosError, AxiosResponse } from 'axios'
import { STATUSES } from '../sys-data-flow/status'
import { KafkaConnectorInfoStatus } from './types'
import { AlreadyExistsError, AlreadyNotExistsError, NeedToDrop } from './errors'

export async function runKSQL(func: () => Promise<AxiosResponse>) {
    try {
        return await func()
    } catch (err) {
        if (axios.isAxiosError(err)) {
            const axiosErr = err as AxiosError

            switch (axiosErr.response?.status) {
                case 400:
                    if (   axiosErr.response.data.statementText.includes("CREATE TABLE")
                        && axiosErr.response.data.message.includes('already exists'))
                        throw new AlreadyExistsError()
                    else if (axiosErr.response.data.statementText.includes("DROP TABLE")) {
                        if ( axiosErr.response.data.message.includes('does not exist') )
                            throw new AlreadyNotExistsError()

                        const regex = /Cannot drop \w+\.\nThe following streams and\/or tables read from this source: \[(\w+(?:,\w+)*)\]\.\nYou need to drop them before dropping \w+\./
                        const items = axiosErr.response.data.message.match(regex)

                        if (items.length > 0)
                            throw new NeedToDrop(items[1].split(','))
                    }
                    break
            }
        }

        throw err
    }
}

export async function runConnector(func: () => Promise<AxiosResponse>) {
    try {
        return await func()
    } catch (err) {
        if (axios.isAxiosError(err)) {
            const axiosErr = err as AxiosError
            
            switch (axiosErr.response?.status) {
                case 404:
                    throw new AlreadyNotExistsError()
                case 409:
                    if (axiosErr.response.data.message.includes('already exists'))
                        throw new AlreadyExistsError()
                    break
            }
        }

        throw err
    }
}

export function connectorToDiagramStatus(data: KafkaConnectorInfoStatus) {
    switch (data.status.connector.state) {
        case "RUNNING": return STATUSES.OPERATIONAL
        case "PAUSED":  return STATUSES.PAUSED
        default:        return STATUSES.UNKNOWN
    }
}
