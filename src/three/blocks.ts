import * as THREE from 'three';

export type BlockType =
  | 'source'
  | 'sink'
  | 'composite'
  | 'array'
  | 'stack'
  | 'queue'
  | 'linkedList'
  | 'hashMap'
  | 'skipList'
  | 'tree'
  | 'bTree'
  | 'bPlusTree'
  | 'redBlackTree'
  | 'bst'
  | 'avlTree'
  | 'deque'
  | 'circularQueue'
  | 'trie'
  | 'unionFind'
  | 'heap'
  | 'graph';

export interface BlockParams {
  capacity: number;
  filled: number;
  /** 源节点流速（发送间隔，步数；1=最快） */
  speed?: number;
  /** 当前存储的具体数据值 */
  values?: number[];
  /** 跳表：每个元素的晋升层数 */
  skipLevels?: number[];
}

export interface BlockParamMeta {
  capacityLabel: string;
  capacityMin: number;
  capacityMax: number;
  speedLabel?: string;
  speedMin?: number;
  speedMax?: number;
}

export const DEFAULT_PARAMS: Record<BlockType, BlockParams> = {
  source: { capacity: 5, filled: 0, speed: 2 },
  sink: { capacity: 1, filled: 0, speed: 1 },
  composite: { capacity: 4, filled: 0 },
  array: { capacity: 6, filled: 0 },
  stack: { capacity: 3, filled: 0 },
  queue: { capacity: 3, filled: 0 },
  linkedList: { capacity: 4, filled: 0 },
  hashMap: { capacity: 4, filled: 0 },
  skipList: { capacity: 6, filled: 0 },
  tree: { capacity: 3, filled: 0 },
  bTree: { capacity: 6, filled: 0 },
  bPlusTree: { capacity: 6, filled: 0 },
  redBlackTree: { capacity: 6, filled: 0 },
  bst: { capacity: 6, filled: 0 },
  avlTree: { capacity: 6, filled: 0 },
  deque: { capacity: 6, filled: 0 },
  circularQueue: { capacity: 6, filled: 0 },
  trie: { capacity: 6, filled: 0 },
  unionFind: { capacity: 6, filled: 0 },
  heap: { capacity: 6, filled: 0 },
  graph: { capacity: 5, filled: 0 },
};

export const PARAM_META: Record<BlockType, BlockParamMeta> = {
  source: { capacityLabel: '消息数', capacityMin: 1, capacityMax: 20, speedLabel: '流速', speedMin: 1, speedMax: 10 },
  sink: { capacityLabel: '容量', capacityMin: 1, capacityMax: 1, speedLabel: '消耗速度', speedMin: 1, speedMax: 10 },
  composite: { capacityLabel: '容量', capacityMin: 1, capacityMax: 10 },
  array: { capacityLabel: '长度', capacityMin: 1, capacityMax: 8 },
  stack: { capacityLabel: '容量', capacityMin: 1, capacityMax: 6 },
  queue: { capacityLabel: '容量', capacityMin: 1, capacityMax: 6 },
  linkedList: { capacityLabel: '节点数', capacityMin: 1, capacityMax: 6 },
  hashMap: { capacityLabel: '桶数', capacityMin: 1, capacityMax: 6 },
  skipList: { capacityLabel: '元素数', capacityMin: 1, capacityMax: 12 },
  tree: { capacityLabel: '层数', capacityMin: 1, capacityMax: 3 },
  bTree: { capacityLabel: '键数', capacityMin: 1, capacityMax: 12 },
  bPlusTree: { capacityLabel: '键数', capacityMin: 1, capacityMax: 20 },
  redBlackTree: { capacityLabel: '节点数', capacityMin: 1, capacityMax: 12 },
  bst: { capacityLabel: '节点数', capacityMin: 1, capacityMax: 12 },
  avlTree: { capacityLabel: '节点数', capacityMin: 1, capacityMax: 12 },
  deque: { capacityLabel: '容量', capacityMin: 1, capacityMax: 8 },
  circularQueue: { capacityLabel: '容量', capacityMin: 1, capacityMax: 8 },
  trie: { capacityLabel: '键数', capacityMin: 1, capacityMax: 12 },
  unionFind: { capacityLabel: '元素数', capacityMin: 1, capacityMax: 8 },
  heap: { capacityLabel: '元素数', capacityMin: 1, capacityMax: 10 },
  graph: { capacityLabel: '节点数', capacityMin: 2, capacityMax: 6 },
};

export interface BlockInfo {
  name: string;
  description: string;
}

/** 积木悬浮说明文案 */
export const BLOCK_INFO: Record<BlockType, BlockInfo> = {
  source: { name: '源节点', description: '数据源头，生成消息' },
  sink: { name: '汇节点', description: '数据终点，吸收统计' },
  composite: { name: '复合组件', description: '由多个积木打包而成' },
  array: { name: '数组', description: '连续内存，随机访问 O(1)' },
  stack: { name: '栈', description: '后进先出（LIFO）' },
  queue: { name: '队列', description: '先进先出（FIFO）' },
  linkedList: { name: '链表', description: '指针串联，插入删除快' },
  hashMap: { name: '哈希表', description: '键值对，哈希散列，查找 O(1)' },
  skipList: { name: '跳表', description: '多层索引链表，查找 O(log n)' },
  tree: { name: '树', description: '层级结构，父子节点' },
  bTree: { name: 'B树', description: '多路平衡搜索树' },
  bPlusTree: { name: 'B+树', description: '索引节点 + 叶子链表' },
  redBlackTree: { name: '红黑树', description: '自平衡二叉搜索树' },
  bst: { name: '二叉搜索树', description: '左小右大，查找 O(log n)' },
  avlTree: { name: 'AVL 树', description: '旋转保持平衡，左右子树高差≤1' },
  deque: { name: '双端队列', description: '两端都可进出' },
  circularQueue: { name: '循环队列', description: '环形缓冲，头尾相连' },
  trie: { name: '字典树', description: '前缀树，按位检索' },
  unionFind: { name: '并查集', description: '集合合并与查找' },
  heap: { name: '堆', description: '大顶/小顶，堆序结构' },
  graph: { name: '图', description: '节点 + 边，网状关系' },
};

const BLOCK_COLORS: Record<BlockType, number> = {
  source: 0x52c41a,
  sink: 0x8c8c8c,
  composite: 0xf5b301,
  array: 0x4f7cff,
  stack: 0x8a5cf6,
  queue: 0xff9c33,
  linkedList: 0xe85d75,
  hashMap: 0x13c2c2,
  skipList: 0x08979c,
  tree: 0x2fbf9f,
  bTree: 0x1f78b4,
  bPlusTree: 0x33a02c,
  redBlackTree: 0xe31a1c,
  bst: 0x1677ff,
  avlTree: 0xfa8c16,
  deque: 0x13c2c2,
  circularQueue: 0x722ed1,
  trie: 0xeb2f96,
  unionFind: 0x52c41a,
  heap: 0xe8792f,
  graph: 0x35c4e0,
};
const LINE_COLOR = 0xb9bfc9;
const BASE_COLOR = 0x3a3f4b;
const SLOT_COLOR = 0xffffff;
const SLOT_BORDER = 0xc3c8d1;

/** 数字标签 Sprite */
function createNumberSprite(value: number): THREE.Sprite {
  const canvas = document.createElement('canvas');
  canvas.width = 64;
  canvas.height = 64;
  const ctx = canvas.getContext('2d');
  if (ctx === null) {
    return new THREE.Sprite();
  }
  ctx.fillStyle = '#1b1d24';
  ctx.font = 'bold 30px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(String(value), 32, 32);
  const texture = new THREE.CanvasTexture(canvas);
  const material = new THREE.SpriteMaterial({
    map: texture,
    transparent: true,
    depthWrite: false,
  });
  const sprite = new THREE.Sprite(material);
  sprite.scale.set(0.6, 0.6, 1);
  return sprite;
}

function addValueLabel(parent: THREE.Object3D, value: number, x: number, z: number): void {
  const sprite = createNumberSprite(value);
  sprite.position.set(x, 0.5, z);
  parent.add(sprite);
}

/** 扁平圆点（数据元素） */
function createDot(color: number, radius = 0.34): THREE.Mesh {
  return new THREE.Mesh(
    new THREE.CylinderGeometry(radius, radius, 0.1, 32),
    new THREE.MeshBasicMaterial({ color }),
  );
}

/** 扁平格子（白色 + 边框） */
function createSlot(w: number, d: number): THREE.Group {
  const group = new THREE.Group();
  const body = new THREE.Mesh(
    new THREE.BoxGeometry(w, 0.06, d),
    new THREE.MeshBasicMaterial({ color: SLOT_COLOR }),
  );
  group.add(body);
  const edges = new THREE.EdgesGeometry(new THREE.BoxGeometry(w, 0.06, d));
  const line = new THREE.LineSegments(edges, new THREE.LineBasicMaterial({ color: SLOT_BORDER }));
  group.add(line);
  return group;
}

/** 填充块（盖在格子上） */
function createFill(w: number, d: number, color: number): THREE.Mesh {
  return new THREE.Mesh(
    new THREE.BoxGeometry(w - 0.08, 0.1, d - 0.08),
    new THREE.MeshBasicMaterial({ color }),
  );
}

function createBase(width: number, depth: number): THREE.Mesh {
  return new THREE.Mesh(
    new THREE.BoxGeometry(width, 0.04, depth),
    new THREE.MeshBasicMaterial({ color: BASE_COLOR }),
  );
}

/** 平面连接线（俯视下的细线） */
function createLink(from: THREE.Vector3, to: THREE.Vector3, color = LINE_COLOR): THREE.Mesh {
  const direction = to.clone().sub(from);
  const length = direction.length();
  const mid = from.clone().add(to).multiplyScalar(0.5);
  const link = new THREE.Mesh(
    new THREE.CylinderGeometry(0.05, 0.05, length, 8),
    new THREE.MeshBasicMaterial({ color }),
  );
  link.position.copy(mid);
  link.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction.normalize());
  return link;
}

function addBase(group: THREE.Group, width: number, depth: number): void {
  const base = createBase(width, depth);
  base.position.y = 0;
  group.add(base);
  group.userData.width = width;
  group.userData.depth = depth;
}

export interface BlockInstance {
  group: THREE.Group;
  inPort: THREE.Vector3;
  outPort: THREE.Vector3;
}

function addPorts(group: THREE.Group, opts?: { in?: boolean; out?: boolean }): BlockInstance {
  const hasIn = opts?.in ?? true;
  const hasOut = opts?.out ?? true;
  const width = (group.userData.width as number | undefined) ?? 4;
  const inPort = new THREE.Vector3(-width / 2 - 0.3, 0, 0);
  const outPort = new THREE.Vector3(width / 2 + 0.3, 0, 0);
  if (hasIn) {
    const inMesh = createDot(0x4f7cff, 0.22);
    inMesh.position.copy(inPort);
    inMesh.userData.portKind = 'in';
    group.add(inMesh);
  }
  if (hasOut) {
    const outMesh = createDot(0xff9c33, 0.22);
    outMesh.position.copy(outPort);
    outMesh.userData.portKind = 'out';
    group.add(outMesh);
  }
  return { group, inPort, outPort };
}

function clampFilled(params: BlockParams): number {
  return Math.max(0, Math.min(params.filled, params.capacity));
}

/** 数组：一排格子 */
function createArrayBlock(params: BlockParams): THREE.Group {
  const group = new THREE.Group();
  const n = Math.max(1, params.capacity);
  const filled = clampFilled(params);
  const spacing = 1.1;
  addBase(group, n * spacing + 0.6, 1.8);
  const startX = -(n - 1) * spacing * 0.5;
  for (let i = 0; i < n; i += 1) {
    const x = startX + i * spacing;
    const slot = createSlot(0.95, 1.4);
    slot.position.set(x, 0.03, 0);
    group.add(slot);
    if (i < filled) {
      const fill = createFill(0.95, 1.4, BLOCK_COLORS.array);
      fill.position.set(x, 0.08, 0);
      group.add(fill);
      const value = params.values?.[i];
      if (value !== undefined) {
        addValueLabel(group, value, x, 0);
      }
    }
  }
  return group;
}

/** 栈：竖排格子（z 方向） */
function createStackBlock(params: BlockParams): THREE.Group {
  const group = new THREE.Group();
  const n = Math.max(1, params.capacity);
  const filled = clampFilled(params);
  const spacing = 0.95;
  addBase(group, 2.2, n * spacing + 0.6);
  const startZ = (n - 1) * spacing * 0.5;
  for (let i = 0; i < n; i += 1) {
    const z = startZ - i * spacing;
    const slot = createSlot(1.5, 0.8);
    slot.position.set(0, 0.03, z);
    group.add(slot);
    if (i < filled) {
      const fill = createFill(1.5, 0.8, BLOCK_COLORS.stack);
      fill.position.set(0, 0.08, z);
      group.add(fill);
      const value = params.values?.[i];
      if (value !== undefined) {
        addValueLabel(group, value, 0, z);
      }
    }
  }
  return group;
}

/** 队列：横排格子，队首在右（先进先出，从右往左消耗） */
function createQueueBlock(params: BlockParams): THREE.Group {
  const group = new THREE.Group();
  const n = Math.max(1, params.capacity);
  const filled = clampFilled(params);
  const spacing = 1.35;
  addBase(group, n * spacing + 0.6, 1.9);
  const startX = -(n - 1) * spacing * 0.5;
  for (let i = 0; i < n; i += 1) {
    const x = startX + i * spacing;
    const slot = createSlot(1.15, 1.5);
    slot.position.set(x, 0.03, 0);
    group.add(slot);
  }
  // 队首在右：从右往左填充，values[0]（最早）在最右
  for (let i = 0; i < filled; i += 1) {
    const x = startX + (n - 1 - i) * spacing;
    const fill = createFill(1.15, 1.5, BLOCK_COLORS.queue);
    fill.position.set(x, 0.08, 0);
    group.add(fill);
    const value = params.values?.[i];
    if (value !== undefined) {
      addValueLabel(group, value, x, 0);
    }
  }
  return group;
}

/** 链表：圆点 + 连接线 */
function createLinkedListBlock(params: BlockParams): THREE.Group {
  const group = new THREE.Group();
  const n = Math.max(1, params.capacity);
  const filled = clampFilled(params);
  const spacing = 1.4;
  addBase(group, n * spacing + 0.6, 1.5);
  const positions: THREE.Vector3[] = [];
  const startX = -(n - 1) * spacing * 0.5;
  for (let i = 0; i < filled; i += 1) {
    positions.push(new THREE.Vector3(startX + i * spacing, 0.05, 0));
  }
  for (let i = 0; i < positions.length - 1; i += 1) {
    group.add(createLink(positions[i], positions[i + 1]));
  }
  positions.forEach((p, i) => {
    const dot = createDot(BLOCK_COLORS.linkedList);
    dot.position.copy(p);
    group.add(dot);
    const value = params.values?.[i];
    if (value !== undefined) {
      addValueLabel(group, value, p.x, p.z);
    }
  });
  return group;
}

/** 哈希表：一排桶，数据按哈希散落到桶 */
function createHashMapBlock(params: BlockParams): THREE.Group {
  const group = new THREE.Group();
  const buckets = Math.max(1, params.capacity);
  const filled = clampFilled(params);
  const spacing = 1.3;
  addBase(group, buckets * spacing + 0.6, 1.9);
  const startX = -(buckets - 1) * spacing * 0.5;
  for (let i = 0; i < buckets; i += 1) {
    const slot = createSlot(1.05, 1.5);
    slot.position.set(startX + i * spacing, 0.03, 0);
    group.add(slot);
  }
  const bucketCounts = new Array<number>(buckets).fill(0);
  for (let j = 0; j < filled; j += 1) {
    const key = params.values?.[j] ?? j;
    const bucketIndex = key % buckets; // 哈希散列：hash(key) = key % 桶数
    const k = bucketCounts[bucketIndex];
    bucketCounts[bucketIndex] += 1;
    const x = startX + bucketIndex * spacing;
    const dx = x - 0.2 + (k % 2) * 0.4;
    const dot = createDot(BLOCK_COLORS.hashMap, 0.26);
    dot.position.set(dx, 0.06, 0);
    group.add(dot);
    addValueLabel(group, key, dx, 0);
  }
  return group;
}

/** 跳表：多层索引链表 */
function createSkipListBlock(params: BlockParams): THREE.Group {
  const group = new THREE.Group();
  const n = Math.max(1, params.capacity);
  const filled = clampFilled(params);
  const spacing = 1.5;
  const layerGap = 1.2;
  addBase(group, n * spacing + 0.8, layerGap * 2 + 1.2);
  const startX = -(n - 1) * spacing * 0.5;
  const color = BLOCK_COLORS.skipList;
  const linkColor = 0xc9d2e0;
  const z0 = -layerGap;
  const z1 = 0;
  const z2 = layerGap;

  // 底层：完整有序链表
  for (let i = 0; i < filled; i += 1) {
    const x = startX + i * spacing;
    const dot = createDot(color, 0.42);
    dot.position.set(x, 0.05, z0);
    group.add(dot);
    const value = params.values?.[i];
    if (value !== undefined) {
      addValueLabel(group, value, x, z0);
    }
    if (i + 1 < filled) {
      group.add(createLink(new THREE.Vector3(x, 0.05, z0), new THREE.Vector3(startX + (i + 1) * spacing, 0.05, z0), linkColor));
    }
  }

  // 索引层：基于 skipLevels 的随机晋升（插入时已确定）
  const l1: number[] = [];
  const l2: number[] = [];
  for (let i = 0; i < filled; i += 1) {
    const lv = params.skipLevels?.[i] ?? 0;
    if (lv >= 1) {
      l1.push(i);
    }
    if (lv >= 2) {
      l2.push(i);
    }
  }
  for (const i of l1) {
    const x = startX + i * spacing;
    const dot = createDot(color, 0.34);
    dot.position.set(x, 0.05, z1);
    group.add(dot);
    group.add(createLink(new THREE.Vector3(x, 0.05, z0), new THREE.Vector3(x, 0.05, z1), linkColor));
  }
  for (let k = 0; k + 1 < l1.length; k += 1) {
    const a = startX + l1[k] * spacing;
    const b = startX + l1[k + 1] * spacing;
    group.add(createLink(new THREE.Vector3(a, 0.05, z1), new THREE.Vector3(b, 0.05, z1), 0xdde3ec));
  }

  // 第 2 层索引（l2 已在上面基于值生成）
  for (const i of l2) {
    const x = startX + i * spacing;
    const dot = createDot(color, 0.26);
    dot.position.set(x, 0.05, z2);
    group.add(dot);
    group.add(createLink(new THREE.Vector3(x, 0.05, z1), new THREE.Vector3(x, 0.05, z2), linkColor));
  }
  for (let k = 0; k + 1 < l2.length; k += 1) {
    const a = startX + l2[k] * spacing;
    const b = startX + l2[k + 1] * spacing;
    group.add(createLink(new THREE.Vector3(a, 0.05, z2), new THREE.Vector3(b, 0.05, z2), 0xdde3ec));
  }
  return group;
}

/** 树：按层序填充 filled 个节点 */
function createTreeBlock(params: BlockParams): THREE.Group {
  const group = new THREE.Group();
  const depth = Math.max(1, Math.min(3, params.capacity));
  const filled = clampFilled(params);
  addBase(group, 4.4, 3.2);
  const allNodes = [
    new THREE.Vector3(0, 0.05, -1.2),
    new THREE.Vector3(-0.9, 0.05, 0),
    new THREE.Vector3(0.9, 0.05, 0),
    new THREE.Vector3(-1.7, 0.05, 1.1),
    new THREE.Vector3(-0.5, 0.05, 1.1),
    new THREE.Vector3(0.5, 0.05, 1.1),
    new THREE.Vector3(1.7, 0.05, 1.1),
  ];
  const maxNodes = depth === 1 ? 1 : depth === 2 ? 3 : 7;
  const count = Math.min(filled, maxNodes);
  for (let i = 0; i < count; i += 1) {
    const left = 2 * i + 1;
    const right = 2 * i + 2;
    if (left < count) {
      group.add(createLink(allNodes[i], allNodes[left], 0x8ad6c2));
    }
    if (right < count) {
      group.add(createLink(allNodes[i], allNodes[right], 0x8ad6c2));
    }
  }
  for (let i = 0; i < count; i += 1) {
    const dot = createDot(BLOCK_COLORS.tree, i === 0 ? 0.34 : 0.3);
    dot.position.copy(allNodes[i]);
    group.add(dot);
    const value = params.values?.[i];
    if (value !== undefined) {
      addValueLabel(group, value, allNodes[i].x, allNodes[i].z);
    }
  }
  return group;
}

function generateTreeLayout(count: number): { nodes: THREE.Vector3[]; width: number; depth: number } {
  const nodes: THREE.Vector3[] = [];
  const levelCounts: number[] = [];
  let remaining = count;
  let level = 0;
  while (remaining > 0) {
    const c = Math.min(2 ** level, remaining);
    levelCounts.push(c);
    remaining -= c;
    level += 1;
  }
  const layerGap = 1.15;
  for (let l = 0; l < levelCounts.length; l += 1) {
    const c = levelCounts[l];
    const z = -((levelCounts.length - 1) * layerGap) / 2 + l * layerGap;
    const spacing = Math.max(0.9, 4.4 / c);
    const startX = -((c - 1) * spacing) / 2;
    for (let i = 0; i < c; i += 1) {
      nodes.push(new THREE.Vector3(startX + i * spacing, 0.05, z));
    }
  }
  const maxCount = levelCounts[levelCounts.length - 1] ?? 1;
  const width = Math.max(maxCount * 0.9 + 0.8, 3.2);
  const depth = Math.max(levelCounts.length * layerGap + 0.8, 3.0);
  return { nodes, width, depth };
}

function inorderToLevelOrder(count: number): number[] {
  const result: number[] = new Array(count).fill(0);
  let index = 0;
  const fill = (i: number): void => {
    if (i >= count) {
      return;
    }
    fill(2 * i + 1);
    result[i] = index;
    index += 1;
    fill(2 * i + 2);
  };
  fill(0);
  return result;
}

/** 二叉搜索树：升序插入退化为右斜链表，展示退化问题 */
function createBstBlock(params: BlockParams): THREE.Group {
  const group = new THREE.Group();
  const filled = clampFilled(params);
  const gap = 1.0;
  const size = Math.max(filled * gap + 1.0, 2.6);
  addBase(group, size, size);
  const nodes: THREE.Vector3[] = [];
  for (let i = 0; i < filled; i += 1) {
    nodes.push(new THREE.Vector3(-size / 2 + 0.7 + i * gap, 0.05, -size / 2 + 0.7 + i * gap));
  }
  for (let i = 0; i + 1 < nodes.length; i += 1) {
    group.add(createLink(nodes[i], nodes[i + 1], 0xbfbfbf));
  }
  nodes.forEach((p, i) => {
    const dot = createDot(BLOCK_COLORS.bst, 0.3);
    dot.position.copy(p);
    group.add(dot);
    const value = params.values?.[i];
    if (value !== undefined) {
      addValueLabel(group, value, p.x, p.z);
    }
  });
  return group;
}

/** AVL 树：平衡二叉搜索树（中序排布） */
function createAvlTreeBlock(params: BlockParams): THREE.Group {
  const group = new THREE.Group();
  const filled = clampFilled(params);
  const layout = generateTreeLayout(filled);
  addBase(group, layout.width, layout.depth);
  const nodes = layout.nodes;
  const inorder = inorderToLevelOrder(filled);
  for (let i = 0; i < nodes.length; i += 1) {
    const left = 2 * i + 1;
    const right = 2 * i + 2;
    if (left < nodes.length) {
      group.add(createLink(nodes[i], nodes[left], 0xbfbfbf));
    }
    if (right < nodes.length) {
      group.add(createLink(nodes[i], nodes[right], 0xbfbfbf));
    }
  }
  nodes.forEach((p, i) => {
    const dot = createDot(BLOCK_COLORS.avlTree, 0.3);
    dot.position.copy(p);
    group.add(dot);
    const value = params.values?.[inorder[i]];
    if (value !== undefined) {
      addValueLabel(group, value, p.x, p.z);
    }
  });
  return group;
}

/** 双端队列：横排格子，两端开口 */
function createDequeBlock(params: BlockParams): THREE.Group {
  const group = new THREE.Group();
  const n = Math.max(1, params.capacity);
  const filled = clampFilled(params);
  const spacing = 1.35;
  addBase(group, n * spacing + 1.6, 1.9);
  const startX = -((n - 1) * spacing) / 2;
  for (let i = 0; i < n; i += 1) {
    const x = startX + i * spacing;
    const slot = createSlot(1.15, 1.5);
    slot.position.set(x, 0.03, 0);
    group.add(slot);
    if (i < filled) {
      const fill = createFill(1.15, 1.5, BLOCK_COLORS.deque);
      fill.position.set(x, 0.08, 0);
      group.add(fill);
      const value = params.values?.[i];
      if (value !== undefined) {
        addValueLabel(group, value, x, 0);
      }
    }
  }
  return group;
}

/** 循环队列：环形排列的格子 */
function createCircularQueueBlock(params: BlockParams): THREE.Group {
  const group = new THREE.Group();
  const n = Math.max(1, params.capacity);
  const filled = clampFilled(params);
  const radius = 1.9;
  addBase(group, radius * 2 + 1.0, radius * 2 + 1.0);
  for (let i = 0; i < n; i += 1) {
    const angle = (i / n) * Math.PI * 2 - Math.PI / 2;
    const x = Math.cos(angle) * radius;
    const z = Math.sin(angle) * radius;
    const slot = createSlot(0.85, 0.85);
    slot.position.set(x, 0.03, z);
    group.add(slot);
    if (i < filled) {
      const fill = createFill(0.85, 0.85, BLOCK_COLORS.circularQueue);
      fill.position.set(x, 0.08, z);
      group.add(fill);
      const value = params.values?.[i];
      if (value !== undefined) {
        addValueLabel(group, value, x, z);
      }
    }
  }
  return group;
}

/** 字典树：按十位分组的前缀树 */
function createTrieBlock(params: BlockParams): THREE.Group {
  const group = new THREE.Group();
  const filled = clampFilled(params);
  addBase(group, 4.6, 3.4);
  const root = new THREE.Vector3(0, 0.05, -1.1);
  const rootDot = createDot(BLOCK_COLORS.trie, 0.3);
  rootDot.position.copy(root);
  group.add(rootDot);
  const groups = new Map<number, number[]>();
  for (let i = 0; i < filled; i += 1) {
    const v = params.values?.[i] ?? 0;
    const prefix = Math.floor(v / 10);
    const list = groups.get(prefix) ?? [];
    list.push(v);
    groups.set(prefix, list);
  }
  const groupEntries = Array.from(groups.entries());
  const spacing = 4.0 / Math.max(groupEntries.length, 1);
  groupEntries.forEach((entry, idx) => {
    const list = entry[1];
    const x = -2.0 + spacing * (idx + 0.5);
    const child = new THREE.Vector3(x, 0.05, 0.5);
    group.add(createLink(root, child, 0xbfbfbf));
    const dot = createDot(BLOCK_COLORS.trie, 0.24);
    dot.position.copy(child);
    group.add(dot);
    list.forEach((v, j) => {
      addValueLabel(group, v, x - 0.2 + j * 0.4, 0.5);
    });
  });
  return group;
}

/** 并查集：数字按模分组的集合 */
function createUnionFindBlock(params: BlockParams): THREE.Group {
  const group = new THREE.Group();
  const filled = clampFilled(params);
  addBase(group, 4.6, 3.0);
  const groups = new Map<number, number[]>();
  for (let i = 0; i < filled; i += 1) {
    const v = params.values?.[i] ?? 0;
    const rep = v % 3;
    const list = groups.get(rep) ?? [];
    list.push(v);
    groups.set(rep, list);
  }
  const entries = Array.from(groups.entries());
  const spacing = 4.0 / Math.max(entries.length, 1);
  entries.forEach((entry, idx) => {
    const list = entry[1];
    const x = -2.0 + spacing * (idx + 0.5);
    const repDot = createDot(BLOCK_COLORS.unionFind, 0.32);
    repDot.position.set(x, 0.05, -0.7);
    group.add(repDot);
    list.forEach((v, j) => {
      const mx = x - 0.3 + j * 0.3;
      const member = createDot(BLOCK_COLORS.unionFind, 0.18);
      member.position.set(mx, 0.05, 0.7);
      group.add(member);
      group.add(createLink(new THREE.Vector3(x, 0.05, -0.7), new THREE.Vector3(mx, 0.05, 0.7), 0xbfbfbf));
      addValueLabel(group, v, mx, 0.7);
    });
  });
  return group;
}

/** 红黑树：二叉搜索树（左小右大）+ 红黑节点 */
function createRedBlackTreeBlock(params: BlockParams): THREE.Group {
  const group = new THREE.Group();
  const filled = clampFilled(params);
  const layout = generateTreeLayout(filled);
  addBase(group, layout.width, layout.depth);
  const nodes = layout.nodes;
  const inorder = inorderToLevelOrder(filled);
  const black = 0x1a1a1a;
  const red = 0xe31a1c;
  for (let i = 0; i < nodes.length; i += 1) {
    const left = 2 * i + 1;
    const right = 2 * i + 2;
    if (left < nodes.length) {
      group.add(createLink(nodes[i], nodes[left], 0xbfbfbf));
    }
    if (right < nodes.length) {
      group.add(createLink(nodes[i], nodes[right], 0xbfbfbf));
    }
  }
  nodes.forEach((p, i) => {
    const level = Math.floor(Math.log2(i + 1));
    const dot = createDot(level % 2 === 0 ? black : red, 0.3);
    dot.position.copy(p);
    group.add(dot);
    const value = params.values?.[inorder[i]];
    if (value !== undefined) {
      addValueLabel(group, value, p.x, p.z);
    }
  });
  return group;
}

/** B树：节点内键有序，根为分隔键，子树按区间分布 */
function createBTreeBlock(params: BlockParams): THREE.Group {
  const group = new THREE.Group();
  const filled = clampFilled(params);
  const values = params.values ?? [];

  const drawNode = (x: number, z: number, keys: number[]): THREE.Vector3 => {
    const w = keys.length * 0.7 + 0.5;
    const box = new THREE.Mesh(
      new THREE.BoxGeometry(w, 0.08, 0.9),
      new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.6 }),
    );
    box.position.set(x, 0.05, z);
    group.add(box);
    const edges = new THREE.EdgesGeometry(new THREE.BoxGeometry(w, 0.08, 0.9));
    const line = new THREE.LineSegments(edges, new THREE.LineBasicMaterial({ color: BLOCK_COLORS.bTree }));
    line.position.set(x, 0.05, z);
    group.add(line);
    keys.forEach((v, i) => {
      addValueLabel(group, v, x - (keys.length - 1) * 0.35 + i * 0.7, z);
    });
    return new THREE.Vector3(x, 0.05, z);
  };

  if (filled <= 3) {
    const w = Math.max(filled * 0.7 + 0.5, 2.2);
    addBase(group, w, 2.2);
    drawNode(0, 0, values.slice(0, filled));
    return group;
  }

  // 根 3 个分隔键 + 4 个子节点（按区间）
  const quarter = Math.floor(filled / 4);
  const sepKeys = [values[quarter], values[2 * quarter], values[3 * quarter]];
  const children = [
    values.slice(0, quarter),
    values.slice(quarter + 1, 2 * quarter),
    values.slice(2 * quarter + 1, 3 * quarter),
    values.slice(3 * quarter + 1),
  ];
  const width = 6.0;
  addBase(group, width, 3.4);
  const root = drawNode(0, -0.9, sepKeys);
  const childXs = [-2.2, -0.7, 0.7, 2.2];
  children.forEach((child, idx) => {
    if (child.length === 0) {
      return;
    }
    const pos = drawNode(childXs[idx], 0.7, child);
    group.add(createLink(root, pos, 0xbfbfbf));
  });
  return group;
}

/** B+树：根索引（路由键）+ 叶子节点（数据，链表连接） */
function createBPlusTreeBlock(params: BlockParams): THREE.Group {
  const group = new THREE.Group();
  const filled = clampFilled(params);
  const leafGap = 1.6;
  const leafCount = Math.max(Math.ceil(filled / 2), 1);
  const width = Math.max(leafCount * leafGap + 1.2, 3.4);
  addBase(group, width, 3.6);

  const drawBox = (x: number, z: number, w: number, color: number): THREE.Vector3 => {
    const box = new THREE.Mesh(
      new THREE.BoxGeometry(w, 0.08, 0.9),
      new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.6 }),
    );
    box.position.set(x, 0.05, z);
    group.add(box);
    const edges = new THREE.EdgesGeometry(new THREE.BoxGeometry(w, 0.08, 0.9));
    const line = new THREE.LineSegments(edges, new THREE.LineBasicMaterial({ color }));
    line.position.set(x, 0.05, z);
    group.add(line);
    return new THREE.Vector3(x, 0.05, z);
  };

  // 叶子节点（含数据键），链表连接
  const leafData: number[][] = [];
  for (let i = 0; i < filled; i += 2) {
    leafData.push((params.values ?? []).slice(i, i + 2));
  }
  const startX = -((leafCount - 1) * leafGap) / 2;
  const leafPositions: THREE.Vector3[] = [];
  leafData.forEach((data, idx) => {
    const x = startX + idx * leafGap;
    const pos = drawBox(x, 0.7, 1.2, BLOCK_COLORS.bPlusTree);
    leafPositions.push(pos);
    data.forEach((v, i) => {
      addValueLabel(group, v, x - 0.2 + i * 0.4, 0.7);
    });
  });
  for (let i = 0; i + 1 < leafPositions.length; i += 1) {
    group.add(createLink(leafPositions[i], leafPositions[i + 1], 0xbfbfbf));
  }

  // 根索引节点（含路由键 = 每个叶子的最大键）
  const routeKeys = leafData.filter((d) => d.length > 0).map((d) => d[d.length - 1]);
  if (routeKeys.length > 0) {
    const rootW = routeKeys.length * 0.7 + 0.5;
    const rootPos = drawBox(0, -0.9, rootW, 0x8a8f9c);
    routeKeys.forEach((v, i) => {
      addValueLabel(group, v, -(routeKeys.length - 1) * 0.35 + i * 0.7, -0.9);
    });
    for (const lp of leafPositions) {
      group.add(createLink(rootPos, lp, 0xbfbfbf));
    }
  }
  return group;
}

/** 堆：金字塔排列 filled 个球 */
function createHeapBlock(params: BlockParams): THREE.Group {
  const group = new THREE.Group();
  const n = Math.max(1, params.capacity);
  const filled = clampFilled(params);
  addBase(group, 4.6, 3.4);
  let layer = 0;
  while ((layer + 1) * (layer + 2) / 2 <= n) {
    layer += 1;
  }
  let placed = 0;
  for (let level = 0; level < layer; level += 1) {
    const count = level + 1;
    const z = -1.0 + level * 1.1;
    const startX = -(count - 1) * 0.55;
    for (let i = 0; i < count && placed < filled; i += 1) {
      const dot = createDot(BLOCK_COLORS.heap, 0.4);
      dot.position.set(startX + i * 1.1, 0.05, z);
      group.add(dot);
      const value = params.values?.[placed];
      if (value !== undefined) {
        addValueLabel(group, value, startX + i * 1.1, z);
      }
      placed += 1;
    }
  }
  return group;
}

/** 图：filled 个节点 + 边 */
function createGraphBlock(params: BlockParams): THREE.Group {
  const group = new THREE.Group();
  const n = Math.max(2, params.capacity);
  const filled = clampFilled(params);
  addBase(group, 4.6, 4.0);
  const nodes: THREE.Vector3[] = [];
  for (let i = 0; i < n; i += 1) {
    const angle = (i / n) * Math.PI * 2 - Math.PI / 2;
    const radius = i === 0 ? 0 : 1.7;
    const x = Math.cos(angle) * radius;
    const z = Math.sin(angle) * radius;
    nodes.push(new THREE.Vector3(x, 0.05, z));
  }
  for (let i = 1; i < filled; i += 1) {
    group.add(createLink(nodes[0], nodes[i], 0x9ad7e8));
    if (i < filled - 1) {
      group.add(createLink(nodes[i], nodes[i + 1], 0x9ad7e8));
    }
  }
  if (filled > 2) {
    group.add(createLink(nodes[1], nodes[filled - 1], 0x9ad7e8));
  }
  for (let i = 0; i < filled; i += 1) {
    const dot = createDot(BLOCK_COLORS.graph, 0.32);
    dot.position.copy(nodes[i]);
    group.add(dot);
    const value = params.values?.[i];
    if (value !== undefined) {
      addValueLabel(group, value, nodes[i].x, nodes[i].z);
    }
  }
  return group;
}

/** 源节点：圆形卡片，只有输出端口 */
function createSourceBlock(): THREE.Group {
  const group = new THREE.Group();
  const body = new THREE.Mesh(
    new THREE.CylinderGeometry(0.9, 0.9, 0.1, 32),
    new THREE.MeshBasicMaterial({ color: BLOCK_COLORS.source }),
  );
  body.position.y = 0.05;
  group.add(body);
  const core = createDot(0xffffff, 0.4);
  core.position.y = 0.11;
  group.add(core);
  group.userData.width = 1.8;
  group.userData.depth = 1.8;
  return group;
}

/** 汇节点：圆形卡片，只有输入端口 */
function createSinkBlock(): THREE.Group {
  const group = new THREE.Group();
  const body = new THREE.Mesh(
    new THREE.CylinderGeometry(0.9, 0.9, 0.1, 32),
    new THREE.MeshBasicMaterial({ color: BLOCK_COLORS.sink }),
  );
  body.position.y = 0.05;
  group.add(body);
  const core = createDot(0xffffff, 0.4);
  core.position.y = 0.11;
  group.add(core);
  group.userData.width = 1.8;
  group.userData.depth = 1.8;
  return group;
}

/** 复合组件：黑盒或展开态（展开时内部积木+连线缩放展示在盒内） */
export interface CompositeSpec {
  name: string;
  blocks: Array<{ type: BlockType; params: BlockParams }>;
  links: Array<{ from: number; to: number }>;
  expanded: boolean;
  shape?: 'box' | 'bucket';
}

export function createCompositeBlock(spec: CompositeSpec): BlockInstance {
  const group = new THREE.Group();
  group.userData.compositeName = spec.name;
  if (!spec.expanded && spec.shape === 'bucket') {
    // 桶形：圆形桶口 + 令牌
    const body = new THREE.Mesh(
      new THREE.CylinderGeometry(1.05, 1.05, 0.12, 32),
      new THREE.MeshBasicMaterial({ color: 0xf5b301 }),
    );
    body.position.y = 0.06;
    group.add(body);
    const rim = new THREE.Mesh(
      new THREE.TorusGeometry(1.05, 0.07, 8, 32),
      new THREE.MeshBasicMaterial({ color: 0xd49a00 }),
    );
    rim.rotation.x = -Math.PI / 2;
    rim.position.y = 0.14;
    group.add(rim);
    for (let i = 0; i < 3; i += 1) {
      const token = createDot(0xffffff, 0.17);
      token.position.set(-0.4 + i * 0.4, 0.15, 0);
      group.add(token);
    }
    group.userData.width = 2.4;
    group.userData.depth = 2.4;
  } else if (!spec.expanded) {
    addBase(group, 2.8, 2.0);
    group.userData.width = 2.8;
    group.userData.depth = 2.0;
    const d1 = createDot(0x13c2c2, 0.3);
    d1.position.set(-0.5, 0.06, 0);
    group.add(d1);
    const d2 = createDot(0xe85d75, 0.3);
    d2.position.set(0.5, 0.06, 0);
    group.add(d2);
  } else {
    const spacing = 2.6;
    const w = spec.blocks.length * spacing + 1.2;
    addBase(group, w, 3.4);
    group.userData.width = w;
    group.userData.depth = 3.4;
    const startX = -((spec.blocks.length - 1) * spacing) / 2;
    const subGroups: THREE.Group[] = [];
    spec.blocks.forEach((rb, i) => {
      const sub = createBlock(rb.type, rb.params).group;
      sub.scale.setScalar(0.55);
      sub.position.set(startX + i * spacing, 0.05, 0);
      group.add(sub);
      subGroups.push(sub);
    });
    for (const l of spec.links) {
      const from = subGroups[l.from].position.clone();
      const to = subGroups[l.to].position.clone();
      group.add(createLink(from, to, 0xb9bfc9));
    }
  }
  return addPorts(group);
}

export function createBlock(type: BlockType, params: BlockParams): BlockInstance {
  if (type === 'source') {
    return addPorts(createSourceBlock(), { in: false, out: true });
  }
  if (type === 'sink') {
    return addPorts(createSinkBlock(), { in: true, out: false });
  }
  let group: THREE.Group;
  switch (type) {
    case 'array':
      group = createArrayBlock(params);
      break;
    case 'stack':
      group = createStackBlock(params);
      break;
    case 'queue':
      group = createQueueBlock(params);
      break;
    case 'linkedList':
      group = createLinkedListBlock(params);
      break;
    case 'hashMap':
      group = createHashMapBlock(params);
      break;
    case 'skipList':
      group = createSkipListBlock(params);
      break;
    case 'tree':
      group = createTreeBlock(params);
      break;
    case 'bTree':
      group = createBTreeBlock(params);
      break;
    case 'bPlusTree':
      group = createBPlusTreeBlock(params);
      break;
    case 'redBlackTree':
      group = createRedBlackTreeBlock(params);
      break;
    case 'bst':
      group = createBstBlock(params);
      break;
    case 'avlTree':
      group = createAvlTreeBlock(params);
      break;
    case 'deque':
      group = createDequeBlock(params);
      break;
    case 'circularQueue':
      group = createCircularQueueBlock(params);
      break;
    case 'trie':
      group = createTrieBlock(params);
      break;
    case 'unionFind':
      group = createUnionFindBlock(params);
      break;
    case 'heap':
      group = createHeapBlock(params);
      break;
    case 'graph':
      group = createGraphBlock(params);
      break;
    case 'composite':
      return createCompositeBlock({ name: '复合组件', blocks: [], links: [], expanded: false });
  }
  return addPorts(group);
}
