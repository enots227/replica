import { Fragment, useState } from 'react'
import { Button, ButtonGroup, Card, Dropdown, DropdownButton, Spinner } from 'react-bootstrap'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faPlus, faTrash } from '@fortawesome/free-solid-svg-icons'
import axios, { AxiosError } from 'axios'
import RawErrorResponse from '../../../components/debug/rawErrorResponse'
import { SuccessNotification, WarnNotification, DangerNotification, useNotifier } from '../../../components/notifications'
import { Node } from '../../../components/sys-data-flow/types'
import { Status } from '../../../components/sys-data-flow/status'
import { AlreadyExistsError, AlreadyNotExistsError, NeedToDrop } from '../../../components/kafka/errors'
import { createDBTargetKTable, deleteDBTargetKTable, createDBTargetKTableQueryable, deleteDBTargetKTableQueryable } from '../../../services/api'

type Props = {
    items: Node[],
}

export default function TargetPane(props: Props) {
    const notifier = useNotifier();
    const [processing, setProcessing] = useState(false)
    const [errResp, setErrResp] = useState<AxiosError | null>(null)

    const status: number = 0

    function handleCreateKTable() {
        (async () => {
            try {
                setProcessing(true)
                setErrResp(null)

                await createDBTargetKTable()

                notifier.pushNotification(<SuccessNotification title={'Successfully Created KSQL Table'}>The database targets KSQL table was created.</SuccessNotification>)
            } catch (err) {
                if (err instanceof AlreadyExistsError) {
                    notifier.pushNotification(<WarnNotification title={'KSQL Table Already Exists'}>The database targets KSQL table already exists.</WarnNotification>)
                } else {
                    notifier.pushNotification(<DangerNotification title={'Failure Creating KSQL Table'}>Unexpected error occurred while creating database targets KSQL table.</DangerNotification>)

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

                await deleteDBTargetKTable()

                notifier.pushNotification(<SuccessNotification title={'Successfully Deleted KSQL Table'}>The database targets KSQL table was deleted.</SuccessNotification>)
            } catch (err) {
                if (err instanceof AlreadyNotExistsError) {
                    notifier.pushNotification(<WarnNotification title={'KSQL Table Already Does Not Exists'}>The database targets KSQL table already does not exists.</WarnNotification>)
                } else if (err instanceof NeedToDrop) {
                    notifier.pushNotification(<DangerNotification title='Failure Deleting KSQL Table'>
                        Unable to drop source KSQL table. The following items first need to be dropped first:
                        <ul>
                            {err.items.map((item, i) => <li key={i}>{item}</li>)}
                        </ul>
                    </DangerNotification>)
                } else {
                    notifier.pushNotification(<DangerNotification title={'Failure Deleting KSQL Table'}>Unexpected error occurred while creating database targets KSQL table.</DangerNotification>)

                    if (axios.isAxiosError(err))
                        setErrResp(err)
                }
            } finally {
                setProcessing(false)
            }
        })()
    }

    function handleCreateKTableQueryable() {
        (async () => {
            try {
                setProcessing(true)
                setErrResp(null)

                await createDBTargetKTableQueryable()

                notifier.pushNotification(<SuccessNotification title={'Successfully Created KSQL Table'}>The database targets KSQL table was created.</SuccessNotification>)
            } catch (err) {
                if (err instanceof AlreadyExistsError) {
                    notifier.pushNotification(<WarnNotification title={'KSQL Table Already Exists'}>The database targets KSQL table already exists.</WarnNotification>)
                } else {
                    notifier.pushNotification(<DangerNotification title={'Failure Creating KSQL Table'}>Unexpected error occurred while creating database targets KSQL table.</DangerNotification>)

                    if (axios.isAxiosError(err))
                        setErrResp(err)
                }
            } finally {
                setProcessing(false)
            }
        })()
    }

    function handleDeleteKTableQueryable() {
        (async () => {
            try {
                setProcessing(true)
                setErrResp(null)

                await deleteDBTargetKTableQueryable()

                notifier.pushNotification(<SuccessNotification title={'Successfully Deleted KSQL Table'}>The database targets KSQL table was deleted.</SuccessNotification>)
            } catch (err) {
                if (err instanceof AlreadyNotExistsError) {
                    notifier.pushNotification(<WarnNotification title={'KSQL Table Already Does Not Exists'}>The database targets KSQL table already does not exists.</WarnNotification>)
                } else {
                    notifier.pushNotification(<DangerNotification title={'Failure Deleting KSQL Table'}>Unexpected error occurred while creating database targets KSQL table.</DangerNotification>)

                    if (axios.isAxiosError(err))
                        setErrResp(err)
                }
            } finally {
                setProcessing(false)
            }
        })()
    }

    const isNew = true

    return <Card className="sticky-top">
        <Card.Header>Target {Status(status)}</Card.Header>
        <Card.Body>
            <div className='d-flex'>
                <div className='ms-auto'>
                    <ButtonGroup className="ms-1">
                        {processing ?
                            <Fragment>
                                <Button variant='primary' disabled>
                                    <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" />
                                    {isNew ? "Creating..." : "Updating..."}
                                </Button>
                            </Fragment>
                            : (isNew ?
                                <Button variant='primary' disabled={processing}>Create</Button>
                                :
                                <Button variant='danger' disabled={processing}>Delete</Button>
                            )
                        }
                        <DropdownButton as={ButtonGroup} title="" variant="outline-secondary" disabled={processing}>
                            <Dropdown.Header>KSQL Table</Dropdown.Header>
                            <Dropdown.Item eventKey="1" onClick={handleCreateKTable}>
                                <FontAwesomeIcon icon={faPlus} className="pe-1" />
                                Create
                            </Dropdown.Item>
                            <Dropdown.Item eventKey="2" onClick={handleDeleteKTable}>
                                <FontAwesomeIcon icon={faTrash} className="pe-1" />
                                Delete
                            </Dropdown.Item>
                            <Dropdown.Divider />
                            <Dropdown.Header>Queryable KSQL Table</Dropdown.Header>
                            <Dropdown.Item eventKey="3" onClick={handleCreateKTableQueryable}>
                                <FontAwesomeIcon icon={faPlus} className="pe-1" />
                                Create
                            </Dropdown.Item>
                            <Dropdown.Item eventKey="4" onClick={handleDeleteKTableQueryable}>
                                <FontAwesomeIcon icon={faTrash} className="pe-1" />
                                Delete
                            </Dropdown.Item>
                        </DropdownButton>
                    </ButtonGroup>
                </div>
            </div>
            <RawErrorResponse className='mt-2' axiosError={errResp} />
        </Card.Body>
    </Card>
}
