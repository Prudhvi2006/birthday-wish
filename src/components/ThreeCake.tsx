import React, { useEffect, useRef } from "react";
import * as THREE from "three";

interface ThreeCakeProps {
  candles: boolean[];
  onBlowCandle: (index: number) => void;
}

export default function ThreeCake({ candles, onBlowCandle }: ThreeCakeProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const flamesRef = useRef<(THREE.Mesh | null)[]>([]);
  const candlesRef = useRef<(THREE.Mesh | null)[]>([]);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cakeGroupRef = useRef<THREE.Group | null>(null);

  // Sync candle lit states when candles prop changes
  useEffect(() => {
    candles.forEach((isLit, idx) => {
      const flame = flamesRef.current[idx];
      if (flame) {
        flame.visible = isLit;
      }
    });
  }, [candles]);

  useEffect(() => {
    if (!containerRef.current) return;

    const container = containerRef.current;
    
    // Create Scene with a subtle transparent background or dark background to blend with page
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    // Create Camera
    const camera = new THREE.PerspectiveCamera(
      45,
      container.clientWidth / container.clientHeight,
      0.1,
      1000
    );
    camera.position.set(0, 4.5, 9);
    camera.lookAt(0, 1.5, 0);

    // Create Renderer with antialiasing and alpha (transparent bg)
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(container.clientWidth, container.clientHeight);
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.95);
    scene.add(ambientLight);

    // Warm directional light
    const dirLight1 = new THREE.DirectionalLight(0xfff3e0, 1.8);
    dirLight1.position.set(5, 10, 5);
    scene.add(dirLight1);

    // Soft cool feedback light from front-low
    const dirLight2 = new THREE.DirectionalLight(0xbbdefb, 0.6);
    dirLight2.position.set(-5, 2, -5);
    scene.add(dirLight2);

    // Sparkly point light on top of cake for candles shine
    const pointLight = new THREE.PointLight(0xffaa00, 1.2, 10);
    pointLight.position.set(0, 4, 0);
    scene.add(pointLight);

    // Cake Group
    const cakeGroup = new THREE.Group();
    cakeGroupRef.current = cakeGroup;

    // 1. Bottom Layer (Rich matcha cream - 0x2ecc71)
    const bottomCake = new THREE.Mesh(
      new THREE.CylinderGeometry(3, 3, 1.5, 32),
      new THREE.MeshStandardMaterial({
        color: 0x2ecc71,
        roughness: 0.3,
        metalness: 0.1,
      })
    );
    bottomCake.position.y = 0.75;
    cakeGroup.add(bottomCake);

    // Add lovely decorative sprinkles around Bottom Layer
    for (let i = 0; i < 16; i++) {
      const angle = (i / 16) * Math.PI * 2;
      const x = Math.cos(angle) * 2.95;
      const z = Math.sin(angle) * 2.95;
      const color = i % 3 === 0 ? 0xff4081 : i % 3 === 1 ? 0xffeb3b : 0x00e5ff;
      
      const sprinkle = new THREE.Mesh(
        new THREE.SphereGeometry(0.12, 8, 8),
        new THREE.MeshStandardMaterial({ color, roughness: 0.2 })
      );
      sprinkle.position.set(x, 0.75 + (Math.sin(i) * 0.3), z);
      cakeGroup.add(sprinkle);
    }

    // 2. Middle Layer (Creamy forest - 0x27ae60)
    const middleCake = new THREE.Mesh(
      new THREE.CylinderGeometry(2.2, 2.2, 1.3, 32),
      new THREE.MeshStandardMaterial({
        color: 0x27ae60,
        roughness: 0.4,
        metalness: 0.05,
      })
    );
    middleCake.position.y = 1.4 + 0.65; // middle of its segment
    cakeGroup.add(middleCake);

    // Decorative chocolate drops on Middle Layer
    for (let i = 0; i < 12; i++) {
      const angle = (i / 12) * Math.PI * 2;
      const x = Math.cos(angle) * 2.15;
      const z = Math.sin(angle) * 2.15;
      const drop = new THREE.Mesh(
        new THREE.CylinderGeometry(0.08, 0, 0.3, 8),
        new THREE.MeshStandardMaterial({ color: 0x5d4037, roughness: 0.1 })
      );
      drop.position.set(x, 1.8, z);
      drop.rotation.x = Math.PI / 2;
      drop.rotation.z = angle;
      cakeGroup.add(drop);
    }

    // 3. Top Layer (Dhanushka's Special Emerald Whip - 0x58d68d)
    const topCake = new THREE.Mesh(
      new THREE.CylinderGeometry(1.5, 1.5, 1.0, 32),
      new THREE.MeshStandardMaterial({
        color: 0x58d68d,
        roughness: 0.3,
        metalness: 0.08,
      })
    );
    topCake.position.y = 2.6 + 0.5; // aligned to y height
    cakeGroup.add(topCake);

    // Decorative strawberries on Top Layer
    for (let i = 0; i < 6; i++) {
      const angle = (i / 6) * Math.PI * 2 + 0.3;
      const x = Math.cos(angle) * 1.35;
      const z = Math.sin(angle) * 1.35;
      
      const strawberry = new THREE.Mesh(
        new THREE.SphereGeometry(0.18, 12, 12),
        new THREE.MeshStandardMaterial({ color: 0xe63946, roughness: 0.2 })
      );
      strawberry.scale.set(1, 1.3, 1);
      strawberry.position.set(x, 3.1, z);
      cakeGroup.add(strawberry);

      // tiny emerald leaf top
      const leaf = new THREE.Mesh(
        new THREE.ConeGeometry(0.05, 0.1, 4),
        new THREE.MeshStandardMaterial({ color: 0x4caf50 })
      );
      leaf.position.set(x, 3.25, z);
      cakeGroup.add(leaf);
    }

    // 4. Shiny Cake Stand Base plate under the cake
    const standPlate = new THREE.Mesh(
      new THREE.CylinderGeometry(3.3, 3.3, 0.15, 32),
      new THREE.MeshStandardMaterial({ color: 0xcccccc, metalness: 0.8, roughness: 0.2 })
    );
    standPlate.position.y = 0.05;
    cakeGroup.add(standPlate);

    const standLeg = new THREE.Mesh(
      new THREE.CylinderGeometry(1.2, 1.8, 0.4, 16),
      new THREE.MeshStandardMaterial({ color: 0xbbbbbb, metalness: 0.8, roughness: 0.2 })
    );
    standLeg.position.y = -0.2;
    cakeGroup.add(standLeg);

    // Candles
    const localFlames: (THREE.Mesh | null)[] = [];
    const localCandles: (THREE.Mesh | null)[] = [];

    for (let i = 0; i < 5; i++) {
      const angle = (i / 5) * Math.PI * 2;
      const x = Math.cos(angle) * 0.95;
      const z = Math.sin(angle) * 0.95;

      // Candle Stick Mesh (using Cylinder)
      const candleGeo = new THREE.CylinderGeometry(0.08, 0.08, 0.8, 16);
      const candleMat = new THREE.MeshStandardMaterial({
        color: i % 3 === 0 ? 0xff4081 : i % 3 === 1 ? 0x00e5ff : 0xffeb3b,
        roughness: 0.2,
      });
      const candle = new THREE.Mesh(candleGeo, candleMat);
      candle.position.set(x, 3.4, z);
      
      // Save index in userData so raycaster knows which index was tapped
      candle.userData = { index: i };
      cakeGroup.add(candle);
      localCandles[i] = candle;

      // Candle Flame Mesh (Cone)
      const flameGeo = new THREE.ConeGeometry(0.09, 0.24, 12);
      const flameMat = new THREE.MeshBasicMaterial({
        color: 0xffaa00,
      });
      const flame = new THREE.Mesh(flameGeo, flameMat);
      flame.position.set(x, 3.9, z);
      flame.visible = candles[i];
      cakeGroup.add(flame);
      localFlames[i] = flame;
    }

    flamesRef.current = localFlames;
    candlesRef.current = localCandles;

    scene.add(cakeGroup);

    // Tap/Click Raycaster listener
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    const onPointerDown = (event: PointerEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);

      // Search matching intersects in the candles
      const targetMeshes = localCandles.filter((c): c is THREE.Mesh => c !== null);
      const intersects = raycaster.intersectObjects(targetMeshes);

      if (intersects.length > 0) {
        const clickedObj = intersects[0].object;
        if (clickedObj && clickedObj.userData && typeof clickedObj.userData.index === "number") {
          const idx = clickedObj.userData.index;
          onBlowCandle(idx);
        }
      }
    };

    renderer.domElement.addEventListener("pointerdown", onPointerDown);

    // Animation loop
    let requestID: number;
    let clock = new THREE.Clock();

    const animate = () => {
      requestID = requestAnimationFrame(animate);

      // Constantly rotate the beautiful birthday cake group!
      cakeGroup.rotation.y += 0.009;

      const time = clock.getElapsedTime();

      // Flicker lit flames beautifully
      localFlames.forEach((flame, idx) => {
        if (flame && flame.visible) {
          const randScale = 1.0 + Math.sin(time * 25 + idx * 7) * 0.12;
          flame.scale.set(randScale, randScale + Math.cos(time * 30 + idx * 5) * 0.1, randScale);
          // Gently flicker colors between golden orange and warm yellow
          (flame.material as THREE.MeshBasicMaterial).color.setHex(
            Math.sin(time * 20 + idx) > 0 ? 0xffbb00 : 0xff8800
          );
        }
      });

      renderer.render(scene, camera);
    };

    animate();

    // Setup Resize Observer for container
    const resizeObserver = new ResizeObserver((entries) => {
      for (let entry of entries) {
        const { width, height } = entry.contentRect;
        if (width === 0 || height === 0) return;
        
        camera.aspect = width / height;
        camera.updateProjectionMatrix();
        renderer.setSize(width, height);
      }
    });
    
    resizeObserver.observe(container);

    // Cleanup everything
    return () => {
      cancelAnimationFrame(requestID);
      resizeObserver.disconnect();
      if (rendererRef.current && rendererRef.current.domElement) {
        rendererRef.current.domElement.removeEventListener("pointerdown", onPointerDown);
        if (container.contains(rendererRef.current.domElement)) {
          container.removeChild(rendererRef.current.domElement);
        }
      }
    };
  }, [onBlowCandle]);

  return (
    <div className="w-full relative flex flex-col items-center">
      {/* Three.js Render Box */}
      <div 
        ref={containerRef} 
        id="cake-3d-scene"
        className="w-full h-[280px] cursor-pointer relative overflow-hidden bg-radial-gradient"
      />
      {/* Instruction Subtext overlay */}
      <div className="absolute inset-x-0 bottom-1 flex justify-center pointer-events-none">
        <span className="text-[10px] uppercase tracking-wider text-[#e63946] bg-white/90 border border-[#ffcc33] font-mono font-bold px-2 py-0.5 rounded-full shadow-sm animate-pulse">
          🔄 DRAG OR ROTATE CAKE / TAP CANDLES TO BLOW! 🎂
        </span>
      </div>
    </div>
  );
}
