
import React, { useState, useCallback, useRef, useEffect } from 'react';
import type { ContentBlock } from './types';
import PropertiesPanel from './components/PropertiesPanel';
import Canvas from './components/Canvas';
import ContextMenu from './components/ContextMenu';
import ExportModal from './components/ExportModal';
import { TextIcon, ImageIcon, SaveIcon, UploadIcon, CameraIcon, SettingsIcon, UndoIcon, RedoIcon } from './components/icons';

// @ts-ignore
const html2canvas = window.html2canvas;

interface AppState {
    blocks: ContentBlock[];
    canvasSize: { width: number; height: number };
    zCounter: number;
}

const App: React.FC = () => {
  const [blocks, setBlocks] = useState<ContentBlock[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [zCounter, setZCounter] = useState<number>(1);
  const [zoom, setZoom] = useState<number>(1);
  
  // History State
  const [past, setPast] = useState<AppState[]>([]);
  const [future, setFuture] = useState<AppState[]>([]);

  const [draggingState, setDraggingState] = useState<{ 
      id: string; 
      startX: number; 
      startY: number; 
      originalX: number; 
      originalY: number 
  } | null>(null);
  
  const [resizingState, setResizingState] = useState<{
    id: string;
    handle: string;
    startX: number;
    startY: number;
    originalRect: { x: number; y: number; width: number; height: number };
  } | null>(null);

  const [contextMenu, setContextMenu] = useState<{ x: number, y: number, blockId: string } | null>(null);
  const [canvasSize, setCanvasSize] = useState({ width: 1280, height: 720 });
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isCanvasSettingsOpen, setIsCanvasSettingsOpen] = useState(false);
  const [isSidebarVisible, setIsSidebarVisible] = useState(false);
  const longPressTimeout = useRef<number | null>(null);
  const canvasRef = useRef<HTMLDivElement>(null);

  // Spacebar panning state
  const [isSpacePressed, setIsSpacePressed] = useState(false);
  const [canvasPan, setCanvasPan] = useState({ x: 0, y: 0 });
  const [panningState, setPanningState] = useState<{
    startX: number;
    startY: number;
    originalPanX: number;
    originalPanY: number;
  } | null>(null);

  // --- History Management ---
  const saveHistory = useCallback(() => {
      setPast(prev => [...prev, { blocks, canvasSize, zCounter }]);
      setFuture([]);
  }, [blocks, canvasSize, zCounter]);

  const handleUndo = useCallback(() => {
      if (past.length === 0) return;
      const previousState = past[past.length - 1];
      const newPast = past.slice(0, past.length - 1);
      
      setFuture(prev => [{ blocks, canvasSize, zCounter }, ...prev]);
      setPast(newPast);
      
      setBlocks(previousState.blocks);
      setCanvasSize(previousState.canvasSize);
      setZCounter(previousState.zCounter);
  }, [past, blocks, canvasSize, zCounter]);

  const handleRedo = useCallback(() => {
      if (future.length === 0) return;
      const nextState = future[0];
      const newFuture = future.slice(1);
      
      setPast(prev => [...prev, { blocks, canvasSize, zCounter }]);
      setFuture(newFuture);
      
      setBlocks(nextState.blocks);
      setCanvasSize(nextState.canvasSize);
      setZCounter(nextState.zCounter);
  }, [future, blocks, canvasSize, zCounter]);

  // --- Keyboard Events (Delete, Undo/Redo, Spacebar Pan) ---
  useEffect(() => {
      const handleKeyDown = (e: KeyboardEvent) => {
          // Prevent spacebar if typing in an input field
          const activeElement = document.activeElement;
          const isTyping = activeElement && (activeElement.tagName === 'INPUT' || activeElement.tagName === 'TEXTAREA');

          // Spacebar for panning
          if (e.code === 'Space' && !isTyping && !isSpacePressed) {
              e.preventDefault();
              setIsSpacePressed(true);
          }

          // Check for Delete key
          if ((e.key === 'Delete' || e.key === 'Backspace') && selectedId) {
              // Prevent deletion if typing in an input field
              if (isTyping) {
                  return;
              }
              saveHistory();
              handleDeleteBlock(selectedId);
          }

          // Undo: Ctrl+Z or Cmd+Z
          if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
              e.preventDefault();
              handleUndo();
          }

          // Redo: Ctrl+Y or Ctrl+Shift+Z or Cmd+Shift+Z
          if (
              ((e.ctrlKey || e.metaKey) && e.key === 'y') ||
              ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'z')
          ) {
              e.preventDefault();
              handleRedo();
          }
      };

      const handleKeyUp = (e: KeyboardEvent) => {
          if (e.code === 'Space') {
              setIsSpacePressed(false);
              setPanningState(null);
          }
      };

      const handlePaste = (e: ClipboardEvent) => {
          const items = e.clipboardData?.items;
          if (!items) return;

          for (let i = 0; i < items.length; i++) {
              if (items[i].type.startsWith('image/')) {
                  e.preventDefault();
                  const blob = items[i].getAsFile();
                  if (blob) {
                      const reader = new FileReader();
                      reader.onload = (ev) => {
                          if (typeof ev.target?.result === 'string') {
                              handleAddImage(ev.target.result);
                          }
                      };
                      reader.readAsDataURL(blob);
                  }
                  break;
              }
          }
      };

      window.addEventListener('keydown', handleKeyDown);
      window.addEventListener('keyup', handleKeyUp);
      window.addEventListener('paste', handlePaste);
      return () => {
          window.removeEventListener('keydown', handleKeyDown);
          window.removeEventListener('keyup', handleKeyUp);
          window.removeEventListener('paste', handlePaste);
      };
  }, [selectedId, handleUndo, handleRedo, saveHistory, isSpacePressed, zCounter, canvasSize.width, blocks, canvasSize]); // Dependencies for the effect


  const handleZoomChange = useCallback((deltaY: number) => {
    setZoom(prev => {
        const zoomStep = 0.1;
        const change = deltaY < 0 ? zoomStep : -zoomStep;
        const newZoom = parseFloat((prev + change).toFixed(1));
        return Math.min(Math.max(newZoom, 0.2), 3.0);
    });
  }, []);

  const handleAddText = useCallback(() => {
    saveHistory();
    const newZIndex = zCounter + 1;
    const newBlock: ContentBlock = {
      id: crypto.randomUUID(),
      type: 'text',
      text: '텍스트를 입력하세요',
      x: 100, y: 100,
      zIndex: newZIndex,
      fontSize: 24,
      fontFamily: 'applemyungjo-Regular',
      fontWeight: 'Regular',
      textAlign: 'center',
      verticalAlign: 'middle',
      color: '#000000',
      width: 300, height: 100,
    };
    setBlocks(prev => [...prev, newBlock]);
    setZCounter(newZIndex);
    setSelectedId(newBlock.id);
    setIsCanvasSettingsOpen(false);
  }, [zCounter, saveHistory]);

  const handleAddImage = useCallback((src: string) => {
    const img = new Image();
    img.onload = () => {
      setPast(prev => [...prev, { blocks, canvasSize, zCounter }]);
      setFuture([]);
      const newZIndex = zCounter + 1;
      const maxWidth = canvasSize.width * 0.5;
      const newBlock: ContentBlock = {
        id: crypto.randomUUID(),
        type: 'image',
        src,
        x: 150, y: 150,
        zIndex: newZIndex,
        width: img.width > maxWidth ? maxWidth : img.width,
        height: (img.width > maxWidth ? maxWidth / img.width : 1) * img.height,
        borderRadius: 0,
      };
      setBlocks(prev => [...prev, newBlock]);
      setZCounter(newZIndex);
      setSelectedId(newBlock.id);
      setIsCanvasSettingsOpen(false);
    };
    img.src = src;
  }, [zCounter, canvasSize.width, blocks, canvasSize]);
  
  const handleUpdateBlock = useCallback((id: string, newProps: Partial<ContentBlock>) => {
    setBlocks(prev => prev.map(block => {
      if (block.id === id) {
        return { ...block, ...newProps } as ContentBlock;
      }
      return block;
    }));
  }, []);
  
  const handleDeleteBlock = useCallback((id: string) => {
      setBlocks(prev => prev.filter(block => block.id !== id));
      setSelectedId(null);
      setIsSidebarVisible(false);
  }, []);

  const handleSelectBlock = useCallback((id: string | null) => {
    setSelectedId(id);
    if (id) {
        setIsCanvasSettingsOpen(false);
        setIsSidebarVisible(true);
        // Clear placeholder text when selecting a text block
        const block = blocks.find(b => b.id === id);
        if (block?.type === 'text' && block.text === '텍스트를 입력하세요') {
          handleUpdateBlock(id, { text: '' });
        }
    }
  }, [blocks, handleUpdateBlock]);

  const handleOpenCanvasSettings = useCallback(() => {
      setSelectedId(null);
      setIsCanvasSettingsOpen(true);
      setIsSidebarVisible(true);
  }, []);

  const handleUpdateCanvasSize = useCallback((newSize: { width?: number; height?: number }) => {
    setCanvasSize(prev => ({ ...prev, ...newSize }));
    // 설정 변경 후 사이드바 닫기
    setTimeout(() => {
      setIsSidebarVisible(false);
      setIsCanvasSettingsOpen(false);
    }, 500);
  }, []);

  const getClientCoords = (e: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>) => {
    if ('touches' in e) {
      return { clientX: e.touches[0].clientX, clientY: e.touches[0].clientY };
    }
    return { clientX: e.clientX, clientY: e.clientY };
  };

  const handleBlockMouseDown = (e: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>, id: string) => {
    e.stopPropagation();
    handleSelectBlock(id);
    const block = blocks.find(b => b.id === id);
    if (block) {
      saveHistory(); // Save state before dragging starts
      const { clientX, clientY } = getClientCoords(e);
      setDraggingState({ 
          id, 
          startX: clientX, 
          startY: clientY, 
          originalX: block.x, 
          originalY: block.y 
      });
    }
    if ('touches' in e) {
        longPressTimeout.current = window.setTimeout(() => {
            handleOpenContextMenu(e, id);
            longPressTimeout.current = null;
        }, 700);
    }
  };

  const handleResizeMouseDown = (e: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>, id: string, handle: string) => {
    e.stopPropagation();
    const block = blocks.find((b) => b.id === id);
    if (block) {
      saveHistory(); // Save state before resizing starts
      const { clientX, clientY } = getClientCoords(e);
      setResizingState({
        id, handle,
        startX: clientX,
        startY: clientY,
        originalRect: { x: block.x, y: block.y, width: block.width, height: block.height },
      });
    }
  };

  const handleCanvasMouseMove = (e: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>) => {
    if (longPressTimeout.current) {
        clearTimeout(longPressTimeout.current);
        longPressTimeout.current = null;
    }
    const { clientX, clientY } = getClientCoords(e);

    if (panningState) {
      const dx = clientX - panningState.startX;
      const dy = clientY - panningState.startY;
      setCanvasPan({
        x: panningState.originalPanX + dx,
        y: panningState.originalPanY + dy
      });
    } else if (draggingState) {
      const dx = (clientX - draggingState.startX) / zoom;
      const dy = (clientY - draggingState.startY) / zoom;
      handleUpdateBlock(draggingState.id, {
          x: draggingState.originalX + dx,
          y: draggingState.originalY + dy
      });
    } else if (resizingState) {
      const { id, handle, startX, startY, originalRect } = resizingState;
      const dx = (clientX - startX) / zoom;
      const dy = (clientY - startY) / zoom;

      let { x: newX, y: newY, width: newWidth, height: newHeight } = originalRect;

      if (handle.includes('right')) newWidth += dx;
      if (handle.includes('left')) { newWidth -= dx; newX += dx; }
      if (handle.includes('bottom')) newHeight += dy;
      if (handle.includes('top')) { newHeight -= dy; newY += dy; }

      const MIN_DIMENSION = 20;
      if (newWidth < MIN_DIMENSION) {
        newWidth = MIN_DIMENSION;
        if (handle.includes('left')) newX = originalRect.x + originalRect.width - MIN_DIMENSION;
      }
      if (newHeight < MIN_DIMENSION) {
        newHeight = MIN_DIMENSION;
        if (handle.includes('top')) newY = originalRect.y + originalRect.height - MIN_DIMENSION;
      }
      handleUpdateBlock(id, { x: newX, y: newY, width: newWidth, height: newHeight });
    }
  };

  const handleCanvasMouseUp = () => {
    if (longPressTimeout.current) {
        clearTimeout(longPressTimeout.current);
        longPressTimeout.current = null;
    }
    setDraggingState(null);
    setResizingState(null);
    setPanningState(null);
  };

  const handleCanvasMouseDown = (e: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>) => {
    if (isSpacePressed) {
      const { clientX, clientY } = getClientCoords(e);
      setPanningState({
        startX: clientX,
        startY: clientY,
        originalPanX: canvasPan.x,
        originalPanY: canvasPan.y
      });
    }
  };
  
  const handleCloseContextMenu = () => setContextMenu(null);

  const handleOpenContextMenu = (e: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>, blockId: string) => {
    e.preventDefault();
    e.stopPropagation();
    handleCloseContextMenu();
    const { clientX, clientY } = getClientCoords(e);
    setContextMenu({ x: clientX, y: clientY, blockId });
  }

  const handleBringToFront = (id: string) => {
    saveHistory();
    const newZIndex = zCounter + 1;
    handleUpdateBlock(id, { zIndex: newZIndex });
    setZCounter(newZIndex);
    handleCloseContextMenu();
  };

  const handleSendToBack = (id: string) => {
    saveHistory();
    const minZIndex = Math.min(...blocks.map(b => b.zIndex));
    handleUpdateBlock(id, { zIndex: minZIndex - 1 });
    handleCloseContextMenu();
  };

  const handleBackup = () => {
    const state = { blocks, canvasSize, zCounter };
    const dataStr = JSON.stringify(state, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    const exportFileDefaultName = 'my-page-backup.json';
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  const handleRestore = (data: string) => {
    try {
        const state = JSON.parse(data);
        if (state.blocks && state.canvasSize && state.zCounter) {
            saveHistory();
            setBlocks(state.blocks);
            setCanvasSize(state.canvasSize);
            setZCounter(state.zCounter);
            setSelectedId(null);
            setIsCanvasSettingsOpen(true);
        } else {
            alert('유효하지 않은 백업 파일입니다.');
        }
    } catch (error) {
        console.error("Failed to restore:", error);
        alert('백업 파일을 불러오는 데 실패했습니다.');
    }
  };

  const handleExport = async (format: 'png' | 'jpg') => {
    setIsExportModalOpen(false);
    setSelectedId(null); // Hide outlines before capture
    await new Promise(resolve => setTimeout(resolve, 50)); // allow UI to update

    if(canvasRef.current && html2canvas) {
        try {
            const captureScale = 2 / zoom;
            const canvas = await html2canvas(canvasRef.current, { 
                useCORS: true, 
                backgroundColor: '#ffffff',
                scale: captureScale, 
            });
            const image = canvas.toDataURL(`image/${format}`, format === 'jpg' ? 0.9 : 1.0);
            const link = document.createElement('a');
            link.download = `my-page.${format}`;
            link.href = image;
            link.click();
        } catch (error) {
            console.error("Image export failed:", error);
            alert('이미지를 내보내는 데 실패했습니다.');
        }
    }
  };
  
  const selectedBlock = blocks.find(block => block.id === selectedId) || null;

  const handleBackgroundClick = () => {
      handleSelectBlock(null);
      setIsCanvasSettingsOpen(false);
      // setIsSidebarVisible(false); // 사이드바는 닫지 않음
  }

  return (
    <div className="h-screen w-screen flex flex-col font-sans overflow-hidden" onClick={handleCloseContextMenu}>
      {/* Top Toolbar Only */}
      <div className="absolute top-0 left-0 right-0 bg-white shadow-md z-20 p-2 flex items-center justify-between">
        <div className="flex items-center space-x-2">
            <div className="flex items-center gap-2 ml-2 mr-4">
              <img src="/favicon-32x32.png" alt="Logo" className="w-8 h-8" />
              <h1 className="text-xl font-bold text-gray-700 hidden md:block">EBOOK MAKER</h1>
            </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={handleUndo}
            disabled={past.length === 0}
            className={`p-2.5 rounded-xl transition-all duration-200 ${past.length > 0 ? 'bg-white hover:bg-gray-50 text-gray-700 shadow-md hover:shadow-lg border border-gray-200' : 'bg-gray-100 text-gray-400 cursor-not-allowed opacity-40'}`}
            title="실행 취소 (Ctrl+Z)"
          >
            <UndoIcon />
          </button>
          <button
            onClick={handleRedo}
            disabled={future.length === 0}
            className={`p-2.5 rounded-xl transition-all duration-200 ${future.length > 0 ? 'bg-white hover:bg-gray-50 text-gray-700 shadow-md hover:shadow-lg border border-gray-200' : 'bg-gray-100 text-gray-400 cursor-not-allowed opacity-40'}`}
            title="다시 실행 (Ctrl+Y)"
          >
            <RedoIcon />
          </button>
          <div className="w-px h-8 bg-gray-300 mx-2" />
          <button
            onClick={handleBackup}
            className="p-2.5 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-all duration-200 shadow-md hover:shadow-lg hover:scale-105"
            title="프로젝트 저장"
          >
            <SaveIcon />
          </button>
           <button
            onClick={() => {
              const input = document.createElement('input');
              input.type = 'file';
              input.accept = '.json';
              input.onchange = (e: Event) => {
                const file = (e.target as HTMLInputElement).files?.[0];
                if (file) {
                  const reader = new FileReader();
                  reader.onload = (ev) => {
                    if (typeof ev.target?.result === 'string') {
                      handleRestore(ev.target.result);
                    }
                  };
                  reader.readAsText(file);
                }
              };
              input.click();
            }}
            className="p-2.5 bg-emerald-500 text-white rounded-xl hover:bg-emerald-600 transition-all duration-200 shadow-md hover:shadow-lg hover:scale-105"
            title="불러오기"
          >
            <UploadIcon />
          </button>
          <button
            onClick={() => setIsExportModalOpen(true)}
            className="p-2.5 bg-violet-500 text-white rounded-xl hover:bg-violet-600 transition-all duration-200 shadow-md hover:shadow-lg hover:scale-105"
            title="이미지로 내보내기"
          >
            <CameraIcon />
          </button>
        </div>
      </div>

      <div className="flex flex-1 pt-16 h-full overflow-hidden">
        {isSidebarVisible && (
          <div className="hidden md:block relative">
              <button
                onClick={() => {
                  setIsSidebarVisible(false);
                  setIsCanvasSettingsOpen(false);
                  setSelectedId(null);
                }}
                className="absolute top-2 right-2 z-50 p-1.5 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
                title="닫기"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
              <PropertiesPanel
                  selectedBlock={selectedBlock}
                  onUpdateBlock={handleUpdateBlock}
                  onDeleteBlock={(id) => { saveHistory(); handleDeleteBlock(id); }}
                  canvasSize={canvasSize}
                  onUpdateCanvasSize={handleUpdateCanvasSize}
                  onSelectBlock={handleSelectBlock}
                  onHistorySave={saveHistory}
              />
          </div>
        )}
        <div className="flex-1 relative">
          <Canvas
            ref={canvasRef}
            blocks={blocks}
            selectedId={selectedId}
            canvasSize={canvasSize}
            zoom={zoom}
            onZoomChange={handleZoomChange}
            onSelectBlock={(id) => {
                if (id === null) {
                  handleBackgroundClick();
                } else {
                  handleSelectBlock(id);
                }
            }}
            onBlockMouseDown={handleBlockMouseDown}
            onCanvasMouseMove={handleCanvasMouseMove}
            onCanvasMouseUp={handleCanvasMouseUp}
            onCanvasMouseDown={handleCanvasMouseDown}
            onOpenContextMenu={handleOpenContextMenu}
            onResizeMouseDown={handleResizeMouseDown}
            isSpacePressed={isSpacePressed}
            canvasPan={canvasPan}
          />
        </div>
      </div>

      {/* Bottom Input Toolbar - Fixed at canvas bottom */}
      <div className={`fixed bottom-0 ${isSidebarVisible ? 'left-0 md:left-64' : 'left-0'} right-0 z-30 p-6`}>
        <div className="bg-white/95 backdrop-blur-md shadow-2xl rounded-2xl border border-gray-200/50 p-4">
          <div className="flex items-center gap-2">
            {/* Settings Button */}
            <button
              onClick={handleOpenCanvasSettings}
              className="p-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl transition-all duration-200 hover:scale-105"
              title="캔버스 설정"
            >
              <SettingsIcon />
            </button>

            {/* Text Add Button */}
            <button
              onClick={handleAddText}
              className="p-3 bg-blue-500 hover:bg-blue-600 text-white rounded-xl transition-all duration-200 hover:scale-105 shadow-md"
              title="텍스트 추가"
            >
              <TextIcon />
            </button>

            {/* Image Add Button */}
            <button
              onClick={() => {
                const input = document.createElement('input');
                input.type = 'file';
                input.accept = 'image/*';
                input.onchange = (e: Event) => {
                  const file = (e.target as HTMLInputElement).files?.[0];
                  if (file) {
                    const reader = new FileReader();
                    reader.onload = (ev) => {
                      if (typeof ev.target?.result === 'string') {
                        handleAddImage(ev.target.result);
                      }
                    };
                    reader.readAsDataURL(file);
                  }
                };
                input.click();
              }}
              className="p-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl transition-all duration-200 hover:scale-105 shadow-md"
              title="이미지 추가"
            >
              <ImageIcon />
            </button>

            {/* Separator */}
            <div className="w-px h-12 bg-gray-200 mx-2" />

            {/* Text Input */}
            <div className="relative flex-1">
              <textarea
                value={selectedBlock?.type === 'text' ? selectedBlock.text : ''}
                onChange={(e) => {
                  if (selectedBlock?.type === 'text') {
                    handleUpdateBlock(selectedBlock.id, { text: e.target.value });
                  }
                }}
                onFocus={() => {
                  if (selectedBlock?.type === 'text' && selectedBlock.text === '텍스트를 입력하세요') {
                    handleUpdateBlock(selectedBlock.id, { text: '' });
                  }
                }}
                placeholder={selectedBlock?.type === 'text' ? '' : '텍스트 블록을 선택하고 내용을 입력하세요...'}
                className="w-full bg-gray-50/50 text-gray-800 placeholder-gray-400 px-5 py-3.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400 focus:bg-white text-sm resize-none transition-all duration-200 font-medium"
                rows={1}
                style={{
                  minHeight: '48px',
                  lineHeight: '1.5'
                }}
                disabled={!selectedBlock || selectedBlock.type !== 'text'}
              />
              {selectedBlock?.type === 'text' && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">
                  {selectedBlock.text.length} 자
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {contextMenu && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          blockId={contextMenu.blockId}
          onBringToFront={handleBringToFront}
          onSendToBack={handleSendToBack}
        />
      )}
      {isExportModalOpen && (
        <ExportModal
            onClose={() => setIsExportModalOpen(false)}
            onExport={handleExport}
        />
      )}
      {/* Mobile Properties Panel */}
      <div className={`md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white shadow-lg transition-transform duration-300 ${selectedId || isCanvasSettingsOpen ? 'translate-y-0' : 'translate-y-full'}`}>
          <div className="max-h-[50vh] overflow-y-auto pb-20">
              <PropertiesPanel
                selectedBlock={selectedBlock}
                onUpdateBlock={handleUpdateBlock}
                onDeleteBlock={(id) => { saveHistory(); handleDeleteBlock(id); }}
                canvasSize={canvasSize}
                onUpdateCanvasSize={handleUpdateCanvasSize}
                onSelectBlock={handleSelectBlock}
                onHistorySave={saveHistory}
            />
          </div>
      </div>
    </div>
  );
};

export default App;
