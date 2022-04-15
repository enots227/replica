import React, { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Card, Row, Col, Table, Button } from 'react-bootstrap'
import { getAccount, getAccounts } from '../../services/api'
import AccountPane from '../accounts/account'
import { DangerNotification, INotifierContext, useNotifier } from '../../components/notifications';

export type IAccount = {
    id: number
    name: string
    targets: string[]
}

export type IAccountProps = {
    account: IAccount
    setAccount: React.Dispatch<React.SetStateAction<IAccount | null>>
    afterSubmit?: () => void
}

type IAccountsPaneProps = {
    accounts: IAccount[],
    setAccounts: React.Dispatch<React.SetStateAction<IAccount[]>>,
    selected?: number
}

function AccountsPane(props: IAccountsPaneProps) {
    const navigate = useNavigate()

    function handleRowClick(acct_id: number) {
        navigate(`/accounts/${acct_id}`)
    }

    function handleNewClick() {
        navigate(`/accounts/new`)
    }

    return (
        <Card>
            <Card.Header><h6 className="mb-0">Accounts</h6></Card.Header>
            <Card.Body>
                <div className="d-grid gap-2 d-md-flex justify-content-md-end">
                    <Button onClick={handleNewClick}>Add Account</Button>
                </div>
                <Table hover>
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Name</th>
                        </tr>
                    </thead>
                    <tbody>
                        {props.accounts.map((account) => {
                            return (
                                <tr onClick={() => handleRowClick(account.id)} key={account.id} className={props.selected === account.id ? "table-active" : ""}>
                                    <td>
                                        {account.id}
                                    </td>
                                    <td>
                                        {account.name}
                                    </td>
                                </tr>
                            )
                        })}
                    </tbody>
                </Table>

            </Card.Body>
        </Card>
    );
}

async function fetchAccount(notifier: INotifierContext, id: string | undefined) {
    if (typeof id === "undefined") {
        return null
    }

    if (id === "new") {
        return {
            id: 0,
            name: "",
            targets: []
        }
    }

    const acctID = parseInt(id)

    if (isNaN(acctID)) {
        notifier.pushNotification(
            <DangerNotification title="Failed to Read Account">The account id is not an integer.</DangerNotification>
        )
        return null
    }

    const result = await getAccount(acctID)

    return {
        id: result.data.account.id,
        name: result.data.account.name,
        targets: result.data.targets,
    }
}

async function fetchAccounts(notifier: INotifierContext) {
    const result = await getAccounts()

    return result.data.accounts
}

function AccountsPage() {
    const notifier = useNotifier();
    const { accountID } = useParams();
    const [accounts, setAccounts] = useState<Array<IAccount>>([]);
    const [account, setAccount] = useState<IAccount | null>(null);

    const loadAccounts = async () => {
        setAccounts(await fetchAccounts(notifier))
    }

    const loadAccount = async () => {
        setAccount(await fetchAccount(notifier, accountID))
    }

    useEffect(() => {
        loadAccounts()

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        loadAccount()

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [accountID]);

    return <Row className="m-2">
        <Col>
            <AccountsPane accounts={accounts} setAccounts={setAccounts} selected={account?.id} />
        </Col>
        <Col>
            {account !== null ? <AccountPane account={account} setAccount={setAccount} reload={loadAccounts} /> : null}
        </Col>
    </Row>
}

export default AccountsPage;
