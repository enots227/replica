import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Form, Button, Col, Row, ButtonGroup, Spinner, Dropdown, DropdownButton } from 'react-bootstrap'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faPause, faPlay, faPlus, faTrash, faRotate } from '@fortawesome/free-solid-svg-icons'
import axios, { AxiosError } from 'axios'
import RawErrorResponse from '../../../../components/debug/rawErrorResponse'
import { useNotifier, SuccessNotification, DangerNotification, WarnNotification } from '../../../../components/notifications'
import { AlreadyExistsError, AlreadyNotExistsError, NeedToDrop, NotPrepared } from '../../../../components/kafka/errors'
import { parseIntSafe } from '../../../../services/utils/parser'
import { createSourceSchema, createSourceKTable, deleteSourceKTable, createSourceConnector, deleteSourceConnector, pauseSourceConnector, resumeSourceConnector, restartSourceConnector } from '../../../../services/api'
import { Source } from '../types'

type Props = {
    item: Source
}

export default function SourcePane(props: Props) {
    const notifier = useNotifier()
    const { nodeID } = useParams()
    const navigate = useNavigate()
    const [item, setItem] = useState<Source>(props.item)
    const [processing, setProcessing] = useState(false)
    const [errResp, setErrResp] = useState<AxiosError | null>(null)

    function handleCreate() {
        (async () => {
            try {
                setProcessing(true)
                setErrResp(null)

                let ktableAlreadyExists = false, connectorAlreadyExists = false

                try {
                    await createSourceSchema()
                } catch (err) {
                    throw err
                }

                try {
                    await createSourceKTable()
                } catch (err) {
                    if (err instanceof AlreadyExistsError) {
                        ktableAlreadyExists = true
                    } else {
                        throw err
                    }
                }

                try {
                    await createSourceConnector(item.dbHostname, item.dbPort, item.dbName, item.dbUser, item.dbPassword, item.pollInterval)
                } catch (err) {
                    if (err instanceof AlreadyExistsError) {
                        connectorAlreadyExists = true
                    } else {
                        throw err
                    }
                }
                
                notifier.pushNotification(<SuccessNotification title={'Successfully Created Source'}>
                    {(() => {
                        if (ktableAlreadyExists && connectorAlreadyExists) {
                            return 'The source KSQL table and connector already exists.'
                        } else if (ktableAlreadyExists) {
                            return 'The source KSQL table already exists and connector was created.'
                        } else if (connectorAlreadyExists) {
                            return 'The source KSQL table was created and connector already exists.'
                        } else {
                            return 'The source KSQL table and connector was created.'
                        }
                    })()}
                </SuccessNotification>)

                navigate('/configuration/KC_SRC/replica_src')
                
                setProcessing(false)
            } catch (err) {
                notifier.pushNotification(<DangerNotification title='Failure Creating Sink'>Unexpected error occurred while creating sink.</DangerNotification>)

                if (axios.isAxiosError(err))
                    setErrResp(err)

                setProcessing(false)
            }
        })()
    }

    function handleCreateSchema() {
        (async () => {
            try {
                setProcessing(true)
                setErrResp(null)

                await createSourceSchema()

                notifier.pushNotification(<SuccessNotification title='Successfully Created/Updated Schema'>The source schema was created/updated.</SuccessNotification>)
            } catch (err) {
                notifier.pushNotification(<DangerNotification title='Failure Creating/Updating Schema'>Unexpected error occurred while creating/updating source schema.</DangerNotification>)

                if (axios.isAxiosError(err))
                    setErrResp(err)
            } finally {
                setProcessing(false)
            }
        })()
    }

    function handleCreateKTable() {
        (async () => {
            try {
                setProcessing(true)
                setErrResp(null)

                await createSourceKTable()

                notifier.pushNotification(<SuccessNotification title='Successfully Created KSQL Table'>The source KSQL table was created.</SuccessNotification>)
            } catch (err) {
                if (err instanceof AlreadyExistsError) {
                    notifier.pushNotification(<WarnNotification title='KSQL Table Already Exists'>The source KSQL table already exists.</WarnNotification>)
                } else if (err instanceof NotPrepared) {
                    notifier.pushNotification(<DangerNotification title='Failure Creating KSQL Table'>The schema for the KSQL table is not created. The schema must first be created</DangerNotification>)
                } else {
                    notifier.pushNotification(<DangerNotification title='Failure Creating KSQL Table'>Unexpected error occurred while creating source KSQL table.</DangerNotification>)

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

                await createSourceConnector(item.dbHostname, item.dbPort, item.dbName, item.dbUser, item.dbPassword, item.pollInterval)

                notifier.pushNotification(<SuccessNotification title='Successfully Created Connector'>The source connector was created.</SuccessNotification>)
            } catch (err) {
                if (err instanceof AlreadyExistsError) {
                    notifier.pushNotification(<WarnNotification title='Connector Already Exists'>The source connector already exists.</WarnNotification>)
                } else {
                    notifier.pushNotification(<DangerNotification title='Failure Creating Connector'>Unexpected error occurred while creating source connector.</DangerNotification>)

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

                await deleteSourceKTable()

                notifier.pushNotification(<SuccessNotification title='Successfully Deleted KSQL Table'>The source KSQL table was deleted.</SuccessNotification>)
            } catch (err) {
                if (err instanceof AlreadyNotExistsError) {
                    notifier.pushNotification(<SuccessNotification title='KSQL Table Already Does Not Exist'>The source KSQL table already does not exist.</SuccessNotification>)
                } else if (err instanceof NeedToDrop) {
                    notifier.pushNotification(<DangerNotification title='Failure Deleting KSQL Table'>
                        Unable to drop source KSQL table. The following items first need to be dropped first:
                        <ul>
                            {err.items.map((item, i) => <li key={i}>{item}</li>)}
                        </ul>
                    </DangerNotification>)
                } else {
                    notifier.pushNotification(<DangerNotification title='Failure Deleting KSQL Table'>Unexpected error occurred while deleting source KSQL table.</DangerNotification>)

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

                await deleteSourceConnector()

                notifier.pushNotification(<SuccessNotification title='Successfully Deleted Connector'>The source connector was deleted.</SuccessNotification>)
            } catch (err) {
                if (err instanceof AlreadyNotExistsError) {
                    notifier.pushNotification(<SuccessNotification title='Connector Already Does Not Exist'>The source connector already does not exist.</SuccessNotification>)
                } else {
                    notifier.pushNotification(<DangerNotification title='Failure Deleting Connector'>Unexpected error occurred while deleting source connector.</DangerNotification>)

                    if (axios.isAxiosError(err))
                        setErrResp(err)
                }
            } finally {
                setProcessing(false)
            }
        })()
    }

    function handlePauseConnector() {
        (async () => {
            try {
                setProcessing(true)
                setErrResp(null)

                await pauseSourceConnector()

                notifier.pushNotification(<SuccessNotification title='Successfully Paused Connector'>The source connector was paused.</SuccessNotification>)
            } catch (err) {
                notifier.pushNotification(<DangerNotification title='Failure Pausing Connector'>Unexpected error occurred while attempting to pause the source connector.</DangerNotification>)

                if (axios.isAxiosError(err))
                    setErrResp(err)
            } finally {
                setProcessing(false)
            }
        })()
    }

    function handleResumeConnector() {
        (async () => {
            try {
                setProcessing(true)
                setErrResp(null)

                await resumeSourceConnector()

                notifier.pushNotification(<SuccessNotification title='Successfully Resumed Connector'>The source connector was resumed.</SuccessNotification>)
            } catch (err) {
                notifier.pushNotification(<DangerNotification title='Failure Resuming Connector'>Unexpected error occurred while attempting to resume the source connector.</DangerNotification>)

                if (axios.isAxiosError(err))
                    setErrResp(err)
            } finally {
                setProcessing(false)
            }
        })()
    }

    function handleRestartConnector() {
        (async () => {
            try {
                setProcessing(true)
                setErrResp(null)

                await restartSourceConnector()

                notifier.pushNotification(<SuccessNotification title='Successfully Restarted Connector'>The source connector was restarted.</SuccessNotification>)
            } catch (err) {
                notifier.pushNotification(<DangerNotification title='Failure Restarting Connector'>Unexpected error occurred while attempting to restart the source connector.</DangerNotification>)

                if (axios.isAxiosError(err))
                    setErrResp(err)
            } finally {
                setProcessing(false)
            }
        })()
    }

    const isNew = nodeID === 'new'

    return <Form>
        <Row>
            <Col>
                <Form.Group className="mb-3" controlId="dbHostname">
                    <Form.Label>Database Hostname</Form.Label>
                    <Form.Control type="text" defaultValue={item.dbHostname}
                        onChange={(e) => { setItem({ ...item, dbHostname: e.target.value }) }} />
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
                    <Form.Control type="text" defaultValue={item.dbUser}
                        onChange={(e) => { setItem({ ...item, dbUser: e.target.value }) }} />
                </Form.Group>
            </Col>
            <Col>
                <Form.Group className="mb-3" controlId="dbPassword">
                    <Form.Label>Database Password</Form.Label>
                    <Form.Control type="text" defaultValue={item.dbPassword}
                        onChange={(e) => { setItem({ ...item, dbPassword: e.target.value }) }} />
                </Form.Group>
            </Col>
        </Row>
        <Form.Group className="mb-3" controlId="dbName">
            <Form.Label>Database Name</Form.Label>
            <Form.Control type="text" defaultValue={item.dbName}
                onChange={(e) => { setItem({ ...item, dbName: e.target.value }) }} />
        </Form.Group>
        <Form.Group className="mb-3" controlId="pollInterval">
            <Form.Label>Poll Interval</Form.Label>
            <Form.Control type="number" defaultValue={item.pollInterval}
                onChange={(e) => { setItem({ ...item, pollInterval: parseIntSafe(e.target.value) }) }} />
        </Form.Group>
        <div className="d-flex mb-3">
            <div className="ms-auto">
                <ButtonGroup className="ms-1">
                    {processing ?
                        <Button variant="primary" disabled>
                            <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" />
                            {isNew ? "Creating..." : "Updating..."}
                        </Button> :
                        <Button variant="primary">
                            {isNew ? "Create" : "Update"}
                        </Button>
                    }
                    <DropdownButton as={ButtonGroup} title="" variant="outline-secondary" disabled={processing}>
                        <Dropdown.Item eventKey="1" onClick={handleCreate}>
                            <FontAwesomeIcon icon={faPlus} className="pe-1" />
                            Create
                        </Dropdown.Item>
                        <Dropdown.Item eventKey="3" onClick={handlePauseConnector}>
                            <FontAwesomeIcon icon={faPause} className="pe-1" />
                            Pause
                        </Dropdown.Item>
                        <Dropdown.Item eventKey="4" onClick={handleResumeConnector}>
                            <FontAwesomeIcon icon={faPlay} className="pe-1" />
                            Resume
                        </Dropdown.Item>
                        <Dropdown.Item eventKey="5" onClick={handleRestartConnector}>
                            <FontAwesomeIcon icon={faRotate} className="pe-1" />
                            Restart
                        </Dropdown.Item>
                        <Dropdown.Divider />
                        <Dropdown.Header>Schema</Dropdown.Header>
                        <Dropdown.Item eventKey="1" onClick={handleCreateSchema}>
                            <FontAwesomeIcon icon={faPlus} className="pe-1" />
                            Create
                        </Dropdown.Item>
                        <Dropdown.Divider />
                        <Dropdown.Header>KSQL Table</Dropdown.Header>
                        <Dropdown.Item eventKey="6" onClick={handleCreateKTable}>
                            <FontAwesomeIcon icon={faPlus} className="pe-1" />
                            Create
                        </Dropdown.Item>
                        <Dropdown.Item eventKey="7" onClick={handleDeleteKTable}>
                            <FontAwesomeIcon icon={faTrash} className="pe-1" />
                            Delete
                        </Dropdown.Item>
                        <Dropdown.Divider />
                        <Dropdown.Header>Connector</Dropdown.Header>
                        <Dropdown.Item eventKey="8" onClick={handleCreateConnector}>
                            <FontAwesomeIcon icon={faPlus} className="pe-1" />
                            Create
                        </Dropdown.Item>
                        <Dropdown.Item eventKey="9" onClick={handleDeleteConnector}>
                            <FontAwesomeIcon icon={faTrash} className="pe-1" />
                            Delete
                        </Dropdown.Item>
                    </DropdownButton>
                </ButtonGroup>
            </div>
        </div>
        <RawErrorResponse axiosError={errResp} />
    </Form>
}

