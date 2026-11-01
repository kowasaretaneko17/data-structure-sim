import * as THREE from 'three';

export interface DataLink {
  group: THREE.Group;
  update: (dt: number) => void;
  startTransfer(onDone: () => void): void;
  isBusy(): boolean;
  setHighlight(hl: boolean): void;
  setStore(store: boolean): void;
}

/**
 * 平面连线：细线视觉 + 透明粗拾取管（便于点击）+ 表示单条数据的光点。
 * 端点通过 getFrom/getTo 动态获取。
 */
export function createDataLink(
  scene: THREE.Scene,
  getFrom: () => THREE.Vector3,
  getTo: () => THREE.Vector3,
): DataLink {
  const lineGeo = new THREE.BufferGeometry();
  const positions = new THREE.Float32BufferAttribute(new Float32Array(6), 3);
  lineGeo.setAttribute('position', positions);
  const lineMaterial = new THREE.LineBasicMaterial({ color: 0xb9bfc9 });
  const line = new THREE.Line(lineGeo, lineMaterial);

  // 透明粗拾取管，用于 raycast 命中
  const pickMaterial = new THREE.MeshBasicMaterial({
    transparent: true,
    opacity: 0,
    depthWrite: false,
  });
  const pickCylinder = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.28, 1, 8), pickMaterial);
  pickCylinder.userData.isPick = true;

  const dot = new THREE.Mesh(
    new THREE.CylinderGeometry(0.14, 0.14, 0.12, 20),
    new THREE.MeshBasicMaterial({ color: 0xff9c33 }),
  );
  dot.visible = false;

  const group = new THREE.Group();
  group.add(line);
  group.add(pickCylinder);
  group.add(dot);
  scene.add(group);

  const from = new THREE.Vector3();
  const to = new THREE.Vector3();
  let t = 0;
  let busy = false;
  let onDone: (() => void) | null = null;
  let store = false;

  const up = new THREE.Vector3(0, 1, 0);

  function refreshEndpoints(): void {
    from.copy(getFrom());
    to.copy(getTo());
    positions.setXYZ(0, from.x, from.y, from.z);
    positions.setXYZ(1, to.x, to.y, to.z);
    positions.needsUpdate = true;
    const dir = to.clone().sub(from);
    const len = dir.length();
    pickCylinder.position.copy(from.clone().add(to).multiplyScalar(0.5));
    pickCylinder.scale.set(1, Math.max(len, 0.01), 1);
    if (len > 0.0001) {
      pickCylinder.quaternion.setFromUnitVectors(up, dir.normalize());
    }
  }

  return {
    group,
    update(dt: number): void {
      refreshEndpoints();
      if (!busy) {
        dot.position.copy(from);
        return;
      }
      t += dt * 1.4;
      if (t >= 1) {
        t = 1;
        busy = false;
        dot.visible = false;
        const done = onDone;
        onDone = null;
        done?.();
      } else {
        dot.position.lerpVectors(from, to, t);
      }
    },
    startTransfer(done: () => void): void {
      if (busy) {
        return;
      }
      t = 0;
      busy = true;
      onDone = done;
      dot.visible = true;
      refreshEndpoints();
      dot.position.copy(from);
    },
    isBusy(): boolean {
      return busy;
    },
    setHighlight(hl: boolean): void {
      lineMaterial.color.set(hl ? 0x4f7cff : store ? 0x8a5cf6 : 0xb9bfc9);
    },
    setStore(s: boolean): void {
      store = s;
      lineMaterial.color.set(s ? 0x8a5cf6 : 0xb9bfc9);
    },
  };
}
