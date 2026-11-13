import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { eraseFirmware, EraseRequired, installFirmware } from '../kmswitcher/flash/device.js';
import { boards, readRelease, release } from '../kmswitcher/flash/firmware.js';

const archive = await readFile(release.archive);
const md5 = bytes => createHash('md5').update(bytes).digest('hex');
const blank = size => new Uint8Array(size).fill(0xff);

function fakeLoader(board) {
    const memory = blank(board.capacity);
    const calls = [];
    return {
        memory, calls,
        detectFlashSize: async () => board.flashSize,
        flashSizeBytes: () => board.capacity,
        flashMd5sum: async (address, size) => md5(memory.subarray(address, address + size)),
        async writeFlash(options) {
            calls.push('write');
            assert.equal(options.eraseAll, false);
            assert.equal(options.compress, true);
            assert.equal(options.calculateMD5Hash, md5);
            for (const { address, data } of options.fileArray) {
                memory.fill(0xff, address, address + Math.ceil(data.length / 4096) * 4096);
                memory.set(data, address);
            }
        },
        async eraseFlash() {
            calls.push('erase');
            memory.fill(0xff);
        },
    };
}

for (const board of Object.values(boards)) {
    const images = await readRelease(archive, board);

    test(`${board.label} installs the released images and preserves settings on reinstall`, async () => {
        assert.deepEqual(images.map(image => image.address), board.offsets);
        const loader = fakeLoader(board);
        await installFirmware(loader, board, images, md5);
        for (const { address, data } of images) {
            assert.equal(md5(loader.memory.subarray(address, address + data.length)), md5(data));
        }
        loader.memory[0x9000] = 12;
        await installFirmware(loader, board, images, md5);
        assert.equal(loader.memory[0x9000], 12);
        assert.deepEqual(loader.calls, ['write', 'write']);
    });

    test(`${board.label} requires an explicit erase for an incompatible layout`, async () => {
        const loader = fakeLoader(board);
        loader.memory[0x8000] = 42;
        loader.memory[0x9000] = 12;
        await assert.rejects(installFirmware(loader, board, images, md5), EraseRequired);
        assert.deepEqual(loader.calls, []);
        assert.equal(loader.memory[0x9000], 12);

        await eraseFirmware(loader, md5);
        await installFirmware(loader, board, images, md5);
        assert.deepEqual(loader.calls, ['erase', 'write']);
        assert.equal(loader.memory[0x9000], 0xff);
    });

    test(`${board.label} detects leftover settings with a blank partition table`, async () => {
        const loader = fakeLoader(board);
        loader.memory[0x9000] = 12;
        await assert.rejects(installFirmware(loader, board, images, md5), EraseRequired);
        assert.deepEqual(loader.calls, []);
    });
}

test('a damaged archive is rejected before flashing', async () => {
    const damaged = Uint8Array.from(archive);
    damaged[0] ^= 0xff;
    await assert.rejects(readRelease(damaged, boards.receiver), /checksum mismatch/);
});

test('a capacity mismatch is reported without requesting erase', async () => {
    const board = boards.controller;
    const images = await readRelease(archive, board);
    const loader = fakeLoader(board);
    loader.flashSizeBytes = () => boards.receiver.capacity;
    await assert.rejects(installFirmware(loader, board, images, md5), /at least 16MB/);
    assert.deepEqual(loader.calls, []);
});

test('erase verifies that the table and settings are blank', async () => {
    const loader = fakeLoader(boards.receiver);
    loader.eraseFlash = async () => { loader.memory[0x9000] = 1; };
    await assert.rejects(eraseFirmware(loader, md5), /erase could not be verified/);
});
