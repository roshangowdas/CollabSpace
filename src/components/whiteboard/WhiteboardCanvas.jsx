// ==============================================================================
// CollabSpace Component: WhiteboardCanvas
// File: src/components/whiteboard/WhiteboardCanvas.jsx
// Description:
//   Interactive SVG Whiteboard Canvas supporting Select, Pan, Zoom, Sticky Notes,
//   Rectangles, Circles, Arrows, Freehand Drawing, Text, Resizing, and Live Collaborator Cursors.
// ==============================================================================

import React, { useState, useRef, useEffect, useCallback } from 'react'
import {
  saveWhiteboardElement,
  deleteWhiteboardElement,
  SHAPE_TYPES,
  STICKY_COLORS,
} from '@/services/whiteboards'
import { cn } from '@/utils/cn'

export function WhiteboardCanvas({
  whiteboardId,
  elements = [],
  onElementsChange,
  activeTool = SHAPE_TYPES.SELECT,
  setActiveTool,
  activeColor = STICKY_COLORS[0].bg,
  zoom = 1,
  setZoom,
  pan = { x: 0, y: 0 },
  setPan,
  currentUser,
  remoteCursors = {},
  onBroadcastCursor = null,
  onBroadcastElement = null,
  selectedElementId,
  setSelectedElementId,
  className = '',
}) {
  const svgRef = useRef(null)
  const isInteractingRef = useRef(false)
  const interactionStateRef = useRef(null)
  const lastCursorBroadcastRef = useRef(0)

  const [activeDrawing, setActiveDrawing] = useState(null)
  const [editingTextElementId, setEditingTextElementId] = useState(null)

  // Convert browser viewport client coordinates to canvas world coordinates
  const getCanvasCoords = useCallback(
    (clientX, clientY) => {
      if (!svgRef.current) return { x: 0, y: 0 }
      const rect = svgRef.current.getBoundingClientRect()
      const x = (clientX - rect.left - pan.x) / zoom
      const y = (clientY - rect.top - pan.y) / zoom
      return { x: Math.round(x), y: Math.round(y) }
    },
    [pan, zoom]
  )

  // 1. Mouse Down Handler
  const handleMouseDown = (e) => {
    // Only handle primary left click
    if (e.button !== 0 && e.button !== 1) return

    const { x, y } = getCanvasCoords(e.clientX, e.clientY)
    isInteractingRef.current = true

    // Handle Pan Tool or middle mouse click
    if (activeTool === SHAPE_TYPES.PAN || e.button === 1 || e.spaceKey) {
      interactionStateRef.current = {
        type: 'pan',
        startClientX: e.clientX,
        startClientY: e.clientY,
        startPanX: pan.x,
        startPanY: pan.y,
      }
      return
    }

    // Handle Selection & Moving
    if (activeTool === SHAPE_TYPES.SELECT) {
      // Find clicked element (from top-most z-index down)
      const clicked = [...elements]
        .reverse()
        .find((el) => isPointInElement(x, y, el))

      if (clicked) {
        setSelectedElementId(clicked.id)
        interactionStateRef.current = {
          type: 'move',
          elementId: clicked.id,
          startX: x,
          startY: y,
          originalProps: { ...clicked.properties },
        }
      } else {
        setSelectedElementId(null)
        setEditingTextElementId(null)
      }
      return
    }

    // Handle Sticky Note Placement
    if (activeTool === SHAPE_TYPES.STICKY) {
      const newSticky = {
        id: `elem-sticky-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        whiteboard_id: whiteboardId,
        element_type: 'sticky_note',
        properties: {
          x: x - 90,
          y: y - 80,
          width: 180,
          height: 160,
          color: activeColor,
          text: 'New Idea...',
          fontSize: 14,
        },
        z_index: elements.length + 1,
        created_by: currentUser?.id,
      }

      onElementsChange((prev) => [...prev, newSticky])
      saveWhiteboardElement(newSticky)
      if (onBroadcastElement) onBroadcastElement('create', newSticky)

      setSelectedElementId(newSticky.id)
      setEditingTextElementId(newSticky.id)
      setActiveTool(SHAPE_TYPES.SELECT)
      isInteractingRef.current = false
      return
    }

    // Handle Text Box Placement
    if (activeTool === SHAPE_TYPES.TEXT) {
      const newText = {
        id: `elem-text-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        whiteboard_id: whiteboardId,
        element_type: 'text',
        properties: {
          x,
          y,
          width: 200,
          height: 50,
          text: 'Heading...',
          fontSize: 18,
          color: '#0f172a',
        },
        z_index: elements.length + 1,
        created_by: currentUser?.id,
      }

      onElementsChange((prev) => [...prev, newText])
      saveWhiteboardElement(newText)
      if (onBroadcastElement) onBroadcastElement('create', newText)

      setSelectedElementId(newText.id)
      setEditingTextElementId(newText.id)
      setActiveTool(SHAPE_TYPES.SELECT)
      isInteractingRef.current = false
      return
    }

    // Handle Drawing Shapes (Rectangle, Circle, Arrow, Line, Freehand)
    interactionStateRef.current = {
      type: 'draw',
      tool: activeTool,
      startX: x,
      startY: y,
    }

    if (activeTool === SHAPE_TYPES.FREEHAND) {
      setActiveDrawing({
        type: 'path',
        points: [{ x, y }],
        stroke: '#0f172a',
        strokeWidth: 3,
      })
    }
  }

  // 2. Mouse Move Handler
  const handleMouseMove = (e) => {
    const { x, y } = getCanvasCoords(e.clientX, e.clientY)

    // Broadcast collaborator cursor (throttled to 40ms)
    const now = Date.now()
    if (onBroadcastCursor && now - lastCursorBroadcastRef.current > 40) {
      lastCursorBroadcastRef.current = now
      onBroadcastCursor(x, y)
    }

    if (!isInteractingRef.current || !interactionStateRef.current) return

    const state = interactionStateRef.current

    // Pan Canvas Drag
    if (state.type === 'pan') {
      const dx = e.clientX - state.startClientX
      const dy = e.clientY - state.startClientY
      setPan({
        x: state.startPanX + dx,
        y: state.startPanY + dy,
      })
      return
    }

    // Move Element Drag
    if (state.type === 'move') {
      const dx = x - state.startX
      const dy = y - state.startY

      onElementsChange((prev) =>
        prev.map((el) => {
          if (el.id !== state.elementId) return el

          const orig = state.originalProps
          const updatedProps = { ...orig }

          if (orig.x !== undefined && orig.y !== undefined) {
            updatedProps.x = Math.round(orig.x + dx)
            updatedProps.y = Math.round(orig.y + dy)
          } else if (orig.startX !== undefined) {
            updatedProps.startX = Math.round(orig.startX + dx)
            updatedProps.startY = Math.round(orig.startY + dy)
            updatedProps.endX = Math.round(orig.endX + dx)
            updatedProps.endY = Math.round(orig.endY + dy)
          } else if (orig.points) {
            updatedProps.points = orig.points.map((p) => ({
              x: Math.round(p.x + dx),
              y: Math.round(p.y + dy),
            }))
          }

          return { ...el, properties: updatedProps }
        })
      )
      return
    }

    // Resize Element Drag
    if (state.type === 'resize') {
      const dx = x - state.startX
      const dy = y - state.startY

      onElementsChange((prev) =>
        prev.map((el) => {
          if (el.id !== state.elementId) return el
          const orig = state.originalProps
          const newW = Math.max(50, Math.round(orig.width + dx))
          const newH = Math.max(40, Math.round(orig.height + dy))
          return {
            ...el,
            properties: { ...el.properties, width: newW, height: newH },
          }
        })
      )
      return
    }

    // Freehand Drawing
    if (state.type === 'draw' && state.tool === SHAPE_TYPES.FREEHAND) {
      setActiveDrawing((prev) => {
        if (!prev) return null
        return {
          ...prev,
          points: [...prev.points, { x, y }],
        }
      })
      return
    }

    // Preview Shapes
    if (state.type === 'draw') {
      const minX = Math.min(state.startX, x)
      const minY = Math.min(state.startY, y)
      const width = Math.abs(x - state.startX)
      const height = Math.abs(y - state.startY)

      if (state.tool === SHAPE_TYPES.RECTANGLE) {
        setActiveDrawing({
          type: 'rectangle',
          x: minX,
          y: minY,
          width,
          height,
          fill: '#ffffff',
          stroke: '#3b82f6',
          strokeWidth: 2,
        })
      } else if (state.tool === SHAPE_TYPES.CIRCLE) {
        setActiveDrawing({
          type: 'circle',
          x: minX,
          y: minY,
          width,
          height,
          fill: '#ffffff',
          stroke: '#3b82f6',
          strokeWidth: 2,
        })
      } else if (state.tool === SHAPE_TYPES.ARROW || state.tool === SHAPE_TYPES.LINE) {
        setActiveDrawing({
          type: state.tool === SHAPE_TYPES.ARROW ? 'arrow' : 'line',
          startX: state.startX,
          startY: state.startY,
          endX: x,
          endY: y,
          stroke: '#3b82f6',
          strokeWidth: 2,
        })
      }
    }
  }

  // 3. Mouse Up Handler
  const handleMouseUp = () => {
    if (!isInteractingRef.current) return
    isInteractingRef.current = false

    const state = interactionStateRef.current
    interactionStateRef.current = null

    // If moving or resizing, persist final position
    if (state?.type === 'move' || state?.type === 'resize') {
      const movedElement = elements.find((el) => el.id === state.elementId)
      if (movedElement) {
        saveWhiteboardElement(movedElement)
        if (onBroadcastElement) onBroadcastElement('update', movedElement)
      }
      return
    }

    // Finalize shape creation
    if (state?.type === 'draw' && activeDrawing) {
      let finalElement = null
      const uniqueId = `elem-${activeDrawing.type}-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`

      if (activeDrawing.type === 'rectangle' && activeDrawing.width > 5 && activeDrawing.height > 5) {
        finalElement = {
          id: uniqueId,
          whiteboard_id: whiteboardId,
          element_type: 'rectangle',
          properties: {
            x: activeDrawing.x,
            y: activeDrawing.y,
            width: activeDrawing.width,
            height: activeDrawing.height,
            fill: '#ffffff',
            stroke: '#0f172a',
            strokeWidth: 2,
          },
          z_index: elements.length + 1,
          created_by: currentUser?.id,
        }
      } else if (activeDrawing.type === 'circle' && activeDrawing.width > 5 && activeDrawing.height > 5) {
        finalElement = {
          id: uniqueId,
          whiteboard_id: whiteboardId,
          element_type: 'circle',
          properties: {
            x: activeDrawing.x,
            y: activeDrawing.y,
            width: activeDrawing.width,
            height: activeDrawing.height,
            fill: '#ffffff',
            stroke: '#0f172a',
            strokeWidth: 2,
          },
          z_index: elements.length + 1,
          created_by: currentUser?.id,
        }
      } else if ((activeDrawing.type === 'arrow' || activeDrawing.type === 'line')) {
        finalElement = {
          id: uniqueId,
          whiteboard_id: whiteboardId,
          element_type: activeDrawing.type,
          properties: {
            startX: activeDrawing.startX,
            startY: activeDrawing.startY,
            endX: activeDrawing.endX,
            endY: activeDrawing.endY,
            stroke: '#0f172a',
            strokeWidth: 2,
          },
          z_index: elements.length + 1,
          created_by: currentUser?.id,
        }
      } else if (activeDrawing.type === 'path' && activeDrawing.points.length > 2) {
        finalElement = {
          id: uniqueId,
          whiteboard_id: whiteboardId,
          element_type: 'path',
          properties: {
            points: activeDrawing.points,
            stroke: '#0f172a',
            strokeWidth: 3,
          },
          z_index: elements.length + 1,
          created_by: currentUser?.id,
        }
      }

      if (finalElement) {
        onElementsChange((prev) => [...prev, finalElement])
        saveWhiteboardElement(finalElement)
        if (onBroadcastElement) onBroadcastElement('create', finalElement)
        setSelectedElementId(finalElement.id)
      }

      setActiveDrawing(null)
      setActiveTool(SHAPE_TYPES.SELECT)
    }
  }

  // Mouse wheel pan & zoom
  const handleWheel = (e) => {
    e.preventDefault()
    if (e.ctrlKey || e.metaKey) {
      // Zoom
      const zoomFactor = e.deltaY < 0 ? 1.08 : 0.92
      setZoom((z) => Math.min(Math.max(parseFloat((z * zoomFactor).toFixed(2)), 0.2), 3.0))
    } else {
      // Pan
      setPan((p) => ({
        x: p.x - e.deltaX,
        y: p.y - e.deltaY,
      }))
    }
  }

  // Update text inside sticky note or text element
  const handleTextChange = (elementId, newText) => {
    onElementsChange((prev) =>
      prev.map((el) => {
        if (el.id !== elementId) return el
        const updated = {
          ...el,
          properties: { ...el.properties, text: newText },
        }
        saveWhiteboardElement(updated)
        if (onBroadcastElement) onBroadcastElement('update', updated)
        return updated
      })
    )
  }

  // Check if a point hits an element
  function isPointInElement(px, py, el) {
    const p = el.properties
    if (p.x !== undefined && p.width !== undefined && p.height !== undefined) {
      return px >= p.x && px <= p.x + p.width && py >= p.y && py <= p.y + p.height
    }
    if (p.startX !== undefined && p.endX !== undefined) {
      const minX = Math.min(p.startX, p.endX) - 10
      const maxX = Math.max(p.startX, p.endX) + 10
      const minY = Math.min(p.startY, p.endY) - 10
      const maxY = Math.max(p.startY, p.endY) + 10
      return px >= minX && px <= maxX && py >= minY && py <= maxY
    }
    if (p.points && p.points.length > 0) {
      return p.points.some((pt) => Math.hypot(pt.x - px, pt.y - py) < 15)
    }
    return false
  }

  const selectedElement = elements.find((e) => e.id === selectedElementId)

  return (
    <div
      className={cn(
        'relative w-full h-full overflow-hidden bg-slate-50 dark:bg-zinc-950 select-none cursor-crosshair',
        activeTool === SHAPE_TYPES.PAN ? 'cursor-grab active:cursor-grabbing' : '',
        activeTool === SHAPE_TYPES.SELECT ? 'cursor-default' : '',
        className
      )}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onWheel={handleWheel}
    >
      <svg
        ref={svgRef}
        className="w-full h-full"
        style={{ touchAction: 'none' }}
      >
        <defs>
          {/* Subtle Grid Dot Pattern */}
          <pattern
            id="canvas-grid"
            width={40 * zoom}
            height={40 * zoom}
            patternUnits="userSpaceOnUse"
            patternTransform={`translate(${pan.x % (40 * zoom)}, ${pan.y % (40 * zoom)})`}
          >
            <circle
              cx={20 * zoom}
              cy={20 * zoom}
              r={1.2 * zoom}
              fill="currentColor"
              className="text-slate-300 dark:text-zinc-800"
            />
          </pattern>

          {/* Arrowhead Marker */}
          <marker
            id="arrowhead"
            viewBox="0 0 10 10"
            refX="6"
            refY="5"
            markerWidth="6"
            markerHeight="6"
            orient="auto-start-reverse"
          >
            <path d="M 0 1 L 10 5 L 0 9 z" fill="#0f172a" className="dark:fill-zinc-200" />
          </marker>

          <marker
            id="arrowhead-preview"
            viewBox="0 0 10 10"
            refX="6"
            refY="5"
            markerWidth="6"
            markerHeight="6"
            orient="auto-start-reverse"
          >
            <path d="M 0 1 L 10 5 L 0 9 z" fill="#3b82f6" />
          </marker>
        </defs>

        {/* Background Grid */}
        <rect width="100%" height="100%" fill="url(#canvas-grid)" />

        {/* Main Canvas Viewport Group */}
        <g transform={`translate(${pan.x}, ${pan.y}) scale(${zoom})`}>
          {/* Render All Elements */}
          {elements.map((el) => (
            <RenderWhiteboardElement
              key={el.id}
              element={el}
              isSelected={el.id === selectedElementId}
              isEditing={el.id === editingTextElementId}
              onStartEdit={() => setEditingTextElementId(el.id)}
              onTextChange={(newText) => handleTextChange(el.id, newText)}
            />
          ))}

          {/* Render Active In-Progress Drawing Preview */}
          {activeDrawing && <RenderDrawingPreview drawing={activeDrawing} />}

          {/* Resize Handle for Selected Element */}
          {selectedElement && selectedElement.properties?.width && (
            <g>
              {/* Bounding box outline */}
              <rect
                x={selectedElement.properties.x - 2}
                y={selectedElement.properties.y - 2}
                width={selectedElement.properties.width + 4}
                height={selectedElement.properties.height + 4}
                fill="none"
                stroke="#3b82f6"
                strokeWidth={1.5}
                strokeDasharray="4 4"
                pointerEvents="none"
              />

              {/* SE Resize Handle */}
              <rect
                x={selectedElement.properties.x + selectedElement.properties.width - 4}
                y={selectedElement.properties.y + selectedElement.properties.height - 4}
                width={8}
                height={8}
                fill="#ffffff"
                stroke="#3b82f6"
                strokeWidth={2}
                className="cursor-se-resize"
                onMouseDown={(e) => {
                  e.stopPropagation()
                  isInteractingRef.current = true
                  const { x, y } = getCanvasCoords(e.clientX, e.clientY)
                  interactionStateRef.current = {
                    type: 'resize',
                    elementId: selectedElement.id,
                    startX: x,
                    startY: y,
                    originalProps: { ...selectedElement.properties },
                  }
                }}
              />
            </g>
          )}

          {/* Collaborator Live Cursors */}
          {Object.entries(remoteCursors).map(([uid, cursor]) => {
            if (!cursor || uid === currentUser?.id) return null
            return (
              <g
                key={uid}
                transform={`translate(${cursor.x}, ${cursor.y})`}
                className="transition-transform duration-75 pointer-events-none"
              >
                {/* Mouse Arrow */}
                <path
                  d="M0,0 L0,18 L4.5,13.5 L9.5,23.5 L12.5,22 L7.5,12 L14,12 Z"
                  fill={cursor.userColor || '#3b82f6'}
                  stroke="#ffffff"
                  strokeWidth="1.2"
                />
                {/* User Name Tag */}
                <g transform="translate(14, 14)">
                  <rect
                    rx="4"
                    x="0"
                    y="0"
                    width={Math.max((cursor.userName || 'Peer').length * 7 + 12, 45)}
                    height="18"
                    fill={cursor.userColor || '#3b82f6'}
                    className="shadow-sm"
                  />
                  <text
                    x="6"
                    y="13"
                    fill="#ffffff"
                    fontSize="10"
                    fontWeight="600"
                    fontFamily="sans-serif"
                  >
                    {cursor.userName || 'Peer'}
                  </text>
                </g>
              </g>
            )
          })}
        </g>
      </svg>
    </div>
  )
}

/**
 * Renders individual SVG canvas elements
 */
function RenderWhiteboardElement({
  element,
  isSelected,
  isEditing,
  onStartEdit,
  onTextChange,
}) {
  const p = element.properties

  // Sticky Note
  if (element.element_type === 'sticky_note') {
    return (
      <g
        transform={`translate(${p.x}, ${p.y})`}
        className="cursor-move"
        onDoubleClick={onStartEdit}
      >
        {/* Sticky Background & Shadow */}
        <rect
          width={p.width}
          height={p.height}
          rx={6}
          fill={p.color || '#fef08a'}
          stroke={isSelected ? '#3b82f6' : 'rgba(0,0,0,0.08)'}
          strokeWidth={isSelected ? 2 : 1}
          filter="drop-shadow(0 2px 4px rgba(0,0,0,0.1))"
        />

        {/* Top Tape decoration */}
        <rect
          x={(p.width - 40) / 2}
          y={-5}
          width={40}
          height={10}
          rx={2}
          fill="rgba(255,255,255,0.4)"
        />

        {/* Text Content / Editor */}
        <foreignObject x={10} y={15} width={p.width - 20} height={p.height - 25}>
          {isEditing ? (
            <textarea
              defaultValue={p.text}
              onBlur={(e) => onTextChange(e.target.value)}
              className="w-full h-full bg-transparent resize-none border-none outline-none font-sans text-xs text-slate-800 leading-snug"
              autoFocus
            />
          ) : (
            <div
              className="w-full h-full font-sans text-xs text-slate-800 leading-snug whitespace-pre-wrap select-none overflow-hidden"
              onClick={onStartEdit}
            >
              {p.text}
            </div>
          )}
        </foreignObject>
      </g>
    )
  }

  // Rectangle Shape
  if (element.element_type === 'rectangle') {
    return (
      <g className="cursor-move">
        <rect
          x={p.x}
          y={p.y}
          width={p.width}
          height={p.height}
          rx={4}
          fill={p.fill || '#ffffff'}
          stroke={isSelected ? '#3b82f6' : p.stroke || '#0f172a'}
          strokeWidth={isSelected ? 2.5 : p.strokeWidth || 2}
          className="dark:fill-zinc-900 dark:stroke-zinc-300"
        />
        {p.text && (
          <text
            x={p.x + p.width / 2}
            y={p.y + p.height / 2 + 5}
            textAnchor="middle"
            fontSize={p.fontSize || 14}
            fill="#0f172a"
            className="dark:fill-zinc-200 font-medium select-none pointer-events-none"
          >
            {p.text}
          </text>
        )}
      </g>
    )
  }

  // Circle / Ellipse Shape
  if (element.element_type === 'circle') {
    return (
      <g className="cursor-move">
        <ellipse
          cx={p.x + p.width / 2}
          cy={p.y + p.height / 2}
          rx={p.width / 2}
          ry={p.height / 2}
          fill={p.fill || '#ffffff'}
          stroke={isSelected ? '#3b82f6' : p.stroke || '#0f172a'}
          strokeWidth={isSelected ? 2.5 : p.strokeWidth || 2}
          className="dark:fill-zinc-900 dark:stroke-zinc-300"
        />
        {p.text && (
          <text
            x={p.x + p.width / 2}
            y={p.y + p.height / 2 + 5}
            textAnchor="middle"
            fontSize={p.fontSize || 14}
            fill="#0f172a"
            className="dark:fill-zinc-200 font-medium select-none pointer-events-none"
          >
            {p.text}
          </text>
        )}
      </g>
    )
  }

  // Arrow Connector
  if (element.element_type === 'arrow') {
    return (
      <g className="cursor-move">
        <line
          x1={p.startX}
          y1={p.startY}
          x2={p.endX}
          y2={p.endY}
          stroke={isSelected ? '#3b82f6' : p.stroke || '#0f172a'}
          strokeWidth={isSelected ? 3 : p.strokeWidth || 2}
          markerEnd="url(#arrowhead)"
          className="dark:stroke-zinc-300"
        />
      </g>
    )
  }

  // Straight Line Connector
  if (element.element_type === 'line') {
    return (
      <g className="cursor-move">
        <line
          x1={p.startX}
          y1={p.startY}
          x2={p.endX}
          y2={p.endY}
          stroke={isSelected ? '#3b82f6' : p.stroke || '#0f172a'}
          strokeWidth={isSelected ? 3 : p.strokeWidth || 2}
          className="dark:stroke-zinc-300"
        />
      </g>
    )
  }

  // Freehand Path
  if (element.element_type === 'path' && p.points?.length > 1) {
    const d = p.points.reduce(
      (acc, pt, idx) => (idx === 0 ? `M ${pt.x} ${pt.y}` : `${acc} L ${pt.x} ${pt.y}`),
      ''
    )
    return (
      <path
        d={d}
        fill="none"
        stroke={isSelected ? '#3b82f6' : p.stroke || '#0f172a'}
        strokeWidth={isSelected ? 4 : p.strokeWidth || 3}
        strokeLinecap="round"
        strokeLinejoin="round"
        className="cursor-move dark:stroke-zinc-200"
      />
    )
  }

  // Standalone Text
  if (element.element_type === 'text') {
    return (
      <foreignObject
        x={p.x}
        y={p.y}
        width={Math.max(p.width || 200, 150)}
        height={Math.max(p.height || 50, 40)}
        className="cursor-move overflow-visible"
        onDoubleClick={onStartEdit}
      >
        {isEditing ? (
          <input
            type="text"
            defaultValue={p.text}
            onBlur={(e) => onTextChange(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && e.target.blur()}
            className="w-full bg-transparent border-b border-brand text-foreground outline-none font-bold"
            style={{ fontSize: `${p.fontSize || 18}px` }}
            autoFocus
          />
        ) : (
          <div
            className="w-full font-bold text-foreground select-none"
            style={{ fontSize: `${p.fontSize || 18}px`, color: p.color }}
            onClick={onStartEdit}
          >
            {p.text}
          </div>
        )}
      </foreignObject>
    )
  }

  return null
}

/**
 * In-progress drawing preview rendering
 */
function RenderDrawingPreview({ drawing }) {
  if (drawing.type === 'rectangle') {
    return (
      <rect
        x={drawing.x}
        y={drawing.y}
        width={drawing.width}
        height={drawing.height}
        rx={4}
        fill="none"
        stroke="#3b82f6"
        strokeWidth={2}
        strokeDasharray="4 4"
      />
    )
  }

  if (drawing.type === 'circle') {
    return (
      <ellipse
        cx={drawing.x + drawing.width / 2}
        cy={drawing.y + drawing.height / 2}
        rx={drawing.width / 2}
        ry={drawing.height / 2}
        fill="none"
        stroke="#3b82f6"
        strokeWidth={2}
        strokeDasharray="4 4"
      />
    )
  }

  if (drawing.type === 'arrow' || drawing.type === 'line') {
    return (
      <line
        x1={drawing.startX}
        y1={drawing.startY}
        x2={drawing.endX}
        y2={drawing.endY}
        stroke="#3b82f6"
        strokeWidth={2}
        strokeDasharray="4 4"
        markerEnd={drawing.type === 'arrow' ? 'url(#arrowhead-preview)' : undefined}
      />
    )
  }

  if (drawing.type === 'path' && drawing.points?.length > 1) {
    const d = drawing.points.reduce(
      (acc, pt, idx) => (idx === 0 ? `M ${pt.x} ${pt.y}` : `${acc} L ${pt.x} ${pt.y}`),
      ''
    )
    return (
      <path
        d={d}
        fill="none"
        stroke="#3b82f6"
        strokeWidth={2.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    )
  }

  return null
}
