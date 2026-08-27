import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

/**
 * Photorealistic 3D First-Person Seat Sightline Engine (Three.js WebGL)
 * Real-time 3D camera positioned at exact seat coordinates inside an auditorium/stadium.
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

    const width = container.clientWidth || 300;
    const height = container.clientHeight || 150;

    // 1. Scene & Camera
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x060608);
    scene.fog = new THREE.FogExp2(0x060608, 0.025);

    const camera = new THREE.PerspectiveCamera(55, width / height, 0.1, 100);

    // Calculate exact 3D position of the hovered seat
    const colPercent = totalCols > 1 ? (col - 1) / (totalCols - 1) : 0.5; // 0 (left) -> 0.5 (center) -> 1 (right)
    const rowPercent = totalRows > 1 ? (row - 1) / (totalRows - 1) : 0.5; // 0 (front) -> 1 (back)

    const posX = (colPercent - 0.5) * 14.5;
    const posY = 1.2 + rowPercent * 4.8;
    const posZ = 5.5 + rowPercent * 14.5;

    camera.position.set(posX, posY, posZ);
    // Look at center-screen
    const targetLookAt = new THREE.Vector3(0, 3.2, 0);
    camera.lookAt(targetLookAt);

    // 2. WebGL Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.1;
    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    // 3. Lighting
    const ambientLight = new THREE.AmbientLight(0x222233, 0.8);
    scene.add(ambientLight);

    const screenLight = new THREE.PointLight(0x1ed760, 2.5, 30);
    screenLight.position.set(0, 4, 1);
    scene.add(screenLight);

    const ceilingGlow = new THREE.PointLight(0x38bdf8, 1.2, 40);
    ceilingGlow.position.set(0, 10, 10);
    scene.add(ceilingGlow);

    // 4. Curved 3D Cinema Screen
    const screenRadius = 18;
    const screenHeight = 7.5;
    const screenGeo = new THREE.CylinderGeometry(
      screenRadius,
      screenRadius,
      screenHeight,
      36,
      1,
      true,
      Math.PI * 0.73,
      Math.PI * 0.54
    );

    // Texture loader or dynamic screen canvas
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');

    const renderScreenTexture = (img) => {
      if (img) {
        ctx.drawImage(img, 0, 0, 1024, 512);
        // Vignette & Glow
        const grad = ctx.createRadialGradient(512, 256, 100, 512, 256, 500);
        grad.addColorStop(0, 'rgba(0,0,0,0)');
        grad.addColorStop(1, 'rgba(0,0,0,0.65)');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, 1024, 512);
      } else {
        // Glowing Futuristic Screen Graphic
        const grad = ctx.createLinearGradient(0, 0, 1024, 512);
        grad.addColorStop(0, '#0a192f');
        grad.addColorStop(0.5, '#0f3460');
        grad.addColorStop(1, '#1a1a2e');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, 1024, 512);

        ctx.strokeStyle = '#1ed760';
        ctx.lineWidth = 6;
        ctx.strokeRect(40, 40, 944, 432);

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 44px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('4K LASER DOLBY ATMOS', 512, 240);

        ctx.fillStyle = '#1ed760';
        ctx.font = 'bold 26px monospace';
        ctx.fillText('HIGH CONTRAST IMMERSION', 512, 290);
      }
    };

    renderScreenTexture(null);
    if (moviePoster) {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.src = moviePoster;
      img.onload = () => {
        renderScreenTexture(img);
        screenTex.needsUpdate = true;
      };
    }

    const screenTex = new THREE.CanvasTexture(canvas);
    const screenMat = new THREE.MeshBasicMaterial({
      map: screenTex,
      side: THREE.BackSide,
    });
    const screenMesh = new THREE.Mesh(screenGeo, screenMat);
    screenMesh.position.set(0, 4, -18);
    screenMesh.rotation.y = Math.PI;
    scene.add(screenMesh);

    // Screen Top & Bottom Bezel Glow Frame
    const frameGeo = new THREE.CylinderGeometry(
      screenRadius + 0.05,
      screenRadius + 0.05,
      screenHeight + 0.2,
      36,
      1,
      true,
      Math.PI * 0.725,
      Math.PI * 0.55
    );
    const frameMat = new THREE.MeshBasicMaterial({
      color: 0x1ed760,
      wireframe: true,
      transparent: true,
      opacity: 0.25,
      side: THREE.BackSide,
    });
    const frameMesh = new THREE.Mesh(frameGeo, frameMat);
    frameMesh.position.copy(screenMesh.position);
    frameMesh.rotation.copy(screenMesh.rotation);
    scene.add(frameMesh);

    // 5. Stage & Auditorium Floor Riser Steps
    const floorGeo = new THREE.PlaneGeometry(50, 40);
    const floorMat = new THREE.MeshStandardMaterial({
      color: 0x0a0a0e,
      roughness: 0.85,
      metalness: 0.2,
    });
    const floorMesh = new THREE.Mesh(floorGeo, floorMat);
    floorMesh.rotation.x = -Math.PI / 2;
    floorMesh.position.set(0, -0.2, 5);
    scene.add(floorMesh);

    // Stage Front Platform
    const stageGeo = new THREE.BoxGeometry(22, 0.8, 6);
    const stageMat = new THREE.MeshStandardMaterial({ color: 0x111116, roughness: 0.7 });
    const stageMesh = new THREE.Mesh(stageGeo, stageMat);
    stageMesh.position.set(0, 0.4, -2.5);
    scene.add(stageMesh);

    // Stage Rim LED Strip
    const stageLedGeo = new THREE.BoxGeometry(22, 0.1, 0.1);
    const stageLedMat = new THREE.MeshBasicMaterial({ color: 0x1ed760 });
    const stageLed = new THREE.Mesh(stageLedGeo, stageLedMat);
    stageLed.position.set(0, 0.85, 0.45);
    scene.add(stageLed);

    // 6. Tiered 3D Seats Hierarchy (Rows A..H)
    const seatBackGeo = new THREE.BoxGeometry(0.7, 0.65, 0.15);
    const seatCushionGeo = new THREE.BoxGeometry(0.7, 0.15, 0.65);
    const seatArmGeo = new THREE.BoxGeometry(0.12, 0.35, 0.65);

    const normalMat = new THREE.MeshStandardMaterial({ color: 0x1c1c22, roughness: 0.6 });
    const currentSeatMat = new THREE.MeshStandardMaterial({
      color: categoryColor === '#ffffff' ? 0xffffff : new THREE.Color(categoryColor || '#1ed760'),
      emissive: new THREE.Color(categoryColor || '#1ed760'),
      emissiveIntensity: 0.6,
      roughness: 0.3,
    });

    const rowsCount = Math.min(totalRows, 10);
    const colsCount = Math.min(totalCols, 16);

    for (let r = 1; r <= rowsCount; r++) {
      const rRatio = (r - 1) / (rowsCount - 1 || 1);
      const rowY = 0.5 + rRatio * 4.8;
      const rowZ = 5.0 + rRatio * 14.0;

      // Create Stepped Tier Concrete Platform under each row
      const stepGeo = new THREE.BoxGeometry(22, rowY, 1.8);
      const stepMat = new THREE.MeshStandardMaterial({ color: 0x0d0d12, roughness: 0.9 });
      const stepMesh = new THREE.Mesh(stepGeo, stepMat);
      stepMesh.position.set(0, rowY / 2, rowZ);
      scene.add(stepMesh);

      // Floor Aisle Step LED indicator
      const aisleLedGeo = new THREE.BoxGeometry(0.15, 0.05, 1.6);
      const aisleLedMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });
      const aisleLedLeft = new THREE.Mesh(aisleLedGeo, aisleLedMat);
      aisleLedLeft.position.set(-0.8, rowY + 0.03, rowZ);
      scene.add(aisleLedLeft);

      const aisleLedRight = new THREE.Mesh(aisleLedGeo, aisleLedMat);
      aisleLedRight.position.set(0.8, rowY + 0.03, rowZ);
      scene.add(aisleLedRight);

      // Seat Chairs
      for (let c = 1; c <= colsCount; c++) {
        const cRatio = (c - 1) / (colsCount - 1 || 1);
        let seatX = (cRatio - 0.5) * 14.0;
        // Create central aisle gap
        if (seatX >= 0) seatX += 0.8;
        else seatX -= 0.8;

        const isCurrentSeat = r === row && c === col;
        const mat = isCurrentSeat ? currentSeatMat : normalMat;

        // Seat Back
        const backMesh = new THREE.Mesh(seatBackGeo, mat);
        backMesh.position.set(seatX, rowY + 0.65, rowZ + 0.25);
        scene.add(backMesh);

        // Seat Cushion
        const cushionMesh = new THREE.Mesh(seatCushionGeo, mat);
        cushionMesh.position.set(seatX, rowY + 0.35, rowZ - 0.05);
        scene.add(cushionMesh);

        // Armrests
        const armL = new THREE.Mesh(seatArmGeo, mat);
        armL.position.set(seatX - 0.38, rowY + 0.45, rowZ - 0.05);
        scene.add(armL);

        const armR = new THREE.Mesh(seatArmGeo, mat);
        armR.position.set(seatX + 0.38, rowY + 0.45, rowZ - 0.05);
        scene.add(armR);
      }
    }

    // 7. Sidewalls with Dolby Atmos Speaker Units
    const wallMat = new THREE.MeshStandardMaterial({ color: 0x09090d, roughness: 0.9 });
    const wallLeft = new THREE.Mesh(new THREE.BoxGeometry(0.5, 12, 35), wallMat);
    wallLeft.position.set(-11, 5, 5);
    scene.add(wallLeft);

    const wallRight = new THREE.Mesh(new THREE.BoxGeometry(0.5, 12, 35), wallMat);
    wallRight.position.set(11, 5, 5);
    scene.add(wallRight);

    // Wall Sconces / Atmos Speakers with blue glow
    for (let z = 0; z < 25; z += 6) {
      const speakerMat = new THREE.MeshBasicMaterial({ color: 0x539df5 });
      const spkL = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.4, 0.4), speakerMat);
      spkL.position.set(-10.7, 5.5, z);
      scene.add(spkL);

      const spkR = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.4, 0.4), speakerMat);
      spkR.position.set(10.7, 5.5, z);
      scene.add(spkR);
    }

    // 8. Interactive Mouse Parallax Look-Around Effect
    let mouseX = 0;
    let mouseY = 0;

    const handleMouseMove = (e) => {
      const rect = container.getBoundingClientRect();
      const nx = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const ny = -(((e.clientY - rect.top) / rect.height) * 2 - 1);
      mouseX = nx * 0.25;
      mouseY = ny * 0.15;
    };

    container.addEventListener('mousemove', handleMouseMove);

    // 9. Animation Loop
    let animId;
    let clock = new THREE.Clock();

    const animate = () => {
      animId = requestAnimationFrame(animate);
      const elapsedTime = clock.getElapsedTime();

      // Subtle projector pulse
      screenLight.intensity = 2.2 + Math.sin(elapsedTime * 4) * 0.3;

      // Apply subtle mouse parallax to camera lookAt
      const dynamicTarget = new THREE.Vector3(
        targetLookAt.x + mouseX * 4.0,
        targetLookAt.y + mouseY * 2.5,
        targetLookAt.z
      );
      camera.lookAt(dynamicTarget);

      renderer.render(scene, camera);
    };

    animate();

    // 10. Cleanup on Unmount
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
      className="w-full h-full rounded-xl overflow-hidden cursor-crosshair relative select-none"
    />
  );
}
