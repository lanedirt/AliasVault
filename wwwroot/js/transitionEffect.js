function startTransitionEffect() {
    const overlay = document.getElementById('transitionOverlay');
    overlay.style.transform = 'scale(1)';

    setTimeout(() => {
        window.location.href = '/user/register';
    }, 500);
}
