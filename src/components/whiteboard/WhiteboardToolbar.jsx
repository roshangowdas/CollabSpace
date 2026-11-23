// ==============================================================================
// CollabSpace Component: WhiteboardToolbar
// File: src/components/whiteboard/WhiteboardToolbar.jsx
// Description:
//   Floating toolbar for the collaborative whiteboard: Select, Pan, Sticky Notes,
//   Shapes, Connectors, Freehand drawing, Text, Zoom controls, and Color pickers.
// ==============================================================================

import React, { useState } from 'react'
import {
  MousePointer,
  Hand,
  StickyNote,
  Square,
  Circle,
  MoveRight,
  PenTool,
  Type,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Trash2,
  Palette,
  Minus,
} from 'lucide-react'
import { STICKY_COLORS, SHAPE_TYPES } from '@/services/whiteboards'
import { cn } from '@/utils/cn'

export function WhiteboardToolbar({
  activeTool,
  setActiveTool,
  activeColor,
  setActiveColor,
  zoom,
  setZoom,
  onResetView,
  selectedElement,
  onDeleteSelected,
  className = '',
}) {
  const [showColorPicker, setShowColorPicker] = useState(false)

  const tools = [
    { id: SHAPE_TYPES.SELECT, label: 'Select (V)', icon: MousePointer },
    { id: SHAPE_TYPES.PAN, label: 'Pan Canvas (H)', icon: Hand },
    { id: SHAPE_TYPES.STICKY, label: 'Sticky Note (S)', icon: StickyNote },
    { id: SHAPE_TYPES.RECTANGLE, label: 'Rectangle (R)', icon: Square },
    { id: SHAPE_TYPES.CIRCLE, label: 'Circle (C)', icon: Circle },
    { id: SHAPE_TYPES.ARROW, label: 'Arrow Connector (A)', icon: MoveRight },
    { id: SHAPE_TYPES.LINE, label: 'Straight Line (L)', icon: Minus },
    { id: SHAPE_TYPES.FREEHAND, label: 'Freehand Pen (P)', icon: PenTool },
    { id: SHAPE_TYPES.TEXT, label: 'Text Box (T)', icon: Type },
  ]

  const handleZoomIn = () => {
    setZoom((z) => Math.min(parseFloat((z + 0.15).toFixed(2)), 3.0))
  }

  const handleZoomOut = () => {
    setZoom((z) => Math.max(parseFloat((z - 0.15).toFixed(2)), 0.25))
  }

  return (
    <div
      className={cn(
        'absolute bottom-6 left-1/2 -translate-x-1/2 z-30 flex items-center gap-1.5 p-1.5 bg-card/95 backdrop-blur-md rounded-lg border border-border shadow-modal select-none',
        className
      )}
    >
      {/* Primary Tool Buttons */}
      <div className="flex items-center gap-1">
        {tools.map((tool) => {
          const Icon = tool.icon
          const isActive = activeTool === tool.id
          return (
            <button
              key={tool.id}
              type="button"
              onClick={() => setActiveTool(tool.id)}
              className={cn(
                'p-2 rounded-xl transition-all text-xs font-medium relative group',
                isActive
                  ? 'bg-brand text-white shadow-xs scale-105'
                  : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
              )}
              title={tool.label}
            >
              <Icon className="h-4 w-4" />
              {/* Tooltip */}
              <span className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded bg-popover text-popover-foreground text-[10px] font-medium border border-border shadow-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
                {tool.label}
              </span>
            </button>
          )
        })}
      </div>

      <div className="h-5 w-px bg-border mx-1" />

      {/* Sticky Note / Shape Color Picker */}
      <div className="relative">
        <button
          type="button"
          onClick={() => setShowColorPicker(!showColorPicker)}
          className="p-2 rounded-xl text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors flex items-center gap-1.5"
          title="Change Color"
        >
          <span
            className="h-4 w-4 rounded-full border border-black/20 shadow-2xs"
            style={{ backgroundColor: activeColor }}
          />
        </button>

        {showColorPicker && (
          <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 p-2 bg-card rounded-xl border border-border shadow-modal flex items-center gap-1.5 z-40">
            {STICKY_COLORS.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => {
                  setActiveColor(c.bg)
                  setShowColorPicker(false)
                }}
                className={cn(
                  'h-6 w-6 rounded-full border transition-transform hover:scale-110 shadow-2xs',
                  activeColor === c.bg ? 'ring-2 ring-brand ring-offset-1' : ''
                )}
                style={{ backgroundColor: c.bg, borderColor: c.border }}
                title={c.name}
              />
            ))}
          </div>
        )}
      </div>

      {/* Delete Active Selection */}
      {selectedElement && (
        <>
          <div className="h-5 w-px bg-border mx-1" />
          <button
            type="button"
            onClick={onDeleteSelected}
            className="p-2 rounded-xl text-destructive hover:bg-destructive/10 transition-colors"
            title="Delete Selected Element (Del)"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </>
      )}

      <div className="h-5 w-px bg-border mx-1" />

      {/* Zoom Controls */}
      <div className="flex items-center gap-0.5 text-xs text-muted-foreground">
        <button
          type="button"
          onClick={handleZoomOut}
          className="p-2 rounded-xl hover:bg-secondary hover:text-foreground transition-colors"
          title="Zoom Out (-)"
        >
          <ZoomOut className="h-4 w-4" />
        </button>

        <button
          type="button"
          onClick={onResetView}
          className="px-2 py-1 rounded-lg hover:bg-secondary hover:text-foreground font-mono text-[11px] transition-colors"
          title="Reset Zoom & Pan"
        >
          {Math.round(zoom * 100)}%
        </button>

        <button
          type="button"
          onClick={handleZoomIn}
          className="p-2 rounded-xl hover:bg-secondary hover:text-foreground transition-colors"
          title="Zoom In (+)"
        >
          <ZoomIn className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}
