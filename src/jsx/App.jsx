import React, {
  useEffect
} from 'react';
import '../styles/styles.less';

// src/scripts/scene.js
import * as THREE from 'three';

function App() {
  function initScene(container) {
    if (!container) throw new Error('Scene container not found');
    const scene = new THREE.Scene();

    const camera = new THREE.PerspectiveCamera(
      75,
      container.clientWidth / container.clientHeight,
      0.1,
      10
    );
    camera.position.z = 1;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(window.devicePixelRatio || 2);
    container.appendChild(renderer.domElement);

    // Load main scene images
    const images = [
      '/assets/img/1.jpg',
      '/assets/img/2.jpg',
      '/assets/img/3.jpg'
    ];

    const loader = new THREE.TextureLoader();
    const textures = images.map(img => {
      const tex = loader.load(img);
      // tex.encoding = THREE.sRGBEncoding;
      return tex;
    });

    /// Clouds
    const cloudCount = 150;
    const clouds = [];
    let phase = 1;

    loader.load('/assets/img/cloud.png', (cloudTex) => {
      for (let i = 0; i < cloudCount; i++) {
        const cloudMat = new THREE.SpriteMaterial({
          map: cloudTex,
          transparent: true,
          opacity: 0.1 + Math.random() * 0.2,
          blending: THREE.AdditiveBlending,
        });

        const cloud = new THREE.Sprite(cloudMat);

        // Random position around center
        cloud.position.set(
          (Math.random() - 0.5) * 2,
          (Math.random() - 0.5) * 2,
          0.1 + Math.random() * 0.4
        );
        cloud.material.rotation = Math.random() * Math.PI * 2;

        // Random scale
        const scale = 0.1 + Math.random() * 0.7;
        cloud.scale.set(scale, scale, 1);

        scene.add(cloud);
        clouds.push(cloud);
      }
    });

    // Store initial cloud states for reset
    const initialCloudStates = [];

    function storeInitialClouds() {
      initialCloudStates.length = 0;
      clouds.forEach(cloud => {
        initialCloudStates.push({
          opacity: cloud.material.opacity,
          position: cloud.position.clone(),
          scale: cloud.scale.clone()
        });
      });
    }

    const zoom = 1.5;
    let offsetX = 0; let offsetY = 0; let targetX = 0; let
      targetY = 0;

    window.addEventListener('mousemove', e => {
      targetX = (e.clientX / window.innerWidth - 0.5) * 2;
      targetY = (0.5 - e.clientY / window.innerHeight) * 2;
    });

    // Shader material for main plane
    const material = new THREE.ShaderMaterial({
      uniforms: {
        brightness: { value: 0.8 },
        map1: { value: textures[0] },
        map2: { value: textures[1] },
        mixFactor: { value: 0 },
        offset: { value: new THREE.Vector2(0, 0) },
        zoom: { value: zoom }
      },
      vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0);
        }
      `,
      fragmentShader: `
        uniform sampler2D map1;
        uniform sampler2D map2;
        uniform float mixFactor;
        uniform float brightness;
        uniform float zoom;
        uniform vec2 offset;
        varying vec2 vUv;
        void main() {
          vec2 uv = vUv - 0.5;
          uv /= zoom;
          uv += 0.5;
          uv += offset;

          vec4 color1 = texture2D(map1, uv);
          vec4 color2 = texture2D(map2, uv);
          vec4 color = mix(color1, color2, mixFactor);
          color.rgb *= brightness;
          gl_FragColor = color;
        }
      `
    });

    const geometry = new THREE.PlaneGeometry(2, 2);
    const plane = new THREE.Mesh(geometry, material);
    scene.add(plane);

    // Animate
    function animate() {
      requestAnimationFrame(animate);

      offsetX += (targetX * 0.01 - offsetX) * 0.05;
      offsetY += (targetY * 0.01 - offsetY) * 0.05;
      material.uniforms.offset.value.set(offsetX, offsetY);

      clouds.forEach((cloud, i) => {
        if (phase === 1) {
        // slow horizontal movement
          cloud.position.x += 0.0005 * ((i % 2 === 0) ? -1 : 1);

          // cursor repulsion
          const dx = cloud.position.x - targetX;
          const dy = cloud.position.y - targetY;
          const dist = Math.sqrt(dx * dx + dy * dy);
          const repelRadius = 0.3;
          if (dist < repelRadius) {
            const force = (repelRadius - dist) * 0.02;
            cloud.position.x += (dx / dist) * force;
            cloud.position.y += (dy / dist) * force;
          }

          // only restore if cloud was previously blown away
          if (cloud.recoverFromBlowAway) {
            const init = initialCloudStates[i];
            cloud.position.lerp(init.position, 0.05);
            cloud.scale.lerp(init.scale, 0.05);
            cloud.material.opacity += (init.opacity - cloud.material.opacity) * 0.05;

            // check if recovery is basically done
            if (cloud.position.distanceTo(init.position) < 0.001) {
              cloud.recoverFromBlowAway = false;
            }
          }
        }

        if (phase === 2) {
        // mark cloud as "needs recovery" for later
          cloud.recoverFromBlowAway = true;

          // blow-away: move toward nearest edge
          const targetXEdge = (Math.abs(cloud.position.x) > Math.abs(cloud.position.y))
            ? (cloud.position.x > 0 ? 1.2 : -1.2)
            : cloud.position.x;
          const targetYEdge = (Math.abs(cloud.position.y) >= Math.abs(cloud.position.x))
            ? (cloud.position.y > 0 ? 1.2 : -1.2)
            : cloud.position.y;

          cloud.position.x += (targetXEdge - cloud.position.x) * 0.05;
          cloud.position.y += (targetYEdge - cloud.position.y) * 0.05;

          cloud.scale.x *= 0.99;
          cloud.scale.y *= 0.99;
          cloud.material.opacity *= 0.96;
        }
      });

      renderer.render(scene, camera);
    }

    animate();

    window.addEventListener('resize', () => {
      camera.aspect = container.clientWidth / container.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(container.clientWidth, container.clientHeight);
    });

    async function transitionTo(nextIndex) {
      return new Promise(resolve => {
        material.uniforms.map2.value = textures[nextIndex];
        let mix = 0;
        const duration = 2;
        const startTime = performance.now();

        function animateMix() {
          const elapsed = (performance.now() - startTime) / 1000;
          mix = Math.min(elapsed / duration, 1);
          material.uniforms.mixFactor.value = mix;
          if (mix < 1) requestAnimationFrame(animateMix);
          else {
            material.uniforms.map1.value = material.uniforms.map2.value;
            material.uniforms.mixFactor.value = 0;
            resolve();
          }
        }
        animateMix();
      });
    }

    // Store initial cloud positions after they are loaded
    setTimeout(storeInitialClouds, 500);

    return {
      scenePlane: plane,
      textures,
      transitionTo,
      setPhase: (p) => { phase = p; }
    };
  }
  function initTextScroll(sceneController) {
    const textContainer = document.querySelector('.text-container');
    const bodyText = textContainer.querySelector('.body-text');

    let phase = 1;
    let scrollEnabled = false;
    let isTransitioning = false;

    // Create scroll arrow
    const arrow = document.createElement('div');
    arrow.className = 'scroll-indicator';
    arrow.innerHTML = '<div class="arrow"></div>';
    document.body.appendChild(arrow);

    // Enable scrolling after intro delay
    setTimeout(() => {
      scrollEnabled = true;
      arrow.style.opacity = '1';
    }, 3000);

    async function goForward() {
      if (isTransitioning || phase !== 1) return; // only trigger once from start
      isTransitioning = true;
      scrollEnabled = false;
      arrow.style.opacity = '0';

      // === Phase 1 → 2 ===
      sceneController.setPhase(2);
      textContainer.style.transition = 'transform 1.5s ease-out';
      textContainer.style.transform = 'translate(0, 70vh)';
      await sceneController.transitionTo(1);

      // === Phase 2 → 3 === (auto-triggered)
      bodyText.style.transition = 'opacity 1.5s ease-in';
      bodyText.style.opacity = '1';
      await sceneController.transitionTo(2);

      phase = 3;
      scrollEnabled = true;
      isTransitioning = false;
    }

    async function goBackward() {
      if (isTransitioning || phase !== 3) return; // only valid when at end
      isTransitioning = true;
      scrollEnabled = false;

      // === Phase 3 → 1 (skip 2) ===
      bodyText.style.opacity = '0';
      textContainer.style.transition = 'transform 1.5s ease-out';
      textContainer.style.transform = 'translate(0, 100vh)';
      await sceneController.transitionTo(0);

      phase = 1;
      sceneController.setPhase(1);
      arrow.style.opacity = '1';
      scrollEnabled = true;
      isTransitioning = false;
    }

    function handleScroll(event) {
      if (!scrollEnabled) return;

      const delta = event.deltaY || event.touches?.[0]?.clientY || 0;

      if (delta > 0 && phase === 1) {
        goForward();
      } else if (delta < 0 && phase === 3) {
        goBackward();
      }
    }

    // Listen for both mouse and touch scroll
    window.addEventListener('wheel', handleScroll, { passive: true });
    window.addEventListener('touchstart', handleScroll, { passive: true });
  }
  useEffect(() => {
    const container = document.querySelector('.scene-container');
    const sceneController = initScene(container);
    initTextScroll(sceneController);
  }, []);

  return (
    <>
      <div className="scene-container" />
      <div className="text-container">
        <div className="container">
          <h2 className="headline">Name of the Company</h2>
          <div className="body-text">
            <h3>This is more about what the company does.</h3>
            <h3>And contact info</h3>
          </div>
        </div>
      </div>
    </>
  );
}

export default App;
