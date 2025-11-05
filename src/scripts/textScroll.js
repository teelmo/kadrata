export function initTextScroll(sceneController) {
  const textContainer = document.querySelector('.text-container');
  const headline = textContainer.querySelector('.headline');
  const bodyText = textContainer.querySelector('.body-text');

  let phase = 1;
  let scrollEnabled = false;
  let isTransitioning = false;

  // Create scroll arrow
  const arrow = document.createElement('div');
  arrow.className = 'scroll-indicator';
  arrow.innerHTML = `<div class="arrow"></div>`;
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
    textContainer.style.transform = 'translate(20%, 70vh)';
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
    textContainer.style.transform = 'translate(20%, 100vh)';
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