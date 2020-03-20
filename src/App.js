/* eslint-disable react/forbid-prop-types */
import React, { useState, useRef, useCallback, useEffect } from 'react'
import './App.css'
import PropTypes from 'prop-types'
import { FixedSizeGrid as Grid } from 'react-window'
import Autosizer from 'react-virtualized-auto-sizer'
import colorSchemes from './colorSchemes'

const defaultColorScheme = 'maeditor'

TreeCanvas.propTypes = {
  width: PropTypes.number.isRequired,
  height: PropTypes.number.isRequired,
  nodes: PropTypes.any.isRequired,
  branchStrokeStyle: PropTypes.any.isRequired,
  treeStrokeWidth: PropTypes.any,
  ancestorCollapsed: PropTypes.any.isRequired,
  rowHeight: PropTypes.number,
  nodeChildren: PropTypes.any,
  nodeHandleRadius: PropTypes.number,
  rowConnectorDash: PropTypes.any,
  nodeClicked: PropTypes.func,
  collapsed: PropTypes.any,
  nx: PropTypes.any,
  ny: PropTypes.any,
  collapsedNodeHandleFillStyle: PropTypes.string,
  nodeHandleFillStyle: PropTypes.string,
}
function TreeCanvas({
  width,
  height,
  nodes,
  branchStrokeStyle,
  treeStrokeWidth = 1,
  ancestorCollapsed,
  rowConnectorDash = [2, 2],
  nodeChildren,
  rowHeight = 24,
  nodeHandleRadius = 4,
  collapsed,
  collapsedNodeHandleFillStyle = 'white',
  nodeHandleFillStyle = 'black',
  nodeClicked = () => {},
  nx,
  ny,
}) {
  const treeCanvas = useRef()

  const nodesWithHandles = nodes.filter(
    node => !ancestorCollapsed[node] && nodeChildren[node].length
  )

  const makeNodeHandlePath = useCallback(
    (node, ctx) => {
      ctx.beginPath()
      ctx.arc(nx[node], ny[node], nodeHandleRadius, 0, 2 * Math.PI)
    },
    [nodeHandleRadius, nx, ny]
  )

  // useEffect+useRef is a conventional way to draw to
  // canvas using React. the ref is a "reference to the canvas DOM element"
  // and the useEffect makes sure to update it when the ref changes and/or
  // the props that are relevant to all the drawing code within here change
  useEffect(() => {
    if (treeCanvas.current) {
      const ctx = treeCanvas.current.getContext('2d')
      ctx.strokeStyle = branchStrokeStyle
      ctx.lineWidth = treeStrokeWidth
      nodes.forEach(node => {
        if (!ancestorCollapsed[node]) {
          if (!nodeChildren[node].length) {
            ctx.setLineDash([])
            ctx.beginPath()
            ctx.fillRect(
              nx[node],
              ny[node] - nodeHandleRadius,
              1,
              2 * nodeHandleRadius
            )
          }
          if (nodeChildren[node].length && !collapsed[node]) {
            ctx.setLineDash([])
            nodeChildren[node].forEach(child => {
              ctx.beginPath()
              ctx.moveTo(nx[node], ny[node])
              ctx.lineTo(nx[node], ny[child])
              ctx.lineTo(nx[child], ny[child])
              ctx.stroke()
            })
          } else {
            ctx.setLineDash(rowConnectorDash)
            ctx.beginPath()
            ctx.moveTo(nx[node], ny[node])
            ctx.lineTo(width, ny[node])
            ctx.stroke()
          }
        }
      })
      nodesWithHandles.forEach(node => {
        makeNodeHandlePath(node, ctx)
        if (collapsed[node]) {
          ctx.fillStyle = collapsedNodeHandleFillStyle
        } else {
          ctx.fillStyle = nodeHandleFillStyle
          ctx.stroke()
        }
        ctx.fill()
      })
    }
  }, [
    ancestorCollapsed,
    branchStrokeStyle,
    treeStrokeWidth,
    rowConnectorDash,
    nx,
    ny,
    nodes,
    nodeHandleRadius,
    nodeChildren,
    collapsed,
    nodesWithHandles,
    collapsedNodeHandleFillStyle,
    nodeHandleFillStyle,
    makeNodeHandlePath,
    width,
  ])

  return (
    <canvas
      ref={treeCanvas}
      onClick={evt => {
        const { clientX, clientY } = evt
        const mouseX = clientX - treeCanvas.current.getBoundingClientRect().left
        const mouseY = clientY - treeCanvas.current.getBoundingClientRect().top
        const ctx = treeCanvas.current.getContext('2d')
        let clickedNode = null
        nodesWithHandles.forEach(node => {
          makeNodeHandlePath(node, ctx)
          if (ctx.isPointInPath(mouseX, mouseY)) {
            clickedNode = node
          }
        })
        if (clickedNode && nodeClicked) {
          nodeClicked(clickedNode)
        }
      }}
      width={width}
      height={height}
      style={{ width, height }}
    />
  )
}

SpeciesNames.propTypes = {
  nodes: PropTypes.any.isRequired,
  ancestorCollapsed: PropTypes.any.isRequired,
  colorScheme: PropTypes.any,
  rowData: PropTypes.any.isRequired,
  rowHeights: PropTypes.any.isRequired,
}
function SpeciesNames({
  nodes,
  ancestorCollapsed,
  rowHeights,
  rowData,
  colorScheme,
}) {
  return (
    <div>
      {nodes.map(node => {
        return (
          <div key={node} style={{ height: rowHeights[node] }}>
            {!ancestorCollapsed[node] && rowData[node] ? (
              <span>{node}</span>
            ) : null}
          </div>
        )
      })}
    </div>
  )
}

const Cell = props => {
  const { rowIndex, columnIndex, style, data } = props
  const { ancestorCollapsed, colorScheme, rowHeights, rowData } = data
  const nodes = Object.keys(rowData)
  const letter = rowData[nodes[rowIndex]][columnIndex]
  return (
    <div
      style={{ ...style, color: colorScheme[letter.toUpperCase()] || 'black' }}
    >
      {letter}
    </div>
  )
}

Window.propTypes = {
  rowData: PropTypes.any.isRequired,
}
function Window(props) {
  const { rowData } = props
  const nodes = Object.keys(rowData)
  const elt = nodes[0]

  return (
    <Autosizer>
      {({ height, width }) => (
        <Grid
          columnCount={rowData[elt].length}
          columnWidth={25}
          height={height}
          rowCount={nodes.length}
          rowHeight={20}
          width={width}
          itemData={{ ...props }}
        >
          {Cell}
        </Grid>
      )}
    </Autosizer>
  )
}

MSARows.propTypes = {
  nodes: PropTypes.any.isRequired,
  style: PropTypes.any,
  colorScheme: PropTypes.any,
  rowData: PropTypes.any.isRequired,
  height: PropTypes.any.isRequired,
}

function MSARows({ nodes, style = {}, rowData, colorScheme, height }) {
  const ref = useRef()

  return (
    <div ref={ref} style={style}>
      <Window
        rowData={rowData}
        nodes={nodes}
        colorScheme={colorScheme}
        height={height}
      />
    </div>
  )
}

MSA.propTypes = {
  rowHeight: PropTypes.number,
  nameFontSize: PropTypes.number,
  width: PropTypes.string,
  height: PropTypes.number,
  treeWidth: PropTypes.number,
  nameWidth: PropTypes.number,
  branchStrokeStyle: PropTypes.string,
  nodeHandleRadius: PropTypes.number,
  nodeHandleFillStyle: PropTypes.string,
  colorScheme: PropTypes.string,
  collapsed: PropTypes.shape({}),
  rowData: PropTypes.shape({}).isRequired,
  branches: PropTypes.any.isRequired,
  root: PropTypes.string.isRequired,
}

function MSA({
  rowHeight: genericRowHeight = 24,
  nameFontSize = 12,
  width: containerWidth = '',
  height: containerHeight = null,
  treeWidth = 200,
  nameWidth = 200,
  branchStrokeStyle = 'black',
  nodeHandleRadius = 4,
  nodeHandleFillStyle = 'white',
  colorScheme: colorSchemeName = defaultColorScheme,
  collapsed: initialCollapsed = {},
  root,
  branches,
  rowData,
}) {
  const ref = useRef()
  const [collapsed, setCollapsed] = useState(initialCollapsed)
  const colorScheme = colorSchemes[colorSchemeName]
  const treeStrokeWidth = 1
  const availableTreeWidth = treeWidth - nodeHandleRadius - 2 * treeStrokeWidth
  const charFontName = 'Menlo,monospace'
  const scrollbarHeight = 20 // hack

  // get tree structure
  const nodeChildren = {}
  const branchLength = {}
  nodeChildren[root] = []
  branchLength[root] = 0
  branches.forEach(branch => {
    const parent = branch[0]
    const child = branch[1]
    const len = branch[2]
    nodeChildren[parent] = nodeChildren[parent] || []
    nodeChildren[child] = nodeChildren[child] || []
    nodeChildren[parent].push(child)
    branchLength[child] = len
  })
  const nodes = []
  const nodeRank = {}
  const ancestorCollapsed = {}
  const distFromRoot = {}
  let maxDistFromRoot = 0

  const addNode = node => {
    if (!node) {
      throw new Error('All nodes must be named')
    }
    if (nodeRank[node]) {
      throw new Error(`All node names must be unique (duplicate '${node}')`)
    }
    nodeRank[node] = nodes.length
    nodes.push(node)
  }

  const addSubtree = (node, parent) => {
    distFromRoot[node] =
      (typeof parent !== 'undefined' ? distFromRoot[parent] : 0) +
      branchLength[node]
    maxDistFromRoot = Math.max(maxDistFromRoot, distFromRoot[node])
    ancestorCollapsed[node] = ancestorCollapsed[parent] || collapsed[parent]
    const kids = nodeChildren[node]
    if (kids.length === 2) {
      addSubtree(kids[0], node)
      addNode(node)
      addSubtree(kids[1], node)
    } else {
      addNode(node)
      kids.forEach(child => addSubtree(child, node))
    }
  }
  addSubtree(root)

  // layout tree
  const nx = {}
  const ny = {}
  const rowHeights = {}
  let treeHeight = 0
  nodes.forEach(node => {
    const rh =
      ancestorCollapsed[node] ||
      !(rowData[node] || (collapsed[node] && !ancestorCollapsed[node]))
        ? 0
        : genericRowHeight
    nx[node] =
      nodeHandleRadius +
      treeStrokeWidth +
      (availableTreeWidth * distFromRoot[node]) / maxDistFromRoot
    ny[node] = treeHeight + rh / 2
    rowHeights[node] = rh
    treeHeight += rh
  })
  treeHeight += scrollbarHeight

  return (
    <div
      style={{
        width: containerWidth,
        height: containerHeight || treeHeight,
        overflowY: 'auto',
      }}
      ref={ref}
    >
      <MSARows
        colorScheme={colorScheme}
        rowData={rowData}
        rowHeights={rowHeights}
        ancestorCollapsed={ancestorCollapsed}
        nodes={nodes}
        height={treeHeight}
      />
    </div>
  )
}
function App() {
  const [data, setData] = useState()
  useEffect(async () => {
    const res = await fetch('./data.json').then(result => result.json())
    setData(res)
  }, [])

  return (
    <div className="App">
      <MSARows
        colorScheme={colorScheme}
        rowData={data}
        rowHeights={rowHeights}
        nodes={nodes}
        height={treeHeight}
      />
    </div>
  )
}

export default App
