import React from 'react';
import { BringToFrontIcon, SendToBackIcon } from './icons';

interface ContextMenuProps {
  x: number;
  y: number;
  blockId: string;
  onBringToFront: (id: string) => void;
  onSendToBack: (id: string) => void;
}

const ContextMenu: React.FC<ContextMenuProps> = ({ x, y, blockId, onBringToFront, onSendToBack }) => {
  return (
    <div
      className="absolute bg-white rounded-md shadow-lg py-1 z-50"
      style={{ top: y, left: x }}
      onClick={(e) => e.stopPropagation()}
    >
      <button
        onClick={(e) => {
          e.stopPropagation();
          onBringToFront(blockId);
        }}
        className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
      >
        <BringToFrontIcon />
        <span className="ml-2">맨 앞으로 가져오기</span>
      </button>
      <button
        onClick={(e) => {
          e.stopPropagation();
          onSendToBack(blockId);
        }}
        className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
      >
        <SendToBackIcon />
        <span className="ml-2">맨 뒤로 보내기</span>
      </button>
    </div>
  );
};

export default ContextMenu;