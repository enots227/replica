import { faCheckCircle, faTimesCircle, faPauseCircle } from "@fortawesome/free-solid-svg-icons"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"

export const STATUSES = {
    FAILURE: -1,
    UNKNOWN: 0,
    OPERATIONAL: 1,
    PAUSED: 2,
}

export function Status(code: number) {
    switch (code) {
        case STATUSES.OPERATIONAL:
            return <FontAwesomeIcon className="text-success me-2" icon={faCheckCircle} title='Operational' />
        case STATUSES.PAUSED:
            return <FontAwesomeIcon className="text-warning me-2" icon={faPauseCircle} title='Paused' />
        case STATUSES.UNKNOWN:
        case STATUSES.FAILURE:
        default:
            return <FontAwesomeIcon className="text-danger me-2" icon={faTimesCircle} title='Failure' />
    }
}
