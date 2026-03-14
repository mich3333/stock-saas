'use client'
import { useState, useEffect, ReactNode } from 'react'
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd'
import { motion, AnimatePresence } from 'framer-motion'
import { GripVertical } from 'lucide-react'
import { cn } from '@/lib/utils'

const STORAGE_KEY = 'stockflow-widget-order'

export interface DashboardWidget {
  id: string
  label: string
  content: ReactNode
}

interface DraggableGridProps {
  widgets: DashboardWidget[]
  isDragMode: boolean
}

export function DraggableGrid({ widgets, isDragMode }: DraggableGridProps) {
  const [order, setOrder] = useState<string[]>(() => widgets.map((w) => w.id))
  const [mounted, setMounted] = useState(false)

  // Stable string to detect widget additions without re-running on every render
  const widgetIds = widgets.map((w) => w.id).join(',')

  useEffect(() => {
    setMounted(true)
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) {
        const parsed: string[] = JSON.parse(saved)
        // Merge: keep saved order, append any new widget ids
        const allIds = widgets.map((w) => w.id)
        const merged = [...parsed.filter((id) => allIds.includes(id)), ...allIds.filter((id) => !parsed.includes(id))]
        setOrder(merged)
      }
    } catch {
      // ignore
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // When widgets are dynamically added (e.g. stock chart after clicking a stock),
  // insert them into `order` at their natural position so they render correctly.
  useEffect(() => {
    const currentIds = widgetIds.split(',').filter(Boolean)
    setOrder((prev) => {
      const newIds = currentIds.filter((id) => !prev.includes(id))
      if (newIds.length === 0) return prev
      const result = [...prev]
      for (const newId of newIds) {
        const naturalIdx = currentIds.indexOf(newId)
        // Find the first subsequent widget that already exists in result
        let insertAt = result.length
        for (let i = naturalIdx + 1; i < currentIds.length; i++) {
          const existingIdx = result.indexOf(currentIds[i])
          if (existingIdx !== -1) {
            insertAt = existingIdx
            break
          }
        }
        result.splice(insertAt, 0, newId)
      }
      return result
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [widgetIds])

  useEffect(() => {
    if (mounted) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(order))
    }
  }, [order, mounted])

  const onDragEnd = (result: DropResult) => {
    if (!result.destination) return
    const newOrder = [...order]
    const [removed] = newOrder.splice(result.source.index, 1)
    newOrder.splice(result.destination.index, 0, removed)
    setOrder(newOrder)
  }

  const sortedWidgets = order
    .map((id) => widgets.find((w) => w.id === id))
    .filter(Boolean) as DashboardWidget[]

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <Droppable droppableId="dashboard-grid">
        {(provided) => (
          <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-8">
            {sortedWidgets.map((widget, index) => (
              <Draggable
                key={widget.id}
                draggableId={widget.id}
                index={index}
                isDragDisabled={!isDragMode}
              >
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.draggableProps}
                    className={cn(
                      'relative transition-shadow',
                      snapshot.isDragging && 'shadow-2xl shadow-blue-500/20 z-50'
                    )}
                  >
                    <AnimatePresence>
                      {isDragMode && (
                        <motion.div
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: -10 }}
                          className="absolute -left-7 top-1/2 -translate-y-1/2 z-10"
                        >
                          <div
                            {...provided.dragHandleProps}
                            className="p-1 rounded-md bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm cursor-grab active:cursor-grabbing text-gray-400 hover:text-blue-500 transition-colors"
                          >
                            <GripVertical size={16} />
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {!isDragMode && provided.dragHandleProps && (
                      <div {...provided.dragHandleProps} style={{ display: 'none' }} />
                    )}

                    <motion.div
                      animate={
                        isDragMode
                          ? { scale: snapshot.isDragging ? 1.01 : 1, opacity: snapshot.isDragging ? 0.95 : 1 }
                          : { scale: 1, opacity: 1 }
                      }
                      className={cn(
                        'transition-all',
                        isDragMode && !snapshot.isDragging && 'ring-2 ring-blue-400/30 rounded-2xl'
                      )}
                    >
                      {widget.content}
                    </motion.div>
                  </div>
                )}
              </Draggable>
            ))}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </DragDropContext>
  )
}
