
import React, { useRef, useState } from 'react';
import { TextIcon, ImageIcon, SaveIcon, UploadIcon, CameraIcon, SettingsIcon, UndoIcon, RedoIcon } from './icons';

interface ToolbarProps {
  onAddText: () => void;
  onAddImage: (src: string) => void;
  onBackup: () => void;
  onRestore: (data: string) => void;
  onOpenExportModal: () => void;
  onOpenCanvasSettings: () => void;
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  selectedText?: string;
  onUpdateText?: (text: string) => void;
}

const Toolbar: React.FC<ToolbarProps> = ({
    onAddText, onAddImage, onBackup, onRestore,
    onOpenExportModal, onOpenCanvasSettings,
    onUndo, onRedo, canUndo, canRedo,
    selectedText = '', onUpdateText
}) => {
  const imageInputRef = useRef<HTMLInputElement>(null);
  const restoreInputRef = useRef<HTMLInputElement>(null);
  const [imageCount, setImageCount] = useState(0);

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        if (typeof e.target?.result === 'string') {
          onAddImage(e.target.result);
          setImageCount(prev => prev + 1);
        }
      };
      reader.readAsDataURL(file);
    }
    // Reset file input
    event.target.value = "";
  };

  const handleRestoreUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            if (typeof e.target?.result === 'string') {
                onRestore(e.target.result);
            }
        };
        reader.readAsText(file);
    }
    // Reset file input to allow uploading the same file again
    if(event.target) {
        event.target.value = "";
    }
  };

  return (
    <>
      {/* Top Toolbar */}
      <div className="absolute top-0 left-0 right-0 bg-white shadow-md z-20 p-2 flex items-center justify-between">
        <div className="flex items-center space-x-2">
            <h1 className="text-xl font-bold text-gray-700 mr-4 hidden md:block">상세페이지 만들기</h1>
            <button
              onClick={onUndo}
              disabled={!canUndo}
              className={`p-2 rounded-md transition-colors duration-200 ${canUndo ? 'bg-gray-200 hover:bg-gray-300 text-gray-700' : 'bg-gray-100 text-gray-400 cursor-not-allowed'}`}
              title="실행 취소 (Ctrl+Z)"
            >
              <UndoIcon />
            </button>
             <button
              onClick={onRedo}
              disabled={!canRedo}
              className={`p-2 rounded-md transition-colors duration-200 ${canRedo ? 'bg-gray-200 hover:bg-gray-300 text-gray-700' : 'bg-gray-100 text-gray-400 cursor-not-allowed'}`}
              title="다시 실행 (Ctrl+Y)"
            >
              <RedoIcon />
            </button>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={onBackup}
            className="flex items-center px-3 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors duration-200"
            title="프로젝트 저장"
          >
            <SaveIcon />
             <span className="ml-2 hidden sm:inline">프로젝트 저장</span>
          </button>
           <button
            onClick={() => restoreInputRef.current?.click()}
            className="flex items-center px-3 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors duration-200"
            title="불러오기"
          >
            <UploadIcon />
            <span className="ml-2 hidden sm:inline">불러오기</span>
          </button>
          <button
            onClick={onOpenExportModal}
            className="flex items-center px-3 py-2 bg-purple-500 text-white rounded-md hover:bg-purple-600 transition-colors duration-200"
            title="이미지로 내보내기"
          >
            <CameraIcon />
            <span className="ml-2 hidden sm:inline">이미지로 내보내기</span>
          </button>
          <button
              onClick={onOpenCanvasSettings}
              className="flex items-center px-3 py-2 bg-gray-100 text-gray-600 rounded-md hover:bg-gray-200 transition-colors duration-200"
              title="캔버스 설정"
          >
              <SettingsIcon />
          </button>
          <input
            type="file"
            ref={imageInputRef}
            onChange={handleImageUpload}
            accept="image/*"
            className="hidden"
          />
          <input
            type="file"
            ref={restoreInputRef}
            onChange={handleRestoreUpload}
            accept=".json"
            className="hidden"
          />
        </div>
      </div>

      {/* Bottom Input Toolbar */}
      <div className="fixed bottom-0 left-0 right-0 z-20 flex justify-center items-end pb-4 px-4">
        <div className="bg-white rounded-full p-3 flex items-center space-x-2 w-full sm:w-11/12 md:w-5/6 lg:w-4/5 xl:w-3/4 max-w-4xl shadow-lg border border-gray-200">
          <button
            onClick={onAddText}
            className="flex items-center justify-center p-2 bg-blue-50 text-blue-600 rounded-full hover:bg-blue-100 transition-colors duration-200 flex-shrink-0"
            title="텍스트 추가"
          >
            <TextIcon />
          </button>
          <button
            onClick={() => imageInputRef.current?.click()}
            className="flex items-center justify-center p-2 bg-green-50 text-green-600 rounded-full hover:bg-green-100 transition-colors duration-200 flex-shrink-0"
            title="이미지 추가"
          >
            <ImageIcon />
          </button>

          <div className="flex-1">
            <textarea
              value={selectedText}
              onChange={(e) => onUpdateText?.(e.target.value)}
              onFocus={(e) => {
                if (e.target.value === '내용을 입력하세요...') {
                  e.target.value = '';
                  onUpdateText?.('');
                }
              }}
              onBlur={(e) => {
                if (e.target.value === '') {
                  onUpdateText?.('내용을 입력하세요...');
                }
              }}
              placeholder="내용을 입력하세요..."
              className="w-full bg-white text-gray-800 placeholder-gray-400 px-4 py-2 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-400 text-sm resize-none border-0"
              rows={1}
            />
          </div>
        </div>
      </div>
    </>
  );
};

export default Toolbar;
