import { MouseEvent } from "react"
import { NodeGroups } from "./types"
import { Mermaid } from 'mdx-mermaid/lib/Mermaid'
import { SelectedNode, NodePanes, Node } from './types'
import InspectPane from "./insepectPane"
import { Col, Row } from "react-bootstrap"
import { useNavigate, useParams } from "react-router-dom"

type ColorProps = {
    selected?: string
}

type NodeLabelFunc = (id: string, num: number) => string

type Props = {
    id: number
    chartTemplate: string
    nodeGrps: NodeGroups
    nodePanes: NodePanes
    colors: ColorProps
    reload?: () => Promise<void>
    nodeLabeler: NodeLabelFunc
}

function parseExprs(rawChart: string) {
    return rawChart
        .replace(/^\s*/gm, '')
        .trim()
        .split("\n")
}

type NodeMapping = {
    [node: string]: number
}

type NodeDefs = {
    [nodeGrp: string]: NodeMapping
}

function parseNodeDefs(exprs: string[], nodeGrps: NodeGroups) {
    const nodeDefRegex = new RegExp('^(\\w+)[\\(\\{\\[]')

    return exprs.reduce<NodeDefs>((res, expr) => {
        const matches = expr.match(nodeDefRegex)

        if (matches !== null && matches.length === 2) {
            const captureName = matches[1]

            if (!(captureName in res)) {
                if (captureName in nodeGrps)
                    res[captureName] = nodeGrps[captureName].reduce<NodeMapping>((res, node, n) => {
                        res[node.id] = n

                        return res
                    }, {})
                else
                    res[captureName] = {}
            }
        }

        return res
    }, {})
}

function extractId(html_id: string) {
    const delimiter_pos = html_id.lastIndexOf(":")

    if (delimiter_pos === -1)
        return { grp: html_id, idx: -1 }

    const grp = html_id.substring(0, delimiter_pos)
    let idx = parseInt(html_id.substring(delimiter_pos + 1, html_id.length))

    return { grp, idx }
}

function determineID(nodeID: string | undefined, nodes: Node[]) {
    if (nodeID === "new")
        return -2

    if (typeof (nodeID) === "undefined")
        return null

    for (const n in nodes) {
        if (nodes[n].id === nodeID)
            return parseInt(n)
    }

    return -1
}

function modDef(expr: string, nodeGrps: NodeGroups, captureRegex: string, nodeLabeler: NodeLabelFunc) {
    const capture = expr.match(
        new RegExp('^' + captureRegex + "[^\\w\\-]")
    )

    if (capture === null)
        return null

    const nodeDef = capture[1]

    if (!(nodeDef in nodeGrps))
        return expr

    const cnt = nodeGrps[nodeDef].length
    const rest = expr.substring(capture[1].length)

    if (cnt === 0)
        return nodeDef + ":?" + rest

    let res = []
    for (let i = 0; i < cnt; i++) {
        const nodeNum = i+1
        const nodeId = nodeGrps[nodeDef][i].id

        const nodeRest = rest
            .replaceAll('$nodeNum', nodeNum.toString())
            .replaceAll('$nodeId', nodeId)
            .replaceAll('$nodeLabel', nodeLabeler(nodeId, nodeNum))

        res.push(nodeDef + ":" + i + nodeRest)
    }
    return res.join("\n")
}

function modEdge(expr: string, nodeGrps: NodeGroups, captureRegex: string, nodeDefs: NodeDefs) {
    const capture = expr.match(
        new RegExp('^' + captureRegex + '-->' + captureRegex + '$')
    )

    if (capture === null) {
        return null
    }

    const from = capture[1]
    const to = capture[2]

    if (!(from in nodeGrps) || nodeGrps[from].length === 0) {
        const f = from in nodeGrps && nodeGrps[from].length === 0 ? ':?' : ''

        if (to in nodeGrps) {
            if (nodeGrps[to].length === 0) {
                return from + f + '-->' + to + ':?'
            }

            let res = []
            for (const t in nodeGrps[to]) {
                res.push(from + f + '-->' + to + ':' + t)
            }

            return res.join("\n")
        }

        return from + f + '-->' + to
    }

    let unknown = 0
    let res = []
    for (const [f, nodeFrom] of Object.entries(nodeGrps[from])) {
        if (typeof (nodeFrom.edgesTo) === "undefined" || !(to in nodeGrps)) {
            res.push(from + ':' + f + '-->' + to)
            continue
        }

        for (const nodeTo of Object.values(nodeFrom.edgesTo[to])) {
            if (!(nodeTo in nodeDefs[to])) {
                res.push(from + ':' + f + '-->' + to + ':?' + unknown++)
                continue
            }

            res.push(from + ':' + f + '-->' + to + ':' + nodeDefs[to][nodeTo])
        }
    }

    return res.join("\n")
}

function modStyle(expr: string, nodeGrps: NodeGroups, captureRegex: string) {
    const capture = expr.match(
        new RegExp('^style ' + captureRegex + " ")
    )

    if (capture === null)
        return null

    const nodeDef = capture[1]

    if (!(nodeDef in nodeGrps))
        return expr

    const cnt = nodeGrps[nodeDef].length
    const rest = expr.substring(capture[0].length)

    if (cnt === 0)
        return 'style ' + nodeDef + ':? ' + rest

    let res = []
    for (let i = 0; i < cnt; i++) {
        res.push('style ' + nodeDef + ":" + i + ' ' + rest)
    }
    return res.join("\n")
}

function expandExpr(expr: string, nodeGrps: NodeGroups, nodeDefs: NodeDefs, nodeLabeler: NodeLabelFunc): string {
    const captureRegex = '(' + Object.keys(nodeDefs).join('|') + ')'

    {
        let modExpr = modDef(expr, nodeGrps, captureRegex, nodeLabeler)

        if (modExpr !== null)
            return modExpr
    }

    {
        let modExpr = modEdge(expr, nodeGrps, captureRegex, nodeDefs)

        if (modExpr !== null)
            return modExpr
    }

    {
        let modExpr = modStyle(expr, nodeGrps, captureRegex)

        if (modExpr !== null)
            return modExpr
    }

    return expr
}

function expandExprs(chartTemplate: string, nodeGrps: NodeGroups, nodeLabeler: NodeLabelFunc) {
    const exprs = parseExprs(chartTemplate)
    const nodeDefs = parseNodeDefs(exprs, nodeGrps)

    return exprs.reduce((res, expr) => {
        return res + expandExpr(expr, nodeGrps, nodeDefs, nodeLabeler) + "\n"
    }, "").trim()
}

function applyStyle(chart_id: string, nodeSelected: SelectedNode, colors: ColorProps) {
    if (nodeSelected.idx === -2)
        return ""

    if (nodeSelected.idx !== null) {
        if (isNaN(nodeSelected.idx))
            chart_id += ':?'
        else if (nodeSelected.idx !== -1)
            chart_id += ":" + nodeSelected.idx
    }

    return "\nstyle " + chart_id + " fill:" + colors.selected
}

function applyStyles(chart_id: string, nodeSelected: SelectedNode, { nodeGrps, colors }: Props) {
    if (nodeSelected.idx !== null)
        return applyStyle(chart_id, nodeSelected, colors)

    if (nodeSelected.grp in nodeGrps) {
        if ( nodeGrps[nodeSelected.grp].length === 0 )
            return applyStyle(chart_id, {
                grp: nodeSelected.grp,
                idx: NaN,
            } as SelectedNode, colors)

        let styles = [];
        for (let i = 0; i < nodeGrps[nodeSelected.grp].length; i++) {
            styles.push(applyStyle(chart_id, {
                grp: nodeSelected.grp,
                idx: i,
            } as SelectedNode, colors))
        }
        return styles.join('\n')
    } else {
        return applyStyle(chart_id, {
            grp: nodeSelected.grp,
            idx: null,
        } as SelectedNode, colors)
    }
}

export default function Diagram(props: Props) {
    const navigate = useNavigate();
    const { nodeGrp, nodeID } = useParams();

    let nodeSelected: SelectedNode | null = null

    const handleClick = (e: MouseEvent<HTMLDivElement>) => {
        const nodeElem = (e.target as HTMLElement).closest(".node")

        if (nodeElem === null)
            return;

        const html_id = nodeElem.id.substring(10, nodeElem.id.lastIndexOf("-"))
        const { grp, idx } = extractId(html_id)

        if (grp in props.nodeGrps && idx !== -1 && !isNaN(idx)) {
            const node = props.nodeGrps[grp][idx]

            if (typeof (node) !== "undefined") {
                navigate('/configuration/' + grp + '/' + node.id)
            }
        } else {
            navigate('/configuration/' + grp + '/')
        }
    }

    const genChart = () => {
        let chart = expandExprs(
            props.chartTemplate,
            props.nodeGrps,
            props.nodeLabeler,
        )

        if (nodeSelected !== null) {
            let chart_id = nodeSelected.grp

            chart += applyStyles(chart_id, nodeSelected, props)
        }

        return chart
    }

    if (typeof (nodeGrp) !== "undefined") {
        const grp = nodeGrp.toUpperCase()

        if (grp in props.nodeGrps) {
            const idx = determineID(nodeID, props.nodeGrps[grp])

            nodeSelected = { grp, idx }
        } else {
            nodeSelected = { grp, idx: null }
        }
    }

    return <Row onClick={handleClick}>
        <Col lg>
            <Row className="justify-content-md-center">
                <Col md="auto">
                    <Mermaid chart={genChart()} />
                </Col>
            </Row>
        </Col>
        <Col lg>
            <InspectPane nodeGrps={props.nodeGrps} nodePanes={props.nodePanes} nodeSelected={nodeSelected} reload={props.reload} />
        </Col>
    </Row>
}

Diagram.defaultProps = {
    id: 0,
    nodeGrps: [],
    nodePanes: {},
    colors: {
        selected: "#00D1FF",
    },
    nodeLabeler: (id: string, num: number) => {
        return id + ':' + num.toString()
    }
};
