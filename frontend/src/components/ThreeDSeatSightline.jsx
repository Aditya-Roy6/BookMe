import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

/**
 * Photorealistic 3D Cinema / Stadium Auditorium Seat Sightline Engine
 * Real-time Three.js WebGL with realistic human eye camera placement,
 * curved IMAX laser screen, plush velvet seats, acoustic wood paneling, and volumetric lighting.
 */
export default function ThreeDSeatSightline({
  row = 1,
  col = 1,
  totalRows = 8,
  totalCols = 14,
  moviePoster,
  categoryName = 'Prime Club',
  categoryColor = '#1ed760',
}) {
  const mountRef = useRef(null);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth || 320;
    const height = container.clientHeight || 160;

    // 1. Scene & Camera Setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x050508);
    scene.fog = new THREE.FogExp2(0x050508, 0.018);

    const camera = new THREE.PerspectiveCamera(58, width / height, 0.1, 100);

    // Coordinate Math
    const numRows = Math.max(totalRows, 6);
    const numCols = Math.max(totalCols, 10);

    const getRowY = (r) => 0.8 + (r - 1) * 0.65;
    const getRowZ = (r) => 4.5 + (r - 1) * 2.2;

    const getSeatX = (c) => {
      const norm = (c - 0.5) / numCols - 0.5; // -0.5 to +0.5
      let x = norm * 12.0;
      if (x >= 0) x += 0.5;
      else x -= 0.5;
      return x;
    };

    const mySeatX = getSeatX(col);
    const mySeatY = getRowY(row);
    const mySeatZ = getRowZ(row);

    // Human eye position: 0.9m above the seat cushion
    camera.position.set(mySeatX, mySeatY + 0.9, mySeatZ);

    // Target look-at: Center of the IMAX screen (0, 3.2, 0)
    const screenTarget = new THREE.Vector3(0, 3.2, 0);
    camera.lookAt(screenTarget);

    // 2. High-Performance WebGL Renderer
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: false,
      powerPreference: 'high-performance',
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.25;
    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    // 3. Lighting Setup
    const ambientLight = new THREE.AmbientLight(0x1a1a24, 1.2);
    scene.add(ambientLight);

    // Screen Emissive Glow
    const screenLight = new THREE.PointLight(0x22c55e, 3.0, 25);
    screenLight.position.set(0, 3.5, 2);
    scene.add(screenLight);

    // Ambient Overhead Cinema Sconce Glow
    const ceilingLight = new THREE.PointLight(0x38bdf8, 1.0, 35);
    ceilingLight.position.set(0, 8.5, 8);
    scene.add(ceilingLight);

    // Projector Light Beam from Booth Behind Audience
    const projectorLight = new THREE.SpotLight(0xffffff, 4.0);
    projectorLight.position.set(0, 9.0, 26);
    projectorLight.target.position.set(0, 3.2, 0);
    projectorLight.angle = Math.PI / 7;
    projectorLight.penumbra = 0.6;
    scene.add(projectorLight);
    scene.add(projectorLight.target);

    // 4. Curved 3D IMAX Screen Mesh
    const screenWidth = 14;
    const screenHeight = 6.2;
    const screenRadius = 22;
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

    // Dynamic Canvas Texture for Screen
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');

    const drawScreen = (img) => {
      if (img) {
        ctx.drawImage(img, 0, 0, 1024, 512);
        // Vignette
        const grad = ctx.createRadialGradient(512, 256, 120, 512, 256, 500);
        grad.addColorStop(0, 'rgba(0,0,0,0)');
        grad.addColorStop(1, 'rgba(0,0,0,0.7)');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, 1024, 512);
      } else {
        // High-end Dolby Cinema Showcase Screen
        const grad = ctx.createLinearGradient(0, 0, 1024, 512);
        grad.addColorStop(0, '#061325');
        grad.addColorStop(0.5, '#0b3558');
        grad.addColorStop(1, '#07111e');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, 1024, 512);

        // Tech grid lines
        ctx.strokeStyle = 'rgba(56, 189, 248, 0.25)';
        ctx.lineWidth = 2;
        for (let i = 0; i < 1024; i += 64) {
          ctx.beginPath();
          ctx.moveTo(i, 0);
          ctx.lineTo(i, 512);
          ctx.stroke();
        }

        // Glowing center badge
        ctx.fillStyle = '#ffffff';
        ctx.font = '900 48px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('DOLBY CINEMA 4K', 512, 230);

        ctx.fillStyle = '#1ed760';
        ctx.font = '700 24px monospace';
        ctx.fillText('ATMOS IMMERSIVE SIGHTLINE', 512, 280);

        ctx.strokeStyle = '#1ed760';
        ctx.lineWidth = 4;
        ctx.strokeRect(30, 30, 964, 452);
      }
    };

    drawScreen(null);

    const screenTex = new THREE.CanvasTexture(canvas);
    if (moviePoster) {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.src = moviePoster;
      img.onload = () => {
        drawScreen(img);
        screenTex.needsUpdate = true;
      };
    }

    const screenMat = new THREE.MeshBasicMaterial({
      map: screenTex,
      side: THREE.BackSide,
    });
    const screenMesh = new THREE.Mesh(screenGeo, screenMat);
    screenMesh.position.set(0, 3.5, -screenRadius + 2.5);
    screenMesh.rotation.y = Math.PI;
    scene.add(screenMesh);

    // Glowing Neon Rim around the Screen
    const rimGeo = new THREE.CylinderGeometry(
      screenRadius + 0.05,
      screenRadius + 0.05,
      screenHeight + 0.2,
      40,
      1,
      true,
      Math.PI * 0.755,
      Math.PI * 0.49
    );
    const rimMat = new THREE.MeshBasicMaterial({
      color: 0x1ed760,
      wireframe: true,
      transparent: true,
      opacity: 0.35,
      side: THREE.BackSide,
    });
    const rimMesh = new THREE.Mesh(rimGeo, rimMat);
    rimMesh.position.copy(screenMesh.position);
    rimMesh.rotation.copy(screenMesh.rotation);
    scene.add(rimMesh);

    // 5. Stage & Auditorium Platform Floor
    const stageMat = new THREE.MeshStandardMaterial({ color: 0x0c0c10, roughness: 0.8 });
    const stage = new THREE.Mesh(new THREE.BoxGeometry(18, 0.6, 4.5), stageMat);
    stage.position.set(0, 0.3, 0.5);
    scene.add(stage);

    // Stage Front LED strip
    const stageLed = new THREE.Mesh(
      new THREE.BoxGeometry(18, 0.08, 0.08),
      new THREE.MeshBasicMaterial({ color: 0x1ed760 })
    );
    stageLed.position.set(0, 0.62, 2.75);
    scene.add(stageLed);

    // Main Auditorium Incline Floor
    const floorMat = new THREE.MeshStandardMaterial({ color: 0x08080a, roughness: 0.9 });
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(30, 40), floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.position.set(0, 0, 15);
    scene.add(floor);

    // 6. 3D Plush Velvet Seats & Stepped Tiers
    const seatBackGeo = new THREE.BoxGeometry(0.55, 0.55, 0.12);
    const seatHeadGeo = new THREE.BoxGeometry(0.42, 0.16, 0.14);
    const seatCushionGeo = new THREE.BoxGeometry(0.55, 0.12, 0.52);
    const armrestGeo = new THREE.BoxGeometry(0.08, 0.28, 0.48);

    const velvetMat = new THREE.MeshStandardMaterial({
      color: 0x1c1c24,
      roughness: 0.7,
      metalness: 0.1,
    });

    const highlightMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(categoryColor || '#1ed760'),
      emissive: new THREE.Color(categoryColor || '#1ed760'),
      emissiveIntensity: 0.7,
      roughness: 0.3,
    });

    // Render tiers and chairs:
    // IMPORTANT: Only render rows in front (r < row), or adjacent chairs in the same row!
    for (let r = 1; r <= numRows; r++) {
      const rowY = getRowY(r);
      const rowZ = getRowZ(r);

      // Stepped Concrete Tier Platform
      const stepMesh = new THREE.Mesh(
        new THREE.BoxGeometry(20, rowY, 2.2),
        new THREE.MeshStandardMaterial({ color: 0x0f0f14, roughness: 0.9 })
      );
      stepMesh.position.set(0, rowY / 2, rowZ);
      scene.add(stepMesh);

      // Aisle LED Guide lights
      const aisleLedLeft = new THREE.Mesh(
        new THREE.BoxGeometry(0.12, 0.04, 2.0),
        new THREE.MeshBasicMaterial({ color: 0x38bdf8 })
      );
      aisleLedLeft.position.set(-0.55, rowY + 0.02, rowZ);
      scene.add(aisleLedLeft);

      const aisleLedRight = new THREE.Mesh(
        new THREE.BoxGeometry(0.12, 0.04, 2.0),
        new THREE.MeshBasicMaterial({ color: 0x38bdf8 })
      );
      aisleLedRight.position.set(0.55, rowY + 0.02, rowZ);
      scene.add(aisleLedRight);

      // Seat Chairs
      for (let c = 1; c <= numCols; c++) {
        // Skip current seat chair itself so it doesn't clip right through the camera view!
        if (r === row && c === col) continue;

        // Skip seats behind the user to maximize performance & prevent backward clutter
        if (r > row + 1) continue;

        const seatX = getSeatX(c);
        const isNeighbor = r === row && Math.abs(c - col) === 1;

        // Seat Back
        const back = new THREE.Mesh(seatBackGeo, isNeighbor ? highlightMat : velvetMat);
        back.position.set(seatX, rowY + 0.55, rowZ + 0.2);
        scene.add(back);

        // Headrest
        const head = new THREE.Mesh(seatHeadGeo, isNeighbor ? highlightMat : velvetMat);
        head.position.set(seatX, rowY + 0.86, rowZ + 0.2);
        scene.add(head);

        // Cushion
        const cushion = new THREE.Mesh(seatCushionGeo, isNeighbor ? highlightMat : velvetMat);
        cushion.position.set(seatX, rowY + 0.28, rowZ - 0.08);
        scene.add(cushion);

        // Armrests
        const armL = new THREE.Mesh(armrestGeo, velvetMat);
        armL.position.set(seatX - 0.3, rowY + 0.38, rowZ - 0.08);
        scene.add(armL);

        const armR = new THREE.Mesh(armrestGeo, velvetMat);
        armR.position.set(seatX + 0.3, rowY + 0.38, rowZ - 0.08);
        scene.add(armR);
      }
    }

    // 7. Viewer's Own Armrests in Immediate Foreground (Bottom of Camera View)
    const userArmL = new THREE.Mesh(
      new THREE.BoxGeometry(0.12, 0.4, 0.7),
      new THREE.MeshStandardMaterial({ color: 0x141418, roughness: 0.6 })
    );
    userArmL.position.set(mySeatX - 0.42, mySeatY + 0.35, mySeatZ + 0.1);
    scene.add(userArmL);

    const userArmR = new THREE.Mesh(
      new THREE.BoxGeometry(0.12, 0.4, 0.7),
      new THREE.MeshStandardMaterial({ color: 0x141418, roughness: 0.6 })
    );
    userArmR.position.set(mySeatX + 0.42, mySeatY + 0.35, mySeatZ + 0.1);
    scene.add(userArmR);

    // 8. Acoustic Timber Sidewalls & Atmos Speakers
    const wallMat = new THREE.MeshStandardMaterial({ color: 0x09090d, roughness: 0.85 });
    const wallL = new THREE.Mesh(new THREE.BoxGeometry(0.4, 12, 35), wallMat);
    wallL.position.set(-9.5, 5, 12);
    scene.add(wallL);

    const wallR = new THREE.Mesh(new THREE.BoxGeometry(0.4, 12, 35), wallMat);
    wallR.position.set(9.5, 5, 12);
    scene.add(wallR);

    // Wall Sconces with warm amber lighting
    for (let z = 4; z < 26; z += 5) {
      const sconce = new THREE.Mesh(
        new THREE.BoxGeometry(0.1, 0.5, 0.25),
        new THREE.MeshBasicMaterial({ color: 0x38bdf8 })
      );
      sconce.position.set(-9.25, 4.8, z);
      scene.add(sconce);

      const sconceR = new THREE.Mesh(
        new THREE.BoxGeometry(0.1, 0.5, 0.25),
        new THREE.MeshBasicMaterial({ color: 0x38bdf8 })
      );
      sconceR.position.set(9.25, 4.8, z);
      scene.add(sconceR);
    }

    // 9. Smooth Interactive Mouse Parallax Gyro
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

    // 10. Animation Loop
    let animId;
    let clock = new THREE.Clock();

    const animate = () => {
      animId = requestAnimationFrame(animate);
      const elapsedTime = clock.getElapsedTime();

      // Smooth interpolation for mouse parallax
      currentParallaxX += (targetParallaxX - currentParallaxX) * 0.08;
      currentParallaxY += (targetParallaxY - currentParallaxY) * 0.08;

      // Subtle projector light flicker
      screenLight.intensity = 2.8 + Math.sin(elapsedTime * 5) * 0.25;

      const dynamicLookAt = new THREE.Vector3(
        screenTarget.x + currentParallaxX,
        screenTarget.y + currentParallaxY,
        screenTarget.z
      );
      camera.lookAt(dynamicLookAt);

      renderer.render(scene, camera);
    };

    animate();

    // 11. Cleanup on unmount
    return () => {
      cancelAnimationFrame(animId);
      container.removeEventListener('mousemove', handleMouseMove);
      renderer.dispose();
      scene.clear();
    };
  }, [row, col, totalRows, totalCols, moviePoster, categoryName, categoryColor]);

  return (
    <div
      ref={mountRef}
      className="w-full h-full rounded-xl overflow-hidden cursor-grab active:cursor-grabbing relative select-none"
    />
  );
}
