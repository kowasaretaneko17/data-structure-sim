import type { BlockParams, BlockType } from './blocks';

export interface RecipeBlock {
  type: BlockType;
  params: BlockParams;
}

export interface RecipeLink {
  from: number;
  to: number;
  mode?: 'transfer' | 'store';
}

/** 复合组件配方：子图结构 + 对外端口映射 */
export interface Recipe {
  name: string;
  blocks: RecipeBlock[];
  links: RecipeLink[];
  /** 输入端口映射到内部积木 index */
  inPort: number;
  /** 输出端口映射到内部积木 index */
  outPort: number;
  /** 黑盒外观 */
  shape?: 'box' | 'bucket';
}

/** 复合组件配方库（初始为空，通过「框选 + 打包」创建） */
export const RECIPES: Recipe[] = [];
