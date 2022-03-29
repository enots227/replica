
export type NodeEdgesTo = {
    [grp: string]: string[]
}

export type Node = {
    id: string,
    edgesTo?: NodeEdgesTo,
    data?: any
}

export type NodeGroups = {
    [grp: string]: Node[],
} 

export type NodePanes = {
    [grp: string]: any
} | null

export type SelectedNode = {
    grp: string
    idx: number | null
}
