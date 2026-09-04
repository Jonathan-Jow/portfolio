import * as THREE from "https://unpkg.com/three@0.160.0/build/three.module.js";

const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const progressBar = document.getElementById('progress-bar');
const topbar = document.querySelector('.topbar');
document.getElementById('year').textContent = new Date().getFullYear();

function updateScrollState() {
  const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
  progressBar.style.width = `${maxScroll > 0 ? (window.scrollY / maxScroll) * 100 : 0}%`;
  topbar.classList.toggle('scrolled', window.scrollY > 24);
}
window.addEventListener('scroll', updateScrollState, { passive: true });
updateScrollState();

const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry) => { if (entry.isIntersecting) entry.target.classList.add('is-visible'); });
}, { threshold: .14 });
document.querySelectorAll('.reveal').forEach((element) => revealObserver.observe(element));

const chapterObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (!entry.isIntersecting) return;
    document.querySelectorAll('.nav-links a').forEach((link) => link.classList.toggle('active', link.dataset.nav === entry.target.id));
  });
}, { threshold: .48 });
document.querySelectorAll('[data-chapter]').forEach((chapter) => chapterObserver.observe(chapter));

// Profundidade discreta nos cards, sem afetar a navegação por toque.
if (!reduceMotion && window.matchMedia('(pointer: fine)').matches) {
  document.querySelectorAll('.project-card').forEach((card) => {
    card.addEventListener('pointermove', (event) => {
      const bounds = card.getBoundingClientRect();
      const x = (event.clientX - bounds.left) / bounds.width - .5;
      const y = (event.clientY - bounds.top) / bounds.height - .5;
      card.style.transform = `perspective(1000px) rotateX(${-y * 1.4}deg) rotateY(${x * 1.4}deg) translateY(-7px)`;
    });
    card.addEventListener('pointerleave', () => { card.style.transform = ''; });
  });
}

// Campo 3D leve no primeiro capítulo: cria movimento sem competir com o conteúdo.
const host = document.getElementById('hero-3d');
if (host && !reduceMotion) {
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(55, 1, .1, 100);
  camera.position.set(0, 0, 7);
  const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.7));
  host.appendChild(renderer.domElement);

  const wire = new THREE.LineSegments(
    new THREE.EdgesGeometry(new THREE.IcosahedronGeometry(1.6, 1)),
    new THREE.LineBasicMaterial({ color: 0xd9ff57, transparent: true, opacity: .19 })
  );
  wire.position.set(2.4, .1, 0);
  scene.add(wire);

  const particleCount = 150;
  const positions = new Float32Array(particleCount * 3);
  for (let i = 0; i < particleCount; i += 1) {
    positions[i * 3] = (Math.random() - .5) * 12;
    positions[i * 3 + 1] = (Math.random() - .5) * 7;
    positions[i * 3 + 2] = (Math.random() - .5) * 4;
  }
  const particlesGeometry = new THREE.BufferGeometry();
  particlesGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  const particles = new THREE.Points(particlesGeometry, new THREE.PointsMaterial({ color: 0xd9ff57, size: .025, transparent: true, opacity: .55 }));
  scene.add(particles);

  const pointer = { x: 0, y: 0 };
  window.addEventListener('pointermove', (event) => {
    pointer.x = event.clientX / window.innerWidth - .5;
    pointer.y = event.clientY / window.innerHeight - .5;
  }, { passive: true });

  function resize() {
    const width = host.clientWidth;
    const height = host.clientHeight;
    if (!width || !height) return;
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height);
  }
  window.addEventListener('resize', resize, { passive: true });
  resize();

  const clock = new THREE.Clock();
  function draw() {
    requestAnimationFrame(draw);
    const time = clock.getElapsedTime();
    wire.rotation.x = time * .08 + pointer.y * .3;
    wire.rotation.y = time * .13 + pointer.x * .3;
    particles.rotation.y = time * .018;
    particles.rotation.x = pointer.y * .08;
    renderer.render(scene, camera);
  }
  draw();
}
