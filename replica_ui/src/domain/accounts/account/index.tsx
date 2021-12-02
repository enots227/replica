import React, { useEffect, useState } from 'react';
import { Form, Button, Accordion } from 'react-bootstrap'
import { IAccount, IAccountProps } from '..';
import AccountMonitor from '../../../components/accountMonitor';

import { DangerNotification, INotifierContext, SuccessNotification, useNotifier } from '../../../components/notifications';
import { configureTarget, createAccount, updateAccount } from '../../../services/api';

function Account(props: IAccountProps) {
    const notifier = useNotifier();

    const isNew = props.account.id === 0

    function setName(e: React.ChangeEvent<HTMLInputElement>) {
        props.setAccount({ ...props.account, name: e.target.value });
    }

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();

        const asyncFunc = async () => {
            await setAccount(notifier, props.account)

            if (typeof props.afterSubmit !== "undefined")
                props.afterSubmit()
        };
        asyncFunc();
    }

    return (
        <Accordion.Item eventKey="0">
            <Accordion.Header>{isNew ? "New Account" : "Account " + props.account.id}</Accordion.Header>
            <Accordion.Body>
                <Form onSubmit={handleSubmit}>
                    <Form.Group className="mb-3" controlId="acctName">
                        <Form.Label>Name</Form.Label>
                        <Form.Control type="text" value={props.account.name}
                            onChange={setName} />
                    </Form.Group>
                    <div className="d-grid gap-2 d-md-flex justify-content-md-end">
                        <Button variant="primary" type="submit">
                            {isNew ? "Create" : "Update"}
                        </Button>
                    </div>
                </Form>
            </Accordion.Body>
        </Accordion.Item>
    );
}

function AccountDatabaseTarget(props: IAccountProps) {
    const [accountID, setAccountID] = useState<number>();
    const [dbTargets, setDBTargets] = useState<string[]>(props.account.targets)

    const notifier = useNotifier();

    useEffect(() => {
        if (accountID === props.account.id) return;
        
        setDBTargets(props.account.targets)
        setAccountID(props.account.id)
    }, [props, accountID])
    
    if (props.account.id === 0) return null;

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();

        const fetchData = async () => {
            const result = await configureTarget(props.account.id, dbTargets);

            if (result.status === 200) {
                notifier.pushNotification(
                    <SuccessNotification title="Successfully Configured Target">The database target for account {props.account.id} was successfully configured.</SuccessNotification>
                );
            } else {
                notifier.pushNotification(
                    <DangerNotification title="Failed to Configure Sink">Unexpected error occurred.</DangerNotification>
                );
            }

            console.log(result)
            
            props.setAccount({
                ...props.account,
                targets: dbTargets
            })
        };

        fetchData();
    }

    return (
        <Accordion.Item eventKey="1">
            <Accordion.Header>Account {props.account.id} Database Targets</Accordion.Header>
            <Accordion.Body>
                <Form onSubmit={handleSubmit}>
                    <Form.Group className="mb-3" controlId="trgs">
                        <Form.Label>Database Targets</Form.Label>
                        <Form.Control type="text" value={dbTargets}
                            onChange={(e) => { setDBTargets( e.target.value.split(',') ) }} />
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

async function setAccount(notifier: INotifierContext, account: IAccount | null) {
    if (account === null) return;

    const isNew = account.id === 0;

    const result = isNew ?
        await createAccount(account.name) :
        await updateAccount(account.id, account.name);

    if (result.status === 200) {
        notifier.pushNotification(
            <SuccessNotification title={"Successfully " + (isNew ? "Created" : "Updated") + " Account"}>The account {account.id} was successfully {isNew ? "created" : "updated"}.</SuccessNotification>
        );
    } else {
        notifier.pushNotification(
            <DangerNotification title={"Failed to " + (isNew ? "Create" : "Update") + " Account"}>Unexpected error occurred.</DangerNotification>
        );
    }

    console.log(result);
}

function AccountPane(props: IAccountProps) {
    return (
        <div className="mt-4">
            {props.account.id > 0 ? <AccountMonitor account={props.account} setAccount={props.setAccount}/> : null}
            <Accordion className="mt-4" defaultActiveKey="0">
                <Account account={props.account} setAccount={props.setAccount} afterSubmit={props.afterSubmit} />
                <AccountDatabaseTarget account={props.account} setAccount={props.setAccount} />
            </Accordion>
        </div>
    );
}

export default AccountPane;
