import axios from 'axios';
import { runKSQL, runConnector } from '../../components/kafka'
import { KafkaConnectorsInfoStatus } from '../../components/kafka/types';

export const replica_api = axios.create({
    baseURL: 'http://localhost:8000',
    timeout: 50000
});

// Kafka ////////////////////////////////////////////////////////////////
export async function getSchemaSubjects(): Promise<string[]> {
    const resp = await replica_api.get('/v1/cluster/src/schema-registry/')

    return resp.data
}

export async function getConnectors() {
    const resp = await replica_api.get<KafkaConnectorsInfoStatus>('/v1/cluster/connectors/');

    if ( resp.status === 200 )
        return resp.data

    return {}
}

// Source ////////////////////////////////////
// Schema Registry
export async function createSourceSchema() {
    return await replica_api.post('/v1/cluster/src/schema-registry/');
}

// KSQL Table
export async function createSourceKTable() {
    return runKSQL(() => replica_api.post('/v1/cluster/src/ktable/'))
}

export async function deleteSourceKTable() {
    return await runKSQL(() => replica_api.delete('/v1/cluster/src/ktable/'))
}

export async function createSourceConnector(dbHostname: string, dbPort: number, 
    dbName: string, dbUser: string, dbPassword: string, pollInterval: number) {
    return await runConnector(() => replica_api.post('/v1/cluster/src/connector/', {
        db_hostname: dbHostname,
        db_port: dbPort,
        db_name: dbName,
        db_user: dbUser,
        db_password: dbPassword,
        poll_interval: pollInterval,
    }))
}

export async function deleteSourceConnector() {
    return await runConnector(() => replica_api.delete('/v1/cluster/src/connector/'))
}

// Sink //////////////////////////////////////
// KSQL Table
export async function createSinkKTable(dbHostname: string, dbName: string, 
    dbTable: string) {
    return runKSQL(async () => replica_api.post('/v1/cluster/snk/ktables/', {
        db_hostname: dbHostname,
        db_name: dbName,
        db_table: dbTable,
    }))
}

export async function deleteSinkKTable(dbHostname: string, dbName: string, 
    dbTable: string) {
    return await runKSQL(() => replica_api.delete('/v1/cluster/snk/ktables/', {
        data: { db_hostname: dbHostname, db_name: dbName, db_table: dbTable }
    }))
}

export async function createSinkConnector(dbHostname: string, dbPort: number, 
    dbName: string, dbTable: string, dbUser: string, dbPassword: string) {
    return await runConnector(() => replica_api.post('/v1/cluster/snk/connectors/', {
        db_hostname: dbHostname,
        db_port: dbPort,
        db_name: dbName,
        db_table: dbTable,
        db_user: dbUser,
        db_password: dbPassword,
    }))
}

export async function deleteSinkConnector(dbHostname: string, dbName: string, 
    dbTable: string) {
    return await runConnector(() => replica_api.delete('/v1/cluster/snk/connectors/',{
        data: { db_hostname: dbHostname, db_name: dbName, db_table: dbTable }
    }))
}

// Database Target ///////////////////////////
// KSQL Table
export async function createDBTargetKTable() {
    return runKSQL(() => replica_api.post('/v1/cluster/trg/ktable/'))
}

export async function deleteDBTargetKTable() {
    return await runKSQL(() => replica_api.delete('/v1/cluster/trg/ktable/'))
}

export async function createDBTargetKTableQueryable() {
    return runKSQL(() => replica_api.post('/v1/cluster/trg/ktable-queryable/'))
}

export async function deleteDBTargetKTableQueryable() {
    return await runKSQL(() => replica_api.delete('/v1/cluster/trg/ktable-queryable/'))
}

// Accounts /////////////////////////////////////////////////////////////
export async function getAccounts() {
    return await replica_api.get('/v1/accounts/');
}

export async function getAccount(acctID: number) {
    return await replica_api.get('/v1/accounts/' + acctID + '/');
}

export async function configureAcctTarget(
    acctID: number,
    dbTargets: Array<string>,
 ) {
    return await replica_api.post('/v1/accounts/' + acctID + '/trg/', {
        targets: dbTargets,
    });
}

export async function updateName(
    acctID: number,
    name: string,
 ) {
    return await replica_api.patch('/v1/accounts/' + acctID + '/', {
        name: name,
    });
}

export async function createAccount(
    name: string) {
    return await replica_api.post('/v1/accounts/', {
        name: name,
    });
}

export async function updateAccount(
    acctID: number,
    name: string) {
    return await replica_api.patch('/v1/accounts/' + acctID + '/', {
        name: name,
    });
}
