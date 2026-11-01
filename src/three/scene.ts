import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

export interface Scene3D {
  renderer: THREE.WebGLRenderer;
  scene: THREE.Scene;
  camera: THREE.OrthographicCamera;
  controls: OrbitControls;
  onUpdate(fn: (dt: number) => void): () => void;
  dispose(): void;
}

/** 创建 2D 俯视场景：正交相机、浅色背景、网格、仅平移/缩放。 */
export function createScene3D(container: HTMLElement): Scene3D {
  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(container.clientWidth, container.clientHeight);
  container.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0xf5f6f8);

  const frustumSize = 22;
  const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 200);
  updateCamera();

  function updateCamera(): void {
    const aspect = container.clientWidth / container.clientHeight;
    camera.left = (-frustumSize * aspect) / 2;
    camera.right = (frustumSize * aspect) / 2;
    camera.top = frustumSize / 2;
    camera.bottom = -frustumSize / 2;
    camera.position.set(0, 20, 0);
    camera.up.set(0, 0, -1);
    camera.lookAt(0, 0, 0);
    camera.updateProjectionMatrix();
  }

  // 网格地面
  const grid = new THREE.GridHelper(60, 60, 0xd8dbe2, 0xe8eaf0);
  grid.position.y = -0.05;
  scene.add(grid);
  const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(60, 60),
    new THREE.MeshBasicMaterial({ color: 0xf5f6f8 }),
  );
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = -0.06;
  scene.add(floor);

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableRotate = false;
  controls.enableDamping = true;
  controls.dampingFactor = 0.08;
  controls.target.set(0, 0, 0);
  controls.minZoom = 0.4;
  controls.maxZoom = 3;

  const updates: Array<(dt: number) => void> = [];
  const clock = new THREE.Clock();

  renderer.setAnimationLoop(() => {
    const dt = clock.getDelta();
    controls.update();
    for (const fn of updates) {
      fn(dt);
    }
    renderer.render(scene, camera);
  });

  function onResize(): void {
    updateCamera();
    renderer.setSize(container.clientWidth, container.clientHeight);
  }
  const resizeObserver = new ResizeObserver(() => {
    onResize();
  });
  resizeObserver.observe(container);

  return {
    renderer,
    scene,
    camera,
    controls,
    onUpdate(fn: (dt: number) => void): () => void {
      updates.push(fn);
      return () => {
        const index = updates.indexOf(fn);
        if (index >= 0) {
          updates.splice(index, 1);
        }
      };
    },
    dispose() {
      resizeObserver.disconnect();
      renderer.setAnimationLoop(null);
      controls.dispose();
      renderer.dispose();
      renderer.domElement.remove();
    },
  };
}
