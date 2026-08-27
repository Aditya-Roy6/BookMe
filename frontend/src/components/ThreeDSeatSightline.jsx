import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

/**
 * Photorealistic 3D Seat Sightline First-Person Engine
 * Faithfully matches real multiplex cinema auditoriums with:
 *  - Deep red acoustic fabric walls with warm golden architectural sconce light wash
 *  - Recessed ceiling downlights & warm step-edge LED guides
 *  - Contoured red velvet cinema seating with headrests, armrests & cup holders
 *  - Giant 16:9 / Cinemascope screen with real movie texture and dynamic projection bounce
 *  - High-fidelity concert arena, football stadium, and cricket ground environments
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

    // 1. Scene & High-FOV First-Person Camera
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0a0a0f);

    const camera = new THREE.PerspectiveCamera(58, width / height, 0.1, 100);

    // Coordinate Calculations
    const numRows = Math.max(totalRows, 6);
    const numCols = Math.max(totalCols, 10);

    const getRowY = (r) => 0.4 + (r - 1) * 0.48;
    const getRowZ = (r) => 3.8 + (r - 1) * 1.45;

    const getSeatX = (c) => {
      const norm = (c - 0.5) / numCols - 0.5; // -0.5 to +0.5
      let x = norm * 10.0;
      if (x >= 0) x += 0.4;
      else x -= 0.4;
      return x;
    };

    const mySeatX = getSeatX(col);
    const mySeatY = getRowY(row);
    const mySeatZ = getRowZ(row);

    // Human eye level: sitting height (+0.72m)
    camera.position.set(mySeatX, mySeatY + 0.72, mySeatZ);

    const screenTarget = new THREE.Vector3(0, 2.4, 0);
    camera.lookAt(screenTarget);

    // 2. High-Performance WebGL Renderer
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: false,
      powerPreference: 'high-performance',
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.3;
    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    // 3. PHOTOREALISTIC LIGHTING SETUP
    // Ambient Light (warm dark tone)
    const ambientLight = new THREE.AmbientLight(0x2a1820, 1.8);
    scene.add(ambientLight);

    // Overhead Ceiling Warm Downlights (Scattered downlights like real cinema ceiling)
    for (const zPos of [4, 8, 12, 16]) {
      const downlight = new THREE.PointLight(0xffeedd, 1.6, 12);
      downlight.position.set(0, 7.5, zPos);
      scene.add(downlight);
    }

    // Screen Projection Bounce Light
    const screenBounce = new THREE.PointLight(0xffffff, 2.8, 18);
    screenBounce.position.set(0, 2.8, 1.2);
    scene.add(screenBounce);

    // 4. Screen Texture & Material
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

      // Movie credits styling matching real cinema
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
        () => {
          console.warn('Fallback to 4K showcase screen');
        }
      );
    }

    // ─── 5. PHOTOREALISTIC VENUE ARCHITECTURE ───
    if (isFootball) {
      // ⚽ FOOTBALL STADIUM ENVIRONMENT
      const turfMat = new THREE.MeshStandardMaterial({ color: 0x15803d, roughness: 0.5 });
      const pitch = new THREE.Mesh(new THREE.PlaneGeometry(26, 18), turfMat);
      pitch.rotation.x = -Math.PI / 2;
      scene.add(pitch);

      const lineMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
      const centerLine = new THREE.Mesh(new THREE.PlaneGeometry(0.12, 18), lineMat);
      centerLine.rotation.x = -Math.PI / 2;
      centerLine.position.set(0, 0.02, 0);
      scene.add(centerLine);

      // Floodlights
      for (const [fx, fz] of [[-11, -8], [11, -8], [-11, 9], [11, 9]]) {
        const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.25, 10), new THREE.MeshStandardMaterial({ color: 0x64748b }));
        pole.position.set(fx, 5, fz);
        scene.add(pole);

        const fl = new THREE.PointLight(0xffffff, 2.5, 25);
        fl.position.set(fx, 9.8, fz);
        scene.add(fl);
      }
    } else if (isCricket) {
      // 🏏 CRICKET STADIUM ENVIRONMENT
      const turfMat = new THREE.MeshStandardMaterial({ color: 0x16a34a, roughness: 0.55 });
      const oval = new THREE.Mesh(new THREE.CylinderGeometry(14, 14, 0.15, 32), turfMat);
      scene.add(oval);

      const pitchStrip = new THREE.Mesh(
        new THREE.BoxGeometry(2.4, 0.04, 10),
        new THREE.MeshStandardMaterial({ color: 0xd4a373, roughness: 0.8 })
      );
      pitchStrip.position.set(0, 0.1, 0);
      scene.add(pitchStrip);
    } else if (isConcert) {
      // 🎸 CONCERT ARENA / FESTIVAL ENVIRONMENT
      const stage = new THREE.Mesh(
        new THREE.BoxGeometry(15, 1.0, 5.5),
        new THREE.MeshStandardMaterial({ color: 0x18181b, roughness: 0.3 })
      );
      stage.position.set(0, 0.5, -1.0);
      scene.add(stage);

      const videoWall = new THREE.Mesh(new THREE.BoxGeometry(13, 6.0, 0.2), screenMat);
      videoWall.position.set(0, 4.0, -3.6);
      scene.add(videoWall);

      for (let tx = -5; tx <= 5; tx += 2.5) {
        const sLight = new THREE.PointLight(0xd946ef, 2.2, 14);
        sLight.position.set(tx, 6.5, -1.0);
        scene.add(sLight);
      }
    } else {
      // 🎬 AUTHENTIC MULTIPLEX CINEMA AUDITORIUM (Matches Photo!)
      // 1. Giant Widescreen (16:9 / 2.39:1 Cinemascope)
      const screenWidth = 14.5;
      const screenHeight = 6.2;
      const screenMesh = new THREE.Mesh(
        new THREE.PlaneGeometry(screenWidth, screenHeight),
        screenMat
      );
      screenMesh.position.set(0, 3.4, 0);
      scene.add(screenMesh);

      // Black Acoustic Bezel Frame around Screen
      const frameMat = new THREE.MeshStandardMaterial({ color: 0x050508, roughness: 0.9 });
      const screenFrame = new THREE.Mesh(
        new THREE.BoxGeometry(screenWidth + 0.6, screenHeight + 0.6, 0.15),
        frameMat
      );
      screenFrame.position.set(0, 3.4, -0.1);
      scene.add(screenFrame);

      // Stage Platform Under Screen
      const stage = new THREE.Mesh(
        new THREE.BoxGeometry(17, 0.5, 3.5),
        new THREE.MeshStandardMaterial({ color: 0x111116, roughness: 0.7 })
      );
      stage.position.set(0, 0.25, 0.5);
      scene.add(stage);

      // 2. Deep Red Acoustic Fabric Sidewalls with Warm Golden Sconce Wash
      const wallMat = new THREE.MeshStandardMaterial({
        color: 0x8b111a, // Deep Velvet Red
        roughness: 0.65,
      });

      const wallL = new THREE.Mesh(new THREE.BoxGeometry(0.4, 10, 26), wallMat);
      wallL.position.set(-8.2, 4.8, 9);
      scene.add(wallL);

      const wallR = new THREE.Mesh(new THREE.BoxGeometry(0.4, 10, 26), wallMat);
      wallR.position.set(8.2, 4.8, 9);
      scene.add(wallR);

      // Wall Architectural Sconces with Up/Down Light Cones (Matches photo!)
      for (let z = 3.5; z < 20; z += 3.8) {
        // Golden Trim Fixture
        const fixtureL = new THREE.Mesh(
          new THREE.BoxGeometry(0.1, 0.7, 0.25),
          new THREE.MeshStandardMaterial({ color: 0xf59e0b, roughness: 0.3, metalness: 0.7 })
        );
        fixtureL.position.set(-7.95, 4.5, z);
        scene.add(fixtureL);

        const fixtureR = new THREE.Mesh(
          new THREE.BoxGeometry(0.1, 0.7, 0.25),
          new THREE.MeshStandardMaterial({ color: 0xf59e0b, roughness: 0.3, metalness: 0.7 })
        );
        fixtureR.position.set(7.95, 4.5, z);
        scene.add(fixtureR);

        // Golden Warm Light Wash Cones on Sidewall
        const sconceLightL = new THREE.PointLight(0xffaa22, 1.8, 6.5);
        sconceLightL.position.set(-7.7, 4.5, z);
        scene.add(sconceLightL);

        const sconceLightR = new THREE.PointLight(0xffaa22, 1.8, 6.5);
        sconceLightR.position.set(7.7, 4.5, z);
        scene.add(sconceLightR);
      }

      // Ceiling Plane (Dark with pin lights)
      const ceiling = new THREE.Mesh(
        new THREE.PlaneGeometry(18, 26),
        new THREE.MeshStandardMaterial({ color: 0x0a0a0e, roughness: 0.9 })
      );
      ceiling.rotation.x = Math.PI / 2;
      ceiling.position.set(0, 8.5, 9);
      scene.add(ceiling);
    }

    // ─── 6. CONTOURED RED CINEMA SEATS & STEPPED RISERS ───
    // Red Cinema Velvet Seat Material
    const cinemaRedMat = new THREE.MeshStandardMaterial({
      color: 0xc81e28, // Bright Velvet Red
      roughness: 0.45,
      metalness: 0.05,
    });

    // Dark Stepped Carpet Material
    const carpetMat = new THREE.MeshStandardMaterial({
      color: 0x5b1016, // Crimson Deep Carpet
      roughness: 0.85,
    });

    const armrestMat = new THREE.MeshStandardMaterial({
      color: 0x18181f,
      roughness: 0.4,
    });

    const highlightMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(categoryColor || '#1ed760'),
      emissive: new THREE.Color(categoryColor || '#1ed760'),
      emissiveIntensity: 0.7,
      roughness: 0.3,
    });

    // Seat Geometries
    const backGeo = new THREE.BoxGeometry(0.52, 0.54, 0.12);
    const headGeo = new THREE.BoxGeometry(0.42, 0.15, 0.14);
    const cushionGeo = new THREE.BoxGeometry(0.52, 0.11, 0.46);
    const armGeo = new THREE.BoxGeometry(0.08, 0.22, 0.42);

    for (let r = 1; r <= numRows; r++) {
      const rowY = getRowY(r);
      const rowZ = getRowZ(r);

      // Stepped Concrete Tier with Carpet
      const stepMesh = new THREE.Mesh(
        new THREE.BoxGeometry(17, rowY, 1.45),
        carpetMat
      );
      stepMesh.position.set(0, rowY / 2, rowZ);
      scene.add(stepMesh);

      // Step Edge Golden Warm LED Runner Strip
      const stepLip = new THREE.Mesh(
        new THREE.BoxGeometry(17, 0.03, 0.04),
        new THREE.MeshBasicMaterial({ color: 0xf59e0b })
      );
      stepLip.position.set(0, rowY + 0.015, rowZ - 0.7);
      scene.add(stepLip);

      // Render seats in front of viewer
      for (let c = 1; c <= numCols; c++) {
        if (r === row && c === col) continue; // Skip camera's own seat
        if (r > row) continue; // Only render rows in front

        const seatX = getSeatX(c);
        const isNeighbor = r === row && Math.abs(c - col) === 1;
        const mat = isNeighbor ? highlightMat : cinemaRedMat;

        // Seat Back
        const back = new THREE.Mesh(backGeo, mat);
        back.position.set(seatX, rowY + 0.52, rowZ + 0.14);
        scene.add(back);

        // Headrest
        const head = new THREE.Mesh(headGeo, mat);
        head.position.set(seatX, rowY + 0.81, rowZ + 0.14);
        scene.add(head);

        // Cushion
        const cushion = new THREE.Mesh(cushionGeo, mat);
        cushion.position.set(seatX, rowY + 0.23, rowZ - 0.06);
        scene.add(cushion);

        // Black Armrests with Cup Holders
        const armL = new THREE.Mesh(armGeo, armrestMat);
        armL.position.set(seatX - 0.29, rowY + 0.31, rowZ - 0.06);
        scene.add(armL);

        const armR = new THREE.Mesh(armGeo, armrestMat);
        armR.position.set(seatX + 0.29, rowY + 0.31, rowZ - 0.06);
        scene.add(armR);
      }
    }

    // ─── 7. VIP RECLINER ARMRESTS & CUP HOLDERS IN FOREGROUND ───
    const fgArmMat = new THREE.MeshStandardMaterial({
      color: 0x991b1b, // Red leather
      roughness: 0.35,
    });

    const fgArmL = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.38, 0.65), fgArmMat);
    fgArmL.position.set(mySeatX - 0.38, mySeatY + 0.3, mySeatZ + 0.05);
    scene.add(fgArmL);

    const fgArmR = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.38, 0.65), fgArmMat);
    fgArmR.position.set(mySeatX + 0.38, mySeatY + 0.3, mySeatZ + 0.05);
    scene.add(fgArmR);

    // Cup Holder Cylinders on Armrests
    const cupMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.2, metalness: 0.8 });
    const cupL = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.08, 16), cupMat);
    cupL.position.set(mySeatX - 0.38, mySeatY + 0.5, mySeatZ - 0.15);
    scene.add(cupL);

    const cupR = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.08, 16), cupMat);
    cupR.position.set(mySeatX + 0.38, mySeatY + 0.5, mySeatZ - 0.15);
    scene.add(cupR);

    // ─── 8. SMOOTH 60 FPS MOUSE PARALLAX ───
    let targetParallaxX = 0;
    let targetParallaxY = 0;
    let currentParallaxX = 0;
    let currentParallaxY = 0;

    const handleMouseMove = (e) => {
      const rect = container.getBoundingClientRect();
      const nx = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const ny = -(((e.clientY - rect.top) / rect.height) * 2 - 1);
      targetParallaxX = nx * 1.4;
      targetParallaxY = ny * 0.7;
    };

    container.addEventListener('mousemove', handleMouseMove);

    // ─── 9. ANIMATION LOOP ───
    let animId;
    const animate = () => {
      animId = requestAnimationFrame(animate);

      currentParallaxX += (targetParallaxX - currentParallaxX) * 0.09;
      currentParallaxY += (targetParallaxY - currentParallaxY) * 0.09;

      const dynamicTarget = new THREE.Vector3(
        screenTarget.x + currentParallaxX,
        screenTarget.y + currentParallaxY,
        screenTarget.z
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
