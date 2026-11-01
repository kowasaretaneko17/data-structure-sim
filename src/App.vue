<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue';
import Sim3DCanvas from './components/Sim3DCanvas.vue';
import { BLOCK_INFO, PARAM_META } from './three/blocks';
import type { BlockParams, BlockType } from './three/blocks';
import { RECIPES } from './three/recipe';
import type { Recipe } from './three/recipe';

const running = ref(false);
const canvasRef = ref<InstanceType<typeof Sim3DCanvas> | null>(null);
const selectedBlock = ref<{ id: number; type: BlockType; params: BlockParams } | null>(null);
const recipes = ref<Recipe[]>([...RECIPES]);
const selectedLinkMode = ref<'transfer' | 'store' | null>(null);

interface ValueEvent {
  time: number;
  op: string;
  value: number;
  blockName: string;
}
const valueLog = ref<ValueEvent[]>([]);
const clockStep = ref(0);
const logListRef = ref<HTMLDivElement | null>(null);

const OP_LABELS: Record<string, string> = {
  emit: '投递',
  enqueue: '入队',
  dequeue: '出队',
  receive: '接收',
};

watch(valueLog, async () => {
  await nextTick();
  const el = logListRef.value;
  if (el !== null) {
    el.scrollTop = el.scrollHeight;
  }
});

const meta = computed(() =>
  selectedBlock.value === null ? null : PARAM_META[selectedBlock.value.type],
);

const BLOCKS: ReadonlyArray<{ key: BlockType; name: string; icon: string }> = [
  { key: 'source', name: '源节点', icon: '📤' },
  { key: 'sink', name: '汇节点', icon: '📥' },
  { key: 'array', name: '数组', icon: '🔢' },
  { key: 'stack', name: '栈', icon: '📚' },
  { key: 'queue', name: '队列', icon: '🚶' },
  { key: 'linkedList', name: '链表', icon: '🔗' },
  { key: 'hashMap', name: '哈希表', icon: '🗂️' },
  { key: 'skipList', name: '跳表', icon: '⛷️' },
  { key: 'tree', name: '树', icon: '🌳' },
  { key: 'bTree', name: 'B树', icon: '🅱️' },
  { key: 'bPlusTree', name: 'B+树', icon: '➕' },
  { key: 'redBlackTree', name: '红黑树', icon: '🔴' },
  { key: 'bst', name: '二叉搜索树', icon: '🌲' },
  { key: 'avlTree', name: 'AVL 树', icon: '⚖️' },
  { key: 'deque', name: '双端队列', icon: '↔️' },
  { key: 'circularQueue', name: '循环队列', icon: '🔄' },
  { key: 'trie', name: '字典树', icon: '🔤' },
  { key: 'unionFind', name: '并查集', icon: '👥' },
  { key: 'heap', name: '堆', icon: '⛰️' },
  { key: 'graph', name: '图', icon: '🕸️' },
];

function toggleRun(): void {
  running.value = !running.value;
}

function onDragStart(event: DragEvent, key: BlockType): void {
  if (event.dataTransfer !== null) {
    event.dataTransfer.setData('text/plain', key);
    event.dataTransfer.effectAllowed = 'copy';
  }
}

function addBlock(key: BlockType): void {
  canvasRef.value?.addBlock(key);
}

function onDragComposite(event: DragEvent, name: string): void {
  if (event.dataTransfer !== null) {
    event.dataTransfer.setData('text/plain', `recipe:${name}`);
    event.dataTransfer.effectAllowed = 'copy';
  }
}

function addComposite(name: string): void {
  const recipe = recipes.value.find((r) => r.name === name);
  if (recipe !== undefined) {
    canvasRef.value?.addCompositeBlock(recipe);
  }
}

function pack(): void {
  const name = window.prompt('组件名称:', '我的组件');
  if (name === null || name === '') {
    return;
  }
  const recipe = canvasRef.value?.packSelected(name);
  if (recipe !== null && recipe !== undefined) {
    recipes.value.push(recipe);
  }
}

function onSelect(payload: { id: number; type: BlockType; params: BlockParams } | null): void {
  selectedBlock.value = payload === null ? null : { ...payload, params: { ...payload.params } };
  if (payload !== null) {
    selectedLinkMode.value = null;
  }
}

function onLinkSelect(mode: 'transfer' | 'store' | null): void {
  selectedLinkMode.value = mode;
  if (mode !== null) {
    selectedBlock.value = null;
  }
}

function setLinkMode(mode: 'transfer' | 'store'): void {
  selectedLinkMode.value = mode;
  canvasRef.value?.setLinkMode(mode);
}

function onLog(events: ValueEvent[]): void {
  valueLog.value = events;
}

function onClock(step: number): void {
  clockStep.value = step;
}

function applyParams(): void {
  if (selectedBlock.value === null) {
    return;
  }
  canvasRef.value?.updateBlock(selectedBlock.value.id, { ...selectedBlock.value.params });
}
</script>

<template>
  <main class="app">
    <header class="toolbar">
      <h1>数据结构 3D 仿真</h1>
      <button class="run-btn" @click="toggleRun">{{ running ? '⏸ 停止' : '▶ 运行' }}</button>
      <button class="pack-btn" @click="pack">📦 打包</button>
      <span class="clock">⏱ 步 {{ clockStep }}</span>
      <span class="hint">拖积木入场景 · 橙端口→蓝端口连线 · 点积木调参数 · 双击复合组件展开</span>
    </header>
    <div class="workspace">
      <aside class="palette">
        <div class="palette-guide">
          ① 拖积木入场景<br />② 橙端口→蓝端口连线<br />③ 点运行看数据流动<br />④ 框选积木→点打包
        </div>
        <div class="palette-title">数据结构积木</div>
        <div
          v-for="block in BLOCKS"
          :key="block.key"
          class="palette-item"
          draggable="true"
          @dragstart="onDragStart($event, block.key)"
          @click="addBlock(block.key)"
        >
          <span class="palette-icon">{{ block.icon }}</span>
          <span class="palette-name">{{ block.name }}</span>
        </div>
        <div class="palette-title" style="margin-top: 12px">复合组件</div>
        <div v-if="recipes.length === 0" class="palette-empty">框选积木 → 点打包创建</div>
        <div
          v-for="recipe in recipes"
          :key="recipe.name"
          class="palette-item composite-item"
          draggable="true"
          @dragstart="onDragComposite($event, recipe.name)"
          @click="addComposite(recipe.name)"
        >
          <span class="palette-icon">🧩</span>
          <span class="palette-name">{{ recipe.name }}</span>
        </div>
      </aside>

      <Sim3DCanvas
        ref="canvasRef"
        :running="running"
        class="canvas"
        @select="onSelect"
        @link-select="onLinkSelect"
        @log="onLog"
        @clock="onClock"
      />

      <aside class="params-panel">
        <template v-if="selectedBlock !== null && meta !== null">
          <div class="params-title">{{ BLOCK_INFO[selectedBlock.type].name }} 参数</div>
          <div v-if="selectedBlock.type === 'sink'" class="param-row">
            <label class="param-label">消耗速度（1=最快）</label>
            <input
              v-model.number="selectedBlock.params.speed"
              type="range"
              class="param-slider"
              :min="1"
              :max="10"
              step="1"
              @input="applyParams"
            />
            <span class="param-value">{{ selectedBlock.params.speed }}</span>
          </div>
          <div v-else class="param-row">
            <label class="param-label">{{ meta.capacityLabel }}</label>
            <input
              v-model.number="selectedBlock.params.capacity"
              type="range"
              class="param-slider"
              :min="meta.capacityMin"
              :max="meta.capacityMax"
              step="1"
              @input="applyParams"
            />
            <span class="param-value">{{ selectedBlock.params.capacity }}</span>
          </div>
          <div v-if="selectedBlock.type === 'source'" class="param-row">
            <label class="param-label">流速（1=最快）</label>
            <input
              v-model.number="selectedBlock.params.speed"
              type="range"
              class="param-slider"
              :min="1"
              :max="10"
              step="1"
              @input="applyParams"
            />
            <span class="param-value">{{ selectedBlock.params.speed }}</span>
          </div>
          <div class="param-row">
            <label class="param-label">当前数据量</label>
            <span class="param-value">{{ selectedBlock.params.filled }}</span>
          </div>
        </template>
        <template v-else-if="selectedLinkMode !== null">
          <div class="params-title">连线方法</div>
          <div class="param-row">
            <label class="param-label">方法</label>
            <select v-model="selectedLinkMode" class="param-select" @change="setLinkMode(selectedLinkMode)">
              <option value="transfer">传输（消耗）</option>
              <option value="store">存储（持久化）</option>
            </select>
          </div>
        </template>
        <template v-else>
          <div class="params-title">参数</div>
          <div class="param-note">点击积木查看 / 调节参数<br />点击连线切换方法</div>
        </template>
      </aside>
      <aside class="log-panel">
        <div class="log-title">操作日志</div>
        <div ref="logListRef" class="log-list">
          <div v-for="(e, i) in valueLog" :key="i" class="log-item" :class="e.op">
            <span class="log-time">步{{ e.time }}</span>
            <span class="log-op">{{ OP_LABELS[e.op] ?? e.op }}</span>
            <span class="log-block">{{ e.blockName }}</span>
            <span class="log-value">{{ e.value }}</span>
          </div>
        </div>
      </aside>
    </div>
  </main>
</template>

<style scoped>
.app {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.toolbar {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 12px 16px;
  border-bottom: 1px solid #d8dbe2;
  background: #ffffff;
  color: #1b1d24;
}

.toolbar h1 {
  font-size: 16px;
  margin: 0;
}

.run-btn {
  padding: 6px 16px;
  border: none;
  border-radius: 6px;
  background: #4f7cff;
  color: #fff;
  font-size: 13px;
  cursor: pointer;
}

.run-btn:hover {
  background: #3d68e0;
}

.pack-btn {
  padding: 6px 14px;
  border: 1px solid #f5b301;
  border-radius: 6px;
  background: #fffaf0;
  color: #8a6500;
  font-size: 13px;
  cursor: pointer;
}

.pack-btn:hover {
  background: #fff3d6;
}

.modal-mask {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
}

.modal {
  background: #ffffff;
  border-radius: 10px;
  padding: 20px;
  min-width: 260px;
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.2);
}

.modal-title {
  font-size: 15px;
  font-weight: 600;
  margin-bottom: 12px;
  color: #1b1d24;
}

.modal-row,
.modal-link {
  font-size: 13px;
  color: #4a4f5a;
  margin-bottom: 6px;
}

.modal-link {
  color: #4f7cff;
}

.close-btn {
  margin-top: 12px;
  padding: 6px 16px;
  border: none;
  border-radius: 6px;
  background: #4f7cff;
  color: #fff;
  font-size: 13px;
  cursor: pointer;
}

.hint {
  font-size: 12px;
  color: #8a8f9c;
}

.workspace {
  display: flex;
  flex: 1;
  min-height: 0;
}

.palette {
  width: 160px;
  min-width: 120px;
  flex-shrink: 1;
  padding: 12px;
  border-right: 1px solid #d8dbe2;
  background: #fafbfc;
  box-sizing: border-box;
  overflow: auto;
}

.palette-title,
.params-title {
  font-size: 12px;
  color: #8a8f9c;
  margin-bottom: 10px;
}

.palette-guide {
  font-size: 11px;
  color: #8a8f9c;
  line-height: 1.7;
  padding: 8px 10px;
  margin-bottom: 12px;
  border: 1px dashed #d8dbe2;
  border-radius: 6px;
  background: #f5f6f8;
}

.palette-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 9px 10px;
  margin-bottom: 8px;
  border: 1px solid #e0e3e8;
  border-radius: 6px;
  background: #ffffff;
  color: #1b1d24;
  cursor: pointer;
  user-select: none;
}

.palette-item:hover {
  border-color: #4f7cff;
}

.composite-item {
  border-color: #f5b301;
  background: #fffaf0;
}

.composite-item:hover {
  border-color: #f5b301;
}

.palette-icon {
  font-size: 18px;
}

.palette-name {
  font-size: 13px;
}

.palette-empty {
  font-size: 11px;
  color: #a0a5b0;
  padding: 4px 0 8px;
}

.params-panel {
  width: 180px;
  min-width: 140px;
  flex-shrink: 1;
  padding: 12px;
  border-left: 1px solid #d8dbe2;
  background: #fafbfc;
  box-sizing: border-box;
  overflow: auto;
}

.param-row {
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin-bottom: 14px;
}

.param-label {
  font-size: 12px;
  color: #4a4f5a;
}

.param-slider {
  width: 100%;
}

.param-value {
  font-size: 13px;
  font-weight: 600;
  color: #4f7cff;
  text-align: right;
}

.param-select {
  padding: 4px 6px;
  border: 1px solid #e0e3e8;
  border-radius: 4px;
  font-size: 13px;
}

.param-note {
  font-size: 12px;
  color: #8a8f9c;
}

.canvas {
  flex: 1 1 auto;
  min-width: 240px;
}

.log-panel {
  width: 200px;
  min-width: 150px;
  flex-shrink: 1;
  border-left: 1px solid #d8dbe2;
  background: #fafbfc;
  padding: 12px;
  box-sizing: border-box;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.log-title {
  font-size: 11px;
  color: #8a8f9c;
  margin-bottom: 4px;
}

.log-list {
  flex: 1;
  overflow-y: auto;
  font-size: 12px;
  line-height: 1.7;
}

.log-item {
  display: flex;
  gap: 6px;
  white-space: nowrap;
}

.log-time {
  color: #8a8f9c;
  font-variant-numeric: tabular-nums;
}

.log-op {
  font-weight: 600;
}

.log-item.emit .log-op {
  color: #389e0d;
}

.log-item.enqueue .log-op {
  color: #1677ff;
}

.log-item.dequeue .log-op {
  color: #d46b08;
}

.log-item.receive .log-op {
  color: #722ed1;
}

.log-block {
  color: #4a4f5a;
}

.log-value {
  font-weight: 600;
  color: #1b1d24;
}

.clock {
  font-size: 13px;
  font-weight: 600;
  color: #4f7cff;
  font-variant-numeric: tabular-nums;
}
</style>
