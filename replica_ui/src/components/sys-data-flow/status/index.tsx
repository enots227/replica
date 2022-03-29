import { faCheckCircle, faTimesCircle } from "@fortawesome/free-solid-svg-icons"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"

export const STATUSES = {
    FAILURE: -1,
    UNKNOWN: 0,
    OPERATIONAL: 1,
}

export function Status(code: number) {
    switch (code) {
        case STATUSES.OPERATIONAL:
            return <FontAwesomeIcon className="text-success me-2" icon={faCheckCircle} />
        case STATUSES.UNKNOWN:
        case STATUSES.FAILURE:
        default:
            return <FontAwesomeIcon className="text-danger me-2" icon={faTimesCircle} />
    }
}
