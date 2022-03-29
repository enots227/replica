import { SelectedNode, NodePanes, NodeGroups } from '../types'

type Props = {
    nodeGrps: NodeGroups
    nodePanes: NodePanes
    nodeSelected: SelectedNode | null
    reload?: () => Promise<void>
}

export default function InspectPane(props: Props) {
    if (   props.nodePanes === null 
        || props.nodeSelected === null
        || !(props.nodeSelected.grp in props.nodePanes) )
        return null

    const Pane = props.nodePanes[props.nodeSelected.grp]

    return <Pane items={props.nodeSelected.grp in props.nodeGrps ? props.nodeGrps[props.nodeSelected.grp] : []} reload={props.reload} />
}
