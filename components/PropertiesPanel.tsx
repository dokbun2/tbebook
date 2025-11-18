
import React, { useState, useEffect } from 'react';
import type { ContentBlock, TextBlockType, ImageBlockType } from '../types';
import { AlignLeftIcon, AlignCenterIcon, AlignRightIcon, AlignTopIcon, AlignMiddleIcon, AlignBottomIcon, TrashIcon, ArrowLeftIcon } from './icons';
import fontsData from '../fonts-data.json';

interface PropertiesPanelProps {
  selectedBlock: ContentBlock | null;
  onUpdateBlock: (id: string, newProps: Partial<ContentBlock>) => void;
  onDeleteBlock: (id: string) => void;
  canvasSize: { width: number; height: number };
  onUpdateCanvasSize: (newSize: { width?: number; height?: number }) => void;
  onSelectBlock: (id: string | null) => void;
  onHistorySave: () => void;
}

const FONT_FAMILIES = fontsData as Array<{name: string; displayName: string; category: string; styles: string[]}>;

const CANVAS_PRESETS = [
    { name: '직접 설정', width: 0, height: 0 },
    { name: '유튜브 썸네일 (16:9)', width: 1280, height: 720 },
    { name: '인스타그램 게시물 (1:1)', width: 1080, height: 1080 },
    { name: '인스타그램 스토리 (9:16)', width: 1080, height: 1920 },
    { name: 'A4 세로', width: 794, height: 1123 },
    { name: 'A4 가로', width: 1123, height: 794 },
];

const PRESET_COLORS = [
  '#FF0000', '#FF7F00', '#FFD700', '#00FF00', '#00FFFF', '#0000FF', '#4B0082', '#9400D3',
  '#FFC0CB', '#FFA07A', '#FFFFE0', '#90EE90', '#AFEEEE', '#ADD8E6', '#DDA0DD', '#F0E68C',
  '#8B0000', '#FF8C00', '#808000', '#006400', '#008080', '#000080', '#483D8B', '#800080',
  '#000000', '#4A4A4A', '#808080', '#A9A9A9', '#C0C0C0', '#DCDCDC', '#F5F5F5', '#FFFFFF'
];

const NumericInput: React.FC<{ label: string; value: number; onChange: (value: number) => void; onFocus: () => void }> = ({ label, value, onChange, onFocus }) => {
    const [localValue, setLocalValue] = useState(String(value));

    useEffect(() => {
        setLocalValue(String(value));
    }, [value]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setLocalValue(e.target.value);
    };

    const handleBlur = () => {
        const numValue = parseInt(localValue, 10);
        if (!isNaN(numValue) && numValue >= 0) {
            onChange(numValue);
        } else {
            setLocalValue(String(value));
        }
    };

    return (
        <div className="mb-4">
            <label className="block text-sm font-medium text-gray-600">{label}</label>
            <input
                type="number"
                value={localValue}
                onChange={handleChange}
                onFocus={onFocus}
                onBlur={handleBlur}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500"
            />
        </div>
    );
};

const ColorPickerModal: React.FC<{
    initialColor: string;
    onSave: (color: string) => void;
    onClose: () => void;
}> = ({ initialColor, onSave, onClose }) => {
    const [selectedColor, setSelectedColor] = useState(initialColor);
    const [hexInput, setHexInput] = useState(initialColor);

    useEffect(() => {
        setSelectedColor(initialColor);
        setHexInput(initialColor);
    }, [initialColor]);

    const handleColorSelect = (color: string) => {
        setSelectedColor(color);
        setHexInput(color);
    };

    const handleHexChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setHexInput(e.target.value);
        if (/^#[0-9A-F]{6}$/i.test(e.target.value)) {
            setSelectedColor(e.target.value);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-20" onClick={onClose}>
            <div className="bg-white rounded-lg shadow-xl p-4 w-80" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-bold text-gray-800">텍스트 색상 선택</h3>
                    <div
                        className="w-8 h-8 rounded border border-gray-300 shadow-sm"
                        style={{ backgroundColor: selectedColor }}
                    />
                </div>

                <div className="grid grid-cols-8 gap-2 mb-4">
                    {PRESET_COLORS.map((color) => (
                        <button
                            key={color}
                            className={`w-6 h-6 rounded-md shadow-sm hover:scale-110 transition-transform focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-blue-500 ${selectedColor.toLowerCase() === color.toLowerCase() ? 'ring-2 ring-offset-1 ring-blue-500' : ''}`}
                            style={{ backgroundColor: color }}
                            onClick={() => handleColorSelect(color)}
                            title={color}
                        />
                    ))}
                </div>

                <input
                    type="text"
                    value={hexInput}
                    onChange={handleHexChange}
                    className="w-full border border-blue-500 rounded-md p-2 mb-4 text-gray-700 font-mono focus:outline-none focus:ring-2 focus:ring-blue-300"
                    placeholder="#000000"
                />

                <div className="flex space-x-2">
                    <button
                        onClick={() => onSave(selectedColor)}
                        className="flex-1 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 font-bold"
                    >
                        저장
                    </button>
                    <button
                        onClick={onClose}
                        className="flex-1 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 font-bold"
                    >
                        닫기
                    </button>
                </div>
            </div>
        </div>
    );
};


const PropertiesPanel: React.FC<PropertiesPanelProps> = ({ selectedBlock, onUpdateBlock, onDeleteBlock, canvasSize, onUpdateCanvasSize, onSelectBlock, onHistorySave }) => {
  const [isColorPickerOpen, setIsColorPickerOpen] = useState(false);

  // 스타일 이름 한글 번역 함수
  const translateStyleName = (style: string): string => {
    const styleTranslations: { [key: string]: string } = {
      'Thin': '얇게',
      'ExtraLight': '아주 얇게',
      'Light': '가늘게',
      'Regular': '보통',
      'Medium': '중간',
      'SemiBold': '약간 굵게',
      'Bold': '굵게',
      'ExtraBold': '아주 굵게',
      'Black': '검게',
      'Italic': '기울임',
      'Bold Italic': '굵은 기울임',
      'Narrow': '좁게',
      'Condensed': '압축',
      'Extended': '확장',
      'Rounded': '둥글게',
      'Script': '필기체',
      'OTF': 'OTF',
      'ttf': 'TTF',
      'Smallcaps': '작은 대문자',
      'Ornaments': '장식',
    };

    return styleTranslations[style] || style;
  };

  const handlePresetChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onHistorySave();
    const selectedPreset = CANVAS_PRESETS[parseInt(e.target.value, 10)];
    if (selectedPreset && selectedPreset.width > 0) {
      onUpdateCanvasSize({ width: selectedPreset.width, height: selectedPreset.height });
    }
  };

  const renderCanvasSettings = () => (
    <>
      <h3 className="text-lg font-semibold text-gray-700 border-b pb-2 mb-4">캔버스 설정</h3>
      <div className="mb-4">
          <label className="block text-sm font-medium text-gray-600">프리셋</label>
          <select
            onChange={handlePresetChange}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500"
          >
            {CANVAS_PRESETS.map((preset, index) => <option key={preset.name} value={index}>{preset.name}</option>)}
          </select>
      </div>
      <NumericInput label="너비 (px)" value={canvasSize.width} onChange={(width) => onUpdateCanvasSize({ width })} onFocus={onHistorySave} />
      <NumericInput label="높이 (px)" value={canvasSize.height} onChange={(height) => onUpdateCanvasSize({ height })} onFocus={onHistorySave} />
    </>
  );


  if (!selectedBlock) {
    return (
      <div className="w-full md:w-64 bg-white p-4 shadow-lg md:h-full md:overflow-y-auto">
        {renderCanvasSettings()}
      </div>
    );
  }

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement | HTMLInputElement | HTMLSelectElement>) => {
    onUpdateBlock(selectedBlock.id, { [e.target.name]: e.target.value });
  };

  const handleNumericPropChange = (name: string, value: number) => {
    onUpdateBlock(selectedBlock.id, { [name]: value });
  };

  const handleColorSave = (color: string) => {
      onUpdateBlock(selectedBlock.id, { color });
      setIsColorPickerOpen(false);
  };

  const wrapHistory = (action: () => void) => {
      onHistorySave();
      action();
  }

  const renderTextProperties = (block: TextBlockType) => {
    // 현재 font-family에서 name과 style 분리
    const parts = block.fontFamily.split('-');
    let currentFamilyName = block.fontFamily;
    let currentStyle = block.fontWeight;

    if (parts.length >= 2) {
      currentStyle = parts[parts.length - 1];
      currentFamilyName = parts.slice(0, -1).join('-');
    }

    const currentFont = FONT_FAMILIES.find(f => f.name === currentFamilyName);

    // 같은 displayName을 가진 모든 폰트의 스타일 합치기
    const currentDisplayName = currentFont?.displayName || '';
    const allMatchingFonts = FONT_FAMILIES.filter(f => f.displayName === currentDisplayName);
    const availableStyles = Array.from(new Set(allMatchingFonts.flatMap(f => f.styles))).sort();

    return (
      <>
        <NumericInput label="글자 크기 (px)" value={block.fontSize} onChange={(val) => handleNumericPropChange('fontSize', val)} onFocus={onHistorySave} />

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-600">글꼴</label>
          <select
            value={currentFamilyName}
            onChange={(e) => {
              onHistorySave();
              const selectedFont = FONT_FAMILIES.find(f => f.name === e.target.value);
              const firstStyle = selectedFont?.styles[0] || 'Regular';
              const fullFontFamily = `${e.target.value}-${firstStyle}`;
              onUpdateBlock(block.id, {
                fontFamily: fullFontFamily,
                fontWeight: firstStyle
              });
            }}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500"
          >
            {(() => {
              // displayName이 같은 폰트들을 하나로 합치기
              const fontMap: { [key: string]: typeof FONT_FAMILIES[0] & { allStyles: string[] } } = {};
              FONT_FAMILIES.forEach(font => {
                if (!fontMap[font.displayName]) {
                  fontMap[font.displayName] = { ...font, allStyles: [...font.styles] };
                } else {
                  // 스타일 합치기
                  fontMap[font.displayName].allStyles.push(...font.styles);
                  // 대표 이름 유지 (첫 번째 것 사용)
                }
              });

              // 카테고리별로 그룹화
              const categories: { [key: string]: Array<typeof FONT_FAMILIES[0] & { allStyles: string[] }> } = {};
              Object.values(fontMap).forEach(font => {
                if (!categories[font.category]) {
                  categories[font.category] = [];
                }
                categories[font.category].push(font);
              });

              return Object.entries(categories).map(([category, fonts]) => (
                <optgroup key={category} label={category}>
                  {fonts.map(font => (
                    <option key={font.name} value={font.name}>
                      {font.displayName}
                    </option>
                  ))}
                </optgroup>
              ));
            })()}
          </select>
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-600">글꼴 스타일</label>
          <select
            value={currentStyle}
            onChange={(e) => {
              onHistorySave();
              const selectedStyle = e.target.value;

              // 같은 displayName을 가진 폰트 중에서 선택한 스타일을 가진 폰트 찾기
              const targetFont = allMatchingFonts.find(f => f.styles.includes(selectedStyle));

              if (targetFont) {
                const fullFontFamily = `${targetFont.name}-${selectedStyle}`;
                onUpdateBlock(block.id, {
                  fontFamily: fullFontFamily,
                  fontWeight: selectedStyle
                });
              } else {
                // 폴백: 현재 폰트 이름 사용
                const fullFontFamily = `${currentFamilyName}-${selectedStyle}`;
                onUpdateBlock(block.id, {
                  fontFamily: fullFontFamily,
                  fontWeight: selectedStyle
                });
              }
            }}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500"
          >
            {availableStyles.map(style => (
              <option key={style} value={style}>{translateStyleName(style)}</option>
            ))}
          </select>
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-600">텍스트 정렬</label>
          <div className="flex items-center space-x-1 mt-1">
            {(['left', 'center', 'right'] as const).map(align => (
                <button
                  key={align}
                  onClick={() => wrapHistory(() => onUpdateBlock(block.id, { textAlign: align }))}
                  className={`p-2 rounded-md transition-colors ${block.textAlign === align ? 'bg-blue-500 text-white' : 'bg-gray-200 hover:bg-gray-300'}`}
                >
                    {align === 'left' && <AlignLeftIcon />}
                    {align === 'center' && <AlignCenterIcon />}
                    {align === 'right' && <AlignRightIcon />}
                </button>
            ))}
          </div>
        </div>
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-600">수직 정렬</label>
          <div className="flex items-center space-x-1 mt-1">
            {(['top', 'middle', 'bottom'] as const).map(align => (
                <button
                  key={align}
                  onClick={() => wrapHistory(() => onUpdateBlock(block.id, { verticalAlign: align }))}
                  className={`p-2 rounded-md transition-colors ${block.verticalAlign === align ? 'bg-blue-500 text-white' : 'bg-gray-200 hover:bg-gray-300'}`}
                >
                    {align === 'top' && <AlignTopIcon />}
                    {align === 'middle' && <AlignMiddleIcon />}
                    {align === 'bottom' && <AlignBottomIcon />}
                </button>
            ))}
          </div>
        </div>
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-600">색상</label>
          <button
              onClick={() => { onHistorySave(); setIsColorPickerOpen(true); }}
              className="mt-1 flex items-center justify-between w-full border border-gray-300 rounded-md shadow-sm p-2 bg-white hover:bg-gray-50"
          >
              <span className="font-mono text-gray-700">{block.color}</span>
              <div className="w-6 h-6 rounded border border-gray-200" style={{ backgroundColor: block.color }} />
          </button>
        </div>
        {isColorPickerOpen && (
            <ColorPickerModal
              initialColor={block.color}
              onSave={handleColorSave}
              onClose={() => setIsColorPickerOpen(false)}
            />
        )}
      </>
    );
  };

  const renderImageProperties = (block: ImageBlockType) => (
    <>
        <NumericInput label="테두리 둥글기 (px)" value={block.borderRadius} onChange={(val) => handleNumericPropChange('borderRadius', val)} onFocus={onHistorySave} />
    </>
  );

  return (
    <div className="w-full md:w-64 bg-white p-4 shadow-lg md:h-full md:overflow-y-auto">
       <div className="flex items-center justify-between border-b pb-2 mb-4">
        <h3 className="text-lg font-semibold text-gray-700">
            {selectedBlock.type === 'text' ? '텍스트' : '이미지'} 편집
        </h3>
        <button onClick={() => onSelectBlock(null)} className="p-1 bg-gray-100 rounded hover:bg-gray-200" title="캔버스 설정으로 돌아가기">
            <ArrowLeftIcon />
        </button>
      </div>
      {selectedBlock.type === 'text' && renderTextProperties(selectedBlock)}
      {selectedBlock.type === 'image' && renderImageProperties(selectedBlock)}
      <div className="mt-6 border-t pt-4">
          <button
              onClick={() => wrapHistory(() => onDeleteBlock(selectedBlock.id))}
              className="w-full flex items-center justify-center py-2 px-4 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors"
          >
              <TrashIcon /> <span className="ml-2">요소 삭제</span>
          </button>
      </div>
    </div>
  );
};

export default PropertiesPanel;
