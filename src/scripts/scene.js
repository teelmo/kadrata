import * as THREE from 'three';

export function initScene(container) {
  const scene = new THREE.Scene();

  const camera = new THREE.PerspectiveCamera(
    75,
    container.clientWidth / container.clientHeight,
    0.1,
    1000
  );

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setSize(container.clientWidth, container.clientHeight);
  container.appendChild(renderer.domElement);

  const texture = new THREE.TextureLoader().load('/assets/img/1.jpg');

  // Full sphere geometry
  const radius = 5;
  const widthSegments = 64;
  const heightSegments = 64;
  const geometry = new THREE.SphereGeometry(radius, widthSegments, heightSegments);
  geometry.scale(-1, 1, 1); // invert normals so camera sees inside

  const material = new THREE.MeshBasicMaterial({ map: texture, side: THREE.BackSide });
  const sphere = new THREE.Mesh(geometry, material);
  scene.add(sphere);

  camera.position.set(0, 0, 0); // inside the sphere

  // optional slow rotation
  function animate() {
    requestAnimationFrame(animate);
    sphere.rotation.y += 0.0008;
    renderer.render(scene, camera);
  }

  animate();

  window.addEventListener('resize', () => {
    camera.aspect = container.clientWidth / container.clientHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(container.clientWidth, container.clientHeight);
  });
}