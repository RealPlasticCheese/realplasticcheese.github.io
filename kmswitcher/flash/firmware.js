import { unzipSync } from './vendor/fflate-0.8.2.js';

export const release = Object.freeze({
    version: '0.2.0',
    archive: new URL('./firmware/KMSwitcher-regular-firmware-0.2.0.zip', import.meta.url),
    sha256: '49b4f906635300055517b1498674d012ccebe1cd4a412197239a382209fa2c66',
});

export const boards = Object.freeze({
    controller: {
        role: 'controller', label: 'S3 Master', chip: 'ESP32-S3', flashSize: '16MB', capacity: 0x1000000,
        reset: 'default_reset', offsets: [0, 0x8000, 0x10000, 0x310000, 0x960000, 0xb60000],
    },
    receiver: {
        role: 'receiver', label: 'S2 Slave', chip: 'ESP32-S2', flashSize: '4MB', capacity: 0x400000,
        reset: 'no_reset', offsets: [0x1000, 0x8000, 0x10000, 0x20000],
    },
});

async function sha256(data) {
    const hash = await crypto.subtle.digest('SHA-256', data);
    return Array.from(new Uint8Array(hash), byte => byte.toString(16).padStart(2, '0')).join('');
}

export async function readRelease(bytes, board) {
    // Check the published archive digest before reading its manifest or any files.
    if (await sha256(bytes) !== release.sha256) throw new Error('Release archive checksum mismatch.');
    const archive = unzipSync(bytes);
    const bundle = JSON.parse(new TextDecoder().decode(archive['bundle.json']));
    const { chip, capacity, settings, files } = bundle.roles[board.role];
    if (bundle.schema !== 1 || bundle.version !== release.version ||
        chip !== board.chip.toLowerCase().replace('-', '') || capacity !== board.capacity ||
        settings.flash_size !== board.flashSize || files.length !== board.offsets.length) {
        throw new Error('Release manifest does not match the selected board.');
    }

    const images = [];
    for (const [index, file] of [...files].sort((a, b) => a.offset - b.offset).entries()) {
        const data = archive[file.path];
        const address = board.offsets[index];
        const end = address + Math.ceil((data?.length ?? 0) / 4096) * 4096;
        if (!data?.length || data.length !== file.size || file.offset !== address ||
            end > (board.offsets[index + 1] ?? board.capacity) ||
            (address < 0xf000 && end > 0x9000) || await sha256(data) !== file.sha256) {
            throw new Error('Invalid release image or flash range.');
        }
        images.push({ address, data });
    }
    return images;
}
