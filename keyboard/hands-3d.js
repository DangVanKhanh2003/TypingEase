import * as THREE from '../vendor/three/three.module.min.js';
import { GLTFLoader } from '../vendor/three/GLTFLoader.js';
import { clone as cloneSkeleton } from '../vendor/three/SkeletonUtils.js';
import { unpackHandGltf } from './gltf-unpack.js';
import { resolveHandSlots } from './hands-pose-map.js';

const MODEL_URL = '/assets/hands-3d/hand-default.compressed.gltf';
const APP_TEXTURE = '/assets/hands-3d/base-1';
const HIGHLIGHT_ROOT = '/assets/hands-3d';
const HIGHLIGHT_NAMES = ['index', 'middle', 'ring', 'pinky', 'thumb'];
// Keep WebGL highlight colours aligned with the keyboard's --fk palette.
const HIGHLIGHT_COLORS = {
  index: '#98d8d8',
  middle: '#f6df72',
  ring: '#a8e0b8',
  pinky: '#b8b8f0',
  thumb: '#cfe0fb',
};
const FRAME_DURATION = 0.275;
const HAND_SCALE = 0.275;
const HAND_OFFSET = 0.033;
const HAND_DEPTH = -0.825;

let transparentTexture = null;
let surfaceTexturePromise = null;
let highlightTexturePromise = null;
let handModelPromise = null;

function cubicEaseInOut(value) {
  const amount = Math.min(1, Math.max(0, value));
  return amount < 0.5 ? 4 * amount * amount * amount : 1 - Math.pow(-2 * amount + 2, 3) / 2;
}

function flipTexture(texture, color = false) {
  if (!texture) return null;
  if (color) texture.colorSpace = THREE.SRGBColorSpace;
  texture.repeat.y = -1;
  texture.offset.y = 1;
  texture.needsUpdate = true;
  return texture;
}

function transparentMap() {
  if (!transparentTexture) {
    transparentTexture = new THREE.DataTexture(new Uint8Array([0, 0, 0, 0]), 1, 1, THREE.RGBAFormat);
    transparentTexture.needsUpdate = true;
  }
  return transparentTexture;
}

function loadSurfaceTexture() {
  if (!surfaceTexturePromise) {
    surfaceTexturePromise = new THREE.TextureLoader().loadAsync(`${APP_TEXTURE}.jpg`)
      .then((texture) => flipTexture(texture, true))
      .catch(() => null);
  }
  return surfaceTexturePromise;
}

function loadHighlightTextures() {
  if (!highlightTexturePromise) {
    const loader = new THREE.TextureLoader();
    highlightTexturePromise = Promise.all(HIGHLIGHT_NAMES.flatMap((name) => [name, `${name}-full`]).map(async (name) => {
      try {
        return [name, flipTexture(await loader.loadAsync(`${HIGHLIGHT_ROOT}/highlight-${name}.png`), true)];
      } catch {
        return [name, null];
      }
    })).then((pairs) => Object.fromEntries(pairs));
  }
  return highlightTexturePromise;
}

/**
 * The 967 KB compressed model unpacks to ~2.8 MB of glTF JSON, so it is fetched,
 * unpacked and parsed exactly once per page; both hands clone the parsed result.
 * `GLTFLoader.parse` accepts an already-parsed glTF object, which keeps the
 * unpacked JSON from being stringified and re-parsed on the way in.
 */
function loadHandModel(url = MODEL_URL) {
  if (!handModelPromise) {
    handModelPromise = (async () => {
      const response = await fetch(url);
      if (!response.ok) throw new Error(`Hand: failed to fetch model "${url}" (${response.status})`);
      const source = unpackHandGltf(await response.text());
      const basePath = url.slice(0, url.lastIndexOf('/') + 1);
      const loader = new GLTFLoader();
      return new Promise((resolve, reject) => loader.parse(source, basePath, resolve, reject));
    })();
    handModelPromise.catch(() => { handModelPromise = null; });
  }
  return handModelPromise;
}

function addHighlightShader(material) {
  const uniforms = {
    highlightMap: { value: transparentMap() },
    highlightColor: { value: new THREE.Color(0xffffff) },
    highlightStrength: { value: 0 },
    highlightOpacity: { value: 0.95 },
    guideStrength: { value: 2 },
  };
  HIGHLIGHT_NAMES.forEach((name, index) => {
    uniforms[`highlightMap${index}`] = { value: transparentMap() };
    uniforms[`highlightColor${index}`] = { value: new THREE.Color(HIGHLIGHT_COLORS[name]) };
  });
  material.userData.highlightUniforms = uniforms;
  material.onBeforeCompile = (shader) => {
    shader.uniforms.highlightMap = uniforms.highlightMap;
    shader.uniforms.highlightColor = uniforms.highlightColor;
    shader.uniforms.highlightStrength = uniforms.highlightStrength;
    shader.uniforms.highlightOpacity = uniforms.highlightOpacity;
    shader.uniforms.guideStrength = uniforms.guideStrength;
    HIGHLIGHT_NAMES.forEach((name, index) => {
      shader.uniforms[`highlightMap${index}`] = uniforms[`highlightMap${index}`];
      shader.uniforms[`highlightColor${index}`] = uniforms[`highlightColor${index}`];
    });
    const guideUniforms = HIGHLIGHT_NAMES.map((name, index) => `uniform sampler2D highlightMap${index};\n      uniform vec3 highlightColor${index};`).join('\n      ');
    const guideSamples = HIGHLIGHT_NAMES.map((name, index) => `
      float guideMix${index} = clamp(texture2D(highlightMap${index}, highlightUv).a * guideStrength, 0.0, 1.0);
      diffuseColor.rgb = mix(diffuseColor.rgb, highlightColor${index}, guideMix${index});`).join('');
    shader.fragmentShader = shader.fragmentShader.replace('#include <common>', `
      #include <common>
      uniform sampler2D highlightMap;
      uniform vec3 highlightColor;
      uniform float highlightStrength;
      uniform float highlightOpacity;
      uniform float guideStrength;
      ${guideUniforms}
    `);
    shader.fragmentShader = shader.fragmentShader.replace('#include <map_fragment>', `
      #include <map_fragment>
      #if defined( USE_MAP )
        vec4 highlightSample = texture2D( highlightMap, vMapUv );
      #else
        vec4 highlightSample = texture2D( highlightMap, vUv );
      #endif
      #if defined( USE_MAP )
        vec2 highlightUv = vMapUv;
      #else
        vec2 highlightUv = vUv;
      #endif
      ${guideSamples}
      highlightSample.rgb = highlightColor;
      float highlightMix = clamp(highlightSample.a * highlightStrength * highlightOpacity, 0.0, 1.0);
      diffuseColor.rgb = mix(diffuseColor.rgb, highlightSample.rgb, highlightMix);
    `);
  };
}

function makeHandMaterial(surface) {
  const material = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    roughness: 0.55,
    metalness: 0,
    toneMapped: false,
    map: surface || null,
    side: THREE.DoubleSide,
  });
  addHighlightShader(material);
  material.needsUpdate = true;
  return material;
}

class SourceHandModel {
  constructor({ side, frameTransitionDuration = FRAME_DURATION }) {
    this.side = side;
    this.group = new THREE.Group();
    this.frameTransitionDuration = frameTransitionDuration;
    this.frameTransitionEasing = cubicEaseInOut;
    this.clipByName = new Map();
    this.materials = [];
    this.highlights = null;
    this.modelRoot = null;
    this.skinnedMesh = null;
    this.frameTween = null;
    // Pose work runs on every keystroke, so the node list, the merged track
    // lists, the property bindings and the track interpolants are all resolved
    // once and reused; the tween itself works on flat, preallocated buffers.
    this.nodes = [];
    this.tracksByFrame = new Map();
    this.bindingByTrack = new Map();
    this.interpolantByTrack = new Map();
    this.fromPosition = this.fromQuaternion = this.fromScale = null;
    this.toPosition = this.toQuaternion = this.toScale = null;
    this.scratchFrom = new THREE.Quaternion();
    this.scratchTo = new THREE.Quaternion();
    this.ready = this.load();
  }

  async load() {
    const [gltf, surface, highlights] = await Promise.all([
      loadHandModel(),
      loadSurfaceTexture(),
      loadHighlightTextures(),
    ]);
    this.highlights = highlights;
    // Clone the shared parse: geometry, skin weights and clips stay shared while
    // each hand gets its own node graph to pose.
    this.modelRoot = cloneSkeleton(gltf.scene);
    if (this.side === 'right') this.modelRoot.scale.x *= -1;
    this.group.add(this.modelRoot);
    for (const clip of gltf.animations) this.clipByName.set(clip.name, clip);
    this.modelRoot.traverse((object) => {
      if (object.isSkinnedMesh) this.skinnedMesh = object;
      if (!object.isMesh || !object.material) return;
      const original = Array.isArray(object.material) ? object.material : [object.material];
      const materials = original.map(() => makeHandMaterial(surface));
      this.materials.push(...materials);
      object.material = materials.length === 1 ? materials[0] : materials;
    });
    this.collectNodes();
    return gltf;
  }

  collectNodes() {
    const nodes = [];
    this.modelRoot.traverse((object) => nodes.push(object));
    this.nodes = nodes;
    this.fromPosition = new Float32Array(nodes.length * 3);
    this.fromQuaternion = new Float32Array(nodes.length * 4);
    this.fromScale = new Float32Array(nodes.length * 3);
    this.toPosition = new Float32Array(nodes.length * 3);
    this.toQuaternion = new Float32Array(nodes.length * 4);
    this.toScale = new Float32Array(nodes.length * 3);
  }

  captureInto(position, quaternion, scale) {
    const nodes = this.nodes;
    for (let index = 0; index < nodes.length; index += 1) {
      const node = nodes[index];
      node.position.toArray(position, index * 3);
      node.quaternion.toArray(quaternion, index * 4);
      node.scale.toArray(scale, index * 3);
    }
  }

  restoreFrom(position, quaternion, scale) {
    const nodes = this.nodes;
    for (let index = 0; index < nodes.length; index += 1) {
      const node = nodes[index];
      node.position.fromArray(position, index * 3);
      node.quaternion.fromArray(quaternion, index * 4);
      node.scale.fromArray(scale, index * 3);
    }
  }

  setFingerHighlight(name) {
    const texture = name && this.highlights?.[name] ? this.highlights[name] : null;
    const colorName = name?.replace(/-full$/, '');
    for (const material of this.materials) {
      const uniforms = material.userData.highlightUniforms;
      if (!uniforms) continue;
      uniforms.highlightMap.value = texture || transparentMap();
      uniforms.highlightColor.value.set(HIGHLIGHT_COLORS[colorName] || '#ffffff');
      HIGHLIGHT_NAMES.forEach((fingerName, index) => {
        // The -full masks cover the complete finger for the initial colour guide;
        // the non-full masks remain available for per-key pose highlights.
        uniforms[`highlightMap${index}`].value = this.highlights?.[`${fingerName}-full`] || transparentMap();
        uniforms[`highlightColor${index}`].value.set(HIGHLIGHT_COLORS[fingerName]);
      });
      // Keep the source highlight vivid over the translucent hand material.
      uniforms.highlightStrength.value = texture ? 1.35 : 0;
    }
  }

  setGuideStrength(value) {
    const strength = Number.isFinite(Number(value)) ? Math.max(0, Number(value)) : 0;
    for (const material of this.materials) {
      const uniforms = material.userData.highlightUniforms;
      if (uniforms) uniforms.guideStrength.value = strength;
    }
  }

  /** The base clip merged with one pose clip; the merge only depends on the clips. */
  mergedTracks(frame) {
    let tracks = this.tracksByFrame.get(frame);
    if (tracks) return tracks;
    const base = this.clipByName.get('base');
    if (!base) return [];
    const byName = new Map(base.tracks.map((track) => [track.name, track]));
    if (frame !== 'base') {
      const pose = this.clipByName.get(frame);
      if (pose) for (const track of pose.tracks) byName.set(track.name, track);
    }
    tracks = Array.from(byName.values());
    this.tracksByFrame.set(frame, tracks);
    return tracks;
  }

  bindingFor(name) {
    let binding = this.bindingByTrack.get(name);
    if (binding !== undefined) return binding;
    binding = new THREE.PropertyBinding(this.modelRoot, name);
    if (!binding.node) binding = null;
    else binding.bind();
    this.bindingByTrack.set(name, binding);
    return binding;
  }

  interpolantFor(track) {
    let interpolant = this.interpolantByTrack.get(track);
    if (interpolant) return interpolant;
    interpolant = track.createInterpolant(new Float32Array(track.getValueSize()));
    this.interpolantByTrack.set(track, interpolant);
    return interpolant;
  }

  applyMergedClipsAtTime(frame, time = 0) {
    if (!this.modelRoot || !this.clipByName.has('base')) return;
    for (const track of this.mergedTracks(frame)) {
      const binding = this.bindingFor(track.name);
      if (!binding) continue;
      binding.setValue(this.interpolantFor(track).evaluate(time), 0);
    }
    this.modelRoot.updateMatrixWorld(true);
  }

  setFrameImmediate(frame, time = 0) {
    this.applyMergedClipsAtTime(frame, time);
  }

  setAnimationFrame(frame, time = 0) {
    if (!this.skinnedMesh || !this.clipByName.has('base')) return;
    const target = this.clipByName.has(frame) ? frame : `default-${this.side}`;
    if (this.frameTransitionDuration <= 0 || !this.modelRoot) {
      this.frameTween = null;
      this.setFrameImmediate(target, time);
      return;
    }
    this.captureInto(this.fromPosition, this.fromQuaternion, this.fromScale);
    this.applyMergedClipsAtTime(target, time);
    this.captureInto(this.toPosition, this.toQuaternion, this.toScale);
    this.restoreFrom(this.fromPosition, this.fromQuaternion, this.fromScale);
    this.modelRoot.updateMatrixWorld(true);
    this.frameTween = { elapsed: 0, duration: this.frameTransitionDuration, target, time };
  }

  update(delta) {
    const tween = this.frameTween;
    if (!tween || !this.modelRoot) return;
    tween.elapsed += delta;
    const amount = this.frameTransitionEasing(Math.min(1, tween.elapsed / tween.duration));
    const nodes = this.nodes;
    const from = this.scratchFrom;
    const to = this.scratchTo;
    for (let index = 0; index < nodes.length; index += 1) {
      const node = nodes[index];
      const offset3 = index * 3;
      const offset4 = index * 4;
      node.position.set(
        this.fromPosition[offset3] + (this.toPosition[offset3] - this.fromPosition[offset3]) * amount,
        this.fromPosition[offset3 + 1] + (this.toPosition[offset3 + 1] - this.fromPosition[offset3 + 1]) * amount,
        this.fromPosition[offset3 + 2] + (this.toPosition[offset3 + 2] - this.fromPosition[offset3 + 2]) * amount,
      );
      from.fromArray(this.fromQuaternion, offset4);
      to.fromArray(this.toQuaternion, offset4);
      node.quaternion.slerpQuaternions(from, to, amount);
      node.scale.set(
        this.fromScale[offset3] + (this.toScale[offset3] - this.fromScale[offset3]) * amount,
        this.fromScale[offset3 + 1] + (this.toScale[offset3 + 1] - this.fromScale[offset3 + 1]) * amount,
        this.fromScale[offset3 + 2] + (this.toScale[offset3 + 2] - this.fromScale[offset3 + 2]) * amount,
      );
    }
    this.modelRoot.updateMatrixWorld(true);
    if (amount >= 1) {
      this.setFrameImmediate(tween.target, tween.time);
      this.frameTween = null;
    }
  }

  dispose() {
    for (const material of this.materials) material?.dispose();
    this.materials.length = 0;
    this.group.clear();
    this.tracksByFrame.clear();
    this.bindingByTrack.clear();
    this.interpolantByTrack.clear();
    this.clipByName.clear();
    this.nodes = [];
    this.frameTween = null;
    this.modelRoot = null;
    this.skinnedMesh = null;
    // Geometry, skinning buffers and clips belong to the module-level parse and
    // are reused by the next mount, so they are deliberately not disposed here.
  }
}

class SourceTypingHands {
  constructor(container, { layout, animated = true } = {}) {
    this.container = container;
    this.layout = layout;
    this.animated = animated;
    this.scene = new THREE.Scene();
    this.camera = new THREE.OrthographicCamera(-1.4, 1.4, 1.4, -1.4, 0.1, 1000);
    this.camera.position.set(0, 3, 0);
    this.camera.lookAt(0, 0, 0);
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'low-power' });
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.setPixelRatio(1);
    this.renderer.toneMapping = THREE.NeutralToneMapping ?? THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.35;
    this.renderer.domElement.style.display = 'block';
    this.renderer.domElement.style.visibility = 'hidden';
    this.container.append(this.renderer.domElement);
    this.clock = new THREE.Clock();
    this.disposed = false;
    this.visible = true;
    this.hands = { leftOnly: false, rightOnly: false };
    this.pendingPose = null;
    this.highlightIntervals = [];
    this.lastHighlightAt = null;
    this.adaptiveDuration = FRAME_DURATION;
    this.adaptiveTarget = FRAME_DURATION;
    this.adaptiveTransition = null;
    this.guideStrength = null;
    // The scene only changes on a pose, a tween step, a guide fade, a resize or a
    // visibility change, so the render loop is started on demand and parked again
    // as soon as nothing is left to draw.
    this.needsRender = false;
    this.frameHandle = 0;
    this.lastWidth = 0;
    this.renderFrame = () => {
      this.frameHandle = 0;
      this.render();
    };
    this.addProductLighting();
    this.leftHand = new SourceHandModel({ side: 'left' });
    this.rightHand = new SourceHandModel({ side: 'right' });
    this.scene.add(this.leftHand.group, this.rightHand.group);
    this.leftHand.group.scale.setScalar(HAND_SCALE);
    this.rightHand.group.scale.setScalar(HAND_SCALE);
    this.leftHand.group.position.set(0.04 - HAND_OFFSET, 0, HAND_DEPTH);
    this.rightHand.group.position.set(0.05 - HAND_OFFSET, 0, HAND_DEPTH);
    this.handleResize = () => {
      if (this.resize()) this.markDirty();
    };
    this.handleVisibilityChange = () => {
      if (document.hidden) this.stopLoop();
      else this.markDirty();
    };
    this.resizeObserver = typeof ResizeObserver === 'function' ? new ResizeObserver(this.handleResize) : null;
    this.resizeObserver?.observe(this.container);
    document.addEventListener('visibilitychange', this.handleVisibilityChange);
    this.resize();
    this.ready = Promise.all([this.leftHand.ready, this.rightHand.ready])
      .then(() => {
        if (this.disposed) return false;
        this.applyDefaultRestPoseSnap();
        if (this.guideStrength != null) {
          this.leftHand.setGuideStrength(this.guideStrength);
          this.rightHand.setGuideStrength(this.guideStrength);
        }
        if (this.pendingPose) this.applyPose(this.pendingPose, true);
        this.resize(true);
        // Draw the first frame before the canvas is revealed so the 2-D fallback
        // never hands over to an empty canvas.
        this.renderer.render(this.scene, this.camera);
        this.needsRender = false;
        this.hideFallbackHands();
        this.renderer.domElement.style.visibility = this.visible ? 'visible' : 'hidden';
        this.markDirty();
        return true;
      })
      .catch(() => {
        this.revealFallbackHands();
        this.stopLoop();
        this.disposed = true;
        this.resizeObserver?.disconnect();
        document.removeEventListener('visibilitychange', this.handleVisibilityChange);
        this.releaseRenderer();
        return false;
      });
  }

  addProductLighting() {
    const target = new THREE.Vector3(0, 0, HAND_DEPTH);
    const extend = (x, y, z, distance) => {
      const source = new THREE.Vector3(x, y, z);
      const vector = new THREE.Vector3().subVectors(source, target);
      vector.setLength(vector.length() + distance);
      return target.clone().add(vector);
    };
    this.scene.add(new THREE.HemisphereLight(0xffffff, 6320264, 1.22 * 1.5));
    const key = new THREE.DirectionalLight(0xffffff, 1.52 * 1.5);
    key.position.copy(extend(0, 0.8, -3, 1));
    key.target.position.copy(target);
    this.scene.add(key, key.target);
    const fill = new THREE.DirectionalLight(12113151, 0.52 * 1.5);
    fill.position.copy(extend(0, 0.45, 1.9, 1));
    fill.target.position.copy(target);
    this.scene.add(fill, fill.target);
  }

  revealFallbackHands() {
    this.container.querySelectorAll('.js-left-hand, .js-right-hand').forEach((node) => node.style.removeProperty('display'));
  }

  hideFallbackHands() {
    this.container.querySelectorAll('.js-left-hand, .js-right-hand').forEach((node) => node.style.display = 'none');
  }

  dominantHand() {
    if (this.hands.leftOnly && !this.hands.rightOnly) return 'left';
    if (this.hands.rightOnly && !this.hands.leftOnly) return 'right';
    return null;
  }

  recordHighlightRequest(at = performance.now()) {
    if (this.lastHighlightAt != null) {
      const interval = Math.min(1200, Math.max(70, at - this.lastHighlightAt));
      if (Number.isFinite(interval) && interval > 0) {
        this.highlightIntervals.push(interval);
        if (this.highlightIntervals.length > 8) this.highlightIntervals.shift();
      }
    }
    this.lastHighlightAt = at;
  }

  updateAdaptiveHandSpeed(delta) {
    // Thêm so với bản gốc: "reduce motion" thì tay nhảy thẳng sang tư thế mới, không tween.
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches) {
      this.leftHand.frameTransitionDuration = 0;
      this.rightHand.frameTransitionDuration = 0;
      return;
    }
    const average = this.highlightIntervals.length ? this.highlightIntervals.reduce((sum, value) => sum + value, 0) / this.highlightIntervals.length : null;
    const target = average == null ? FRAME_DURATION : 0.09 + 0.36 * Math.min(1, Math.max(0, (average - 90) / 610));
    if (Math.abs(target - this.adaptiveTarget) > 0.005) {
      this.adaptiveTarget = target;
      this.adaptiveTransition = { from: this.adaptiveDuration, to: target, elapsed: 0 };
    }
    if (this.adaptiveTransition) {
      this.adaptiveTransition.elapsed += delta;
      this.adaptiveDuration = this.adaptiveTransition.from + (this.adaptiveTransition.to - this.adaptiveTransition.from) * Math.min(1, this.adaptiveTransition.elapsed);
      if (this.adaptiveTransition.elapsed >= 1) this.adaptiveTransition = null;
    }
    this.leftHand.frameTransitionDuration = this.adaptiveDuration;
    this.rightHand.frameTransitionDuration = this.adaptiveDuration;
  }

  applyDefaultRestPoseSnap() {
    const leftDuration = this.leftHand.frameTransitionDuration;
    const rightDuration = this.rightHand.frameTransitionDuration;
    this.leftHand.frameTransitionDuration = 0;
    this.rightHand.frameTransitionDuration = 0;
    this.leftHand.setAnimationFrame('default-left');
    this.rightHand.setAnimationFrame('default-right');
    this.leftHand.setFingerHighlight(null);
    this.rightHand.setFingerHighlight(null);
    this.leftHand.frameTransitionDuration = leftDuration;
    this.rightHand.frameTransitionDuration = rightDuration;
  }

  applySlot(side, slot) {
    const hand = side === 'left' ? this.leftHand : this.rightHand;
    const entry = slot?.entry;
    if (!entry) {
      hand.setAnimationFrame(`default-${side}`);
      hand.setFingerHighlight(null);
      return;
    }
    hand.setAnimationFrame(entry.pose);
    hand.setFingerHighlight(entry.highlight ? `${entry.highlight}${entry.full ? '-full' : ''}` : null);
  }

  applyPose(pose, snap = false) {
    const slots = resolveHandSlots({
      layout: this.layout,
      key: pose.key,
      side: pose.side,
      dominantHand: this.dominantHand(),
      animated: this.animated,
    });
    const leftDuration = this.leftHand.frameTransitionDuration;
    const rightDuration = this.rightHand.frameTransitionDuration;
    if (snap) {
      this.leftHand.frameTransitionDuration = 0;
      this.rightHand.frameTransitionDuration = 0;
    }
    this.applySlot('left', slots.left);
    this.applySlot('right', slots.right);
    if (snap) {
      this.leftHand.frameTransitionDuration = leftDuration;
      this.rightHand.frameTransitionDuration = rightDuration;
    }
    this.markDirty();
  }

  setPose(pose = {}) {
    if (this.disposed || pose.wrong) return;
    this.pendingPose = pose;
    this.recordHighlightRequest();
    if (this.leftHand.clipByName.has('base')) this.applyPose(pose);
  }

  setVisible(value) {
    const next = Boolean(value);
    this.visible = next;
    // The renderer is released as soon as the model fails to load or the mount is
    // destroyed; the 2-D fallback hands own the box from then on.
    if (!this.renderer) return;
    this.renderer.domElement.style.display = next ? 'block' : 'none';
    this.renderer.domElement.style.visibility = next && this.leftHand.clipByName.has('base') ? 'visible' : 'hidden';
    this.leftHand.group.visible = next && !this.hands.rightOnly;
    this.rightHand.group.visible = next && !this.hands.leftOnly;
    if (next) {
      // `display` changes the container box, so the observed size may have been
      // reported as zero while the canvas was hidden.
      this.resize(true);
      this.markDirty();
    } else {
      this.stopLoop();
    }
  }

  setGuideStrength(value) {
    const strength = Number.isFinite(Number(value)) ? Math.max(0, Number(value)) : 0;
    if (this.guideStrength === strength) return;
    this.guideStrength = strength;
    this.leftHand.setGuideStrength(strength);
    this.rightHand.setGuideStrength(strength);
    this.markDirty();
  }

  setHands({ leftOnly = false, rightOnly = false } = {}) {
    this.hands = { leftOnly: Boolean(leftOnly), rightOnly: Boolean(rightOnly) };
    this.leftHand.group.visible = this.visible && !this.hands.rightOnly;
    this.rightHand.group.visible = this.visible && !this.hands.leftOnly;
    if (this.pendingPose && this.leftHand.clipByName.has('base')) this.applyPose(this.pendingPose, true);
    this.markDirty();
  }

  /** Returns true when the drawing buffer or the projection actually changed. */
  resize(force = false) {
    if (!this.renderer) return false;
    const width = this.container.clientWidth;
    const height = width * 0.83333333;
    if (width < 1 || height < 1) return false;
    if (!force && width === this.lastWidth) return false;
    this.lastWidth = width;
    const horizontal = 1.4 * (width / height);
    this.camera.left = -horizontal;
    this.camera.right = horizontal;
    this.camera.top = 1.4;
    this.camera.bottom = -1.4;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
    // Match the legacy player's proportional canvas box; the hand scene uses
    // the same orthographic projection for desktop and mobile layouts.
    this.renderer.domElement.style.width = `${width}px`;
    this.renderer.domElement.style.height = `${height}px`;
    return true;
  }

  markDirty() {
    if (this.disposed) return;
    this.needsRender = true;
    this.startLoop();
  }

  // `WebGLRenderer.setAnimationLoop` cannot be stopped from inside its own callback -
  // three reschedules the next frame after the callback returns - so the on-demand loop
  // owns its requestAnimationFrame handle instead.
  scheduleFrame() {
    if (this.disposed || this.frameHandle || !this.visible || document.hidden) return;
    this.frameHandle = requestAnimationFrame(this.renderFrame);
  }

  startLoop() {
    if (this.frameHandle) return;
    // Drop the time spent parked so the first tween step gets a frame-sized delta.
    this.clock.getDelta();
    this.scheduleFrame();
  }

  stopLoop() {
    if (!this.frameHandle) return;
    cancelAnimationFrame(this.frameHandle);
    this.frameHandle = 0;
  }

  render() {
    if (this.disposed || !this.renderer) return;
    const delta = this.clock.getDelta();
    if (!this.visible || document.hidden) return;
    const tweening = Boolean(this.leftHand.frameTween || this.rightHand.frameTween);
    this.updateAdaptiveHandSpeed(delta);
    if (tweening) {
      this.leftHand.update(delta);
      this.rightHand.update(delta);
      this.needsRender = true;
    }
    if (this.needsRender) {
      this.needsRender = false;
      this.renderer.render(this.scene, this.camera);
      this.scheduleFrame();
      return;
    }
    // Keep spinning while the adaptive speed is still easing; it changes the
    // tween duration of the next keystroke rather than anything on screen.
    if (this.adaptiveTransition) this.scheduleFrame();
  }

  /**
   * A keyboard - and with it a renderer - is built per lesson screen, and three's
   * `dispose()` only frees the GPU objects it allocated: it leaves the WebGL context
   * itself alive. Chrome keeps at most 16 contexts per tab and silently kills the
   * oldest one past that, which blanks the live hands mid-lesson, so the context is
   * explicitly lost here and the canvas shrunk to 1x1 to release its backing store.
   * Idempotent, and safe when the renderer never finished constructing.
   */
  releaseRenderer() {
    const renderer = this.renderer;
    if (!renderer) return;
    this.renderer = null;
    const canvas = renderer.domElement;
    try { renderer.forceContextLoss(); } catch { /* context already lost */ }
    try { renderer.dispose(); } catch { /* nothing left to free */ }
    if (canvas) {
      canvas.width = 1;
      canvas.height = 1;
      canvas.remove();
    }
  }

  destroy() {
    if (this.disposed && !this.renderer) return;
    this.disposed = true;
    this.stopLoop();
    this.resizeObserver?.disconnect();
    document.removeEventListener('visibilitychange', this.handleVisibilityChange);
    this.leftHand?.dispose();
    this.rightHand?.dispose();
    this.releaseRenderer();
    this.revealFallbackHands();
  }
}

export function mountTypingHands(container, options = {}) {
  if (!(container instanceof HTMLElement)) return null;
  try {
    return new SourceTypingHands(container, options);
  } catch (error) {
    console.warn('[hands-3d] unavailable', error);
    container.querySelectorAll('.js-left-hand, .js-right-hand').forEach((node) => node.style.removeProperty('display'));
    return null;
  }
}
