import axios from 'axios';

const replica_api = axios.create({
    baseURL: 'http://localhost:8000',
    timeout: 5000
});

export async function getAccounts() {
    return await replica_api.get('/accounts/');
}

export async function getAccount(acctID: number) {
    return await replica_api.get('/accounts/' + acctID);
}

export async function configureSource(
    dbHostname: string,
    dbPort: number,
    dbUser: string,
    dbPassword: string
 ) {
    return await replica_api.post('/kafka/source/setup', {
        database_hostname: dbHostname,
        database_port: dbPort,
        database_username: dbUser,
        database_password: dbPassword,
    });
}

export async function configureTargets() {
    return await replica_api.post('/kafka/target/setup');
}

export async function configureSink(
    dbHostname: string,
    dbPort: number,
    dbName: string,
    dbUser: string,
    dbPassword: string,
    pollInterval: number,
 ) {
    return await replica_api.post('/kafka/sink/setup', {
        database_hostname: dbHostname,
        database_port: dbPort,
        database_name: dbName,
        database_username: dbUser,
        database_password: dbPassword,
        poll_interval: pollInterval,
    });
}

export async function configureTarget(
    acctID: number,
    dbTargets: Array<string>,
 ) {
    return await replica_api.post('/kafka/target', {
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
