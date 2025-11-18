
import React, { forwardRef, useRef, useEffect } from 'react';
import type { ContentBlock } from '../types';

interface CanvasProps {
  blocks: ContentBlock[];
  selectedId: string | null;
  canvasSize: { width: number; height: number };
  zoom: number;
  onZoomChange: (delta: number) => void;
  onSelectBlock: (id: string | null) => void;
  onBlockMouseDown: (e: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>, id: string) => void;
  onCanvasMouseMove: (e: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>) => void;
  onCanvasMouseUp: (e: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>) => void;
  onCanvasMouseDown: (e: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>) => void;
  onOpenContextMenu: (e: React.MouseEvent | React.TouchEvent, id: string) => void;
  onResizeMouseDown: (e: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>, id: string, handle: string) => void;
  isSpacePressed: boolean;
  canvasPan: { x: number; y: number };
}

const ResizeHandle: React.FC<{
    position: string;
    cursor: string;
    onMouseDown: (e: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>) => void;
}> = ({ position, cursor, onMouseDown }) => {
    const baseStyle = "absolute w-3 h-3 bg-blue-500 border-2 border-white rounded-full z-30";
    const handleEvent = (e: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>) => {
        e.stopPropagation();
        onMouseDown(e);
    };
    return <div className={`${baseStyle} ${position}`} style={{ cursor }} onMouseDown={handleEvent} onTouchStart={handleEvent} />;
};

const Canvas = forwardRef<HTMLDivElement, CanvasProps>(({
  blocks,
  selectedId,
  canvasSize,
  zoom,
  onZoomChange,
  onSelectBlock,
  onBlockMouseDown,
  onCanvasMouseMove,
  onCanvasMouseUp,
  onCanvasMouseDown,
  onOpenContextMenu,
  onResizeMouseDown,
  isSpacePressed,
  canvasPan,
}, ref) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleWheel = (e: WheelEvent) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        onZoomChange(e.deltaY);
      }
    };

    // Passive: false is required to preventDefault on wheel events
    container.addEventListener('wheel', handleWheel, { passive: false });
    return () => container.removeEventListener('wheel', handleWheel);
  }, [onZoomChange]);

  const renderHandles = (blockId: string) => {
      const handles = {
          'top-left': { pos: '-top-1.5 -left-1.5', cursor: 'nwse-resize' },
          'top-center': { pos: '-top-1.5 left-1/2 -translate-x-1/2', cursor: 'ns-resize' },
          'top-right': { pos: '-top-1.5 -right-1.5', cursor: 'nesw-resize' },
          'middle-left': { pos: 'top-1/2 -translate-y-1/2 -left-1.5', cursor: 'ew-resize' },
          'middle-right': { pos: 'top-1/2 -translate-y-1/2 -right-1.5', cursor: 'ew-resize' },
          'bottom-left': { pos: '-bottom-1.5 -left-1.5', cursor: 'nesw-resize' },
          'bottom-center': { pos: '-bottom-1.5 left-1/2 -translate-x-1/2', cursor: 'ns-resize' },
          'bottom-right': { pos: '-bottom-1.5 -right-1.5', cursor: 'nwse-resize' },
      };

      return Object.entries(handles).map(([handleName, {pos, cursor}]) => (
          <ResizeHandle
              key={handleName}
              position={pos}
              cursor={cursor}
              onMouseDown={(e) => onResizeMouseDown(e, blockId, handleName)}
          />
      ))
  }
  
  const handleBlockInteraction = (e: React.MouseEvent | React.TouchEvent, id: string) => {
    e.stopPropagation();
    onSelectBlock(id);
  };
  
  return (
    <div
      ref={containerRef}
      className="flex-1 h-full bg-gray-200 relative overflow-auto flex justify-center p-8 pb-32"
      style={{ cursor: isSpacePressed ? 'grab' : 'default' }}
      onClick={() => onSelectBlock(null)}
      onMouseDown={onCanvasMouseDown}
      onMouseMove={onCanvasMouseMove}
      onMouseUp={onCanvasMouseUp}
      onMouseLeave={onCanvasMouseUp}
      onTouchStart={onCanvasMouseDown}
      onTouchMove={onCanvasMouseMove}
      onTouchEnd={onCanvasMouseUp}
    >
      <div
        style={{
            width: canvasSize.width * zoom,
            height: canvasSize.height * zoom,
            position: 'relative',
            flexShrink: 0,
            transform: `translate(${canvasPan.x}px, ${canvasPan.y}px)`,
        }}
      >
        <div
            ref={ref}
            className="relative bg-white shadow-2xl origin-top-left"
            style={{
                width: `${canvasSize.width}px`,
                height: `${canvasSize.height}px`,
                transform: `scale(${zoom})`
            }}
            onClick={(e) => e.stopPropagation()}
        >
            {blocks.map((block) => {
            const isSelected = block.id === selectedId;
            const style: React.CSSProperties = {
                position: 'absolute',
                top: `${block.y}px`,
                left: `${block.x}px`,
                width: `${block.width}px`,
                // For text, we use minHeight so it can grow. For images, it's fixed height.
                height: block.type === 'text' ? 'auto' : `${block.height}px`,
                minHeight: block.type === 'text' ? `${block.height}px` : undefined,
                zIndex: block.zIndex,
                boxSizing: 'border-box',
                outline: isSelected ? '2px solid #3b82f6' : 'none',
                outlineOffset: '2px',
            };

            if (block.type === 'text') {
                const justifyContent = block.verticalAlign === 'middle' ? 'center' : block.verticalAlign === 'bottom' ? 'flex-end' : 'flex-start';
                return (
                <div
                    key={block.id}
                    onMouseDown={(e) => !isSpacePressed && onBlockMouseDown(e, block.id)}
                    onTouchStart={(e) => !isSpacePressed && onBlockMouseDown(e, block.id)}
                    onClick={(e) => handleBlockInteraction(e, block.id)}
                    onContextMenu={(e) => onOpenContextMenu(e, block.id)}
                    style={{
                    ...style,
                    fontSize: `${block.fontSize}px`,
                    fontFamily: `'${block.fontFamily}'`,
                    textAlign: block.textAlign,
                    color: block.color,
                    cursor: isSpacePressed ? 'grab' : 'move',
                    padding: '4px',
                    // Important for responsiveness
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word',
                    lineHeight: 1.2,
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: justifyContent,
                    }}
                >
                    {block.text}
                    {isSelected && renderHandles(block.id)}
                </div>
                );
            }

            if (block.type === 'image') {
                return (
                <div
                    key={block.id}
                    onMouseDown={(e) => !isSpacePressed && onBlockMouseDown(e, block.id)}
                    onTouchStart={(e) => !isSpacePressed && onBlockMouseDown(e, block.id)}
                    onClick={(e) => handleBlockInteraction(e, block.id)}
                    onContextMenu={(e) => onOpenContextMenu(e, block.id)}
                    style={{
                    ...style,
                    cursor: isSpacePressed ? 'grab' : 'move',
                    borderRadius: `${block.borderRadius}px`,
                    overflow: 'hidden',
                    }}
                >
                    <img
                    src={block.src}
                    alt="user content"
                    className="w-full h-full object-cover pointer-events-none"
                    />
                    {isSelected && renderHandles(block.id)}
                </div>
                );
            }

            return null;
            })}
        </div>
      </div>
    </div>
  );
});

export default Canvas;
