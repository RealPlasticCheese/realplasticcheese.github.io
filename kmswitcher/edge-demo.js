(() => {
    const illustration = document.querySelector('[data-edge-demo]');
    if (!illustration) return;

    const button = illustration.querySelector('.demo-button');
    const status = illustration.querySelector('.demo-status');
    const screens = illustration.querySelectorAll('[data-computer]');

    button.hidden = false;
    button.addEventListener('click', () => {
        const selected = illustration.dataset.active === '1' ? '2' : '1';
        const other = selected === '1' ? '2' : '1';
        illustration.dataset.active = selected;

        for (const screen of screens) {
            screen.querySelector('.demo-selection').textContent =
                screen.dataset.computer === selected ? 'Selected' : 'Ready';
        }

        status.textContent = `Computer ${selected} selected. Keyboard and mouse follow the pointer.`;
        button.replaceChildren(document.createTextNode(`Cross back to computer ${other} `));
        const arrow = document.createElement('span');
        arrow.setAttribute('aria-hidden', 'true');
        arrow.textContent = selected === '1' ? '→' : '←';
        button.append(arrow);
    });
})();
