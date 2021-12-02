import React, { useState } from 'react';
import { Container, Form, Button, Accordion } from 'react-bootstrap'

import { useNotifier, SuccessNotification, DangerNotification } from '../../components/notifications';
import { configureSink, configureSource, configureTarget, configureTargets } from '../../services/api'

function parseIntSafe(value: string) {
    const parsed = parseInt(value);

    if (isNaN(parsed)) return 0;

    return parsed;
}

function SourceConfig() {
    const [dbHostname, setDBHostname] = useState<string>("postgres1");
    const [dbPort, setDBPort] = useState<number>(5432);
    const [dbUser, setDBUser] = useState<string>("db_user");
    const [dbPassword, setDBPassword] = useState<string>("db_password");

    const notifier  = useNotifier();

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();

        const fetchData = async () => {
            const result = await configureSource(dbHostname, dbPort, dbUser, dbPassword);

            if (result.status === 200) {
                const connectDsp = result.data['source_connector']['resp.status_code'] === 409 ? "already exists" : "was created"
                const ksqlDsp = !Array.isArray(result.data['source_ktable']['resp.text'])  ? "already exists" : "was created"

                notifier.pushNotification(
                    <SuccessNotification title="Successfully Configured Source">The Kafka source connector {connectDsp} and the replica_acct_tbl KTable {ksqlDsp}.</SuccessNotification>
                );
            } else {
                notifier.pushNotification(
                    <DangerNotification title="Failed to Configure Source">Unexpected error occurred.</DangerNotification>
                );
            }

            console.log(result);
        };

        fetchData();
    }

    return (
        <Accordion.Item eventKey="0">
            <Accordion.Header>Source Connector and KTable</Accordion.Header>
            <Accordion.Body>
                <Form onSubmit={handleSubmit}>
                    <Form.Group className="mb-3" controlId="dbHostname">
                        <Form.Label>Database Hostname</Form.Label>
                        <Form.Control type="text" defaultValue={dbHostname}
                            onChange={(e) => { setDBHostname(e.target.value) }} />
                    </Form.Group>
                    <Form.Group className="mb-3" controlId="dbPort">
                        <Form.Label>Database Port</Form.Label>
                        <Form.Control type="number" defaultValue={dbPort}
                            onChange={(e) => { setDBPort(parseIntSafe(e.target.value)) }} />
                    </Form.Group>
                    <Form.Group className="mb-3" controlId="dbUser">
                        <Form.Label>Database Username</Form.Label>
                        <Form.Control type="text" defaultValue={dbUser}
                            onChange={(e) => { setDBUser(e.target.value) }} />
                    </Form.Group>
                    <Form.Group className="mb-3" controlId="dbPassword">
                        <Form.Label>Database Password</Form.Label>
                        <Form.Control type="text" defaultValue={dbPassword}
                            onChange={(e) => { setDBPassword(e.target.value) }} />
                    </Form.Group>
                    <div className="d-grid gap-2 d-md-flex justify-content-md-end">
                        <Button variant="primary" type="submit">
                            Create Connector and KTable
                        </Button>
                    </div>
                </Form>
            </Accordion.Body>
        </Accordion.Item>
    );
}

function TrgConfig() {
    const notifier  = useNotifier();

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        
        const fetchData = async () => {
            const result = await configureTargets();

            if (result.status === 200) {
                const ksqlDsp = !Array.isArray(result.data['trg_ktable']['resp.text'])  ? "already exists" : "was created"

                notifier.pushNotification(
                    <SuccessNotification title="Successfully Configured Targets">The replica_trg_tbl KTable {ksqlDsp}.</SuccessNotification>
                );
            } else {
                notifier.pushNotification(
                    <DangerNotification title="Failed to Configure Targets">Unexpected error occurred.</DangerNotification>
                );
            }

            console.log(result);
        };

        fetchData();
    }

    return (
        <Accordion.Item eventKey="1">
            <Accordion.Header>Targets KTable</Accordion.Header>
            <Accordion.Body>
                <Form onSubmit={handleSubmit}>
                    <div className="d-grid gap-2 d-md-flex justify-content-md-end">
                        <Button variant="primary" type="submit">
                            Create KTable
                        </Button>
                    </div>
                </Form>
            </Accordion.Body>
        </Accordion.Item>
    );
}

function SinkConfig() {
    const [dbHostname, setDBHostname] = useState<string>("postgres2");
    const [dbPort, setDBPort] = useState<number>(5432);
    const [dbName, setDBName] = useState<string>("sink");
    const [dbUser, setDBUser] = useState<string>("db_user");
    const [dbPassword, setDBPassword] = useState<string>("db_password");
    const [pollInterval, setPollInterval] = useState<number>(500);

    const notifier  = useNotifier();

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();

        const fetchData = async () => {
            const result = await configureSink(dbHostname, dbPort, dbName, dbUser, dbPassword, pollInterval);

            if (result.status === 200) {
                const connectDsp = result.data['sink_connector']['resp.status_code'] === 409 ? "already exists" : "was created"
                const ksqlDsp = !Array.isArray(result.data['sink_ktable']['resp.text'])  ? "already exists" : "was created"

                notifier.pushNotification(
                    <SuccessNotification title="Successfully Configured Sink">The Kafka source connector {connectDsp} and the replica_acct_tbl KTable {ksqlDsp}.</SuccessNotification>
                );
            } else {
                notifier.pushNotification(
                    <DangerNotification title="Failed to Configure Sink">Unexpected error occurred.</DangerNotification>
                );
            }

            console.log(result);
        };

        fetchData();
    }

    return (
        <Accordion.Item eventKey="2">
            <Accordion.Header>Sink Connector and KTable</Accordion.Header>
            <Accordion.Body>
                <Form onSubmit={handleSubmit}>
                    <Form.Group className="mb-3" controlId="dbHostname">
                        <Form.Label>Database Hostname</Form.Label>
                        <Form.Control type="text" defaultValue={dbHostname}
                            onChange={(e) => { setDBHostname(e.target.value) }} />
                    </Form.Group>
                    <Form.Group className="mb-3" controlId="dbPort">
                        <Form.Label>Database Port</Form.Label>
                        <Form.Control type="number" defaultValue={dbPort}
                            onChange={(e) => { setDBPort(parseIntSafe(e.target.value)) }} />
                    </Form.Group>
                    <Form.Group className="mb-3" controlId="dbName">
                        <Form.Label>Database Name</Form.Label>
                        <Form.Control type="text" defaultValue={dbName}
                            onChange={(e) => { setDBName(e.target.value) }} />
                    </Form.Group>
                    <Form.Group className="mb-3" controlId="dbUser">
                        <Form.Label>Database Username</Form.Label>
                        <Form.Control type="text" defaultValue={dbUser}
                            onChange={(e) => { setDBUser(e.target.value) }} />
                    </Form.Group>
                    <Form.Group className="mb-3" controlId="dbPassword">
                        <Form.Label>Database Password</Form.Label>
                        <Form.Control type="text" defaultValue={dbPassword}
                            onChange={(e) => { setDBPassword(e.target.value) }} />
                    </Form.Group>
                    <Form.Group className="mb-3" controlId="dbID">
                        <Form.Label>Poll Interval</Form.Label>
                        <Form.Control type="number" defaultValue={pollInterval}
                            onChange={(e) => { setPollInterval(parseIntSafe(e.target.value)) }} />
                    </Form.Group>
                    <div className="d-grid gap-2 d-md-flex justify-content-md-end">
                        <Button variant="primary" type="submit">
                            Create KTable and Connector
                        </Button>
                    </div>
                </Form>
            </Accordion.Body>
        </Accordion.Item>
    );
}

function TrgAcctConfig() {
    const [acctID, setAcctID] = useState<number>();
    const [dbTargets, setDBTargets] = useState<Array<string>>([]);

    const notifier  = useNotifier();

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();

        const fetchData = async () => {
            if ( typeof acctID === "undefined" ) {
                notifier.pushNotification(
                    <DangerNotification title="Failed to Configure Sink">Account ID is Required.</DangerNotification>
                );
                return;
            }

            const result = await configureTarget(acctID, dbTargets);

            if (result.status === 200) {
                notifier.pushNotification(
                    <SuccessNotification title="Successfully Configured Target">The database target for account {acctID} was successfully configured.</SuccessNotification>
                );
            } else {
                notifier.pushNotification(
                    <DangerNotification title="Failed to Configure Sink">Unexpected error occurred.</DangerNotification>
                );
            }

            console.log(result);
        };

        fetchData();
    }

    return (
        <Accordion.Item eventKey="3">
            <Accordion.Header>Target KTable - Insert/Update Account Database Targets</Accordion.Header>
            <Accordion.Body>
                <Form onSubmit={handleSubmit}>
                    <Form.Group className="mb-3" controlId="acctID">
                        <Form.Label>Account ID</Form.Label>
                        <Form.Control type="text" defaultValue={acctID} 
                            onChange={(e) => { setAcctID(parseIntSafe(e.target.value)) }} />
                    </Form.Group>
                    <Form.Group className="mb-3" controlId="trgs">
                        <Form.Label>Database Targets</Form.Label>
                        <Form.Control type="text" defaultValue={dbTargets}
                            onChange={(e) => { setDBTargets(e.target.value.split(',')) }} />
                        <Form.Text>Comma separated list of database IDs.</Form.Text>
                    </Form.Group>
                    <div className="d-grid gap-2 d-md-flex justify-content-md-end">
                        <Button variant="primary" type="submit">
                            Insert/Update KTable
                        </Button>
                    </div>
                </Form>
            </Accordion.Body>
        </Accordion.Item>
    );
}

function ConfigurationPage() {
    return (
        <Container className="pt-4">
            <Accordion defaultActiveKey="0">
                <SourceConfig />
                <TrgConfig />
                <SinkConfig />
                <TrgAcctConfig />
            </Accordion>
        </Container>
    );
}

export default ConfigurationPage;
