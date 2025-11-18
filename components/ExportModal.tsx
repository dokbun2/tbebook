import React from 'react';

interface ExportModalProps {
  onClose: () => void;
  onExport: (format: 'png' | 'jpg') => void;
}

const ExportModal: React.FC<ExportModalProps> = ({ onClose, onExport }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-sm" onClick={e => e.stopPropagation()}>
        <h3 className="text-xl font-semibold text-gray-800 mb-4">이미지로 내보내기</h3>
        <p className="text-gray-600 mb-6">원하는 파일 형식을 선택하세요.</p>
        <div className="flex space-x-4">
          <button
            onClick={() => onExport('png')}
            className="flex-1 py-2 px-4 bg-blue-500 text-white font-semibold rounded-lg shadow-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-opacity-75 transition-colors"
          >
            PNG로 저장
          </button>
          <button
            onClick={() => onExport('jpg')}
            className="flex-1 py-2 px-4 bg-green-500 text-white font-semibold rounded-lg shadow-md hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-400 focus:ring-opacity-75 transition-colors"
          >
            JPG로 저장
          </button>
        </div>
        <button
          onClick={onClose}
          className="mt-6 w-full py-2 px-4 bg-gray-200 text-gray-700 font-semibold rounded-lg hover:bg-gray-300 focus:outline-none transition-colors"
        >
          취소
        </button>
      </div>
    </div>
  );
};

export default ExportModal;