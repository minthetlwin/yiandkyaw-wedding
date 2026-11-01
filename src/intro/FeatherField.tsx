import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { useEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { paintFeather, seeded, type FeatherKind } from '../lib/feather'

/**
 * The ambient layer: white down feathers falling through warm light, with
 * champagne dust motes. Feathers drift on curl noise, rock like falling leaves
 * and shy away from the pointer with a little inertia. When the seal breaks,
 * a spray of golden stardust and tiny down bursts from it; when the letter
 * opens, the camera pushes forward through the feathers.
 *
 * One small scene, one draw call per layer, no post-processing.
 */

export interface Burst {
  /** Viewport position (CSS px) of the seal. */
  x: number
  y: number
  id: number
}

export interface FeatherFieldProps {
  /** 'intro' floats over the envelope; 'ambient' drifts quietly behind the page. */
  mode: 'intro' | 'ambient'
  burst: Burst | null
  /** Push the camera forward through the feathers (the zoom into the card). */
  dolly: boolean
}

const CAMERA_Z = 8
const DOLLY_Z = 3.2
const FOV = 40

// --- shared pointer state (window-level: the canvas never takes events) -----

const pointer = { ndc: new THREE.Vector2(9, 9), active: false, tapAt: 0 }

function usePointer() {
  useEffect(() => {
    const set = (e: PointerEvent) =>
      pointer.ndc.set((e.clientX / window.innerWidth) * 2 - 1, -(e.clientY / window.innerHeight) * 2 + 1)
    const move = (e: PointerEvent) => {
      set(e)
      pointer.active = true
    }
    const down = (e: PointerEvent) => {
      set(e)
      pointer.active = true
      pointer.tapAt = performance.now()
    }
    // Touch has no hover: once the finger lifts, stop pushing.
    const up = (e: PointerEvent) => {
      if (e.pointerType !== 'mouse') pointer.active = false
    }
    const leave = () => {
      pointer.active = false
    }
    window.addEventListener('pointermove', move, { passive: true })
    window.addEventListener('pointerdown', down, { passive: true })
    window.addEventListener('pointerup', up, { passive: true })
    window.addEventListener('pointercancel', up, { passive: true })
    document.documentElement.addEventListener('pointerleave', leave)
    return () => {
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerdown', down)
      window.removeEventListener('pointerup', up)
      window.removeEventListener('pointercancel', up)
      document.documentElement.removeEventListener('pointerleave', leave)
    }
  }, [])
}

// --- helpers ------------------------------------------------------------------

const TAN_HALF_FOV = Math.tan(THREE.MathUtils.degToRad(FOV / 2))

/** Half the visible height, in world units, at depth `z`. */
const halfHeightAt = (camera: THREE.Camera, z: number) => TAN_HALF_FOV * Math.max(0.2, camera.position.z - z)

/** The world point at depth `z` under a viewport position (CSS px). */
function screenToWorld(camera: THREE.Camera, size: { width: number; height: number }, x: number, y: number, z: number) {
  const p = new THREE.Vector3((x / size.width) * 2 - 1, -(y / size.height) * 2 + 1, 0.5).unproject(camera)
  p.sub(camera.position).normalize()
  return p.multiplyScalar((z - camera.position.z) / p.z).add(camera.position)
}

/**
 * Divergence-free drift: the analytic curl of a smooth, slowly evolving
 * potential field, two octaves. Feathers follow it like eddies in still air.
 */
function curl(x: number, y: number, z: number, t: number, out: THREE.Vector3) {
  out.set(
    -0.72 * Math.sin(1.2 * y + t * 0.13) - 0.8 * Math.cos(0.8 * z + t * 0.15 + 1.7) - 0.3 * Math.sin(2.6 * y - t * 0.2),
    -0.78 * Math.sin(1.3 * z - t * 0.17) - 0.7 * Math.cos(0.7 * x - t * 0.23 + 3.1) - 0.3 * Math.cos(2.3 * x + t * 0.21),
    -0.66 * Math.sin(1.1 * x + t * 0.19) - 0.9 * Math.cos(0.9 * y + t * 0.21) - 0.25 * Math.sin(2.1 * y + 1.3),
  )
  return out
}

/** A feather-shaped plane, arched along its length, cupped across and gently twisted. */
function featherGeometry() {
  const w = 0.42
  const h = 1.05
  const geo = new THREE.PlaneGeometry(w, h, 8, 22)
  const p = geo.attributes.position
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i)
    const y = p.getY(i)
    const v = y / (h / 2)
    let z = 0.16 * v * v - 1.1 * x * x
    const twist = v * 0.32
    const nx = x * Math.cos(twist) - z * Math.sin(twist)
    z = x * Math.sin(twist) + z * Math.cos(twist)
    p.setXYZ(i, nx, y, z)
  }
  geo.computeVertexNormals()
  return geo
}

function featherTexture(gl: THREE.WebGLRenderer, seed: number, kind: FeatherKind) {
  const canvas = document.createElement('canvas')
  canvas.width = 256
  canvas.height = 640
  const tex = new THREE.CanvasTexture(paintFeather(canvas, { seed, kind }))
  tex.colorSpace = THREE.SRGBColorSpace
  tex.anisotropy = Math.min(8, gl.capabilities.getMaxAnisotropy())
  return tex
}

// --- feathers -----------------------------------------------------------------

interface Flake {
  pos: THREE.Vector3
  vel: THREE.Vector3
  /** Extra orientation from pushes; springs back to zero. */
  kick: THREE.Vector3
  kickVel: THREE.Vector3
  fall: number
  sway: number
  freq: number
  phase: number
  spin: number
  roll: number
  scale: number
  active: boolean
}

interface SwarmProps {
  count: number
  kind: FeatherKind
  seed: number
  /** Dormant swarms only appear when the seal bursts, and are not replaced when they fall away. */
  dormant?: boolean
  burst?: Burst | null
}

function Swarm({ count, kind, seed, dormant = false, burst }: SwarmProps) {
  const mesh = useRef<THREE.InstancedMesh>(null)
  const { gl, camera, size } = useThree()
  const geometry = useMemo(() => featherGeometry(), [])
  const material = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        map: featherTexture(gl, seed, kind),
        transparent: true,
        depthWrite: false,
        alphaTest: 0.012,
        side: THREE.DoubleSide,
        roughness: 0.82,
        metalness: 0,
        emissive: new THREE.Color('#fffaf1'),
        emissiveIntensity: 0.55,
      }),
    [gl, seed, kind],
  )
  const rand = useMemo(() => seeded(seed * 7919), [seed])

  const flakes = useMemo<Flake[]>(() => {
    const r = seeded(seed * 104729)
    const aspect = window.innerWidth / window.innerHeight
    return Array.from({ length: count }, () => {
      const z = -3.6 + r() * 5.4
      const hh = TAN_HALF_FOV * (CAMERA_Z - z)
      return {
        pos: new THREE.Vector3((r() * 2 - 1) * hh * aspect, (r() * 2 - 1) * hh, z),
        vel: new THREE.Vector3(0, -0.3, 0),
        kick: new THREE.Vector3(),
        kickVel: new THREE.Vector3(),
        fall: kind === 'down' ? 0.12 + r() * 0.1 : 0.22 + r() * 0.2,
        sway: 0.25 + r() * 0.35,
        freq: 0.7 + r() * 0.7,
        phase: r() * Math.PI * 2,
        spin: (0.12 + r() * 0.35) * (r() > 0.5 ? 1 : -1),
        roll: (r() - 0.5) * 3.2,
        scale: kind === 'down' ? 0.28 + r() * 0.2 : 0.75 + r() * 0.55,
        active: !dormant,
      }
    })
  }, [count, kind, seed, dormant])

  // Seal burst: dormant down puffs spring out of the seal.
  useEffect(() => {
    if (!dormant || !burst) return
    const origin = screenToWorld(camera, size, burst.x, burst.y, 1.2)
    for (const f of flakes) {
      f.active = true
      f.pos.copy(origin).add(new THREE.Vector3((rand() - 0.5) * 0.2, (rand() - 0.5) * 0.2, rand() * 0.3))
      const a = rand() * Math.PI * 2
      const speed = 1.1 + rand() * 1.8
      f.vel.set(Math.cos(a) * speed, Math.abs(Math.sin(a)) * speed * 0.9 + 0.6, rand() * 0.8)
      f.kickVel.set((rand() - 0.5) * 8, (rand() - 0.5) * 8, (rand() - 0.5) * 8)
    }
  }, [burst, dormant, flakes, camera, size, rand])

  useEffect(
    () => () => {
      geometry.dispose()
      material.map?.dispose()
      material.dispose()
    },
    [geometry, material],
  )

  const scratch = useMemo(
    () => ({ dummy: new THREE.Object3D(), drift: new THREE.Vector3(), target: new THREE.Vector3(), ndc: new THREE.Vector3(), lastTap: 0 }),
    [],
  )

  useFrame(({ clock }, delta) => {
    const m = mesh.current
    if (!m) return
    const dt = Math.min(delta, 1 / 30)
    const t = clock.elapsedTime
    const aspect = size.width / size.height
    const { dummy, drift, target, ndc } = scratch
    const tap = pointer.tapAt > scratch.lastTap
    if (tap) scratch.lastTap = pointer.tapAt
    const relax = 1 - Math.exp(-dt * 1.3)
    const kickDamp = Math.exp(-dt * 2.4)
    const kickReturn = Math.exp(-dt * 0.7)

    for (let i = 0; i < flakes.length; i++) {
      const f = flakes[i]
      if (!f.active) {
        dummy.scale.setScalar(0)
        dummy.updateMatrix()
        m.setMatrixAt(i, dummy.matrix)
        continue
      }

      // Drift: velocity eases toward fall + leaf-like sway + curl eddies (that easing is the inertia).
      curl(f.pos.x * 0.32, f.pos.y * 0.32, f.pos.z * 0.32, t, drift)
      const swing = Math.cos(t * f.freq + f.phase)
      target.set(swing * f.sway + drift.x * 0.2, -f.fall + drift.y * 0.1, drift.z * 0.12)
      f.vel.lerp(target, relax)

      // The pointer pushes nearby feathers away; a tap gives a little gust.
      const depth = camera.position.z - f.pos.z
      if (depth > 0.3 && (pointer.active || tap)) {
        ndc.copy(f.pos).project(camera)
        const dx = (ndc.x - pointer.ndc.x) * aspect
        const dy = ndc.y - pointer.ndc.y
        const d = Math.hypot(dx, dy)
        const R = 0.34
        if (d < R) {
          const k = (1 - d / R) ** 2
          const reach = (depth / CAMERA_Z) * 1.6
          const nx = d > 1e-4 ? dx / d : 1
          const ny = d > 1e-4 ? dy / d : 0
          const impulse = (pointer.active ? 5.5 * dt : 0) + (tap ? 2.2 : 0)
          f.vel.x += nx * k * impulse * reach
          f.vel.y += ny * k * impulse * reach
          f.vel.z -= k * impulse * 0.3
          f.kickVel.z += -nx * k * impulse * 4
          f.kickVel.x += ny * k * impulse * 3
        }
      }

      f.kickVel.multiplyScalar(kickDamp)
      f.kick.addScaledVector(f.kickVel, dt).multiplyScalar(kickReturn)
      f.pos.addScaledVector(f.vel, dt)

      // Keep the field full: recycle what falls out of view or passes the camera.
      const hh = halfHeightAt(camera, f.pos.z)
      const hw = hh * aspect
      const passed = f.pos.z > camera.position.z - 0.7
      if (f.pos.y < -hh - 0.8 || Math.abs(f.pos.x) > hw + 1 || passed) {
        if (dormant) {
          f.active = false
          continue
        }
        f.pos.z = passed ? camera.position.z - 6 - rand() * 4 : -3.6 + rand() * 5.4
        const nh = halfHeightAt(camera, f.pos.z)
        f.pos.x = (rand() * 2 - 1) * nh * aspect
        f.pos.y = passed ? (rand() * 2 - 1) * nh : nh + 0.6 + rand() * 0.8
        f.vel.set(0, -f.fall, 0)
      }

      // Orientation: rock with the swing (steepest at the ends), tip toward and away, turn slowly.
      const rock = Math.sin(t * f.freq + f.phase)
      dummy.position.copy(f.pos)
      dummy.rotation.set(
        Math.sin(t * f.freq * 0.7 + f.phase * 1.3) * 0.75 + f.kick.x,
        t * f.spin + f.phase + f.kick.y,
        f.roll + rock * 0.55 + f.kick.z,
      )
      dummy.scale.setScalar(f.scale)
      dummy.updateMatrix()
      m.setMatrixAt(i, dummy.matrix)
    }
    m.instanceMatrix.needsUpdate = true
  })

  return <instancedMesh ref={mesh} args={[geometry, material, count]} frustumCulled={false} />
}

// --- sparkles: shared point-sprite material -------------------------------------

const SPARKLE_VERT = /* glsl */ `
  attribute float aSize;
  attribute float aAlpha;
  attribute vec3 aColor;
  uniform float uPixelRatio;
  varying float vAlpha;
  varying vec3 vColor;
  void main() {
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    gl_Position = projectionMatrix * mv;
    gl_PointSize = aSize * uPixelRatio * (${CAMERA_Z.toFixed(1)} / max(0.5, -mv.z));
    vAlpha = aAlpha;
    vColor = aColor;
  }
`

// A soft golden core with a faint four-point glint.
const SPARKLE_FRAG = /* glsl */ `
  varying float vAlpha;
  varying vec3 vColor;
  void main() {
    vec2 p = gl_PointCoord - 0.5;
    float d = length(p);
    float core = pow(smoothstep(0.5, 0.0, d), 2.4);
    float glint = max(0.0, 1.0 - abs(p.x) * 16.0) * max(0.0, 1.0 - abs(p.y) * 2.2)
                + max(0.0, 1.0 - abs(p.y) * 16.0) * max(0.0, 1.0 - abs(p.x) * 2.2);
    float a = (core + glint * 0.4) * vAlpha;
    if (a < 0.004) discard;
    gl_FragColor = vec4(vColor, a);
  }
`

/** Champagne golds, as raw sRGB (the shader writes them straight to screen). */
const GOLDS = ['#d4af37', '#e6c873', '#f3e1a6', '#c39a35', '#fff1c8'].map((hex) => {
  const n = parseInt(hex.slice(1), 16)
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255] as const
})

function useSparkles(count: number) {
  const gl = useThree((s) => s.gl)
  return useMemo(() => {
    const geometry = new THREE.BufferGeometry()
    const position = new Float32Array(count * 3)
    const size = new Float32Array(count)
    const alpha = new Float32Array(count)
    const color = new Float32Array(count * 3)
    geometry.setAttribute('position', new THREE.BufferAttribute(position, 3).setUsage(THREE.DynamicDrawUsage))
    geometry.setAttribute('aSize', new THREE.BufferAttribute(size, 1))
    geometry.setAttribute('aAlpha', new THREE.BufferAttribute(alpha, 1).setUsage(THREE.DynamicDrawUsage))
    geometry.setAttribute('aColor', new THREE.BufferAttribute(color, 3))
    const material = new THREE.ShaderMaterial({
      vertexShader: SPARKLE_VERT,
      fragmentShader: SPARKLE_FRAG,
      uniforms: { uPixelRatio: { value: gl.getPixelRatio() } },
      transparent: true,
      depthWrite: false,
    })
    return { geometry, material, position, size, alpha, color }
  }, [count, gl])
}

/** Fine champagne dust, slowly rising and twinkling. */
function GoldDust({ count }: { count: number }) {
  const s = useSparkles(count)
  const { camera, size } = useThree()
  const motes = useMemo(() => {
    const r = seeded(31)
    return Array.from({ length: count }, (_, i) => {
      const c = GOLDS[i % GOLDS.length]
      s.color.set(c, i * 3)
      s.size[i] = 2.5 + r() * 5
      return { x: (r() * 2 - 1) * 7, y: (r() * 2 - 1) * 4.5, z: -4 + r() * 6, rise: 0.04 + r() * 0.08, tw: 0.8 + r() * 2.2, ph: r() * 6.3, base: 0.35 + r() * 0.5 }
    })
  }, [count, s])

  useEffect(
    () => () => {
      s.geometry.dispose()
      s.material.dispose()
    },
    [s],
  )

  const drift = useMemo(() => new THREE.Vector3(), [])
  useFrame(({ clock }, delta) => {
    const dt = Math.min(delta, 1 / 30)
    const t = clock.elapsedTime
    const aspect = size.width / size.height
    motes.forEach((m, i) => {
      curl(m.x * 0.4, m.y * 0.4, m.z * 0.4, t * 0.6, drift)
      m.x += drift.x * 0.05 * dt
      m.y += (m.rise + drift.y * 0.04) * dt
      m.z += drift.z * 0.04 * dt
      const hh = halfHeightAt(camera, m.z)
      if (m.y > hh + 0.3) m.y = -hh - 0.3
      if (m.z > camera.position.z - 0.5) m.z -= 8
      const hw = hh * aspect
      if (m.x > hw + 0.3) m.x = -hw - 0.3
      else if (m.x < -hw - 0.3) m.x = hw + 0.3
      s.position[i * 3] = m.x
      s.position[i * 3 + 1] = m.y
      s.position[i * 3 + 2] = m.z
      s.alpha[i] = m.base * (0.35 + 0.65 * Math.sin(t * m.tw + m.ph) ** 2)
    })
    s.geometry.attributes.position.needsUpdate = true
    s.geometry.attributes.aAlpha.needsUpdate = true
  })

  return <points geometry={s.geometry} material={s.material} frustumCulled={false} />
}

/** The seal's spray: warm golden stardust that blooms, drifts and fades. */
function Stardust({ burst, count = 220 }: { burst: Burst | null; count?: number }) {
  const s = useSparkles(count)
  const { camera, size } = useThree()
  const sparks = useMemo(
    () => Array.from({ length: count }, () => ({ p: new THREE.Vector3(), v: new THREE.Vector3(), age: 1, life: 1, base: 1, tw: 1 })),
    [count],
  )

  useEffect(() => {
    if (!burst) return
    const r = seeded(burst.id * 4099 + 17)
    const origin = screenToWorld(camera, size, burst.x, burst.y, 1.5)
    sparks.forEach((sp, i) => {
      const a = r() * Math.PI * 2
      const lift = r() ** 0.6
      const speed = 0.5 + r() ** 1.6 * 3.4
      sp.p.copy(origin).add(new THREE.Vector3((r() - 0.5) * 0.15, (r() - 0.5) * 0.15, 0))
      sp.v.set(Math.cos(a) * speed, Math.sin(a) * speed * 0.8 + lift * 1.2, (r() - 0.3) * 1.2)
      sp.age = 0
      sp.life = 1.3 + r() * 1.6
      sp.base = 0.6 + r() * 0.4
      sp.tw = 6 + r() * 14
      s.size[i] = 3 + r() ** 2 * 18
      s.color.set(GOLDS[Math.floor(r() * GOLDS.length)], i * 3)
    })
    s.geometry.attributes.aSize.needsUpdate = true
    s.geometry.attributes.aColor.needsUpdate = true
  }, [burst, camera, size, sparks, s])

  useEffect(
    () => () => {
      s.geometry.dispose()
      s.material.dispose()
    },
    [s],
  )

  useFrame(({ clock }, delta) => {
    const dt = Math.min(delta, 1 / 30)
    const drag = Math.exp(-dt * 1.9)
    sparks.forEach((sp, i) => {
      if (sp.age >= sp.life) {
        s.alpha[i] = 0
        return
      }
      sp.age += dt
      sp.v.multiplyScalar(drag)
      sp.v.y -= 0.35 * dt
      sp.p.addScaledVector(sp.v, dt)
      const k = Math.min(1, sp.age / sp.life)
      const twinkle = 0.7 + 0.3 * Math.sin(clock.elapsedTime * sp.tw + i)
      s.alpha[i] = sp.base * (1 - k) ** 1.4 * twinkle * Math.min(1, sp.age * 12)
      s.position[i * 3] = sp.p.x
      s.position[i * 3 + 1] = sp.p.y
      s.position[i * 3 + 2] = sp.p.z
    })
    s.geometry.attributes.position.needsUpdate = true
    s.geometry.attributes.aAlpha.needsUpdate = true
  })

  return <points geometry={s.geometry} material={s.material} frustumCulled={false} />
}

/** Gentle parallax with the pointer; the forward push when the letter opens. */
function CameraRig({ dolly, mode }: { dolly: boolean; mode: FeatherFieldProps['mode'] }) {
  const camera = useThree((s) => s.camera)

  // The ambient field starts fresh behind the page (it fades in from invisible).
  useEffect(() => {
    if (mode === 'ambient') camera.position.set(0, 0, CAMERA_Z)
  }, [mode, camera])

  useFrame((_, delta) => {
    const dt = Math.min(delta, 1 / 30)
    const z = dolly ? DOLLY_Z : CAMERA_Z
    camera.position.z += (z - camera.position.z) * (1 - Math.exp(-dt * (dolly ? 1.5 : 4)))
    const tx = pointer.active ? pointer.ndc.x * 0.28 : 0
    const ty = pointer.active ? pointer.ndc.y * 0.16 : 0
    const ease = 1 - Math.exp(-dt * 1.4)
    camera.position.x += (tx - camera.position.x) * ease
    camera.position.y += (ty - camera.position.y) * ease
    camera.lookAt(camera.position.x * 0.4, camera.position.y * 0.4, -6)
  })
  return null
}

export default function FeatherField({ mode, burst, dolly }: FeatherFieldProps) {
  usePointer()
  const small = useMemo(() => window.matchMedia('(pointer: coarse)').matches || window.innerWidth < 768, [])
  const half = small ? 8 : 9

  return (
    <Canvas
      className="!absolute inset-0"
      style={{ pointerEvents: 'none' }}
      dpr={[1, small ? 1.75 : 2]}
      gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
      camera={{ position: [0, 0, CAMERA_Z], fov: FOV, near: 0.1, far: 40 }}
    >
      <ambientLight intensity={1.5} color="#fffaf2" />
      <hemisphereLight args={['#ffffff', '#efe4d2', 0.8]} />
      <directionalLight position={[-3, 5, 6]} intensity={1.5} color="#fff6e6" />
      <directionalLight position={[4, -2, 3]} intensity={0.35} color="#f1e2c6" />
      <CameraRig dolly={dolly} mode={mode} />
      {/* Two hands of feather, for variety: 15–18 in all. */}
      <Swarm count={half} kind="contour" seed={3} />
      <Swarm count={half - 1} kind="contour" seed={11} />
      <Swarm count={10} kind="down" seed={5} dormant burst={burst} />
      <GoldDust count={small ? 40 : 70} />
      <Stardust burst={burst} />
    </Canvas>
  )
}
