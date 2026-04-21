const slides = Array.from(document.querySelectorAll('.slide'));
const backBtn = document.getElementById('back-btn');
const storyImages = document.getElementById('story-images');
const storyImgA = document.getElementById('story-img-a');
const storyImgB = document.getElementById('story-img-b');
const storyBtn = document.getElementById('story-btn');
let current = 1;
let busy = false;

function updateStoryImages(slideEl) {
    const pair = slideEl.dataset.pair;
    const tip  = slideEl.dataset.tip;

    if (pair) {
        storyImgA.src = `/static/img/marshmallow_experiment/aligned/${pair}a.png`;
        storyImgB.src = `/static/img/marshmallow_experiment/aligned/${pair}b.png`;
        storyImgA.style.gridColumn = '';
        storyImgB.style.display = '';
        storyBtn.innerHTML = slideEl.dataset.btnText;
        storyBtn.dataset.next = slideEl.dataset.btnNext;
        storyImages.classList.remove('single');
        storyImages.classList.add('visible');
    } else if (tip) {
        storyImgA.src = `/static/img/final_three/${tip}.svg`;
        storyImgB.style.display = 'none';
        if ('btnRestart' in slideEl.dataset) {
            storyBtn.innerHTML = '&#8634;';
            storyBtn.dataset.next = '';
        } else {
            storyBtn.innerHTML = slideEl.dataset.btnText;
            storyBtn.dataset.next = slideEl.dataset.btnNext;
        }
        storyImages.classList.add('single', 'visible');
    } else {
        storyImages.classList.remove('visible', 'single');
    }
}

storyBtn.addEventListener('click', () => {
    if (storyBtn.dataset.next === '') {
        goTo(0, 'back');
        return;
    }
    const nextId = storyBtn.dataset.next;
    const nextIndex = slides.findIndex(s => s.id === nextId);
    if (nextIndex !== -1) goTo(nextIndex, 'forward');
});

function goTo(index, direction) {
    if (busy || index === current) return;
    busy = true;

    const from = slides[current];
    const to = slides[index];
    updateStoryImages(to);
    if (to.id === 'slide-3') { adVideo.currentTime = 0; adVideo.play().catch(() => {}); }

    const enterFrom = direction === 'forward' ? 'enter-from-right' : 'enter-from-left';
    const exitTo    = direction === 'forward' ? 'exit-left'         : 'exit-right';

    // Scroll the incoming slide to top before showing it
    to.scrollTop = 0;

    // Position incoming slide off-screen without transition
    to.classList.add(enterFrom);
    to.classList.add('active');

    // Force reflow so the starting transform is painted before we transition
    to.getBoundingClientRect();

    // Exit: ease-in so it accelerates out and disappears decisively
    // Enter: ease-out so it decelerates and lands gently
    from.style.transition = 'opacity 0.13s linear, transform 0.13s linear';
    to.style.transition   = 'opacity 0.3s ease-out, transform 0.3s ease-out';

    from.classList.add(exitTo);
    from.classList.remove('active');
    to.classList.remove(enterFrom);

    setTimeout(() => {
        from.classList.remove(exitTo);
        from.style.transition = '';
        to.style.transition   = '';
        current = index;
        busy = false;
        updateBackBtn();
    }, 320);
}

function updateBackBtn() {
    backBtn.classList.toggle('visible', current > 0);
}

// Forward navigation via continue buttons
document.querySelectorAll('.continue-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        const nextId = btn.dataset.next;
        const nextIndex = slides.findIndex(s => s.id === nextId);
        if (nextIndex === -1) return;

        if (btn.id === 'okay-btn') startAdTimer();

        goTo(nextIndex, 'forward');
    });
});

document.addEventListener('keydown', event => {
    if (busy) return;

    if (event.key === 'ArrowLeft') {
        event.preventDefault();
        if (current > 0) goTo(current - 1, 'back');
    }

    if (event.key === 'ArrowRight') {
        event.preventDefault();
        if (current < slides.length - 1) goTo(current + 1, 'forward');
    }
});

// Back button
backBtn.addEventListener('click', () => {
    if (current > 0) goTo(current - 1, 'back');
});


// --- Ad timer ---

const adVideo = document.getElementById('ad-video');
let adStart = null;

function startAdTimer() {
    adStart = Date.now();
    adVideo.currentTime = 0;
    adVideo.play().catch(() => {});
}

updateStoryImages(slides[current]);

document.getElementById('skip-btn').addEventListener('click', () => {
    adVideo.pause();

    const elapsed = (Date.now() - adStart) / 1000;
    const display = elapsed < 60
        ? elapsed.toFixed(1) + ' seconds'
        : (elapsed / 60).toFixed(1) + ' minutes';

    document.getElementById('waited-time').textContent = display;

    const resultIndex = slides.findIndex(s => s.id === 'slide-4');
    goTo(resultIndex, 'forward');
});

