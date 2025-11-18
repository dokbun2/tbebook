
export interface BaseBlock {
  id: string;
  type: 'text' | 'image';
  x: number;
  y: number;
  zIndex: number;
}

export interface TextBlockType extends BaseBlock {
  type: 'text';
  text: string;
  fontSize: number;
  fontFamily: string;
  fontWeight: string;
  textAlign: 'left' | 'center' | 'right';
  verticalAlign: 'top' | 'middle' | 'bottom';
  color: string;
  width: number;
  height: number;
}

export interface ImageBlockType extends BaseBlock {
  type: 'image';
  src: string;
  width: number;
  height: number;
  borderRadius: number;
}

export type ContentBlock = TextBlockType | ImageBlockType;
