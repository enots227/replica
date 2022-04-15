import { AxiosError } from 'axios'
import { Col, Row, InputGroup, FormControl, Card } from 'react-bootstrap'

type Props = {
    axiosError: AxiosError | null,
    className?: string
}

export default function RawErrorResponse(props: Props) {
    if (props.axiosError === null)
        return null

    let content: string = props.axiosError.response?.data

    if (content.length !== 0) {
        switch (props.axiosError.response?.headers['content-type']) {
            case "text/html":
                // only want the HTML, not head / style
                const s = content.search('<body>') + 6
                const e = content.search('</body>')

                content = content.substring(s, e)

                // remove ids and class tag attributes
                content = content.replaceAll(/(?:id|class)="[\w_-\s]+"/g, '')

                break
            default:
                content = props.axiosError.toString()
                break
        }
    }

    return <Card className={props.className}>
        <Card.Header>
            <b>Error Occurred</b>
        </Card.Header>
        <Card.Body>
            <InputGroup>
                <InputGroup.Text>URL</InputGroup.Text>
                <FormControl value={props.axiosError.request?.responseURL} readOnly />
            </InputGroup>
            <Row className='mt-2'>
                <Col>
                    <InputGroup>
                        <InputGroup.Text>Status Code</InputGroup.Text>
                        <FormControl value={props.axiosError.response?.status} readOnly />
                    </InputGroup>
                </Col>
                <Col>
                    <InputGroup>
                        <InputGroup.Text>Status Text</InputGroup.Text>
                        <FormControl value={props.axiosError.response?.statusText} readOnly />
                    </InputGroup>
                </Col>
            </Row>
            <Row>
                <Col>
                    <div className='form-control mt-2 readOnly' aria-readonly dangerouslySetInnerHTML={{ __html: content }} ></div>
                </Col>
            </Row>
        </Card.Body>
    </Card>
}
