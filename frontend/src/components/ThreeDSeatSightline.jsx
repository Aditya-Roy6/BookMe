import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

/**
 * High-Performance Photorealistic 3D Seat Sightline WebGL Engine
 * Supports:
 *  1. Cinema / Dolby IMAX Auditoriums (Curved laser screen with real movie texture + plush velvet seats)
 *  2. Concert Amphitheatres & Live Arenas (Stage trusses, video wall, and festival stands)
 *  3. Football Stadiums (Floodlit turf, pitch markings, goalposts & bowl stands)
 *  4. Cricket Stadiums (Oval pitch, 22-yard wicket strip, boundary rope & floodlights)
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
    const isConcert = typeStr.includes('concert') || typeStr.includes('amphitheatre') || typeStr.includes('festival') || typeStr.includes('arena');
    const isFootball = typeStr.includes('football') || typeStr.includes('soccer') || typeStr.includes('sports');
    const isCricket = typeStr.includes('cricket') || typeStr.includes('oval');

    // 1. Scene & Camera Setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0a0a0f);
    scene.fog = new THREE.FogExp2(0x0a0a0f, 0.015);

    const camera = new THREE.PerspectiveCamera(56, width / height, 0.1, 120);

    // Coordinate Calculations
    const numRows = Math.max(totalRows, 6);
    const numCols = Math.max(totalCols, 10);

    const getRowY = (r) => 0.9 + (r - 1) * 0.7;
    const getRowZ = (r) => 5.0 + (r - 1) * 2.3;

    const getSeatX = (c) => {
      const norm = (c - 0.5) / numCols - 0.5;
      let x = norm * 13.0;
      if (x >= 0) x += 0.55;
      else x -= 0.55;
      return x;
    };

    const mySeatX = getSeatX(col);
    const mySeatY = getRowY(row);
    const mySeatZ = getRowZ(row);

    // Human eye position: +0.9m above seat cushion
    camera.position.set(mySeatX, mySeatY + 0.9, mySeatZ);

    const centerTarget = new THREE.Vector3(0, 3.4, 0);
    camera.lookAt(centerTarget);

    // 2. High-Performance WebGL Renderer
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: false,
      powerPreference: 'high-performance',
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.35;
    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    // 3. Bright, Atmospheric Illumination
    const ambientLight = new THREE.AmbientLight(0x2a2a38, 2.2);
    scene.add(ambientLight);

    // Overhead House Warm Sconces
    const overheadLight = new THREE.PointLight(0xffeedd, 1.8, 40);
    overheadLight.position.set(0, 10.0, 10.0);
    scene.add(overheadLight);

    // Dynamic Screen / Stage Light
    const stageLightColor = isConcert ? 0xa855f7 : isFootball || isCricket ? 0x38bdf8 : 0x22c55e;
    const screenGlowLight = new THREE.PointLight(stageLightColor, 3.5, 30);
    screenGlowLight.position.set(0, 4.0, 2.0);
    scene.add(screenGlowLight);

    // 4. Create Screen Texture Canvas
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');

    const drawCinemaScreen = (img) => {
      if (img) {
        ctx.drawImage(img, 0, 0, 1024, 512);
        // Subtle movie vignette
        const grad = ctx.createRadialGradient(512, 256, 120, 512, 256, 512);
        grad.addColorStop(0, 'rgba(0,0,0,0)');
        grad.addColorStop(1, 'rgba(0,0,0,0.5)');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, 1024, 512);
      } else {
        // High-end 4K Showcase Poster Canvas
        const grad = ctx.createLinearGradient(0, 0, 1024, 512);
        grad.addColorStop(0, '#0c1b33');
        grad.addColorStop(0.5, '#143860');
        grad.addColorStop(1, '#0c1b33');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, 1024, 512);

        ctx.fillStyle = '#ffffff';
        ctx.font = '900 52px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('4K LASER DOLBY ATMOS', 512, 230);

        ctx.fillStyle = '#1ed760';
        ctx.font = '700 28px monospace';
        ctx.fillText('FEATURE PRESENTATION', 512, 285);

        ctx.strokeStyle = '#1ed760';
        ctx.lineWidth = 6;
        ctx.strokeRect(30, 30, 964, 452);
      }
    };

    drawCinemaScreen(null);

    const screenTex = new THREE.CanvasTexture(canvas);
    if (moviePoster) {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.src = moviePoster;
      img.onload = () => {
        drawCinemaScreen(img);
        screenTex.needsUpdate = true;
      };
    }

    // ─── 5. VENUE SPECIFIC ARCHITECTURE ───
    if (isFootball) {
      // ⚽ FOOTBALL / SOCCER STADIUM SCENE
      const turfMat = new THREE.MeshStandardMaterial({ color: 0x15803d, roughness: 0.6 });
      const pitch = new THREE.Mesh(new THREE.PlaneGeometry(28, 18), turfMat);
      pitch.rotation.x = -Math.PI / 2;
      pitch.position.set(0, 0, 1);
      scene.add(pitch);

      // Pitch Center Circle & Lines
      const lineMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
      const centerLine = new THREE.Mesh(new THREE.PlaneGeometry(0.12, 18), lineMat);
      centerLine.rotation.x = -Math.PI / 2;
      centerLine.position.set(0, 0.02, 1);
      scene.add(centerLine);

      const penaltyBox = new THREE.Mesh(new THREE.PlaneGeometry(12, 5), new THREE.MeshBasicMaterial({ color: 0x166534 }));
      penaltyBox.rotation.x = -Math.PI / 2;
      penaltyBox.position.set(0, 0.01, -5.5);
      scene.add(penaltyBox);

      // Goalpost Frame
      const postMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
      const goalTop = new THREE.Mesh(new THREE.BoxGeometry(6, 0.15, 0.15), postMat);
      goalTop.position.set(0, 2.5, -8.0);
      scene.add(goalTop);

      const postL = new THREE.Mesh(new THREE.BoxGeometry(0.15, 2.5, 0.15), postMat);
      postL.position.set(-3, 1.25, -8.0);
      scene.add(postL);

      const postR = new THREE.Mesh(new THREE.BoxGeometry(0.15, 2.5, 0.15), postMat);
      postR.position.set(3, 1.25, -8.0);
      scene.add(postR);

      // 4 Corner Stadium Floodlight Towers
      for (const [fx, fz] of [[-13, -9], [13, -9], [-13, 10], [13, 10]]) {
        const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.35, 12), new THREE.MeshStandardMaterial({ color: 0x475569 }));
        pole.position.set(fx, 6, fz);
        scene.add(pole);

        const bulb = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.8, 0.6), new THREE.MeshBasicMaterial({ color: 0xffffff }));
        bulb.position.set(fx, 12, fz);
        scene.add(bulb);

        const fLight = new THREE.PointLight(0xffffff, 2.0, 35);
        fLight.position.set(fx, 11.5, fz);
        scene.add(fLight);
      }
    } else if (isCricket) {
      // 🏏 CRICKET OVAL STADIUM SCENE
      const ovalMat = new THREE.MeshStandardMaterial({ color: 0x16a34a, roughness: 0.7 });
      const ovalField = new THREE.Mesh(new THREE.CylinderGeometry(15, 15, 0.2, 32), ovalMat);
      ovalField.position.set(0, 0, 1);
      scene.add(ovalField);

      // 22-Yard Pitch Strip (Brown/Clay)
      const pitchStrip = new THREE.Mesh(
        new THREE.BoxGeometry(2.5, 0.05, 12),
        new THREE.MeshStandardMaterial({ color: 0xd4a373, roughness: 0.85 })
      );
      pitchStrip.position.set(0, 0.12, 1);
      scene.add(pitchStrip);

      // Wickets / Stumps
      const stumpMat = new THREE.MeshBasicMaterial({ color: 0xfef08a });
      for (const sz of [-4.5, 6.5]) {
        for (let sx = -0.2; sx <= 0.2; sx += 0.2) {
          const stump = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.7), stumpMat);
          stump.position.set(sx, 0.45, sz);
          scene.add(stump);
        }
      }

      // Boundary Rope
      const rope = new THREE.Mesh(
        new THREE.TorusGeometry(14.5, 0.08, 8, 36),
        new THREE.MeshBasicMaterial({ color: 0xffffff })
      );
      rope.rotation.x = Math.PI / 2;
      rope.position.set(0, 0.15, 1);
      scene.add(rope);
    } else if (isConcert) {
      // 🎸 CONCERT AMPHITHEATRE / ARENA SCENE
      // Stage Platform
      const stage = new THREE.Mesh(
        new THREE.BoxGeometry(16, 1.2, 7),
        new THREE.MeshStandardMaterial({ color: 0x18181b, roughness: 0.4, metalness: 0.3 })
      );
      stage.position.set(0, 0.6, -1.0);
      scene.add(stage);

      // Giant Live Video Wall
      const screenMat = new THREE.MeshBasicMaterial({ map: screenTex });
      const videoWall = new THREE.Mesh(new THREE.BoxGeometry(14, 6.5, 0.3), screenMat);
      videoWall.position.set(0, 4.5, -4.2);
      scene.add(videoWall);

      // Stage Overhead Truss Arch
      const trussMat = new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.8 });
      const trussTop = new THREE.Mesh(new THREE.BoxGeometry(16, 0.4, 0.4), trussMat);
      trussTop.position.set(0, 8.0, -1.0);
      scene.add(trussTop);

      // Colored Concert Spotlights (Pink & Cyan)
      for (let tx = -6; tx <= 6; tx += 3) {
        const spot = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.5, 0.4), new THREE.MeshBasicMaterial({ color: 0xa855f7 }));
        spot.position.set(tx, 7.8, -1.0);
        scene.add(spot);

        const sLight = new THREE.PointLight(0xa855f7, 2.0, 15);
        sLight.position.set(tx, 7.5, -1.0);
        scene.add(sLight);
      }
    } else {
      // 🎬 DOLBY CINEMA / IMAX AUDITORIUM SCENE
      const screenRadius = 22;
      const screenHeight = 6.8;
      const screenGeo = new THREE.CylinderGeometry(
        screenRadius,
        screenRadius,
        screenHeight,
        40,
        1,
        true,
        Math.PI * 0.76,
        Math.PI * 0.48
      );

      const screenMat = new THREE.MeshBasicMaterial({
        map: screenTex,
        side: THREE.BackSide,
      });
      const screenMesh = new THREE.Mesh(screenGeo, screenMat);
      screenMesh.position.set(0, 3.8, -screenRadius + 3.0);
      screenMesh.rotation.y = Math.PI;
      scene.add(screenMesh);

      // Illuminated Stage Platform
      const stage = new THREE.Mesh(
        new THREE.BoxGeometry(18, 0.8, 5.0),
        new THREE.MeshStandardMaterial({ color: 0x111116, roughness: 0.6 })
      );
      stage.position.set(0, 0.4, 0.5);
      scene.add(stage);

      // Front Stage LED Strip
      const stageLed = new THREE.Mesh(
        new THREE.BoxGeometry(18, 0.1, 0.1),
        new THREE.MeshBasicMaterial({ color: 0x1ed760 })
      );
      stageLed.position.set(0, 0.85, 3.0);
      scene.add(stageLed);

      // Acoustic Timber Sidewalls
      const wallMat = new THREE.MeshStandardMaterial({ color: 0x14141c, roughness: 0.8 });
      const wallL = new THREE.Mesh(new THREE.BoxGeometry(0.5, 14, 35), wallMat);
      wallL.position.set(-10.5, 6, 12);
      scene.add(wallL);

      const wallR = new THREE.Mesh(new THREE.BoxGeometry(0.5, 14, 35), wallMat);
      wallR.position.set(10.5, 6, 12);
      scene.add(wallR);

      // Warm Acoustic Wall Lights
      for (let z = 5; z < 28; z += 5) {
        const sconce = new THREE.Mesh(
          new THREE.BoxGeometry(0.12, 0.6, 0.3),
          new THREE.MeshBasicMaterial({ color: 0x38bdf8 })
        );
        sconce.position.set(-10.2, 5.2, z);
        scene.add(sconce);

        const sconceR = new THREE.Mesh(
          new THREE.BoxGeometry(0.12, 0.6, 0.3),
          new THREE.MeshBasicMaterial({ color: 0x38bdf8 })
        );
        sconceR.position.set(10.2, 5.2, z);
        scene.add(sconceR);
      }
    }

    // ─── 6. AUDITORIUM SEATING TIERS & PLUSH VELVET CHAIRS ───
    const seatBackGeo = new THREE.BoxGeometry(0.56, 0.58, 0.12);
    const seatHeadGeo = new THREE.BoxGeometry(0.44, 0.16, 0.14);
    const seatCushionGeo = new THREE.BoxGeometry(0.56, 0.12, 0.54);
    const armrestGeo = new THREE.BoxGeometry(0.08, 0.28, 0.5);

    const velvetMat = new THREE.MeshStandardMaterial({
      color: 0x22222c,
      roughness: 0.65,
      metalness: 0.1,
    });

    const highlightMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(categoryColor || '#1ed760'),
      emissive: new THREE.Color(categoryColor || '#1ed760'),
      emissiveIntensity: 0.7,
      roughness: 0.3,
    });

    for (let r = 1; r <= numRows; r++) {
      const rowY = getRowY(r);
      const rowZ = getRowZ(r);

      // Stepped Concrete Tier Platform
      const stepMesh = new THREE.Mesh(
        new THREE.BoxGeometry(22, rowY, 2.3),
        new THREE.MeshStandardMaterial({ color: 0x111116, roughness: 0.85 })
      );
      stepMesh.position.set(0, rowY / 2, rowZ);
      scene.add(stepMesh);

      // Aisle LED Guide lights (Cyan)
      const aisleLedLeft = new THREE.Mesh(
        new THREE.BoxGeometry(0.12, 0.04, 2.1),
        new THREE.MeshBasicMaterial({ color: 0x38bdf8 })
      );
      aisleLedLeft.position.set(-0.6, rowY + 0.02, rowZ);
      scene.add(aisleLedLeft);

      const aisleLedRight = new THREE.Mesh(
        new THREE.BoxGeometry(0.12, 0.04, 2.1),
        new THREE.MeshBasicMaterial({ color: 0x38bdf8 })
      );
      aisleLedRight.position.set(0.6, rowY + 0.02, rowZ);
      scene.add(aisleLedRight);

      // Render chairs in front of the viewer and immediate neighbors
      for (let c = 1; c <= numCols; c++) {
        if (r === row && c === col) continue; // Skip camera's own chair to prevent clipping
        if (r > row + 1) continue; // Skip behind

        const seatX = getSeatX(c);
        const isNeighbor = r === row && Math.abs(c - col) === 1;
        const mat = isNeighbor ? highlightMat : velvetMat;

        const back = new THREE.Mesh(seatBackGeo, mat);
        back.position.set(seatX, rowY + 0.58, rowZ + 0.2);
        scene.add(back);

        const head = new THREE.Mesh(seatHeadGeo, mat);
        head.position.set(seatX, rowY + 0.9, rowZ + 0.2);
        scene.add(head);

        const cushion = new THREE.Mesh(seatCushionGeo, mat);
        cushion.position.set(seatX, rowY + 0.28, rowZ - 0.08);
        scene.add(cushion);

        const armL = new THREE.Mesh(armrestGeo, velvetMat);
        armL.position.set(seatX - 0.31, rowY + 0.38, rowZ - 0.08);
        scene.add(armL);

        const armR = new THREE.Mesh(armrestGeo, velvetMat);
        armR.position.set(seatX + 0.31, rowY + 0.38, rowZ - 0.08);
        scene.add(armR);
      }
    }

    // Viewer's Own Armrests in Immediate Bottom Foreground
    const userArmL = new THREE.Mesh(
      new THREE.BoxGeometry(0.14, 0.45, 0.75),
      new THREE.MeshStandardMaterial({ color: 0x18181f, roughness: 0.5 })
    );
    userArmL.position.set(mySeatX - 0.44, mySeatY + 0.35, mySeatZ + 0.1);
    scene.add(userArmL);

    const userArmR = new THREE.Mesh(
      new THREE.BoxGeometry(0.14, 0.45, 0.75),
      new THREE.MeshStandardMaterial({ color: 0x18181f, roughness: 0.5 })
    );
    userArmR.position.set(mySeatX + 0.44, mySeatY + 0.35, mySeatZ + 0.1);
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
      targetParallaxX = nx * 1.8;
      targetParallaxY = ny * 0.9;
    };

    container.addEventListener('mousemove', handleMouseMove);

    // ─── 8. ANIMATION LOOP ───
    let animId;
    const animate = () => {
      animId = requestAnimationFrame(animate);

      currentParallaxX += (targetParallaxX - currentParallaxX) * 0.08;
      currentParallaxY += (targetParallaxY - currentParallaxY) * 0.08;

      const dynamicLookAt = new THREE.Vector3(
        centerTarget.x + currentParallaxX,
        centerTarget.y + currentParallaxY,
        centerTarget.z
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
  }, [row, col, totalRows, totalCols, moviePoster, categoryName, categoryColor, venueType]);

  return (
    <div
      ref={mountRef}
      className="w-full h-full rounded-xl overflow-hidden cursor-grab active:cursor-grabbing relative select-none"
    />
  );
}
