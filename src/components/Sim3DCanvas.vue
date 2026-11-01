<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, watch } from 'vue';
import * as THREE from 'three';
import { createScene3D } from '../three/scene';
import type { Scene3D } from '../three/scene';
import { createBlock, createCompositeBlock, DEFAULT_PARAMS, BLOCK_INFO } from '../three/blocks';
import type { BlockParams, BlockType } from '../three/blocks';
import { RECIPES } from '../three/recipe';
import type { Recipe } from '../three/recipe';
import { createDataLink } from '../three/link';
import type { DataLink } from '../three/link';

const props = defineProps<{ running: boolean }>();
const emit = defineEmits<{
  select: [payload: { id: number; type: BlockType; params: BlockParams } | null];
  'link-select': [mode: 'transfer' | 'store' | null];
  log: [events: ValueEvent[]];
  clock: [step: number];
}>();

interface ValueEvent {
  time: number;
  op: string;
  value: number;
  blockName: string;
}
const valueLog: ValueEvent[] = [];

const container = ref<HTMLDivElement | null>(null);
const tooltipVisible = ref(false);
const tooltipText = ref('');
const tooltipLeft = ref(0);
const tooltipTop = ref(0);
let scene3d: Scene3D | null = null;
let raycaster: THREE.Raycaster | null = null;
let pointer = new THREE.Vector2();
let nextId = 1;

interface SceneBlock {
  id: number;
  type: BlockType;
  params: BlockParams;
  group: THREE.Group;
  inTransit: number;
  values: number[];
  skipLevels: number[];
}

interface PortEntry {
  mesh: THREE.Mesh;
  kind: 'in' | 'out';
  blockId: number;
}

interface SceneLink {
  fromBlockId: number;
  toBlockId: number;
  mode: 'transfer' | 'store';
  data: DataLink | null;
  group: THREE.Group | null;
  cleanup: (() => void) | null;
}

const blocks: SceneBlock[] = [];
const ports: PortEntry[] = [];
const links: SceneLink[] = [];

let dragMode: 'none' | 'line' | 'block' | 'select' = 'none';
let dragBlockId: number | null = null;
let dragFromPos: THREE.Vector3 | null = null;
let tempLine: THREE.Line | null = null;
let pointerDownPos: { x: number; y: number } | null = null;
let selectedId: number | null = null;
let selectedLink: SceneLink | null = null;
let selectionBox: THREE.LineLoop | null = null;
const congestionBoxes = new Map<number, THREE.LineLoop>();
let congestionPulse = 0;
let simTimer: number | null = null;
let simStepCount = 0;
let hoverBlockId: number | null = null;
const selectedIds = new Set<number>();
const selectedBoxes = new Map<number, THREE.LineLoop>();
let selectStart: { x: number; y: number } | null = null;
let selectCurrent: { x: number; y: number } | null = null;
const selectRect = ref<{ left: number; top: number; width: number; height: number } | null>(null);
const recipeMap = new Map<number, Recipe>();

interface ExpandedState {
  position: THREE.Vector3;
  recipe: Recipe;
  innerIds: number[];
  innerLinks: SceneLink[];
  inLinks: SceneLink[];
  outLinks: SceneLink[];
}
const expandedMap = new Map<number, ExpandedState>();

const dragPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);

function addBlock(type: BlockType): void {
  const index = blocks.length;
  const col = index % 3;
  const row = Math.floor(index / 3);
  const id = addBlockAt(type, new THREE.Vector3(-3.5 + col * 3.5, 0, -2.5 + row * 3.5));
  if (id >= 0) {
    setSelected(id);
  }
}

function shuffledRange(count: number): number[] {
  const arr: number[] = [];
  for (let i = 1; i <= count; i += 1) {
    arr.push(i);
  }
  for (let i = arr.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function addBlockAt(type: BlockType, position: THREE.Vector3): number {
  if (scene3d === null) {
    return -1;
  }
  const instance = createBlock(type, { ...DEFAULT_PARAMS[type] });
  const block: SceneBlock = {
    id: nextId,
    type,
    params: { ...DEFAULT_PARAMS[type] },
    group: instance.group,
    inTransit: 0,
    values: type === 'source' ? shuffledRange(100) : [],
    skipLevels: [],
  };
  nextId += 1;
  block.group.position.copy(position);
  scene3d.scene.add(block.group);
  blocks.push(block);
  registerPorts(block);
  return block.id;
}

function addCompositeBlock(recipe: Recipe, position?: THREE.Vector3): number {
  if (scene3d === null) {
    return -1;
  }
  let pos = position;
  if (pos === undefined) {
    const index = blocks.length;
    const col = index % 3;
    const row = Math.floor(index / 3);
    pos = new THREE.Vector3(-3.5 + col * 3.5, 0, -2.5 + row * 3.5);
  }
  const capacity = recipe.blocks.reduce((sum, b) => sum + b.params.capacity, 0);
  const instance = createCompositeBlock({
    name: recipe.name,
    blocks: recipe.blocks,
    links: recipe.links,
    expanded: false,
    shape: recipe.shape,
  });
  const block: SceneBlock = {
    id: nextId,
    type: 'composite',
    params: { capacity, filled: 0 },
    group: instance.group,
    inTransit: 0,
    values: [],
    skipLevels: [],
  };
  nextId += 1;
  block.group.position.copy(pos);
  scene3d.scene.add(block.group);
  blocks.push(block);
  registerPorts(block);
  recipeMap.set(block.id, recipe);
  return block.id;
}

function registerPorts(block: SceneBlock): void {
  for (let i = ports.length - 1; i >= 0; i -= 1) {
    if (ports[i].blockId === block.id) {
      ports.splice(i, 1);
    }
  }
  block.group.traverse((obj) => {
    if (obj instanceof THREE.Mesh && obj.userData.portKind !== undefined) {
      ports.push({ mesh: obj, kind: obj.userData.portKind as 'in' | 'out', blockId: block.id });
    }
  });
}

function rebuildBlock(block: SceneBlock): void {
  if (scene3d === null) {
    return;
  }
  const position = block.group.position.clone();
  scene3d.scene.remove(block.group);
  const instance = createBlock(block.type, {
    capacity: block.params.capacity,
    filled: block.params.filled,
    values: block.values,
    skipLevels: block.skipLevels,
  });
  block.group = instance.group;
  block.group.position.copy(position);
  scene3d.scene.add(block.group);
  registerPorts(block);
}

function updateBlock(id: number, params: BlockParams): void {
  const block = blocks.find((b) => b.id === id);
  if (block === undefined) {
    return;
  }
  block.params.capacity = params.capacity;
  block.params.speed = params.speed;
  rebuildBlock(block);
  setSelected(id);
}

function refreshBlocks(): void {
  for (const block of blocks) {
    rebuildBlock(block);
  }
  if (selectedId !== null) {
    setSelected(selectedId);
  }
}

function findPort(blockId: number, kind: 'in' | 'out'): THREE.Mesh | null {
  const entry = ports.find((p) => p.blockId === blockId && p.kind === kind);
  return entry?.mesh ?? null;
}

function pickPort(event: PointerEvent): PortEntry | null {
  if (scene3d === null || raycaster === null) {
    return null;
  }
  updatePointer(event);
  raycaster.setFromCamera(pointer, scene3d.camera);
  const meshes = ports.map((p) => p.mesh);
  const hits = raycaster.intersectObjects(meshes, false);
  if (hits.length === 0) {
    return null;
  }
  return ports.find((p) => p.mesh === hits[0].object) ?? null;
}

function pickBlock(event: PointerEvent): number | null {
  if (scene3d === null || raycaster === null) {
    return null;
  }
  updatePointer(event);
  raycaster.setFromCamera(pointer, scene3d.camera);
  const meshes: THREE.Mesh[] = [];
  const meshToBlockId = new Map<THREE.Mesh, number>();
  for (const block of blocks) {
    block.group.traverse((obj) => {
      if (obj instanceof THREE.Mesh) {
        meshes.push(obj);
        meshToBlockId.set(obj, block.id);
      }
    });
  }
  const hits = raycaster.intersectObjects(meshes, false);
  if (hits.length === 0) {
    return null;
  }
  return meshToBlockId.get(hits[0].object as THREE.Mesh) ?? null;
}

function pickLink(event: PointerEvent): SceneLink | null {
  if (scene3d === null || raycaster === null) {
    return null;
  }
  updatePointer(event);
  raycaster.setFromCamera(pointer, scene3d.camera);
  const meshes: THREE.Mesh[] = [];
  const meshToLink = new Map<THREE.Mesh, SceneLink>();
  for (const link of links) {
    if (link.group !== null) {
      link.group.traverse((obj) => {
        if (obj instanceof THREE.Mesh) {
          meshes.push(obj);
          meshToLink.set(obj, link);
        }
      });
    }
  }
  const hits = raycaster.intersectObjects(meshes, false);
  if (hits.length === 0) {
    return null;
  }
  return meshToLink.get(hits[0].object as THREE.Mesh) ?? null;
}

function setSelectedLink(link: SceneLink | null): void {
  if (selectedLink !== null) {
    selectedLink.data?.setHighlight(false);
  }
  selectedLink = link;
  if (link !== null) {
    link.data?.setHighlight(true);
    emit('link-select', link.mode);
  } else {
    emit('link-select', null);
  }
}

function setLinkMode(mode: 'transfer' | 'store'): void {
  if (selectedLink !== null) {
    selectedLink.mode = mode;
    selectedLink.data?.setStore(mode === 'store');
  }
}

function removeLink(link: SceneLink): void {
  link.cleanup?.();
  if (link.group !== null && scene3d !== null) {
    scene3d.scene.remove(link.group);
  }
  const index = links.indexOf(link);
  if (index >= 0) {
    links.splice(index, 1);
  }
}

function deleteBlock(id: number): void {
  if (scene3d === null) {
    return;
  }
  const related = links.filter((l) => l.fromBlockId === id || l.toBlockId === id);
  for (const link of related) {
    if (link === selectedLink) {
      selectedLink = null;
    }
    removeLink(link);
  }
  const block = blocks.find((b) => b.id === id);
  if (block === undefined) {
    return;
  }
  scene3d.scene.remove(block.group);
  const index = blocks.indexOf(block);
  if (index >= 0) {
    blocks.splice(index, 1);
  }
  for (let i = ports.length - 1; i >= 0; i -= 1) {
    if (ports[i].blockId === id) {
      ports.splice(i, 1);
    }
  }
  setSelected(null);
}

/** 把框选中的积木打包成复合组件，返回配方 */
function packSelected(name: string): Recipe | null {
  if (scene3d === null || selectedIds.size < 2) {
    return null;
  }
  const selected = blocks.filter((b) => selectedIds.has(b.id));
  const idSet = new Set(selected.map((b) => b.id));
  const internalLinks = links.filter((l) => idSet.has(l.fromBlockId) && idSet.has(l.toBlockId));
  const indexMap = new Map<number, number>();
  selected.forEach((b, i) => indexMap.set(b.id, i));
  const recipeBlocks = selected.map((b) => ({ type: b.type, params: { ...b.params } }));
  const recipeLinks = internalLinks.map((l) => ({
    from: indexMap.get(l.fromBlockId) ?? 0,
    to: indexMap.get(l.toBlockId) ?? 0,
    mode: l.mode,
  }));
  const inBlock = selected.find((b) => !internalLinks.some((l) => l.toBlockId === b.id));
  const outBlock = selected.find((b) => !internalLinks.some((l) => l.fromBlockId === b.id));
  const recipe: Recipe = {
    name,
    blocks: recipeBlocks,
    links: recipeLinks,
    inPort: inBlock !== undefined ? indexMap.get(inBlock.id) ?? 0 : 0,
    outPort: outBlock !== undefined ? indexMap.get(outBlock.id) ?? 0 : 0,
  };
  const center = new THREE.Vector3();
  for (const b of selected) {
    center.add(b.group.position);
  }
  center.divideScalar(selected.length);
  for (const link of [...links]) {
    if (idSet.has(link.fromBlockId) || idSet.has(link.toBlockId)) {
      if (link === selectedLink) {
        selectedLink = null;
      }
      removeLink(link);
    }
  }
  for (const b of selected) {
    scene3d.scene.remove(b.group);
    const idx = blocks.indexOf(b);
    if (idx >= 0) {
      blocks.splice(idx, 1);
    }
    for (let i = ports.length - 1; i >= 0; i -= 1) {
      if (ports[i].blockId === b.id) {
        ports.splice(i, 1);
      }
    }
  }
  clearMultiSelect();
  const id = addCompositeBlock(recipe, center);
  if (id >= 0) {
    setSelected(id);
  }
  return recipe;
}

function onKeyDown(event: KeyboardEvent): void {
  if (event.key !== 'Delete' && event.key !== 'Backspace') {
    return;
  }
  if (selectedLink !== null) {
    removeLink(selectedLink);
    selectedLink = null;
    return;
  }
  if (selectedId !== null) {
    deleteBlock(selectedId);
  }
}

function onDblClick(event: MouseEvent): void {
  if (scene3d === null || raycaster === null) {
    return;
  }
  const rect = scene3d.renderer.domElement.getBoundingClientRect();
  pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
  pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
  raycaster.setFromCamera(pointer, scene3d.camera);
  const meshes: THREE.Mesh[] = [];
  const meshToBlockId = new Map<THREE.Mesh, number>();
  for (const block of blocks) {
    block.group.traverse((obj) => {
      if (obj instanceof THREE.Mesh) {
        meshes.push(obj);
        meshToBlockId.set(obj, block.id);
      }
    });
  }
  const hits = raycaster.intersectObjects(meshes, false);
  if (hits.length === 0) {
    return;
  }
  const blockId = meshToBlockId.get(hits[0].object as THREE.Mesh);
  if (blockId === undefined) {
    return;
  }
  const block = blocks.find((b) => b.id === blockId);
  if (block === undefined) {
    return;
  }
  if (block.type === 'composite') {
    toggleExpand(block.id);
    return;
  }
  // 命中展开态的内部积木 → 折叠对应复合组件
  for (const [compositeId, state] of expandedMap) {
    if (state.innerIds.includes(blockId)) {
      collapseComposite(compositeId);
      return;
    }
  }
}

/** 展开/折叠复合组件（展开时内部积木+连线缩放展示在盒内） */
function removeBlockFromArrays(block: SceneBlock): void {
  const idx = blocks.indexOf(block);
  if (idx >= 0) {
    blocks.splice(idx, 1);
  }
  for (let i = ports.length - 1; i >= 0; i -= 1) {
    if (ports[i].blockId === block.id) {
      ports.splice(i, 1);
    }
  }
}

function toggleExpand(blockId: number): void {
  if (expandedMap.has(blockId)) {
    collapseComposite(blockId);
  } else {
    expandComposite(blockId);
  }
}

/** 就地展开：黑盒替换为正常大小的内部积木 */
function expandComposite(blockId: number): void {
  const block = blocks.find((b) => b.id === blockId);
  const recipe = recipeMap.get(blockId);
  if (block === undefined || recipe === undefined || scene3d === null) {
    return;
  }
  const position = block.group.position.clone();
  const inLinks = links.filter((l) => l.toBlockId === blockId);
  const outLinks = links.filter((l) => l.fromBlockId === blockId);
  scene3d.scene.remove(block.group);
  removeBlockFromArrays(block);

  const spacing = 3.2;
  const startX = position.x - ((recipe.blocks.length - 1) * spacing) / 2;
  const innerIds: number[] = [];
  recipe.blocks.forEach((rb, i) => {
    const id = addBlockAt(rb.type, new THREE.Vector3(startX + i * spacing, 0, position.z));
    innerIds.push(id);
  });
  const innerLinks: SceneLink[] = [];
  for (const l of recipe.links) {
    addLink(innerIds[l.from], innerIds[l.to], l.mode ?? 'transfer');
    innerLinks.push(links[links.length - 1]);
  }
  const inPortId = innerIds[recipe.inPort];
  const outPortId = innerIds[recipe.outPort];
  for (const l of inLinks) {
    l.toBlockId = inPortId;
  }
  for (const l of outLinks) {
    l.fromBlockId = outPortId;
  }
  expandedMap.set(blockId, { position, recipe, innerIds, innerLinks, inLinks, outLinks });
  clearSelectionBox();
  setSelected(null);
}

/** 折叠：内部积木移除，恢复黑盒 */
function collapseComposite(blockId: number): void {
  const state = expandedMap.get(blockId);
  if (state === undefined || scene3d === null) {
    return;
  }
  expandedMap.delete(blockId);
  for (const id of state.innerIds) {
    const b = blocks.find((x) => x.id === id);
    if (b !== undefined) {
      scene3d.scene.remove(b.group);
      removeBlockFromArrays(b);
    }
  }
  for (const l of state.innerLinks) {
    removeLink(l);
  }
  const newId = addCompositeBlock(state.recipe, state.position);
  for (const l of state.inLinks) {
    l.toBlockId = newId;
  }
  for (const l of state.outLinks) {
    l.fromBlockId = newId;
  }
  clearSelectionBox();
  setSelected(newId);
}

function updatePointer(event: PointerEvent): void {
  if (scene3d === null) {
    return;
  }
  const rect = scene3d.renderer.domElement.getBoundingClientRect();
  pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
  pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
}

function raycastToPlane(event: PointerEvent): THREE.Vector3 | null {
  if (scene3d === null || raycaster === null) {
    return null;
  }
  updatePointer(event);
  raycaster.setFromCamera(pointer, scene3d.camera);
  const target = new THREE.Vector3();
  return raycaster.ray.intersectPlane(dragPlane, target);
}

function raycastToClient(clientX: number, clientY: number): THREE.Vector3 | null {
  if (scene3d === null || raycaster === null) {
    return null;
  }
  const rect = scene3d.renderer.domElement.getBoundingClientRect();
  pointer.x = ((clientX - rect.left) / rect.width) * 2 - 1;
  pointer.y = -((clientY - rect.top) / rect.height) * 2 + 1;
  raycaster.setFromCamera(pointer, scene3d.camera);
  const target = new THREE.Vector3();
  return raycaster.ray.intersectPlane(dragPlane, target);
}

function onDrop(event: DragEvent): void {
  const data = event.dataTransfer?.getData('text/plain');
  if (data === undefined || data === '') {
    return;
  }
  const point = raycastToClient(event.clientX, event.clientY);
  if (point === null) {
    return;
  }
  if (data.startsWith('recipe:')) {
    const name = data.slice('recipe:'.length);
    const recipe = RECIPES.find((r) => r.name === name);
    if (recipe !== undefined) {
      const id = addCompositeBlock(recipe, point);
      if (id >= 0) {
        setSelected(id);
      }
    }
    return;
  }
  const id = addBlockAt(data as BlockType, point);
  if (id >= 0) {
    setSelected(id);
  }
}

function onPointerDown(event: PointerEvent): void {
  pointerDownPos = { x: event.clientX, y: event.clientY };
  const port = pickPort(event);
  if (port !== null) {
    if (port.kind === 'out') {
      dragMode = 'line';
      dragFromPos = port.mesh.getWorldPosition(new THREE.Vector3());
      dragBlockId = port.blockId;
      createTempLine(dragFromPos);
      if (scene3d !== null) {
        scene3d.controls.enabled = false;
      }
    }
    return;
  }
  const blockId = pickBlock(event);
  if (blockId !== null) {
    dragMode = 'block';
    dragBlockId = blockId;
    if (scene3d !== null) {
      scene3d.controls.enabled = false;
    }
    return;
  }
  // 空白：开始框选
  dragMode = 'select';
  selectStart = { x: event.clientX, y: event.clientY };
  selectCurrent = { x: event.clientX, y: event.clientY };
  if (scene3d !== null) {
    scene3d.controls.enabled = false;
  }
}

function onPointerMove(event: PointerEvent): void {
  if (dragMode === 'line') {
    if (dragFromPos === null || tempLine === null) {
      return;
    }
    const point = raycastToPlane(event);
    if (point === null) {
      return;
    }
    const positions = tempLine.geometry.getAttribute('position') as THREE.BufferAttribute;
    positions.setXYZ(1, point.x, point.y, point.z);
    positions.needsUpdate = true;
    showTooltip(event, '拖到蓝色端口松手连接');
  } else if (dragMode === 'block') {
    if (dragBlockId === null) {
      return;
    }
    const block = blocks.find((b) => b.id === dragBlockId);
    const point = raycastToPlane(event);
    if (block === undefined || point === null) {
      return;
    }
    block.group.position.x = point.x;
    block.group.position.z = point.z;
    if (selectionBox !== null) {
      selectionBox.position.copy(block.group.position);
    }
    const congestionBox = congestionBoxes.get(dragBlockId);
    if (congestionBox !== undefined) {
      congestionBox.position.copy(block.group.position);
    }
  } else if (dragMode === 'select') {
    selectCurrent = { x: event.clientX, y: event.clientY };
    updateSelectRect();
  } else {
    updateHover(event);
  }
}

function onPointerUp(event: PointerEvent): void {
  const moved =
    pointerDownPos !== null &&
    (Math.abs(event.clientX - pointerDownPos.x) > 4 ||
      Math.abs(event.clientY - pointerDownPos.y) > 4);

  if (dragMode === 'line') {
    if (dragBlockId !== null && dragFromPos !== null) {
      const port = pickPort(event);
      if (port !== null && port.kind === 'in' && port.blockId !== dragBlockId) {
        addLink(dragBlockId, port.blockId);
      }
    }
    cancelDragLine();
  } else if (dragMode === 'block') {
    if (!moved) {
      setSelected(dragBlockId);
    }
  } else if (dragMode === 'select') {
    if (moved) {
      applySelectRect();
    } else {
      const link = pickLink(event);
      if (link !== null) {
        setSelected(null);
        setSelectedLink(link);
      } else {
        clearMultiSelect();
        setSelected(null);
        setSelectedLink(null);
      }
    }
    selectRect.value = null;
  }

  dragMode = 'none';
  dragBlockId = null;
  dragFromPos = null;
  if (scene3d !== null) {
    scene3d.controls.enabled = true;
  }
}

function setSelected(blockId: number | null): void {
  selectedId = blockId;
  clearSelectionBox();
  if (blockId === null || scene3d === null) {
    emit('select', null);
    return;
  }
  const block = blocks.find((b) => b.id === blockId);
  if (block === undefined) {
    emit('select', null);
    return;
  }
  const w = (block.group.userData.width as number | undefined) ?? 4;
  const d = (block.group.userData.depth as number | undefined) ?? 2;
  const halfW = w / 2 + 0.35;
  const halfD = d / 2 + 0.35;
  const points = [
    new THREE.Vector3(-halfW, 0.06, -halfD),
    new THREE.Vector3(halfW, 0.06, -halfD),
    new THREE.Vector3(halfW, 0.06, halfD),
    new THREE.Vector3(-halfW, 0.06, halfD),
    new THREE.Vector3(-halfW, 0.06, -halfD),
  ];
  const geo = new THREE.BufferGeometry().setFromPoints(points);
  selectionBox = new THREE.LineLoop(geo, new THREE.LineBasicMaterial({ color: 0x4f7cff }));
  selectionBox.position.copy(block.group.position);
  scene3d.scene.add(selectionBox);
  emit('select', { id: block.id, type: block.type, params: { ...block.params } });
}

function clearSelectionBox(): void {
  if (selectionBox !== null && scene3d !== null) {
    scene3d.scene.remove(selectionBox);
    selectionBox.geometry.dispose();
    (selectionBox.material as THREE.Material).dispose();
    selectionBox = null;
  }
}

function updateSelectRect(): void {
  if (selectStart === null || selectCurrent === null || container.value === null) {
    return;
  }
  const rect = container.value.getBoundingClientRect();
  selectRect.value = {
    left: Math.min(selectStart.x, selectCurrent.x) - rect.left,
    top: Math.min(selectStart.y, selectCurrent.y) - rect.top,
    width: Math.abs(selectCurrent.x - selectStart.x),
    height: Math.abs(selectCurrent.y - selectStart.y),
  };
}

function applySelectRect(): void {
  if (selectStart === null || selectCurrent === null) {
    return;
  }
  const pMin = raycastToClient(
    Math.min(selectStart.x, selectCurrent.x),
    Math.min(selectStart.y, selectCurrent.y),
  );
  const pMax = raycastToClient(
    Math.max(selectStart.x, selectCurrent.x),
    Math.max(selectStart.y, selectCurrent.y),
  );
  if (pMin === null || pMax === null) {
    return;
  }
  const wxMin = Math.min(pMin.x, pMax.x);
  const wxMax = Math.max(pMin.x, pMax.x);
  const wzMin = Math.min(pMin.z, pMax.z);
  const wzMax = Math.max(pMin.z, pMax.z);
  clearMultiSelect();
  for (const block of blocks) {
    const p = block.group.position;
    if (p.x >= wxMin && p.x <= wxMax && p.z >= wzMin && p.z <= wzMax) {
      selectedIds.add(block.id);
    }
  }
  refreshMultiSelectBoxes();
}

function refreshMultiSelectBoxes(): void {
  for (const box of selectedBoxes.values()) {
    if (scene3d !== null) {
      scene3d.scene.remove(box);
      box.geometry.dispose();
      (box.material as THREE.Material).dispose();
    }
  }
  selectedBoxes.clear();
  for (const id of selectedIds) {
    const block = blocks.find((b) => b.id === id);
    if (block === undefined || scene3d === null) {
      continue;
    }
    const w = (block.group.userData.width as number | undefined) ?? 4;
    const d = (block.group.userData.depth as number | undefined) ?? 2;
    const halfW = w / 2 + 0.35;
    const halfD = d / 2 + 0.35;
    const points = [
      new THREE.Vector3(-halfW, 0.06, -halfD),
      new THREE.Vector3(halfW, 0.06, -halfD),
      new THREE.Vector3(halfW, 0.06, halfD),
      new THREE.Vector3(-halfW, 0.06, halfD),
      new THREE.Vector3(-halfW, 0.06, -halfD),
    ];
    const geo = new THREE.BufferGeometry().setFromPoints(points);
    const box = new THREE.LineLoop(geo, new THREE.LineBasicMaterial({ color: 0x52c41a }));
    box.position.copy(block.group.position);
    scene3d.scene.add(box);
    selectedBoxes.set(id, box);
  }
}

function clearMultiSelect(): void {
  selectedIds.clear();
  refreshMultiSelectBoxes();
}

function showCongestionBox(block: SceneBlock): void {
  if (congestionBoxes.has(block.id) || scene3d === null) {
    return;
  }
  const w = (block.group.userData.width as number | undefined) ?? 4;
  const d = (block.group.userData.depth as number | undefined) ?? 2;
  const halfW = w / 2 + 0.35;
  const halfD = d / 2 + 0.35;
  const points = [
    new THREE.Vector3(-halfW, 0.06, -halfD),
    new THREE.Vector3(halfW, 0.06, -halfD),
    new THREE.Vector3(halfW, 0.06, halfD),
    new THREE.Vector3(-halfW, 0.06, halfD),
    new THREE.Vector3(-halfW, 0.06, -halfD),
  ];
  const geo = new THREE.BufferGeometry().setFromPoints(points);
  const box = new THREE.LineLoop(
    geo,
    new THREE.LineBasicMaterial({ color: 0xff3b30, transparent: true, opacity: 0.8 }),
  );
  box.position.copy(block.group.position);
  scene3d.scene.add(box);
  congestionBoxes.set(block.id, box);
}

function hideCongestionBox(id: number): void {
  const box = congestionBoxes.get(id);
  if (box === undefined) {
    return;
  }
  if (scene3d !== null) {
    scene3d.scene.remove(box);
    box.geometry.dispose();
    (box.material as THREE.Material).dispose();
  }
  congestionBoxes.delete(id);
}

function updateCongestion(): void {
  const congested = new Set<number>();
  for (const link of links) {
    const from = blocks.find((b) => b.id === link.fromBlockId);
    const to = blocks.find((b) => b.id === link.toBlockId);
    if (from === undefined || to === undefined) {
      continue;
    }
    const hasData = from.type === 'source' || from.params.filled - from.inTransit > 0;
    const toFull = to.type === 'sink' ? false : to.params.filled >= to.params.capacity;
    if (hasData && toFull) {
      congested.add(from.id);
    }
  }
  for (const block of blocks) {
    if (congested.has(block.id)) {
      showCongestionBox(block);
    } else {
      hideCongestionBox(block.id);
    }
  }
}

function showTooltip(event: PointerEvent, text: string): void {
  tooltipText.value = text;
  tooltipVisible.value = true;
  const rect = container.value?.getBoundingClientRect();
  tooltipLeft.value = event.clientX - (rect?.left ?? 0) + 14;
  tooltipTop.value = event.clientY - (rect?.top ?? 0) + 14;
}

function updateHover(event: PointerEvent): void {
  const port = pickPort(event);
  if (port !== null) {
    setHoverBlock(port.blockId);
    showTooltip(event, port.kind === 'in' ? '输入端口 · 数据流入' : '输出端口 · 数据流出');
    return;
  }
  const blockId = pickBlock(event);
  if (blockId !== null) {
    setHoverBlock(blockId);
    const block = blocks.find((b) => b.id === blockId);
    if (block !== undefined) {
      const info = BLOCK_INFO[block.type];
      const congested = congestionBoxes.has(blockId);
      const extra = congested
        ? ' · ⚠️ 下游已满，滞涩'
        : ` · 当前 ${block.values.length} 个数据`;
      showTooltip(event, `${info.name} · ${info.description}${extra}`);
    }
    return;
  }
  setHoverBlock(null);
  tooltipVisible.value = false;
}

/** 悬浮积木时放大其端口，便于连线 */
function setHoverBlock(blockId: number | null): void {
  if (hoverBlockId === blockId) {
    return;
  }
  if (hoverBlockId !== null) {
    for (const port of ports) {
      if (port.blockId === hoverBlockId) {
        port.mesh.scale.setScalar(1);
      }
    }
  }
  hoverBlockId = blockId;
  if (blockId !== null) {
    for (const port of ports) {
      if (port.blockId === blockId) {
        port.mesh.scale.setScalar(1.8);
      }
    }
  }
}

function createTempLine(from: THREE.Vector3): void {
  if (scene3d === null) {
    return;
  }
  const geo = new THREE.BufferGeometry();
  const positions = new THREE.Float32BufferAttribute([from.x, from.y, from.z, from.x, from.y, from.z], 3);
  geo.setAttribute('position', positions);
  const mat = new THREE.LineBasicMaterial({ color: 0xff9c33, transparent: true, opacity: 0.8 });
  tempLine = new THREE.Line(geo, mat);
  scene3d.scene.add(tempLine);
}

function cancelDragLine(): void {
  if (tempLine !== null && scene3d !== null) {
    scene3d.scene.remove(tempLine);
    tempLine.geometry.dispose();
    (tempLine.material as THREE.Material).dispose();
  }
  tempLine = null;
}

function addLink(
  fromBlockId: number,
  toBlockId: number,
  mode: 'transfer' | 'store' = 'transfer',
): void {
  const link: SceneLink = { fromBlockId, toBlockId, mode, data: null, group: null, cleanup: null };
  links.push(link);
  createLinkData(link);
}

/** 创建连线数据（只创建一次，端点动态跟随端口） */
function createLinkData(link: SceneLink): void {
  if (scene3d === null || link.data !== null) {
    return;
  }
  const data = createDataLink(
    scene3d.scene,
    () => {
      const mesh = findPort(link.fromBlockId, 'out');
      return mesh !== null ? mesh.getWorldPosition(new THREE.Vector3()) : new THREE.Vector3(0, 0, 0);
    },
    () => {
      const mesh = findPort(link.toBlockId, 'in');
      return mesh !== null ? mesh.getWorldPosition(new THREE.Vector3()) : new THREE.Vector3(0, 0, 0);
    },
  );
  link.data = data;
  link.group = data.group;
  if (link.mode === 'store') {
    data.setStore(true);
  }
  link.cleanup = scene3d.onUpdate((dt) => {
    data.update(dt);
  });
}

// 数据流仿真
function startSim(): void {
  stopSim();
  simStepCount = 0;
  valueLog.length = 0;
  for (const block of blocks) {
    block.params.filled = 0;
    block.inTransit = 0;
    block.values = block.type === 'source' ? shuffledRange(100) : [];
  }
  refreshBlocks();
  simTimer = window.setInterval(simStep, 900);
}

function stopSim(): void {
  if (simTimer !== null) {
    window.clearInterval(simTimer);
    simTimer = null;
  }
}

function heapifyUp(values: number[]): void {
  let i = values.length - 1;
  while (i > 0) {
    const parent = Math.floor((i - 1) / 2);
    if (values[parent] >= values[i]) {
      break;
    }
    [values[parent], values[i]] = [values[i], values[parent]];
    i = parent;
  }
}

function insertSorted(values: number[], value: number): void {
  let i = values.length;
  while (i > 0 && values[i - 1] > value) {
    i -= 1;
  }
  values.splice(i, 0, value);
}

function randomLevel(maxLevel: number): number {
  let level = 0;
  while (level < maxLevel && Math.random() < 0.5) {
    level += 1;
  }
  return level;
}

/** 按结构语义插入数据 */
function insertValue(block: SceneBlock, value: number): void {
  switch (block.type) {
    case 'heap':
      block.values.push(value);
      heapifyUp(block.values); // 大顶堆上浮
      break;
    case 'skipList':
      insertSorted(block.values, value);
      block.skipLevels.push(randomLevel(2)); // 随机晋升
      break;
    case 'redBlackTree':
    case 'bst':
    case 'avlTree':
    case 'bTree':
    case 'bPlusTree':
      insertSorted(block.values, value); // 有序结构，插入保持升序
      break;
    default:
      block.values.push(value);
      break;
  }
}

/** 按结构语义取出数据 */
function extractValue(block: SceneBlock): number | undefined {
  if (block.type === 'stack') {
    return block.values.pop(); // LIFO
  }
  if (block.type === 'skipList') {
    block.skipLevels.shift();
  }
  return block.values.shift(); // FIFO / 堆顶 / 有序最小
}

function syncFilled(): void {
  for (const block of blocks) {
    block.params.filled =
      block.type === 'source'
        ? Math.min(block.params.capacity, block.values.length)
        : block.values.length;
  }
}

function addLog(op: string, value: number, blockName: string): void {
  valueLog.push({ time: simStepCount, op, value, blockName });
  emit('log', valueLog.slice());
}

function blockLabel(block: SceneBlock): string {
  if (block.type === 'composite') {
    return (block.group.userData.compositeName as string | undefined) ?? '复合组件';
  }
  return BLOCK_INFO[block.type].name;
}

function simStep(): void {
  simStepCount += 1;
  emit('clock', simStepCount);
  for (const link of links) {
    const data = link.data;
    if (data === null) {
      continue;
    }
    if (data.isBusy()) {
      continue; // 上一条还没走完
    }
    const from = blocks.find((b) => b.id === link.fromBlockId);
    const to = blocks.find((b) => b.id === link.toBlockId);
    if (from === undefined || to === undefined) {
      continue;
    }
    let hasData: boolean;
    if (from.type === 'source') {
      const speed = from.params.speed ?? 1;
      hasData = from.values.length > 0 && simStepCount % speed === 0;
    } else {
      const isStoreTarget = links.some((l) => l.toBlockId === from.id && l.mode === 'store');
      hasData = from.values.length - from.inTransit > 0 && !isStoreTarget;
    }
    const toFull = to.type === 'sink' ? false : to.values.length >= to.params.capacity;
    if (!hasData || toFull) {
      continue; // 无数据或下游满，滞涩
    }
    const value = extractValue(from);
    if (value === undefined) {
      continue;
    }
    if (from.type === 'source') {
      addLog('emit', value, '源节点');
    } else {
      addLog('dequeue', value, blockLabel(from));
    }
    from.inTransit += 1;
    data.startTransfer(() => {
      from.inTransit -= 1;
      insertValue(to, value);
      if (to.type === 'sink') {
        addLog('receive', value, '汇节点');
      } else {
        addLog('enqueue', value, blockLabel(to));
      }
      syncFilled();
      refreshBlocks();
    });
  }
  syncFilled();
  refreshBlocks();
  updateCongestion();
}

watch(
  () => props.running,
  (running) => {
    if (running) {
      startSim();
    } else {
      stopSim();
    }
  },
);

onMounted(() => {
  if (container.value === null) {
    return;
  }
  scene3d = createScene3D(container.value);
  raycaster = new THREE.Raycaster();
  scene3d.onUpdate((dt) => {
    congestionPulse += dt;
    for (const box of congestionBoxes.values()) {
      const mat = box.material as THREE.LineBasicMaterial;
      mat.opacity = 0.4 + 0.6 * Math.abs(Math.sin(congestionPulse * 6));
    }
  });

  const el = scene3d.renderer.domElement;
  el.addEventListener('pointerdown', onPointerDown);
  el.addEventListener('pointermove', onPointerMove);
  el.addEventListener('pointerup', onPointerUp);
  window.addEventListener('keydown', onKeyDown);
  el.addEventListener('dblclick', onDblClick);

  addBlockAt('source', new THREE.Vector3(-3.5, 0, -2.5));
  addBlockAt('queue', new THREE.Vector3(0, 0, -2.5));
  addBlockAt('sink', new THREE.Vector3(3.5, 0, -2.5));
  addLink(1, 2);
  addLink(2, 3);
});

onBeforeUnmount(() => {
  stopSim();
  window.removeEventListener('keydown', onKeyDown);
  scene3d?.renderer.domElement.removeEventListener('dblclick', onDblClick);
  for (const link of links) {
    link.cleanup?.();
  }
  cancelDragLine();
  clearSelectionBox();
  for (const id of Array.from(congestionBoxes.keys())) {
    hideCongestionBox(id);
  }
  scene3d?.dispose();
  scene3d = null;
});

defineExpose({ addBlock, updateBlock, addCompositeBlock, packSelected, setLinkMode });
</script>

<template>
  <div ref="container" class="sim3d-canvas" @dragover.prevent @drop="onDrop">
    <div
      v-show="tooltipVisible"
      class="tooltip"
      :style="{ left: tooltipLeft + 'px', top: tooltipTop + 'px' }"
    >
      {{ tooltipText }}
    </div>
    <div
      v-if="selectRect !== null"
      class="select-rect"
      :style="{
        left: selectRect.left + 'px',
        top: selectRect.top + 'px',
        width: selectRect.width + 'px',
        height: selectRect.height + 'px',
      }"
    ></div>
  </div>
</template>

<style scoped>
.sim3d-canvas {
  position: relative;
  width: 100%;
  height: 100%;
  min-width: 0;
}

.tooltip {
  position: absolute;
  pointer-events: none;
  background: rgba(26, 29, 38, 0.92);
  color: #ffffff;
  padding: 6px 10px;
  border-radius: 6px;
  font-size: 12px;
  white-space: nowrap;
  z-index: 10;
}

.select-rect {
  position: absolute;
  pointer-events: none;
  border: 1px dashed #4f7cff;
  background: rgba(79, 124, 255, 0.08);
  z-index: 9;
}
</style>
