import { faEye, faPencilAlt, faTrash } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import React, { Fragment, useEffect, useState } from 'react'
import useWebSocket, { ReadyState } from 'react-use-websocket'
import { Form, InputGroup, Card, Badge, Row, Col, Table, Button } from 'react-bootstrap'
import { faCheckCircle } from '@fortawesome/free-solid-svg-icons'
import { IAccount } from '..'
import { DangerNotification, INotifierContext, SuccessNotification, useNotifier } from '../../../components/notifications'
import { configureAcctTarget, createAccount, getConnectors, updateAccount } from '../../../services/api'

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
// Pane
export type AccountDBTargetStatus = {
    targetName: string,
    complete: boolean
}

function convertTargetsWithStatus(targetNames: string[], complete: boolean) {
    let targets: AccountDBTargetStatus[] = []

    for (let targetName of targetNames) {
        targets.push({
            "targetName": targetName,
            "complete": complete
        })
    }

    return targets
}

const WEB_SOCKET_STATUSES = {
    [ReadyState.CONNECTING]: ['Connecting', 'primary'],
    [ReadyState.OPEN]: ['Connected', 'success'],
    [ReadyState.CLOSING]: ['Closing Connection', 'warning'],
    [ReadyState.CLOSED]: ['Closed Connection', 'warning'],
    [ReadyState.UNINSTANTIATED]: ['Uninstantiated Connection', 'warning'],
}

export type Props = {
    account: IAccount
    setAccount: React.Dispatch<React.SetStateAction<IAccount | null>>
    reload: () => void
}

export default function AccountPane(props: Props) {
    const notifier = useNotifier()
    const { lastMessage, lastJsonMessage, readyState } = useWebSocket('ws://localhost:8001/ws/broadcast/' + props.account.id + '/')
    const [lastProcessedTimestamp, setLastProcessedTimestamp] = useState<number>(0);
    const [dbTargetsStatus, setDBTargetsStatus] = useState<AccountDBTargetStatus[]>(convertTargetsWithStatus(props.account.targets, true))
    const [newDBTarget, setNewDBTarget] = useState<string>('')
    const [dbTargets, setDBTargets] = useState<string[]>(props.account.targets)
    const [dbLabels, setDBLabels] = useState<string[]>([])
    const [dbTargetToggle, setDBTargetToggle] = useState(false)

    const isNew = props.account.id === 0

    useEffect(() => {
        setDBTargetsStatus(convertTargetsWithStatus(props.account.targets, true))
    }, [props.account.targets])

    useEffect(() => {
        console.log(lastMessage)
        if (lastMessage === null || lastProcessedTimestamp === lastMessage.timeStamp) return;
        if (lastJsonMessage.target === "replica_src") {
            setDBTargetsStatus(convertTargetsWithStatus(props.account.targets, false))
        } else {
            const idx = dbTargetsStatus.findIndex((target) => { return target.targetName === lastJsonMessage.target })

            let targets = [...dbTargetsStatus];

            if (idx >= 0) {
                targets[idx].complete = true;
            } else {
                targets.push({
                    targetName: lastJsonMessage.target,
                    complete: true,
                })

                const targetNames = targets.reduce<string[]>((result, target) => {
                    result.push(target.targetName)
                    return result
                }, [])

                props.setAccount({
                    ...props.account,
                    targets: targetNames
                })
            }

            setDBTargetsStatus(targets)
        }

        setLastProcessedTimestamp(lastMessage.timeStamp);

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [lastMessage, lastJsonMessage])

    useEffect(() => {
        (async () => {
            const connectors = await getConnectors()

            setDBLabels(Object.keys(connectors).reduce<string[]>((res, name) => {
                const parts = name.split('_')

                if (parts.length === 5 && parts[1] === 'snk') {
                    res.push(parts[2] + '/' + parts[3])
                }

                return res
            }, []))
        })()
    }, [setDBLabels])

    const wsStatus = WEB_SOCKET_STATUSES[readyState];

    const handleAcctSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        (async () => {
            await setAccount(notifier, props.account)
            props.reload()
        })()
    }

    const saveDBTargets = async (targets: string[]) => {
        const resp = await configureAcctTarget(props.account.id, targets);

        if (resp.status === 200) {
            notifier.pushNotification(<SuccessNotification title="Successfully Configured Target">The database target for account {props.account.id} was successfully configured.</SuccessNotification>)

            setDBTargets(targets)
            setNewDBTarget('')
        } else {
            notifier.pushNotification(<DangerNotification title="Failed to Configure Sink">Unexpected error occurred.</DangerNotification>)
        }

        props.setAccount({
            ...props.account,
            targets: dbTargets
        })
    }

    const handleDBTargetToggle = () => {
        setDBTargetToggle(!dbTargetToggle)
    }

    const handleDBTargetAdd = (e: React.FormEvent) => {
        e.preventDefault()

        let targets = [...dbTargets]

        if (newDBTarget.length > 0)
            targets.push(newDBTarget)

        saveDBTargets(targets)
    }

    const handleDBTargetDelete = (dbTarget: string) => {
        let targets = [...dbTargets]

        targets = dbTargets.filter((item) => item !== dbTarget)

        saveDBTargets(targets)
    }

    return <Card>
        <Card.Header>
            <h6 className="mb-0">
                Account {props.account.id}
                <Badge style={{ "float": "right" }} bg={wsStatus[1]}>{wsStatus[0]}</Badge>
            </h6>
        </Card.Header>
        <Card.Body>
            <div className="d-flex gap-2">
                {dbTargetToggle ?
                    <Form onSubmit={handleDBTargetAdd} className='flex-fill p-4 border border-secondary rounded'>
                        <Table hover>
                            <thead>
                                <tr>
                                    <th>Database Target</th>
                                    <th>Status</th>
                                    <th></th>
                                </tr>
                            </thead>
                            <tbody>
                                {dbTargetsStatus.map((dbTarget, i) => {
                                    return <tr key={i}>
                                        <td className='align-baseline'>{dbTarget.targetName}</td>
                                        <td className='align-baseline'>
                                            {dbTarget.complete ?
                                                <span className='text-success'>
                                                    <FontAwesomeIcon icon={faCheckCircle} className='me-2' />
                                                    Synchronized
                                                </span>
                                                :
                                                <span>
                                                    <div style={{maxHeight: "16px", maxWidth: "16px"}} className="spinner-border me-2" role="status"></div>
                                                    Synchronizing...
                                                </span>}
                                        </td>
                                        <td className='d-grid d-md-flex justify-content-md-end'>
                                            <Button variant='danger' size='sm' onClick={(e) => handleDBTargetDelete(dbTarget.targetName)}  >
                                                <FontAwesomeIcon icon={faTrash} />
                                            </Button>
                                        </td>
                                    </tr>
                                })}
                            </tbody>
                        </Table>
                        <InputGroup>
                            <Form.Select value={newDBTarget} onChange={(e) => setNewDBTarget(e.target.value)}>
                                <option key={0} value=''>Select database target...</option>
                                {dbLabels.map((dbLabel, i) => <option key={i + 1} value={dbLabel}>{dbLabel}</option>)}
                            </Form.Select>
                            <Button type='submit'>Add</Button>
                        </InputGroup>
                    </Form>
                    :
                    <Fragment>{dbTargetsStatus?.map((target, t) => {
                        if (target.complete) {
                            return <Card className={'text-success' + (dbTargetsStatus.length === t + 1 ? ' me-auto' : '')}>
                                <Card.Body>
                                    <Row>
                                        <Col className="m-auto text-center" style={{ "minHeight": "36px" }}>
                                            <FontAwesomeIcon icon={faCheckCircle} size="2x" />
                                        </Col>
                                        <Col>
                                            <h6>{target.targetName}</h6>
                                            <small className="text-muted">Synchronized</small>
                                        </Col>
                                    </Row>
                                </Card.Body>
                            </Card>
                        } else {
                            return <Card>
                                <Card.Body>
                                    <Row>
                                        <Col className="mx-auto my-auto text-center" style={{ "minHeight": "36px" }}>
                                            <div className="spinner-border " role="status"></div>
                                        </Col>
                                        <Col>
                                            <h6>{target.targetName}</h6>
                                            <small className="text-muted">Synchronizing...</small >
                                        </Col>
                                    </Row>
                                </Card.Body>
                            </Card>
                        }
                    })}</Fragment>
                }
                <div>
                    <Button variant='link' size='sm' onClick={handleDBTargetToggle} title={dbTargetToggle ? 'View Mode' : 'Edit Mode'}>
                        <FontAwesomeIcon icon={dbTargetToggle ? faEye : faPencilAlt} />
                    </Button>
                </div>
            </div>
            <Form onSubmit={handleAcctSubmit} className='mt-3'>
                <Form.Group className="mb-3" controlId="acctName">
                    <Form.Label>Name</Form.Label>
                    <Form.Control type="text" value={props.account.name}
                        onChange={(e) => props.setAccount({ ...props.account, name: e.target.value })} />
                </Form.Group>
                <div className="d-grid gap-2 d-md-flex justify-content-md-end">
                    <Button variant="primary" type="submit">
                        {isNew ? "Create" : "Update"}
                    </Button>
                </div>
            </Form>
        </Card.Body>
    </Card>
}
