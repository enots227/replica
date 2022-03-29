import axios from 'axios';
import { runKSQL, runConnector } from '../../components/kafka'
import { KafkaConnectorsInfoStatus } from '../../components/kafka/types';

export const replica_api = axios.create({
    baseURL: 'http://localhost:8000',
    timeout: 50000
});

// Kafka ////////////////////////////////////////////////////////////////
export async function getSchemaSubjects(): Promise<string[]> {
    const resp = await replica_api.get('/kafka/schema-registry')

    return resp.data
}

export async function getConnectors() {
    const resp = await replica_api.get<KafkaConnectorsInfoStatus>('/kafka/connectors');

    if ( resp.status === 200 )
        return resp.data

    return {}
}

// Source ////////////////////////////////////
// Schema Registry
export async function createSourceSchema() {
    return await replica_api.post('/kafka/schema-registry/src');
}

// KSQL Table
export async function createSourceKTable() {
    return runKSQL(() => replica_api.post('/kafka/ktables/src'))
}

export async function deleteSourceKTable() {
    return await runKSQL(() => replica_api.delete('/kafka/ktables/src'))
}

export async function createSourceConnector(dbHostname: string, dbPort: number, 
    dbName: string, dbUser: string, dbPassword: string, pollInterval: number) {
    return await runConnector(() => replica_api.post('/kafka/connectors/src', {
        db_hostname: dbHostname,
        db_port: dbPort,
        db_name: dbName,
        db_user: dbUser,
        db_password: dbPassword,
        poll_interval: pollInterval,
    }))
}

export async function deleteSourceConnector() {
    return await runConnector(() => replica_api.delete('/kafka/connectors/src'))
}

// Sink //////////////////////////////////////
// KSQL Table
export async function createSinkKTable(dbHostname: string, dbName: string, 
    dbTable: string) {
    return runKSQL(async () => replica_api.post('/kafka/ktables/snk', {
        db_hostname: dbHostname,
        db_name: dbName,
        db_table: dbTable,
    }))
}

export async function deleteSinkKTable(dbHostname: string, dbName: string, 
    dbTable: string) {
    return await runKSQL(() => replica_api.delete('/kafka/ktables/snk', {
        data: { db_hostname: dbHostname, db_name: dbName, db_table: dbTable }
    }))
}

export async function createSinkConnector(dbHostname: string, dbPort: number, 
    dbName: string, dbTable: string, dbUser: string, dbPassword: string) {
    return await runConnector(() => replica_api.post('/kafka/connectors/snk', {
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
    return await runConnector(() => replica_api.delete('/kafka/connectors/snk',{
        data: { db_hostname: dbHostname, db_name: dbName, db_table: dbTable }
    }))
}

// Database Target ///////////////////////////
// KSQL Table
export async function createDBTargetKTable() {
    return runKSQL(() => replica_api.post('/kafka/ktables/db-trg'))
}

export async function deleteDBTargetKTable() {
    return await runKSQL(() => replica_api.delete('/kafka/ktables/db-trg'))
}

export async function createDBTargetKTableQueryable() {
    return runKSQL(() => replica_api.post('/kafka/ktables/db-trg-qry'))
}

export async function deleteDBTargetKTableQueryable() {
    return await runKSQL(() => replica_api.delete('/kafka/ktables/db-trg-qry'))
}

// Accounts /////////////////////////////////////////////////////////////
export async function getAccounts() {
    return await replica_api.get('/accounts/');
}

export async function getAccount(acctID: number) {
    return await replica_api.get('/accounts/' + acctID);
}

export async function configureAcctTarget(
    acctID: number,
    dbTargets: Array<string>,
 ) {
    return await replica_api.post('/kafka/acct-db-trg', {
        acct_id: acctID,
        targets: dbTargets,
    });
}

export async function updateName(
    acctID: number,
    name: string,
 ) {
    return await replica_api.patch('/accounts/' + acctID, {
        name: name,
    });
}

export async function createAccount(
    name: string) {
    return await replica_api.post('/accounts/', {
        name: name,
    });
}

export async function updateAccount(
    acctID: number,
    name: string) {
    return await replica_api.patch('/accounts/' + acctID, {
        name: name,
    });
}
