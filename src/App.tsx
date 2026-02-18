import { useState, useRef, useCallback } from 'react'
import './App.css'

type Tool = 'select' | 'rectangle' | 'circle' | 'line' | 'pen'
type Point = { x: number; y: number }

interface Shape {
  id: string
  type: 'rectangle' | 'circle' | 'line' | 'path'
  x: number
  y: number
  width?: number
  height?: number
  r?: number
  x2?: number
  y2?: number
  points?: Point[]
  fill: string
  stroke: string
  strokeWidth: number
}

function App() {
  const [tool, setTool] = useState<Tool>('select')
  const [shapes, setShapes] = useState<Shape[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [isDrawing, setIsDrawing] = useState(false)
  const [currentShape, setCurrentShape] = useState<Shape | null>(null)
  const [fillColor, setFillColor] = useState('#3B82F6')
  const [strokeColor, setStrokeColor] = useState('#F9FEFF')
  const [strokeWidth, setStrokeWidth] = useState(2)
  
  const svgRef = useRef<SVGSVGElement>(null)
  const startPoint = useRef<Point>({ x: 0, y: 0 })

  const generateId = () => Math.random().toString(36).substr(2, 9)

  const getMousePos = useCallback((e: React.MouseEvent<SVGSVGElement>): Point => {
    const svg = svgRef.current
    if (!svg) return { x: 0, y: 0 }
    const rect = svg.getBoundingClientRect()
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    }
  }, [])

  const handleMouseDown = useCallback((e: React.MouseEvent<SVGSVGElement>) => {
    if (tool === 'select') return
    
    const pos = getMousePos(e)
    startPoint.current = pos
    setIsDrawing(true)
    
    const newShape: Shape = {
      id: generateId(),
      type: tool === 'pen' ? 'path' : tool,
      x: pos.x,
      y: pos.y,
      fill: tool === 'line' || tool === 'pen' ? 'none' : fillColor,
      stroke: strokeColor,
      strokeWidth,
      points: tool === 'pen' ? [pos] : undefined
    }
    
    setCurrentShape(newShape)
  }, [tool, fillColor, strokeColor, strokeWidth, getMousePos])

  const handleMouseMove = useCallback((e: React.MouseEvent<SVGSVGElement>) => {
    if (!isDrawing || !currentShape) return
    
    const pos = getMousePos(e)
    
    setCurrentShape(prev => {
      if (!prev) return null
      
      if (prev.type === 'rectangle') {
        return {
          ...prev,
          width: pos.x - startPoint.current.x,
          height: pos.y - startPoint.current.y
        }
      } else if (prev.type === 'circle') {
        const radius = Math.sqrt(
          Math.pow(pos.x - startPoint.current.x, 2) + 
          Math.pow(pos.y - startPoint.current.y, 2)
        )
        return { ...prev, r: radius }
      } else if (prev.type === 'line') {
        return { ...prev, x2: pos.x, y2: pos.y }
      } else if (prev.type === 'path' && prev.points) {
        return { ...prev, points: [...prev.points, pos] }
      }
      
      return prev
    })
  }, [isDrawing, currentShape, getMousePos])

  const handleMouseUp = useCallback(() => {
    if (!isDrawing || !currentShape) return
    
    setShapes(prev => [...prev, currentShape])
    setCurrentShape(null)
    setIsDrawing(false)
    setSelectedId(currentShape.id)
  }, [isDrawing, currentShape])

  const handleShapeClick = (id: string) => {
    if (tool === 'select') {
      setSelectedId(id)
    }
  }

  const deleteShape = (id: string) => {
    setShapes(prev => prev.filter(s => s.id !== id))
    if (selectedId === id) setSelectedId(null)
  }

  const clearCanvas = () => {
    setShapes([])
    setSelectedId(null)
  }

  const exportSVG = () => {
    const svgData = svgRef.current?.outerHTML || ''
    const blob = new Blob([svgData], { type: 'image/svg+xml' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'vortexp-drawing.svg'
    link.click()
  }

  const renderShape = (shape: Shape, isPreview = false) => {
    const commonProps = {
      key: shape.id,
      fill: shape.fill,
      stroke: shape.stroke,
      strokeWidth: shape.strokeWidth,
      onClick: () => !isPreview && handleShapeClick(shape.id),
      style: { 
        cursor: tool === 'select' ? 'pointer' : 'crosshair',
        opacity: isPreview ? 0.7 : 1
      }
    }

    switch (shape.type) {
      case 'rectangle':
        return (
          <rect
            {...commonProps}
            x={shape.width && shape.width < 0 ? shape.x + shape.width : shape.x}
            y={shape.height && shape.height < 0 ? shape.y + shape.height : shape.y}
            width={Math.abs(shape.width || 0)}
            height={Math.abs(shape.height || 0)}
          />
        )
      case 'circle':
        return (
          <circle
            {...commonProps}
            cx={shape.x}
            cy={shape.y}
            r={shape.r || 0}
          />
        )
      case 'line':
        return (
          <line
            {...commonProps}
            x1={shape.x}
            y1={shape.y}
            x2={shape.x2 || shape.x}
            y2={shape.y2 || shape.y}
          />
        )
      case 'path':
        if (!shape.points || shape.points.length === 0) return null
        const pathData = shape.points.reduce((acc, point, i) => {
          return acc + (i === 0 ? `M ${point.x} ${point.y}` : ` L ${point.x} ${point.y}`)
        }, '')
        return (
          <path
            {...commonProps}
            d={pathData}
            fill="none"
          />
        )
      default:
        return null
    }
  }

  return (
    <div className="flex h-screen w-screen overflow-hidden">
      {/* Toolbar */}
      <div className="w-64 bg-[#1a1a1a] border-r border-[#E2E7E9]/20 p-4 flex flex-col gap-4">
        <div>
          <h1 className="text-xl font-bold text-[#F9FEFF] mb-1">Vortexp</h1>
          <p className="text-xs text-[#E2E7E9]/60">Vector Canvas</p>
        </div>
        
        {/* Tools */}
        <div className="space-y-2">
          <label className="text-xs font-medium text-[#E2E7E9]/80 uppercase tracking-wide">Tools</label>
          <div className="grid grid-cols-2 gap-2">
            {(['select', 'rectangle', 'circle', 'line', 'pen'] as Tool[]).map((t) => (
              <button
                key={t}
                onClick={() => setTool(t)}
                className={`px-3 py-2 text-sm rounded transition-all ${
                  tool === t 
                    ? 'bg-[#E2E7E9] text-[#222121]' 
                    : 'bg-transparent text-[#F9FEFF] hover:bg-[#E2E7E9]/20'
                }`}
              >
                {t.charAt(0).toUpperCase() + t.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Properties */}
        <div className="space-y-3">
          <label className="text-xs font-medium text-[#E2E7E9]/80 uppercase tracking-wide">Properties</label>
          
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-[#F9FEFF]">Fill</span>
              <input
                type="color"
                value={fillColor}
                onChange={(e) => setFillColor(e.target.value)}
                className="w-8 h-8 rounded cursor-pointer bg-transparent"
              />
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm text-[#F9FEFF]">Stroke</span>
              <input
                type="color"
                value={strokeColor}
                onChange={(e) => setStrokeColor(e.target.value)}
                className="w-8 h-8 rounded cursor-pointer bg-transparent"
              />
            </div>
            
            <div className="space-y-1">
              <div className="flex justify-between">
                <span className="text-sm text-[#F9FEFF]">Width</span>
                <span className="text-sm text-[#E2E7E9]/60">{strokeWidth}px</span>
              </div>
              <input
                type="range"
                min="1"
                max="20"
                value={strokeWidth}
                onChange={(e) => setStrokeWidth(Number(e.target.value))}
                className="w-full accent-[#E2E7E9]"
              />
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="space-y-2 mt-auto">
          <label className="text-xs font-medium text-[#E2E7E9]/80 uppercase tracking-wide">Actions</label>
          <button
            onClick={clearCanvas}
            className="w-full px-3 py-2 text-sm bg-red-500/20 text-red-400 hover:bg-red-500/30 rounded border-red-500/50"
          >
            Clear Canvas
          </button>
          <button
            onClick={exportSVG}
            className="w-full px-3 py-2 text-sm bg-[#E2E7E9]/20 text-[#F9FEFF] hover:bg-[#E2E7E9]/30 rounded"
          >
            Export SVG
          </button>
        </div>
      </div>

      {/* Canvas */}
      <div className="flex-1 bg-[#222121] relative overflow-hidden">
        <svg
          ref={svgRef}
          className="w-full h-full"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          style={{ cursor: tool === 'select' ? 'default' : 'crosshair' }}
        >
          {/* Grid */}
          <defs>
            <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
              <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#E2E7E9" strokeWidth="0.5" opacity="0.1"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
          
          {/* Render shapes */}
          {shapes.map(shape => (
            <g key={shape.id}>
              {renderShape(shape)}
              {selectedId === shape.id && (
                <rect
                  x={shape.x - 4}
                  y={shape.y - 4}
                  width={(shape.width || 10) + 8}
                  height={(shape.height || 10) + 8}
                  fill="none"
                  stroke="#3B82F6"
                  strokeWidth="1"
                  strokeDasharray="4"
                />
              )}
            </g>
          ))}
          
          {/* Current drawing shape */}
          {currentShape && renderShape(currentShape, true)}
        </svg>
        
        {/* Info */}
        <div className="absolute bottom-4 right-4 text-xs text-[#E2E7E9]/40">
          {shapes.length} shapes • Tool: {tool}
        </div>
      </div>
    </div>
  )
}

export default App
