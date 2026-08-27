import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

/**
 * Bright, Photorealistic 3D Seat Sightline WebGL Engine
 * Zero dark voids. Vibrant lighting, crystal-clear 4K screen, plush red velvet seating tiers,
 * and authentic 3D stadium & concert environments.
 */
export default function ThreeDSeatSightline({
  row = 1,
  col = 1,
  totalRows = 8,
  totalCols = 14,
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
    const isConcert =
      typeStr.includes('concert') ||
      typeStr.includes('amphitheatre') ||
      typeStr.includes('festival') ||
      typeStr.includes('arena');
    const isFootball =
      typeStr.includes('football') ||
      typeStr.includes('soccer') ||
      typeStr.includes('sports');
    const isCricket =
      typeStr.includes('cricket') || typeStr.includes('oval');

    // 1. Scene & Camera Setup (Bright background, no dark fog)
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0e1118);

    const camera = new THREE.PerspectiveCamera(54, width / height, 0.1, 100);

    // Coordinate Math: Tight, well-framed room
    const numRows = Math.max(totalRows, 6);
    const numCols = Math.max(totalCols, 10);

    const getRowY = (r) => 0.6 + (r - 1) * 0.55;
    const getRowZ = (r) => 4.2 + (r - 1) * 1.55;

    const getSeatX = (c) => {
      const norm = (c - 0.5) / numCols - 0.5; // -0.5 to +0.5
      let x = norm * 10.5;
      if (x >= 0) x += 0.45;
      else x -= 0.45;
      return x;
    };

    const mySeatX = getSeatX(col);
    const mySeatY = getRowY(row);
    const mySeatZ = getRowZ(row);

    // Human eye position: +0.75m above seat
    camera.position.set(mySeatX, mySeatY + 0.75, mySeatZ);

    const screenCenter = new THREE.Vector3(0, 2.6, 0);
    camera.lookAt(screenCenter);

    // 2. High-Performance WebGL Renderer
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: false,
      powerPreference: 'high-performance',
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.4;
    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    // 3. BRIGHT, BEAUTIFUL LIGHTING
    // Ambient Light (Bright enough to clearly see all seats and floors)
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.6);
    scene.add(ambientLight);

    // Main Overhead Directional Light (Casts crisp soft highlights on seat cushions)
    const dirLightTop = new THREE.DirectionalLight(0xfff5ea, 2.4);
    dirLightTop.position.set(0, 15, 8);
    scene.add(dirLightTop);

    // Fill Light from Back
    const backFill = new THREE.DirectionalLight(0x38bdf8, 1.2);
    backFill.position.set(0, 6, 20);
    scene.add(backFill);

    // Dynamic Colored Screen / Stage Light
    const stageLightColor = isConcert
      ? 0xc084fc
      : isFootball || isCricket
      ? 0x38bdf8
      : 0x4ade80;
    const screenGlow = new THREE.PointLight(stageLightColor, 3.0, 20);
    screenGlow.position.set(0, 3.0, 1.5);
    scene.add(screenGlow);

    // 4. Create Screen Texture Canvas
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');

    const renderPosterTexture = (img) => {
      if (img) {
        ctx.drawImage(img, 0, 0, 1024, 512);
        // Subtle cinema vignette
        const grad = ctx.createRadialGradient(512, 256, 150, 512, 256, 512);
        grad.addColorStop(0, 'rgba(0,0,0,0)');
        grad.addColorStop(1, 'rgba(0,0,0,0.4)');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, 1024, 512);
      } else {
        // Bright Vibrant Showcase Screen
        const grad = ctx.createLinearGradient(0, 0, 1024, 512);
        grad.addColorStop(0, '#1e3a8a');
        grad.addColorStop(0.5, '#0284c7');
        grad.addColorStop(1, '#0f172a');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, 1024, 512);

        // Grid lines
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
        ctx.lineWidth = 2;
        for (let i = 0; i < 1024; i += 64) {
          ctx.beginPath();
          ctx.moveTo(i, 0);
          ctx.lineTo(i, 512);
          ctx.stroke();
        }

        ctx.fillStyle = '#ffffff';
        ctx.font = '900 56px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('4K DOLBY CINEMA', 512, 230);

        ctx.fillStyle = '#4ade80';
        ctx.font = '700 30px monospace';
        ctx.fillText('IMMERSIVE SIGHTLINE', 512, 290);

        ctx.strokeStyle = '#4ade80';
        ctx.lineWidth = 8;
        ctx.strokeRect(25, 25, 974, 462);
      }
    };

    renderPosterTexture(null);

    const screenTex = new THREE.CanvasTexture(canvas);
    const posterUrl =
      moviePoster ||
      'https://images.unsplash.com/photo-1536440136628-849c177e76a1?auto=format&fit=crop&w=1024&q=80';

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = posterUrl;
    img.onload = () => {
      renderPosterTexture(img);
      screenTex.needsUpdate = true;
    };

    // ─── 5. VENUE SPECIFIC 3D WORLD ───
    if (isFootball) {
      // ⚽ FOOTBALL STADIUM
      const turf = new THREE.Mesh(
        new THREE.PlaneGeometry(24, 16),
        new THREE.MeshStandardMaterial({ color: 0x16a34a, roughness: 0.5 })
      );
      turf.rotation.x = -Math.PI / 2;
      turf.position.set(0, 0, 0);
      scene.add(turf);

      // Pitch Markings
      const lineMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
      const centerLine = new THREE.Mesh(new THREE.PlaneGeometry(0.12, 16), lineMat);
      centerLine.rotation.x = -Math.PI / 2;
      centerLine.position.set(0, 0.02, 0);
      scene.add(centerLine);

      // Center Circle
      const circleMat = new THREE.MeshBasicMaterial({ color: 0xffffff, wireframe: true });
      const centerCircle = new THREE.Mesh(new THREE.CircleGeometry(3.0, 32), circleMat);
      centerCircle.rotation.x = -Math.PI / 2;
      centerCircle.position.set(0, 0.02, 0);
      scene.add(centerCircle);

      // Goalpost Frame
      const goalMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
      const goalTop = new THREE.Mesh(new THREE.BoxGeometry(5.0, 0.12, 0.12), goalMat);
      goalTop.position.set(0, 2.2, -6.5);
      scene.add(goalTop);

      const goalL = new THREE.Mesh(new THREE.BoxGeometry(0.12, 2.2, 0.12), goalMat);
      goalL.position.set(-2.5, 1.1, -6.5);
      scene.add(goalL);

      const goalR = new THREE.Mesh(new THREE.BoxGeometry(0.12, 2.2, 0.12), goalMat);
      goalR.position.set(2.5, 1.1, -6.5);
      scene.add(goalR);

      // 4 Bright Stadium Floodlight Towers
      for (const [fx, fz] of [[-10, -7], [10, -7], [-10, 8], [10, 8]]) {
        const pole = new THREE.Mesh(
          new THREE.CylinderGeometry(0.15, 0.25, 9),
          new THREE.MeshStandardMaterial({ color: 0x94a3b8 })
        );
        pole.position.set(fx, 4.5, fz);
        scene.add(pole);

        const head = new THREE.Mesh(
          new THREE.BoxGeometry(1.2, 0.6, 0.4),
          new THREE.MeshBasicMaterial({ color: 0xffffff })
        );
        head.position.set(fx, 9.0, fz);
        scene.add(head);

        const fl = new THREE.PointLight(0xffffff, 2.5, 25);
        fl.position.set(fx, 8.8, fz);
        scene.add(fl);
      }
    } else if (isCricket) {
      // 🏏 CRICKET OVAL
      const turf = new THREE.Mesh(
        new THREE.CylinderGeometry(13, 13, 0.15, 32),
        new THREE.MeshStandardMaterial({ color: 0x22c55e, roughness: 0.55 })
      );
      turf.position.set(0, 0, 0);
      scene.add(turf);

      // 22-Yard Pitch Strip (Brown/Clay)
      const pitchStrip = new THREE.Mesh(
        new THREE.BoxGeometry(2.2, 0.04, 10),
        new THREE.MeshStandardMaterial({ color: 0xe0a96d, roughness: 0.8 })
      );
      pitchStrip.position.set(0, 0.1, 0);
      scene.add(pitchStrip);

      // Wickets
      const stumpMat = new THREE.MeshBasicMaterial({ color: 0xfde047 });
      for (const sz of [-3.8, 5.2]) {
        for (let sx = -0.15; sx <= 0.15; sx += 0.15) {
          const stump = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.6), stumpMat);
          stump.position.set(sx, 0.4, sz);
          scene.add(stump);
        }
      }

      // Boundary Rope
      const rope = new THREE.Mesh(
        new THREE.TorusGeometry(12.5, 0.07, 8, 36),
        new THREE.MeshBasicMaterial({ color: 0xffffff })
      );
      rope.rotation.x = Math.PI / 2;
      rope.position.set(0, 0.12, 0);
      scene.add(rope);
    } else if (isConcert) {
      // 🎸 CONCERT ARENA / AMPHITHEATRE
      const stage = new THREE.Mesh(
        new THREE.BoxGeometry(14, 1.0, 5.5),
        new THREE.MeshStandardMaterial({ color: 0x27272a, roughness: 0.3, metalness: 0.2 })
      );
      stage.position.set(0, 0.5, -1.0);
      scene.add(stage);

      // Bright Live Video Wall
      const screenMat = new THREE.MeshBasicMaterial({ map: screenTex });
      const videoWall = new THREE.Mesh(new THREE.BoxGeometry(12, 5.5, 0.2), screenMat);
      videoWall.position.set(0, 3.8, -3.5);
      scene.add(videoWall);

      // Concert Truss & Colored Spotlights
      const truss = new THREE.Mesh(
        new THREE.BoxGeometry(14, 0.3, 0.3),
        new THREE.MeshStandardMaterial({ color: 0x64748b, metalness: 0.8 })
      );
      truss.position.set(0, 6.8, -1.0);
      scene.add(truss);

      for (let tx = -5; tx <= 5; tx += 2.5) {
        const spot = new THREE.Mesh(
          new THREE.BoxGeometry(0.3, 0.4, 0.3),
          new THREE.MeshBasicMaterial({ color: 0xd946ef })
        );
        spot.position.set(tx, 6.6, -1.0);
        scene.add(spot);

        const sLight = new THREE.PointLight(0xd946ef, 2.0, 12);
        sLight.position.set(tx, 6.3, -1.0);
        scene.add(sLight);
      }
    } else {
      // 🎬 DOLBY CINEMA / IMAX AUDITORIUM (Bright & Crisp)
      // Giant Curved 4K Cinema Screen
      const screenRadius = 14;
      const screenHeight = 5.6;
      const screenGeo = new THREE.CylinderGeometry(
        screenRadius,
        screenRadius,
        screenHeight,
        36,
        1,
        true,
        Math.PI * 0.77,
        Math.PI * 0.46
      );

      const screenMat = new THREE.MeshBasicMaterial({
        map: screenTex,
        side: THREE.BackSide,
      });
      const screenMesh = new THREE.Mesh(screenGeo, screenMat);
      screenMesh.position.set(0, 2.8, -screenRadius + 2.0);
      screenMesh.rotation.y = Math.PI;
      scene.add(screenMesh);

      // Stage Platform Under Screen
      const stage = new THREE.Mesh(
        new THREE.BoxGeometry(16, 0.6, 4.0),
        new THREE.MeshStandardMaterial({ color: 0x1f2937, roughness: 0.5 })
      );
      stage.position.set(0, 0.3, 0.2);
      scene.add(stage);

      // Stage Glowing LED Border
      const stageLed = new THREE.Mesh(
        new THREE.BoxGeometry(16, 0.08, 0.08),
        new THREE.MeshBasicMaterial({ color: 0x4ade80 })
      );
      stageLed.position.set(0, 0.64, 2.2);
      scene.add(stageLed);

      // Wooden Acoustic Sidewalls with Warm Lighting
      const wallMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.6 });
      const wallL = new THREE.Mesh(new THREE.BoxGeometry(0.4, 10, 26), wallMat);
      wallL.position.set(-8.5, 4.5, 9);
      scene.add(wallL);

      const wallR = new THREE.Mesh(new THREE.BoxGeometry(0.4, 10, 26), wallMat);
      wallR.position.set(8.5, 4.5, 9);
      scene.add(wallR);

      // Warm Sconce Lights along walls
      for (let z = 3; z < 20; z += 4) {
        const sconce = new THREE.Mesh(
          new THREE.BoxGeometry(0.12, 0.5, 0.25),
          new THREE.MeshBasicMaterial({ color: 0x38bdf8 })
        );
        sconce.position.set(-8.25, 4.0, z);
        scene.add(sconce);

        const sconceR = new THREE.Mesh(
          new THREE.BoxGeometry(0.12, 0.5, 0.25),
          new THREE.MeshBasicMaterial({ color: 0x38bdf8 })
        );
        sconceR.position.set(8.25, 4.0, z);
        scene.add(sconceR);
      }
    }

    // ─── 6. AUDITORIUM SEATING TIERS & PLUSH RED VELVET CHAIRS ───
    const seatBackGeo = new THREE.BoxGeometry(0.5, 0.52, 0.12);
    const seatHeadGeo = new THREE.BoxGeometry(0.4, 0.14, 0.14);
    const seatCushionGeo = new THREE.BoxGeometry(0.5, 0.12, 0.48);
    const armrestGeo = new THREE.BoxGeometry(0.08, 0.24, 0.44);

    // Rich Cinema Red Velvet Material (Bright and clearly visible)
    const redVelvetMat = new THREE.MeshStandardMaterial({
      color: 0xdc2626,
      roughness: 0.4,
      metalness: 0.1,
    });

    const highlightMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(categoryColor || '#4ade80'),
      emissive: new THREE.Color(categoryColor || '#4ade80'),
      emissiveIntensity: 0.6,
      roughness: 0.3,
    });

    const armrestMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      roughness: 0.5,
    });

    // Concrete Stepped Tier Material
    const stepMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      roughness: 0.7,
    });

    for (let r = 1; r <= numRows; r++) {
      const rowY = getRowY(r);
      const rowZ = getRowZ(r);

      // Stepped Concrete Tier Platform
      const stepMesh = new THREE.Mesh(
        new THREE.BoxGeometry(18, rowY, 1.55),
        stepMat
      );
      stepMesh.position.set(0, rowY / 2, rowZ);
      scene.add(stepMesh);

      // Aisle LED Guide lights (Cyan)
      const aisleLedL = new THREE.Mesh(
        new THREE.BoxGeometry(0.1, 0.04, 1.5),
        new THREE.MeshBasicMaterial({ color: 0x38bdf8 })
      );
      aisleLedL.position.set(-0.5, rowY + 0.02, rowZ);
      scene.add(aisleLedL);

      const aisleLedR = new THREE.Mesh(
        new THREE.BoxGeometry(0.1, 0.04, 1.5),
        new THREE.MeshBasicMaterial({ color: 0x38bdf8 })
      );
      aisleLedR.position.set(0.5, rowY + 0.02, rowZ);
      scene.add(aisleLedR);

      // Render chairs in front of viewer and immediate row neighbors
      for (let c = 1; c <= numCols; c++) {
        if (r === row && c === col) continue; // Skip camera's own chair
        if (r > row) continue; // Only render rows in front!

        const seatX = getSeatX(c);
        const isNeighbor = r === row && Math.abs(c - col) === 1;
        const mat = isNeighbor ? highlightMat : redVelvetMat;

        // Seat Back
        const back = new THREE.Mesh(seatBackGeo, mat);
        back.position.set(seatX, rowY + 0.52, rowZ + 0.16);
        scene.add(back);

        // Headrest
        const head = new THREE.Mesh(seatHeadGeo, mat);
        head.position.set(seatX, rowY + 0.8, rowZ + 0.16);
        scene.add(head);

        // Cushion
        const cushion = new THREE.Mesh(seatCushionGeo, mat);
        cushion.position.set(seatX, rowY + 0.24, rowZ - 0.06);
        scene.add(cushion);

        // Armrests
        const armL = new THREE.Mesh(armrestGeo, armrestMat);
        armL.position.set(seatX - 0.28, rowY + 0.32, rowZ - 0.06);
        scene.add(armL);

        const armR = new THREE.Mesh(armrestGeo, armrestMat);
        armR.position.set(seatX + 0.28, rowY + 0.32, rowZ - 0.06);
        scene.add(armR);
      }
    }

    // Viewer's Own Armrests in Immediate Bottom Foreground
    const userArmL = new THREE.Mesh(
      new THREE.BoxGeometry(0.12, 0.4, 0.65),
      new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.5 })
    );
    userArmL.position.set(mySeatX - 0.4, mySeatY + 0.32, mySeatZ + 0.08);
    scene.add(userArmL);

    const userArmR = new THREE.Mesh(
      new THREE.BoxGeometry(0.12, 0.4, 0.65),
      new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.5 })
    );
    userArmR.position.set(mySeatX + 0.4, mySeatY + 0.32, mySeatZ + 0.08);
    scene.add(userArmR);

    // ─── 7. SMOOTH INTERACTIVE MOUSE PARALLAX (60 FPS) ───
    let targetParallaxX = 0;
    let targetParallaxY = 0;
    let currentParallaxX = 0;
    let currentParallaxY = 0;

    const handleMouseMove = (e) => {
      const rect = container.getBoundingClientRect();
      const nx = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const ny = -(((e.clientY - rect.top) / rect.height) * 2 - 1);
      targetParallaxX = nx * 1.5;
      targetParallaxY = ny * 0.8;
    };

    container.addEventListener('mousemove', handleMouseMove);

    // ─── 8. ANIMATION LOOP ───
    let animId;
    const animate = () => {
      animId = requestAnimationFrame(animate);

      currentParallaxX += (targetParallaxX - currentParallaxX) * 0.1;
      currentParallaxY += (targetParallaxY - currentParallaxY) * 0.1;

      const dynamicLookAt = new THREE.Vector3(
        screenCenter.x + currentParallaxX,
        screenCenter.y + currentParallaxY,
        screenCenter.z
      );
      camera.lookAt(dynamicLookAt);

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
