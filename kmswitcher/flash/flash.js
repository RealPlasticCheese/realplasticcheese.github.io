import { boards, readRelease, release } from './firmware.js';
import { createConnection, eraseFirmware, EraseRequired, FlashMessage, installFirmware } from './device.js';

const byId = id => document.getElementById(id);
const boardChoice = byId('board-choice');
const installButton = byId('install');
const eraseButton = byId('erase');
const statusPanel = byId('flash-status');
const status = byId('status');
const progress = byId('progress');
const log = byId('log');
const details = byId('technical-details');
const dialog = byId('confirm-erase');
let busy = false;

function showStatus(message, state = 'idle') {
    statusPanel.dataset.state = state;
    status.textContent = message;
}

function setBusy(value) {
    busy = value;
    boardChoice.disabled = installButton.disabled = eraseButton.disabled = value;
}

function confirmErase(board, mac) {
    byId('erase-device').textContent = `${board.label} · ${mac}`;
    dialog.returnValue = '';
    return new Promise(resolve => {
        dialog.addEventListener('close', () => resolve(dialog.returnValue === 'erase'), { once: true });
        dialog.showModal();
    });
}

async function downloadFirmware(board) {
    try {
        const response = await fetch(release.archive, { signal: AbortSignal.timeout(30_000) });
        if (!response.ok) throw new Error(`Firmware download returned HTTP ${response.status}.`);
        return await readRelease(new Uint8Array(await response.arrayBuffer()), board);
    } catch (error) {
        log.textContent += `${error.message}\n`;
        throw new FlashMessage('The firmware could not be downloaded or verified. Check your connection and try again.');
    }
}

function showFailure(error, stage, bootHelp) {
    log.textContent += `${error.message || error.name}\n`;
    if (error instanceof EraseRequired) {
        showStatus(`This dongle needs a clean start. ${bootHelp}Choose Erase flash first, then try Install firmware again. Erasing clears saved settings and pairings.`, 'erase-required');
    } else if (error instanceof FlashMessage) {
        showStatus(error.message, 'error');
    } else if (stage === 'choose' && error.name === 'NotFoundError') {
        showStatus('No port was selected. Choose Install firmware or Erase flash to try again.');
    } else if (stage === 'choose' || stage === 'connect') {
        details.hidden = false;
        showStatus(`Could not connect to the dongle. ${bootHelp}Follow the USB instructions above, close any other app using the port, and try again.`, 'error');
    } else {
        const action = stage === 'erase' ? 'Erase flash' : 'Install firmware';
        showStatus(`The operation could not be completed. ${bootHelp}Check the USB connection and try ${action} again. Open Technical details for more information.`, 'error');
    }
}

async function run(action) {
    if (busy) return;
    const board = boards[boardChoice.querySelector(':checked').value];
    const bootHelp = board === boards.receiver ? 'Unplug the S2 and plug it back in while holding BOOT. ' : '';
    const actionButton = action === 'install' ? installButton : eraseButton;
    const restoreFocus = document.activeElement === actionButton;
    setBusy(true);
    log.textContent = '';
    details.hidden = true;
    details.open = false;
    progress.hidden = true;
    progress.removeAttribute('value');
    showStatus('Choose your dongle’s USB serial port.');
    let stage = 'choose';
    let connection;
    try {
        // The browser requires this call to run directly from a user click.
        const port = await navigator.serial.requestPort();
        details.hidden = false;
        let images;
        if (action === 'install') {
            showStatus('Downloading and checking the firmware…');
            images = await downloadFirmware(board);
        }
        stage = 'connect';
        showStatus(`Connecting to the ${board.label}…`);
        connection = createConnection(port, board, {
            clean() { log.textContent = ''; },
            write(data) { log.textContent += data; },
            writeLine(data) { log.textContent += `${data}\n`; },
        });
        const mac = await connection.connect();
        if (action === 'erase') {
            if (!await confirmErase(board, mac)) {
                showStatus(`Erase cancelled. ${bootHelp}`.trim());
                return;
            }
            stage = 'erase';
            showStatus('Erasing the dongle. Keep it plugged in…');
            progress.hidden = false;
            await eraseFirmware(connection.loader, window.md5);
            showStatus(`Flash erased. ${bootHelp}Choose Install firmware.`, 'success');
        } else {
            stage = 'install';
            showStatus('Checking the dongle’s flash layout…');
            progress.hidden = false;
            await installFirmware(connection.loader, board, images, window.md5, (index, written, total) => {
                if (index === 0 && written === 0) showStatus('Installing and verifying firmware. Keep the dongle plugged in…');
                progress.value = Math.min(99, 100 * (index + written / total) / images.length);
            });
            showStatus(`${board.label} firmware installed and verified. Unplug the dongle and plug it back in without holding BOOT.`, 'success');
        }
    } catch (error) {
        showFailure(error, stage, bootHelp);
    } finally {
        try {
            await connection?.close();
        } catch (error) {
            details.hidden = false;
            log.textContent += `Could not close the USB port: ${error.message}\n`;
        }
        progress.hidden = true;
        setBusy(false);
        if (restoreFocus && document.activeElement === document.body) actionButton.focus({ preventScroll: true });
        if (action === 'erase') statusPanel.scrollIntoView({ block: 'nearest' });
    }
}

boardChoice.addEventListener('change', () => {
    const role = boardChoice.querySelector(':checked').value;
    byId('controller-help').hidden = role !== 'controller';
    byId('receiver-help').hidden = role !== 'receiver';
    details.hidden = true;
    showStatus(`Ready to install ${boards[role].label} firmware.`);
});
installButton.addEventListener('click', () => run('install'));
eraseButton.addEventListener('click', () => run('erase'));
byId('cancel-erase').addEventListener('click', () => dialog.close());
byId('approve-erase').addEventListener('click', () => dialog.close('erase'));

byId('version').textContent = `v${release.version}`;
if (window.isSecureContext && navigator.serial && typeof window.md5 === 'function') {
    setBusy(false);
    showStatus('Ready to install S3 Master firmware.');
} else if (window.isSecureContext && navigator.serial) {
    showStatus('The flasher could not finish loading. Refresh the page and try again.', 'error');
} else {
    showStatus('This flasher needs USB serial access. Open this page in desktop Chrome or Edge to continue.', 'error');
}
