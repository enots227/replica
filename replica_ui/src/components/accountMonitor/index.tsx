import React, { useEffect, useState } from 'react';
import useWebSocket, { ReadyState } from 'react-use-websocket';
import { Card, Badge, Row, Col } from "react-bootstrap";
import { faCheckCircle } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { IAccountProps } from '../../domain/accounts';

// Pane
export type IAccountTargetStatus = {
    targetName: string,
    complete: boolean
}

export type IAccountStatus = {
    id: number
    queuedAt: Date | null
    targets: IAccountTargetStatus[]
}

function convertTargetsWithStatus(targetNames: string[], complete: boolean) {
    let targets: IAccountTargetStatus[] = []

    for (let targetName of targetNames) {
        targets.push({
            "targetName": targetName,
            "complete": complete
        })
    }

    return targets
}

export default function AccountMonitorPane(props: IAccountProps) {
    const { lastMessage, lastJsonMessage, readyState } = useWebSocket(
        'ws://'
        + 'localhost:8001'
        + '/ws/broadcast/'
        + props.account.id
        + '/'
    );
    const [lastProcessedTimestamp, setLastProcessedTimestamp] = useState<number>(0);

    const [dbTargets, setDBTargets] = useState<IAccountTargetStatus[]>(convertTargetsWithStatus(props.account.targets, true))

    useEffect(() => {
        setDBTargets(convertTargetsWithStatus(props.account.targets, true))
    }, [props.account.targets])

    useEffect(() => {
        if (lastMessage === null || lastProcessedTimestamp === lastMessage.timeStamp) return;

        if (lastJsonMessage.target === "replica_source") {
            setDBTargets(convertTargetsWithStatus(props.account.targets, false))
        } else {
            const idx = dbTargets.findIndex((target) => { return target.targetName === lastJsonMessage.target })

            let targets = [...dbTargets];

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

            setDBTargets(targets)
        }

        setLastProcessedTimestamp(lastMessage.timeStamp);

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [lastMessage, lastJsonMessage])

    const wsStatus = {
        [ReadyState.CONNECTING]: ['Connecting', 'primary'],
        [ReadyState.OPEN]: ['Connected', 'success'],
        [ReadyState.CLOSING]: ['Closing Connection', 'warning'],
        [ReadyState.CLOSED]: ['Closed Connection', 'warning'],
        [ReadyState.UNINSTANTIATED]: ['Uninstantiated Connection', 'warning'],
    }[readyState];

    return (
        <Card>
            <Card.Header>
                <h6 className="mb-0">
                    Account {props.account.id} Status
                    <Badge style={{ "float": "right" }} bg={wsStatus[1]}>{wsStatus[0]}</Badge>
                </h6>
            </Card.Header>
            <Card.Body>
                <div>{dbTargets?.map((target, idx) => {
                    if (target.complete) {
                        return (
                            <Row key={idx} className="justify-content-md-center mt-1">
                                <Col xs={4}>
                                    <Card className="text-success">
                                        <Card.Body>
                                            <Row>
                                                <Col xs={2} className="mx-auto my-auto text-center" style={{ "minHeight": "36px" }}>
                                                    <FontAwesomeIcon icon={faCheckCircle} size="2x" />
                                                </Col>
                                                <Col>
                                                    <h6>{target.targetName}</h6>
                                                    <small className="text-muted">Synchronized</small >
                                                </Col>
                                            </Row>
                                        </Card.Body>
                                    </Card>
                                </Col>
                            </Row>
                        )
                    } else {
                        return (
                            <Row key={idx} className="justify-content-md-center mt-1">
                                <Col xs={4}>
                                    <Card>
                                        <Card.Body>
                                            <Row>
                                                <Col xs={2} className="mx-auto my-auto text-center" style={{ "minHeight": "36px" }}>
                                                    <div className="spinner-border " role="status"></div>
                                                </Col>
                                                <Col>
                                                    <h6>{target.targetName}</h6>
                                                    <small  className="text-muted">Synchronizing...</small >
                                                </Col>
                                            </Row>
                                        </Card.Body>
                                    </Card>
                                </Col>
                            </Row>
                        )
                    }
                })}</div>
            </Card.Body>
        </Card>
    );
}
