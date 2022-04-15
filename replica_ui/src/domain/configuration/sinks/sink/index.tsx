import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Form, Button, Accordion, ButtonGroup, Col, Row, Dropdown, DropdownButton, Spinner } from 'react-bootstrap'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faPlus, faTrash } from '@fortawesome/free-solid-svg-icons'
import axios, { AxiosError } from 'axios'
import RawErrorResponse from '../../../../components/debug/rawErrorResponse'
import { useNotifier, SuccessNotification, DangerNotification, WarnNotification } from '../../../../components/notifications'
import { AlreadyExistsError, AlreadyNotExistsError } from '../../../../components/kafka/errors'
import { parseIntSafe } from '../../../../services/utils/parser'
import { Sink } from '../types'
import { createSinkKTable, deleteSinkKTable, createSinkConnector, deleteSinkConnector } from '../../../../services/api'
import { useEffect } from 'react'

type Props = {
    nodeIDs: string[]
    item: Sink
    reload: () => Promise<void>,
    accordionHeaderButton: ({ children, eventKey }: { children: JSX.Element, eventKey: string }) => JSX.Element,
}

export default function SinkPane(props: Props) {
    const notifier = useNotifier()
    const navigate = useNavigate()
    const { nodeID } = useParams()
    const [item, setItem] = useState<Sink>(props.item)
    const [processing, setProcessing] = useState(false)
    const [errResp, setErrResp] = useState<AxiosError | null>(null)

    function handleCreate() {
        (async () => {
            try {
                setProcessing(true)
                setErrResp(null)

                let ktableAlreadyExists = false, connectorAlreadyExists = false

                try {
                    await createSinkKTable(item.dbHostname, item.dbName, item.dbTable)
                } catch (err) {
                    if (err instanceof AlreadyExistsError) {
                        ktableAlreadyExists = true
                    } else {
                        throw err
                    }
                }

                try {
                    await createSinkConnector(item.dbHostname, item.dbPort, item.dbName, item.dbTable, item.dbUser, item.dbPassword)
                } catch (err) {
                    if (err instanceof AlreadyExistsError) {
                        connectorAlreadyExists = true
                    } else {
                        throw err
                    }
                }
                
                notifier.pushNotification(<SuccessNotification title={'Successfully Created Sink'}>
                    {(() => {
                        if (ktableAlreadyExists && connectorAlreadyExists) {
                            return 'The sink KSQL table and connector already exists.'
                        } else if (ktableAlreadyExists) {
                            return 'The sink KSQL table already exists and connector was created.'
                        } else if (connectorAlreadyExists) {
                            return 'The sink KSQL table was created and connector already exists.'
                        } else {
                            return 'The sink KSQL table and connector was created.'
                        }
                    })()}
                </SuccessNotification>)
                
                const newNodeID = 'replica_snk_' + item.dbHostname + '_' + item.dbName + '_' + item.dbTable

                navigate('/configuration/KC_SNK/' + newNodeID)

                props.reload()
                
                if ( props.nodeIDs.includes(newNodeID) )
                    setProcessing(false)
            } catch (err) {
                notifier.pushNotification(<DangerNotification title='Failure Creating Sink'>Unexpected error occurred while creating sink.</DangerNotification>)

                if (axios.isAxiosError(err))
                    setErrResp(err)

                setProcessing(false)
            }
        })()
    }

    function handleDelete() {
        (async () => {
            try {
                setProcessing(true)
                setErrResp(null)

                let ktableAlreadyNotExists = false, connectorAlreadyNotExists = false

                try {
                    await deleteSinkKTable(item.dbHostname, item.dbName, item.dbTable)
                } catch (err) {
                    if (err instanceof AlreadyNotExistsError) {
                        ktableAlreadyNotExists = true
                    } else {
                        throw err
                    }
                }

                try {
                    await deleteSinkConnector(item.dbHostname, item.dbName, item.dbTable)
                } catch (err) {
                    if (err instanceof AlreadyNotExistsError) {
                        connectorAlreadyNotExists = true
                    } else {
                        throw err
                    }
                }
                
                notifier.pushNotification(<SuccessNotification title={'Successfully Deleted Sink'}>
                    {(() => {
                        if (ktableAlreadyNotExists && connectorAlreadyNotExists) {
                            return 'The sink KSQL table and connector already does not exists.'
                        } else if (ktableAlreadyNotExists) {
                            return 'The sink KSQL table already does not exists and connector was deleted.'
                        } else if (connectorAlreadyNotExists) {
                            return 'The sink KSQL table was deleted and connector already does not exists.'
                        } else {
                            return 'The sink KSQL table and connector was deleted.'
                        }
                    })()}
                </SuccessNotification>)

                navigate('/configuration/KC_SNK')

                props.reload()
            } catch (err) {
                notifier.pushNotification(<DangerNotification title='Failure Deleting Sink'>Unexpected error occurred while deleting sink.</DangerNotification>)

                if (axios.isAxiosError(err))
                    setErrResp(err)

                setProcessing(false)
            }
        })()
    }

    function handleCreateKTable() {
        (async () => {
            try {
                setProcessing(true)
                setErrResp(null)

                await createSinkKTable(item.dbHostname, item.dbName, item.dbTable)

                notifier.pushNotification(<SuccessNotification title='Successfully Created KSQL Table'>The sink KSQL table was created.</SuccessNotification>)
            } catch (err) {
                if (err instanceof AlreadyExistsError) {
                    notifier.pushNotification(<WarnNotification title='KSQL Table Already Exists'>The sink KSQL table already exists.</WarnNotification>)
                } else {
                    notifier.pushNotification(<DangerNotification title='Failure Creating KSQL Table'>Unexpected error occurred while creating sink KSQL table.</DangerNotification>)

                    if (axios.isAxiosError(err))
                        setErrResp(err)
                }
            } finally {
                setProcessing(false)
            }
        })()
    }

    function handleCreateConnector() {
        (async () => {
            try {
                setProcessing(true)
                setErrResp(null)

                await createSinkConnector(item.dbHostname, item.dbPort, item.dbName, item.dbTable, item.dbUser, item.dbPassword)

                notifier.pushNotification(<SuccessNotification title='Successfully Created Connector'>The sink connector was created.</SuccessNotification>)
            } catch (err) {
                if (err instanceof AlreadyExistsError) {
                    notifier.pushNotification(<WarnNotification title='Connector Already Exists'>The sink connector already exists.</WarnNotification>)
                } else {
                    notifier.pushNotification(<DangerNotification title='Failure Creating Connector'>Unexpected error occurred while creating sink connector.</DangerNotification>)

                    if (axios.isAxiosError(err))
                        setErrResp(err)
                }
            } finally {
                setProcessing(false)
            }
        })()
    }

    function handleDeleteKTable() {
        (async () => {
            try {
                setProcessing(true)
                setErrResp(null)

                await deleteSinkKTable(item.dbHostname, item.dbName, item.dbTable)

                notifier.pushNotification(<SuccessNotification title='Successfully Deleted KSQL Table'>The sink KSQL table was deleted.</SuccessNotification>)
            } catch (err) {
                if (err instanceof AlreadyNotExistsError) {
                    notifier.pushNotification(<SuccessNotification title='KSQL Table Already Does Not Exist'>The sink KSQL table already does not exist.</SuccessNotification>)
                } else {
                    notifier.pushNotification(<DangerNotification title='Failure Deleting KSQL Table'>Unexpected error occurred while deleting sink KSQL table.</DangerNotification>)

                    if (axios.isAxiosError(err))
                        setErrResp(err)
                }
            } finally {
                setProcessing(false)
            }
        })()
    }

    function handleDeleteConnector() {
        (async () => {
            try {
                setProcessing(true)
                setErrResp(null)

                await deleteSinkConnector(item.dbHostname, item.dbName, item.dbTable)

                notifier.pushNotification(<SuccessNotification title='Successfully Deleted Connector'>The sink connector was deleted.</SuccessNotification>)
            } catch (err) {
                if (err instanceof AlreadyNotExistsError) {
                    notifier.pushNotification(<SuccessNotification title='Connector Already Does Not Exist'>The sink connector already does not exist.</SuccessNotification>)
                } else {
                    notifier.pushNotification(<DangerNotification title='Failure Deleting Connector'>Unexpected error occurred while deleting sink connector.</DangerNotification>)

                    if (axios.isAxiosError(err))
                        setErrResp(err)
                }
            } finally {
                setProcessing(false)
            }
        })()
    }

    useEffect(() => {
        setItem(props.item)
    }, [props.item, setItem])
    
    const isNew = nodeID === 'new'

    return (
        <Accordion.Item eventKey="1">
            <props.accordionHeaderButton eventKey="1">
                <h6>
                    {isNew ? "Create" : "Edit"} Sink Connector
                </h6>
            </props.accordionHeaderButton>
            <Accordion.Body>
                <Form>
                    <Row>
                        <Col>
                            <Form.Group className="mb-3" controlId="dbHostname">
                                <Form.Label>Database Hostname</Form.Label>
                                <Form.Control type="text" value={item.dbHostname}
                                    onChange={(e) => { setItem({ ...item, dbHostname: e.target.value }) }} disabled={!isNew} />
                            </Form.Group>
                        </Col>
                        <Col xs={4} sm={3} lg={2}>
                            <Form.Group className="mb-3" controlId="dbPort">
                                <Form.Label>Database Port</Form.Label>
                                <Form.Control type="number" defaultValue={item.dbPort}
                                    onChange={(e) => { setItem({ ...item, dbPort: parseIntSafe(e.target.value) }) }} />
                            </Form.Group>
                        </Col>
                    </Row>
                    <Row>
                        <Col>
                            <Form.Group className="mb-3" controlId="dbUser">
                                <Form.Label>Database Username</Form.Label>
                                <Form.Control type="text" value={item.dbUser}
                                    onChange={(e) => { setItem({ ...item, dbUser: e.target.value }) }} />
                            </Form.Group>
                        </Col>
                        <Col>
                            <Form.Group className="mb-3" controlId="dbPassword">
                                <Form.Label>Database Password</Form.Label>
                                <Form.Control type="text" value={item.dbPassword}
                                    onChange={(e) => { setItem({ ...item, dbPassword: e.target.value }) }} />
                            </Form.Group>
                        </Col>
                    </Row>
                    <Form.Group className="mb-3" controlId="dbName">
                        <Form.Label>Database Name</Form.Label>
                        <Form.Control type="text" value={item.dbName}
                            onChange={(e) => { setItem({ ...item, dbName: e.target.value }) }} disabled={!isNew} />
                    </Form.Group>
                    <div className="d-flex mb-3">
                        <div className="ms-auto">
                            <ButtonGroup className="ms-1">
                                {processing ?
                                    <Button variant="primary" disabled>
                                        <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" />
                                        {isNew ? "Creating..." : "Updating..."}
                                    </Button>
                                    :
                                    isNew ?
                                        <Button variant="primary" onClick={handleCreate}>
                                            Create
                                        </Button>
                                        :
                                        <Button variant="primary">
                                            Update
                                        </Button>
                                }
                                <DropdownButton as={ButtonGroup} title="" variant="outline-secondary" disabled={processing}>
                                    <Dropdown.Item eventKey="1" onClick={handleCreate}>
                                        <FontAwesomeIcon icon={faPlus} className="pe-1" />
                                        Create
                                    </Dropdown.Item>
                                    <Dropdown.Item eventKey="1" onClick={handleDelete}>
                                        <FontAwesomeIcon icon={faTrash} className="pe-1" />
                                        Delete
                                    </Dropdown.Item>
                                    <Dropdown.Divider />
                                    <Dropdown.Header>KSQL Table</Dropdown.Header>
                                    <Dropdown.Item eventKey="3" onClick={handleCreateKTable}>
                                        <FontAwesomeIcon icon={faPlus} className="pe-1" />
                                        Create
                                    </Dropdown.Item>
                                    <Dropdown.Item eventKey="4" onClick={() => handleDeleteKTable()}>
                                        <FontAwesomeIcon icon={faTrash} className="pe-1" />
                                        Delete
                                    </Dropdown.Item>
                                    <Dropdown.Divider />
                                    <Dropdown.Header>Connector</Dropdown.Header>
                                    <Dropdown.Item eventKey="5" onClick={handleCreateConnector}>
                                        <FontAwesomeIcon icon={faPlus} className="pe-1" />
                                        Create
                                    </Dropdown.Item>
                                    <Dropdown.Item eventKey="6" onClick={() => handleDeleteConnector()}>
                                        <FontAwesomeIcon icon={faTrash} className="pe-1" />
                                        Delete
                                    </Dropdown.Item>
                                </DropdownButton>
                            </ButtonGroup>
                        </div>
                    </div>
                </Form>
                <RawErrorResponse axiosError={errResp} />
            </Accordion.Body>
        </Accordion.Item>
    );
}

