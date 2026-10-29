(() => {
    const pause = milliseconds => new Promise(resolve => setTimeout(resolve, milliseconds));

    function revealControls(root) {
        for (const control of root.querySelectorAll('[data-demo-control]')) control.hidden = false;
    }

    async function playSteps(root, messages) {
        const button = root.querySelector('[data-play-demo]');
        const label = button.textContent;
        button.disabled = true;
        button.textContent = 'Playing illustration…';
        try {
            for (const [step, message] of messages.entries()) {
                root.dataset.step = String(step);
                root.querySelector('.demo-status').textContent = message;
                if (step < messages.length - 1) await pause(850);
            }
        } finally {
            button.disabled = false;
            button.textContent = label;
        }
    }

    function initializeDesk() {
        const root = document.querySelector('[data-desk-demo]');
        if (!root) return;
        const neighbours = { 1: { down: '2' }, 2: { up: '1', right: '3' }, 3: { left: '2' } };
        const names = { 1: 'Workstation', 2: 'Laptop', 3: 'Second computer' };
        revealControls(root);

        for (const button of root.querySelectorAll('[data-direction]')) {
            button.addEventListener('click', () => {
                const direction = button.dataset.direction;
                const station = neighbours[root.dataset.station][direction];
                if (!station) return;
                root.dataset.station = station;
                for (const screen of root.querySelectorAll('[data-station-id]')) {
                    screen.querySelector('small').textContent = screen.dataset.stationId === station ? 'Selected' : 'Ready';
                }
                for (const control of root.querySelectorAll('[data-direction]')) {
                    control.disabled = !neighbours[station][control.dataset.direction];
                }
                root.querySelector('.demo-status').textContent = `${names[station]} selected. Pointer, keyboard, and mouse moved ${direction}.`;
            });
        }
    }

    function initializeShortcut() {
        const root = document.querySelector('[data-shortcut-demo]');
        if (!root) return;
        revealControls(root);
        root.querySelector('[data-play-demo]').addEventListener('click', () => playSteps(root, [
            'First standalone Ctrl tap.',
            'Second Ctrl tap. Choose a receiver number.',
            'Press 2. Computer 2 is selected.',
            'Keyboard and mouse now work on computer 2. Normal typing resumes.'
        ]));
    }

    function initializeClipboard() {
        const root = document.querySelector('[data-clipboard-demo]');
        if (!root) return;
        const type = root.querySelector('select');
        const accept = root.querySelector('[data-accept-transfer]');
        const destination = root.querySelector('[data-destination-preview]');
        const destinationState = root.querySelector('[data-destination-state]');
        const examples = {
            text: { name: 'Desk notes', arrival: 'Ready to paste', instruction: 'Plain text verified. Paste normally on computer 2.' },
            image: { name: 'Screenshot.png', arrival: 'Waiting for acceptance', instruction: 'Image received. Choose Put on clipboard before pasting.' },
            files: { name: 'Project folder', arrival: 'Waiting for acceptance', instruction: 'Files received. Choose Save to… or Prepare for paste.' }
        };
        revealControls(root);

        type.addEventListener('change', () => {
            root.dataset.step = 'idle';
            root.querySelector('[data-source-preview]').textContent = examples[type.value].name;
            destination.textContent = 'Waiting for an item';
            destinationState.textContent = 'Destination clipboard unchanged';
            root.querySelector('.demo-status').textContent = 'Copy an item, choose a destination, then receive it there.';
            accept.hidden = true;
        });

        root.querySelector('[data-play-demo]').addEventListener('click', async () => {
            const example = examples[type.value];
            type.disabled = true;
            accept.hidden = true;
            destination.textContent = 'Waiting for an item';
            destinationState.textContent = 'Destination clipboard unchanged';
            try {
                await playSteps(root, [
                    `${example.name} copied on computer 1. Nothing has been sent yet.`,
                    'Choose Send clipboard to Computer 2 in the companion tray.',
                    'The selected content transfers to computer 2 and is verified.',
                    example.instruction
                ]);
                destination.textContent = example.name;
                destinationState.textContent = example.arrival;
                if (type.value !== 'text') {
                    accept.textContent = type.value === 'image' ? 'Illustrate “Put on clipboard”' : 'Illustrate “Save to…”';
                    accept.hidden = false;
                }
            } finally {
                type.disabled = false;
            }
        });

        accept.addEventListener('click', () => {
            root.dataset.step = 'accepted';
            destinationState.textContent = type.value === 'image' ? 'Ready to paste' : 'Saved to a new folder';
            root.querySelector('.demo-status').textContent = type.value === 'image'
                ? 'Illustration: the accepted image is now on computer 2’s clipboard, ready to paste.'
                : 'Illustration: the files are saved in a new destination folder; the originals stay on computer 1.';
            accept.hidden = true;
        });
    }

    initializeDesk();
    initializeShortcut();
    initializeClipboard();
})();
