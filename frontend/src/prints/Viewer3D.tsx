import { Maximize, Minimize, RotateCw } from 'lucide-react';
import { useEffect, useRef, useState, type KeyboardEvent } from 'react';
import {
  AmbientLight,
  Box3,
  BufferGeometry,
  Color,
  DirectionalLight,
  Group,
  Mesh,
  MeshStandardMaterial,
  PerspectiveCamera,
  Scene,
  Vector3,
  WebGLRenderer,
  type Object3D,
} from 'three';
import { ThreeMFLoader } from 'three/addons/loaders/3MFLoader.js';
import { STLLoader } from 'three/addons/loaders/STLLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { t } from '../i18n/nl';

type State = 'loading' | 'ready' | 'error';

/**
 * Viewer3D (lazy chunk): STL or 3MF from /api/prints/:id/model, in the
 * print's colour (tint rule) or the `muted` token when there is none.
 * Drag rotates, scroll zooms; keyboard: arrows rotate, +/- zoom, 0 resets.
 * "Volledig scherm" (top right) fills the screen; Esc exits. Never rotates
 * by itself (reduced motion is respected by default).
 */
export default function Viewer3D({
  url,
  name,
  colour,
}: {
  url: string;
  name: string;
  colour: string | null;
}) {
  const frame = useRef<HTMLDivElement>(null);
  const host = useRef<HTMLDivElement>(null);
  const [state, setState] = useState<State>('loading');
  const [fullscreen, setFullscreen] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const controlsRef = useRef<{
    rotate: (dx: number, dy: number) => void;
    zoom: (f: number) => void;
    reset: () => void;
  } | null>(null);

  useEffect(() => {
    const element = host.current;
    if (element === null) return;
    const run = { disposed: false };
    setState('loading');

    const renderer = new WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.domElement.className = 'app-viewer-canvas';
    element.appendChild(renderer.domElement);

    const scene = new Scene();
    const camera = new PerspectiveCamera(35, 4 / 3, 0.1, 10_000);
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = false;
    scene.add(new AmbientLight(0xffffff, 1.2));
    const key = new DirectionalLight(0xffffff, 2.2);
    key.position.set(1, 2, 1.5);
    scene.add(key);
    const fill = new DirectionalLight(0xffffff, 0.8);
    fill.position.set(-1.5, 0.5, -1);
    scene.add(fill);

    const draw = () => {
      renderer.render(scene, camera);
    };
    controls.addEventListener('change', draw);

    const resize = () => {
      const width = element.clientWidth;
      const height = element.clientHeight;
      if (width === 0 || height === 0) return;
      renderer.setSize(width, height, false);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      draw();
    };
    const observer = new ResizeObserver(resize);
    observer.observe(element);

    let home = { position: new Vector3(), target: new Vector3() };
    controlsRef.current = {
      rotate: (dx, dy) => {
        const offset = camera.position.clone().sub(controls.target);
        offset.applyAxisAngle(new Vector3(0, 1, 0), dx);
        const axis = new Vector3().crossVectors(new Vector3(0, 1, 0), offset).normalize();
        offset.applyAxisAngle(axis, dy);
        camera.position.copy(controls.target).add(offset);
        controls.update();
        draw();
      },
      zoom: (factor) => {
        const offset = camera.position.clone().sub(controls.target).multiplyScalar(factor);
        camera.position.copy(controls.target).add(offset);
        controls.update();
        draw();
      },
      reset: () => {
        camera.position.copy(home.position);
        controls.target.copy(home.target);
        controls.update();
        draw();
      },
    };

    (async () => {
      resize();
      const response = await fetch(url, { credentials: 'same-origin' });
      if (!response.ok) throw new Error(`model ${String(response.status)}`);
      const data = await response.arrayBuffer();
      const isZip = new Uint8Array(data.slice(0, 2)).every((byte, i) => byte === [0x50, 0x4b][i]);
      const material = new MeshStandardMaterial({
        color: new Color(colour ?? tokenColour(element, '--muted')),
        roughness: 0.6,
        metalness: 0.05,
      });
      let model: Object3D;
      if (isZip) {
        model = new ThreeMFLoader().parse(data);
        model.traverse((child) => {
          if (child instanceof Mesh) child.material = material;
        });
      } else {
        const geometry: BufferGeometry = new STLLoader().parse(data);
        geometry.computeVertexNormals();
        model = new Mesh(geometry, material);
      }
      // Slicers are Z-up; three.js is Y-up.
      const holder = new Group();
      model.rotation.x = -Math.PI / 2;
      holder.add(model);
      // Apply the rotation before measuring, or the bounds are those of the unrotated model.
      holder.updateMatrixWorld(true);
      const box = new Box3().setFromObject(holder);
      const size = box.getSize(new Vector3());
      const centre = box.getCenter(new Vector3());
      holder.position.sub(centre);
      scene.add(holder);
      holder.updateMatrixWorld(true);

      // Fit the bounding sphere in the narrower of the two view angles, with a small margin.
      const radius = Math.max(size.length() / 2, 1e-3);
      const vertical = (camera.fov * Math.PI) / 180;
      const horizontal = 2 * Math.atan(Math.tan(vertical / 2) * camera.aspect);
      const distance = (radius / Math.sin(Math.min(vertical, horizontal) / 2)) * 1.1;
      camera.near = distance / 100;
      camera.far = distance * 100;
      camera.position.copy(new Vector3(1.2, 0.9, 1.6).normalize().multiplyScalar(distance));
      controls.target.set(0, 0, 0);
      controls.update();
      camera.updateProjectionMatrix();
      home = { position: camera.position.clone(), target: controls.target.clone() };
      if (run.disposed) return;
      resize();
      setState('ready');
    })().catch(() => {
      if (!run.disposed) setState('error');
    });

    return () => {
      run.disposed = true;
      observer.disconnect();
      controls.dispose();
      renderer.dispose();
      renderer.domElement.remove();
      controlsRef.current = null;
    };
  }, [url, colour, attempt]);

  useEffect(() => {
    const onChange = () => {
      setFullscreen(
        document.fullscreenElement !== null && document.fullscreenElement === frame.current,
      );
    };
    document.addEventListener('fullscreenchange', onChange);
    return () => {
      document.removeEventListener('fullscreenchange', onChange);
    };
  }, []);

  const toggleFullscreen = () => {
    if (document.fullscreenElement === null) {
      void frame.current?.requestFullscreen().catch(() => undefined);
    } else {
      void document.exitFullscreen().catch(() => undefined);
    }
  };

  const onKeyDown = (event: KeyboardEvent) => {
    const controls = controlsRef.current;
    if (controls === null) return;
    const step = Math.PI / 18;
    const actions: Record<string, () => void> = {
      ArrowLeft: () => {
        controls.rotate(-step, 0);
      },
      ArrowRight: () => {
        controls.rotate(step, 0);
      },
      ArrowUp: () => {
        controls.rotate(0, -step);
      },
      ArrowDown: () => {
        controls.rotate(0, step);
      },
      '+': () => {
        controls.zoom(0.85);
      },
      '=': () => {
        controls.zoom(0.85);
      },
      '-': () => {
        controls.zoom(1 / 0.85);
      },
      '0': () => {
        controls.reset();
      },
    };
    const action = actions[event.key];
    if (action !== undefined) {
      event.preventDefault();
      action();
    }
  };

  return (
    <div ref={frame} className="pp-viewer">
      {/* The drawing surface is the image; the button and hint sit on top of it. */}
      <div
        ref={host}
        className="app-viewer-stage"
        role="img"
        aria-label={t('viewer.label', { name })}
        tabIndex={0}
        onKeyDown={onKeyDown}
      />
      {state === 'loading' && (
        <span className="app-viewer-state">
          <span className="pp-spin" aria-hidden="true" />
          <span>{t('viewer.loading')}</span>
        </span>
      )}
      {state === 'error' && (
        <span className="app-viewer-state">
          <span>{t('viewer.error')}</span>
          <button
            type="button"
            className="pp-btn pp-btn-secondary pp-btn-sm"
            onClick={() => {
              setAttempt((n) => n + 1);
            }}
          >
            <RotateCw className="pp-ico" aria-hidden="true" />
            {t('common.retry')}
          </button>
        </span>
      )}
      {document.fullscreenEnabled && (
        <button
          type="button"
          className="pp-btn pp-btn-ghost pp-btn-icon full"
          aria-label={fullscreen ? t('viewer.exitFullscreen') : t('viewer.fullscreen')}
          onClick={toggleFullscreen}
        >
          {fullscreen ? (
            <Minimize className="pp-ico" aria-hidden="true" />
          ) : (
            <Maximize className="pp-ico" aria-hidden="true" />
          )}
        </button>
      )}
      {state === 'ready' && <span className="hint">{t('viewer.hint')}</span>}
    </div>
  );
}

/** A colour token's current value (follows the theme). */
function tokenColour(element: HTMLElement, token: string): string {
  return getComputedStyle(element).getPropertyValue(token).trim() || 'gray';
}
