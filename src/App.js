/* eslint-disable react/forbid-prop-types */
import React, { useState, useRef, useCallback, useEffect } from 'react'
import './App.css'
import PropTypes from 'prop-types'
import { FixedSizeGrid as Grid } from 'react-window'
import Autosizer from 'react-virtualized-auto-sizer'
import { parse } from 'clustal-js'
import colorSchemes from './colorSchemes'

const defaultColorScheme = 'maeditor'

const Cell = props => {
  const { rowIndex, columnIndex, style, data } = props
  const { colorScheme, rowData } = data
  const nodes = Object.keys(rowData)
  const letter = rowData[nodes[rowIndex]][columnIndex]
  return (
    <div
      style={{
        ...style,
        backgroundColor: colorScheme[letter.toUpperCase()] || 'black',
      }}
    />
  )
}

Window.propTypes = {
  rowData: PropTypes.any.isRequired,
  zoom: PropTypes.number,
}
function Window(props) {
  const { rowData, zoom } = props
  const nodes = Object.keys(rowData)
  const elt = nodes[0]

  return (
    <Grid
      columnCount={rowData[elt].length}
      columnWidth={zoom}
      height={400}
      rowCount={nodes.length}
      rowHeight={20}
      width={1000}
      itemData={{ ...props }}
    >
      {Cell}
    </Grid>
  )
}

MSARows.propTypes = {
  style: PropTypes.any,
  colorScheme: PropTypes.any,
  zoom: PropTypes.number,
  rowData: PropTypes.any.isRequired,
}

function MSARows({ style = {}, zoom, rowData, colorScheme }) {
  const ref = useRef()

  return (
    <div ref={ref} style={style}>
      <Window zoom={zoom} rowData={rowData} colorScheme={colorScheme} />
    </div>
  )
}

function App() {
  const [data, setData] = useState()
  const [zoom, setZoom] = useState(10)

  useEffect(() => {
    (async () => {
      const res = await fetch('./tree-align-view-react/data.aln')
      if (res.ok) {
        const temp = await res.text()
        const result = await parse(temp)
        setData(Object.fromEntries(result.alns.map(row => [row.id, row.seq])))
      }
    })()
  }, [])
  const colorScheme = colorSchemes[defaultColorScheme]

  return (
    <div className="App">
      <button onClick={() => setZoom(state => state / 2)}>Zoom out</button>
      <button onClick={() => setZoom(state => state * 2)}>Zoom in</button>
      {data ? (
        <MSARows zoom={zoom} colorScheme={colorScheme} rowData={data} />
      ) : null}
    </div>
  )
}

export default App
