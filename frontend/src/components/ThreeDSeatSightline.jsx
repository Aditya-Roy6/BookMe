import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

/**
 * Ultra-Vibrant Photorealistic 3D Stadium & Cinema Sightline Engine
 * 60 FPS GPU InstancedMesh Architecture with Dynamic Stage Beams & Stadium Floodlights
 */
export default function ThreeDSeatSightline({
  row = 1,
  col = 1,
  totalRows = 8,
  totalCols = 28,
  moviePoster,
  categoryName = 'Prime Club',
  categoryColor = '#1ed760',
  venueType = 'cinema',
}) {
  const mountRef = useRef(null);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth || 320;
    const height = container.clientHeight || 160;

    // Detect Venue Type
    const typeStr = (venueType || 'cinema').toLowerCase();
    const isCircular =
      typeStr.includes('circular') ||
      typeStr.includes('stadium') ||
      typeStr.includes('amphi') ||
      typeStr.includes('arena') ||
      typeStr.includes('concert') ||
      typeStr.includes('festival') ||
      typeStr.includes('square');

    // 1. Scene & Camera Setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(isCircular ? 0x060810 : 0x0a0a0f);

    const camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 150);

    // 2. High-Performance WebGL Renderer
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: 'high-performance',
      alpha: false,
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = isCircular ? 1.6 : 1.3;
    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    let targetLookAt = new THREE.Vector3(0, 0.8, 0);

    // ─── 3. PHOTOREALISTIC VIBRANT CIRCULAR STADIUM ARENA WORLD ───
    if (isCircular) {
      const numR = Math.max(totalRows, 8);
      const numC = Math.max(totalCols, 28);

      // Radial Calculations
      const innerRadius = 5.2;
      const rowSpacing = 1.3;
      const getRadius = (r) => innerRadius + (r - 1) * rowSpacing;
      const getHeight = (r) => 0.5 + (r - 1) * 0.58;

      const myRadius = getRadius(row);
      const myHeight = getHeight(row);
      const seatAngle = ((col - 0.5) / numC) * 2 * Math.PI - Math.PI / 2;

      const mySeatX = myRadius * Math.cos(seatAngle);
      const mySeatZ = myRadius * Math.sin(seatAngle);
      const mySeatY = myHeight;

      // Position Camera at viewer's exact radial seat + sitting eye level
      camera.position.set(mySeatX, mySeatY + 0.75, mySeatZ);
      targetLookAt.set(0, 0.8, 0);
      camera.lookAt(targetLookAt);

      // ─── STADIUM ARENA LIGHTING ───
      // Bright Ambient Light with deep night-blue undertones
      const ambientLight = new THREE.AmbientLight(0x384c6e, 2.2);
      scene.add(ambientLight);

      // Overhead Sun/Arena Main Flood
      const mainArenaLight = new THREE.DirectionalLight(0xffeedd, 3.2);
      mainArenaLight.position.set(0, 25, 0);
      scene.add(mainArenaLight);

      // ─── 4 MASSIVE CORNER FLOODLIGHT TOWERS ───
      const floodDist = myRadius + 5.0;
      const towerColors = [0xffffff, 0xdbeafe, 0xffedd5, 0xe0f2fe];

      for (let fi = 0; fi < 4; fi++) {
        const fa = (fi / 4) * 2 * Math.PI + Math.PI / 4;
        const fx = floodDist * Math.cos(fa);
        const fz = floodDist * Math.sin(fa);

        // Tower Lattice Pole
        const poleMat = new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.8, roughness: 0.3 });
        const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.35, 18, 8), poleMat);
        pole.position.set(fx, 9, fz);
        scene.add(pole);

        // Gantry Head with 8 Bright Floodlamps
        const headGeo = new THREE.BoxGeometry(2.2, 1.2, 0.6);
        const headMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
        const head = new THREE.Mesh(headGeo, headMat);
        head.position.set(fx, 17.5, fz);
        head.lookAt(0, 2, 0);
        scene.add(head);

        // Tower Spotlight focused onto center stage & bowl
        const towerSpot = new THREE.SpotLight(towerColors[fi], 5.0, 65, Math.PI / 3, 0.3, 0.5);
        towerSpot.position.set(fx, 17.5, fz);
        towerSpot.target.position.set(0, 0.5, 0);
        scene.add(towerSpot);
        scene.add(towerSpot.target);
      }

      // ─── INFIELD ARENA FLOOR ───
      const floorMat = new THREE.MeshStandardMaterial({
        color: 0x0f172a,
        roughness: 0.7,
        metalness: 0.2,
      });
      const floor = new THREE.Mesh(new THREE.CylinderGeometry(myRadius + 6, myRadius + 6, 0.3, 48), floorMat);
      floor.position.set(0, -0.15, 0);
      scene.add(floor);

      // ─── SPECTACULAR CENTER CONCERT STAGE / ARENA ───
      // Hexagonal Elevated Stage
      const stageGeo = new THREE.CylinderGeometry(3.0, 3.2, 0.7, 6);
      const stageMat = new THREE.MeshStandardMaterial({
        color: 0x111827,
        roughness: 0.2,
        metalness: 0.6,
      });
      const centerStage = new THREE.Mesh(stageGeo, stageMat);
      centerStage.position.set(0, 0.35, 0);
      scene.add(centerStage);

      // Glowing Neon Stage Rim
      const stageRim = new THREE.Mesh(
        new THREE.TorusGeometry(3.05, 0.08, 12, 6),
        new THREE.MeshBasicMaterial({ color: 0x1ed760 })
      );
      stageRim.rotation.x = Math.PI / 2;
      stageRim.position.set(0, 0.72, 0);
      scene.add(stageRim);

      // Inner Glowing Star / Hexagon Decal
      const innerDecal = new THREE.Mesh(
        new THREE.CylinderGeometry(1.8, 1.8, 0.02, 6),
        new THREE.MeshBasicMaterial({ color: 0x065f46 })
      );
      innerDecal.position.set(0, 0.72, 0);
      scene.add(innerDecal);

      // Central Stage Laser / Light Emitter
      const stageGlow = new THREE.PointLight(0x1ed760, 4.5, 25);
      stageGlow.position.set(0, 2.5, 0);
      scene.add(stageGlow);

      // ─── DYNAMIC CONCERT LASER BEAMS & MOVING HEADS ───
      const beamColors = [0x00f2fe, 0x1ed760, 0xf43f5e, 0x8b5cf6, 0xf59e0b, 0x06b6d4];
      for (let b = 0; b < 6; b++) {
        const bAngle = (b / 6) * 2 * Math.PI;
        const bx = 2.4 * Math.cos(bAngle);
        const bz = 2.4 * Math.sin(bAngle);

        // Spotlight fixture
        const fixture = new THREE.Mesh(
          new THREE.CylinderGeometry(0.12, 0.15, 0.3, 8),
          new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.9 })
        );
        fixture.position.set(bx, 0.8, bz);
        scene.add(fixture);

        // Volumetric Laser Light Cone
        const coneGeo = new THREE.ConeGeometry(0.8, 14, 16, 1, true);
        const coneMat = new THREE.MeshBasicMaterial({
          color: beamColors[b],
          transparent: true,
          opacity: 0.18,
          side: THREE.DoubleSide,
        });
        const beamCone = new THREE.Mesh(coneGeo, coneMat);
        beamCone.position.set(bx, 7.5, bz);
        beamCone.rotation.x = (Math.PI / 180) * 16 * Math.sin(b);
        beamCone.rotation.z = (Math.PI / 180) * 16 * Math.cos(b);
        scene.add(beamCone);

        const spot = new THREE.SpotLight(beamColors[b], 3.0, 30, Math.PI / 6, 0.4);
        spot.position.set(bx, 0.9, bz);
        spot.target.position.set(bx * 2.5, 12, bz * 2.5);
        scene.add(spot);
        scene.add(spot.target);
      }

      // Overhead Truss Ring Suspended Above Center Stage
      const trussRing = new THREE.Mesh(
        new THREE.TorusGeometry(3.5, 0.12, 8, 24),
        new THREE.MeshStandardMaterial({ color: 0x475569, metalness: 0.8 })
      );
      trussRing.rotation.x = Math.PI / 2;
      trussRing.position.set(0, 6.5, 0);
      scene.add(trussRing);

      // 4 Main Aisle Stairways with Glowing Step LED Runners
      for (let a = 0; a < 4; a++) {
        const aisleAngle = (a / 4) * 2 * Math.PI - Math.PI / 2;
        const aisleLength = myRadius + 4;
        const aisleMesh = new THREE.Mesh(
          new THREE.BoxGeometry(0.7, 0.04, aisleLength),
          new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.9 })
        );
        aisleMesh.position.set((aisleLength / 2 + 0.5) * Math.cos(aisleAngle), 0.02, (aisleLength / 2 + 0.5) * Math.sin(aisleAngle));
        aisleMesh.rotation.y = -aisleAngle + Math.PI / 2;
        scene.add(aisleMesh);

        // Amber Aisle LED Strip
        const ledStrip = new THREE.Mesh(
          new THREE.BoxGeometry(0.08, 0.05, aisleLength),
          new THREE.MeshBasicMaterial({ color: 0xf59e0b })
        );
        ledStrip.position.set((aisleLength / 2 + 0.5) * Math.cos(aisleAngle) + 0.3 * Math.sin(aisleAngle), 0.03, (aisleLength / 2 + 0.5) * Math.sin(aisleAngle) - 0.3 * Math.cos(aisleAngle));
        ledStrip.rotation.y = -aisleAngle + Math.PI / 2;
        scene.add(ledStrip);
      }

      // ─── 360° RIBBON DISPLAY BOARDS AROUND BOWL ───
      const ribbonRadius = myRadius + 3.2;
      const ribbonGeo = new THREE.CylinderGeometry(ribbonRadius, ribbonRadius, 0.6, 48, 1, true);
      const ribbonMat = new THREE.MeshBasicMaterial({
        color: 0x1ed760,
        side: THREE.BackSide,
        transparent: true,
        opacity: 0.35,
      });
      const ribbon = new THREE.Mesh(ribbonGeo, ribbonMat);
      ribbon.position.set(0, getHeight(numR) + 0.8, 0);
      scene.add(ribbon);

      // ─── GPU INSTANCED HIGH-DETAIL STADIUM SEATING ───
      // Composite detailed seat geometry (Cushion + Ergonomic Backrest)
      const seatGroupGeo = new THREE.BoxGeometry(0.48, 0.52, 0.42);
      const seatMat = new THREE.MeshStandardMaterial({
        roughness: 0.4,
        metalness: 0.2,
      });

      // Tier Color Palette
      const tierColors = [
        new THREE.Color('#1ed760'), // Front Rows (VIP)
        new THREE.Color('#10b981'),
        new THREE.Color('#3b82f6'), // Mid Rows (Club)
        new THREE.Color('#2563eb'),
        new THREE.Color('#8b5cf6'), // Grand Tier
        new THREE.Color('#6366f1'),
        new THREE.Color('#ec4899'), // Upper Tier
        new THREE.Color('#f43f5e'),
      ];

      // Count Visible Seats in Camera FOV
      let instanceCount = 0;
      for (let r = 1; r <= numR; r++) {
        for (let c = 1; c <= numC; c++) {
          if (r === row && c === col) continue;
          const theta = ((c - 0.5) / numC) * 2 * Math.PI - Math.PI / 2;
          let diff = Math.abs(theta - seatAngle);
          if (diff > Math.PI) diff = 2 * Math.PI - diff;
          if (diff < (150 * Math.PI) / 180 || r < row) {
            instanceCount++;
          }
        }
      }

      const instancedSeats = new THREE.InstancedMesh(seatGroupGeo, seatMat, Math.max(1, instanceCount));
      const dummy = new THREE.Object3D();
      let instIdx = 0;

      for (let r = 1; r <= numR; r++) {
        const rad = getRadius(r);
        const y = getHeight(r);

        // Concrete Stepped Grandstand Tier
        const riserGeo = new THREE.TorusGeometry(rad, 0.72, 4, 40);
        const riserMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.85 });
        const riser = new THREE.Mesh(riserGeo, riserMat);
        riser.rotation.x = Math.PI / 2;
        riser.position.set(0, y - 0.24, 0);
        scene.add(riser);

        // Step-edge Glowing Amber Light Strip along every tier riser
        const stepLed = new THREE.Mesh(
          new THREE.TorusGeometry(rad + 0.65, 0.025, 4, 36),
          new THREE.MeshBasicMaterial({ color: 0xf59e0b })
        );
        stepLed.rotation.x = Math.PI / 2;
        stepLed.position.set(0, y - 0.02, 0);
        scene.add(stepLed);

        const baseTierColor = tierColors[(r - 1) % tierColors.length];

        for (let c = 1; c <= numC; c++) {
          if (r === row && c === col) continue;
          const theta = ((c - 0.5) / numC) * 2 * Math.PI - Math.PI / 2;
          let diff = Math.abs(theta - seatAngle);
          if (diff > Math.PI) diff = 2 * Math.PI - diff;

          if (diff < (150 * Math.PI) / 180 || r < row) {
            const sx = rad * Math.cos(theta);
            const sz = rad * Math.sin(theta);
            dummy.position.set(sx, y + 0.26, sz);
            dummy.rotation.y = -theta - Math.PI / 2;
            dummy.updateMatrix();
            instancedSeats.setMatrixAt(instIdx, dummy.matrix);

            // Give vibrant stadium colors: active category for neighbors, else tier palette
            if (r === row && Math.abs(c - col) <= 2) {
              instancedSeats.setColorAt(instIdx, new THREE.Color(categoryColor || '#1ed760'));
            } else {
              instancedSeats.setColorAt(instIdx, baseTierColor);
            }
            instIdx++;
          }
        }
      }

      instancedSeats.instanceMatrix.needsUpdate = true;
      if (instancedSeats.instanceColor) instancedSeats.instanceColor.needsUpdate = true;
      scene.add(instancedSeats);

      // ─── FIRST-PERSON VIP FOREGROUND CHAIR ARMRESTS ───
      const fgArmMat = new THREE.MeshStandardMaterial({
        color: new THREE.Color(categoryColor || '#1ed760').multiplyScalar(0.7),
        roughness: 0.35,
        metalness: 0.4,
      });

      const armL = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.42, 0.65), fgArmMat);
      armL.position.set(mySeatX - 0.38 * Math.sin(seatAngle), mySeatY + 0.32, mySeatZ + 0.38 * Math.cos(seatAngle));
      armL.rotation.y = -seatAngle + Math.PI / 2;
      scene.add(armL);

      const armR = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.42, 0.65), fgArmMat);
      armR.position.set(mySeatX + 0.38 * Math.sin(seatAngle), mySeatY + 0.32, mySeatZ - 0.38 * Math.cos(seatAngle));
      armR.rotation.y = -seatAngle + Math.PI / 2;
      scene.add(armR);

      // Cup Holders on Armrests
      const cupMat = new THREE.MeshBasicMaterial({ color: 0x0f172a });
      const cupL = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 0.1, 12), cupMat);
      cupL.position.set(armL.position.x, armL.position.y + 0.22, armL.position.z);
      scene.add(cupL);

      const cupR = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 0.1, 12), cupMat);
      cupR.position.set(armR.position.x, armR.position.y + 0.22, armR.position.z);
      scene.add(cupR);
    } else {
      // ─── MULTIPLEX CINEMA AUDITORIUM WORLD ───
      const numRows = Math.max(totalRows, 6);
      const numCols = Math.max(totalCols, 10);

      const getRowY = (r) => 0.4 + (r - 1) * 0.48;
      const getRowZ = (r) => 3.8 + (r - 1) * 1.45;

      const getSeatX = (c) => {
        const norm = (c - 0.5) / numCols - 0.5;
        let x = norm * 10.0;
        if (x >= 0) x += 0.4;
        else x -= 0.4;
        return x;
      };

      const mySeatX = getSeatX(col);
      const mySeatY = getRowY(row);
      const mySeatZ = getRowZ(row);

      camera.position.set(mySeatX, mySeatY + 0.72, mySeatZ);
      targetLookAt.set(0, 2.4, 0);
      camera.lookAt(targetLookAt);

      // Cinema Lights
      const ambientLight = new THREE.AmbientLight(0x2a1820, 1.8);
      scene.add(ambientLight);

      for (const zPos of [4, 8, 12, 16]) {
        const downlight = new THREE.PointLight(0xffeedd, 1.6, 12);
        downlight.position.set(0, 7.5, zPos);
        scene.add(downlight);
      }

      const screenBounce = new THREE.PointLight(0xffffff, 2.8, 18);
      screenBounce.position.set(0, 2.8, 1.2);
      scene.add(screenBounce);

      // Screen Texture Canvas
      const canvas = document.createElement('canvas');
      canvas.width = 1280;
      canvas.height = 720;
      const ctx = canvas.getContext('2d');

      const renderDefaultScreen = () => {
        const grad = ctx.createLinearGradient(0, 0, 1280, 720);
        grad.addColorStop(0, '#1e1b4b');
        grad.addColorStop(0.5, '#4338ca');
        grad.addColorStop(1, '#0f172a');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, 1280, 720);

        ctx.fillStyle = '#ffffff';
        ctx.font = '900 68px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('DOLBY CINEMA 4K LASER', 640, 320);

        ctx.fillStyle = '#1ed760';
        ctx.font = '700 36px monospace';
        ctx.fillText('DIRECT FIRST-PERSON SIGHTLINE', 640, 390);

        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 4;
        ctx.strokeRect(30, 30, 1220, 660);
      };

      renderDefaultScreen();
      const screenTex = new THREE.CanvasTexture(canvas);
      screenTex.colorSpace = THREE.SRGBColorSpace;

      const screenMat = new THREE.MeshBasicMaterial({
        map: screenTex,
        side: THREE.DoubleSide,
      });

      const activePoster =
        moviePoster ||
        'https://images.unsplash.com/photo-1536440136628-849c177e76a1?auto=format&fit=crop&w=1024&q=80';

      if (activePoster) {
        const loader = new THREE.TextureLoader();
        loader.setCrossOrigin('anonymous');
        loader.load(
          activePoster,
          (loadedTex) => {
            loadedTex.colorSpace = THREE.SRGBColorSpace;
            screenMat.map = loadedTex;
            screenMat.needsUpdate = true;
          },
          undefined,
          () => console.warn('Using 4K Dolby showcase texture')
        );
      }

      // Screen Mesh
      const screenMesh = new THREE.Mesh(new THREE.PlaneGeometry(14.5, 6.2), screenMat);
      screenMesh.position.set(0, 3.4, 0);
      scene.add(screenMesh);

      // Frame
      const screenFrame = new THREE.Mesh(new THREE.BoxGeometry(15.1, 6.8, 0.15), new THREE.MeshStandardMaterial({ color: 0x050508 }));
      screenFrame.position.set(0, 3.4, -0.1);
      scene.add(screenFrame);

      // Red Walls & Sconces
      const wallMat = new THREE.MeshStandardMaterial({ color: 0x8b111a, roughness: 0.65 });
      const wallL = new THREE.Mesh(new THREE.BoxGeometry(0.4, 10, 26), wallMat);
      wallL.position.set(-8.2, 4.8, 9);
      scene.add(wallL);

      const wallR = new THREE.Mesh(new THREE.BoxGeometry(0.4, 10, 26), wallMat);
      wallR.position.set(8.2, 4.8, 9);
      scene.add(wallR);

      for (let z = 3.5; z < 20; z += 3.8) {
        const sconceLightL = new THREE.PointLight(0xffaa22, 1.8, 6.5);
        sconceLightL.position.set(-7.7, 4.5, z);
        scene.add(sconceLightL);

        const sconceLightR = new THREE.PointLight(0xffaa22, 1.8, 6.5);
        sconceLightR.position.set(7.7, 4.5, z);
        scene.add(sconceLightR);
      }

      // Red Velvet Chairs in Front Rows
      const redMat = new THREE.MeshStandardMaterial({ color: 0xc81e28, roughness: 0.45 });
      const carpetMat = new THREE.MeshStandardMaterial({ color: 0x5b1016, roughness: 0.85 });
      const backGeo = new THREE.BoxGeometry(0.52, 0.54, 0.12);

      for (let r = 1; r <= numRows; r++) {
        const rowY = getRowY(r);
        const rowZ = getRowZ(r);

        const stepMesh = new THREE.Mesh(new THREE.BoxGeometry(17, rowY, 1.45), carpetMat);
        stepMesh.position.set(0, rowY / 2, rowZ);
        scene.add(stepMesh);

        for (let c = 1; c <= numCols; c++) {
          if (r === row && c === col) continue;
          if (r > row) continue;

          const seatX = getSeatX(c);
          const back = new THREE.Mesh(backGeo, redMat);
          back.position.set(seatX, rowY + 0.52, rowZ + 0.14);
          scene.add(back);
        }
      }

      // VIP Recliner Armrests in Foreground
      const fgArmMat = new THREE.MeshStandardMaterial({ color: 0x991b1b, roughness: 0.35 });
      const fgArmL = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.38, 0.65), fgArmMat);
      fgArmL.position.set(mySeatX - 0.38, mySeatY + 0.3, mySeatZ + 0.05);
      scene.add(fgArmL);

      const fgArmR = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.38, 0.65), fgArmMat);
      fgArmR.position.set(mySeatX + 0.38, mySeatY + 0.3, mySeatZ + 0.05);
      scene.add(fgArmR);
    }

    // ─── 5. SMOOTH 60 FPS INTERACTIVE PARALLAX ───
    let targetParallaxX = 0;
    let targetParallaxY = 0;
    let currentParallaxX = 0;
    let currentParallaxY = 0;

    const handleMouseMove = (e) => {
      const rect = container.getBoundingClientRect();
      const nx = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const ny = -(((e.clientY - rect.top) / rect.height) * 2 - 1);
      targetParallaxX = nx * 1.6;
      targetParallaxY = ny * 0.8;
    };

    container.addEventListener('mousemove', handleMouseMove);

    // ─── 6. ANIMATION LOOP ───
    let animId;
    const animate = () => {
      animId = requestAnimationFrame(animate);

      currentParallaxX += (targetParallaxX - currentParallaxX) * 0.1;
      currentParallaxY += (targetParallaxY - currentParallaxY) * 0.1;

      const dynamicTarget = new THREE.Vector3(
        targetLookAt.x + currentParallaxX,
        targetLookAt.y + currentParallaxY,
        targetLookAt.z
      );
      camera.lookAt(dynamicTarget);

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      cancelAnimationFrame(animId);
      container.removeEventListener('mousemove', handleMouseMove);
      renderer.dispose();
      scene.clear();
    };
  }, [
    row,
    col,
    totalRows,
    totalCols,
    moviePoster,
    categoryName,
    categoryColor,
    venueType,
  ]);

  return (
    <div
      ref={mountRef}
      className="w-full h-full rounded-xl overflow-hidden cursor-grab active:cursor-grabbing relative select-none"
    />
  );
}
