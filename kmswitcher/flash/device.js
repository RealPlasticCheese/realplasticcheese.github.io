import { ESPLoader, Transport } from './vendor/esptool-js-0.7.1.js';

const TABLE_ADDRESS = 0x8000;
const SECTOR_SIZE = 4096;
const SETTINGS_ADDRESS = 0x9000;
const SETTINGS_SIZE = 0x6000;

export class FlashMessage extends Error {}
export class EraseRequired extends FlashMessage {
    constructor() {
        super('The installed partition table or settings do not match the supported layout.');
    }
}

export function createConnection(port, board, terminal) {
    const transport = new Transport(port);
    const loader = new ESPLoader({ transport, terminal, baudrate: 115200 });
    return {
        async connect() {
            await loader.detectChip(board.reset, 3);
            if (loader.chip.CHIP_NAME !== board.chip) {
                throw new FlashMessage(`The connected chip is ${loader.chip.CHIP_NAME}. Select the matching dongle and try again.`);
            }
            const security = await loader.getSecurityInfo();
            const encrypted = security.flashCryptCnt.toString(2).replaceAll('0', '').length % 2;
            if (encrypted || security.parsedFlags.SECURE_BOOT_EN || security.parsedFlags.SECURE_DOWNLOAD_ENABLE) {
                throw new FlashMessage('This dongle has security protections enabled. Use the board maker’s recovery instructions.');
            }
            const mac = await loader.chip.readMac(loader);
            await loader.chip.postConnect?.(loader);
            await loader.runStub();
            if (!loader.IS_STUB) throw new FlashMessage('The dongle could not start its flash loader. Reconnect it and try again.');
            return mac;
        },
        loader,
        async close() {
            if (port.readable || port.writable) await transport.disconnect();
        },
    };
}

export async function installFirmware(loader, board, images, md5, reportProgress) {
    const flashSize = await loader.detectFlashSize();
    if (!flashSize || loader.flashSizeBytes(flashSize) < board.capacity) {
        throw new FlashMessage(`This dongle needs at least ${board.flashSize} of flash. Check that you selected the right board.`);
    }

    // Compare on-device digests so the S2's USB bootloader never has to stream flash back.
    const table = new Uint8Array(SECTOR_SIZE).fill(0xff);
    const emptyTableHash = md5(table);
    table.set(images.find(image => image.address === TABLE_ADDRESS).data);
    const oldTableHash = await loader.flashMd5sum(TABLE_ADDRESS, SECTOR_SIZE);
    if (oldTableHash !== md5(table) && oldTableHash !== emptyTableHash) throw new EraseRequired();

    const oldSettingsHash = await loader.flashMd5sum(SETTINGS_ADDRESS, SETTINGS_SIZE);
    if (oldTableHash === emptyTableHash && oldSettingsHash !== md5(new Uint8Array(SETTINGS_SIZE).fill(0xff))) {
        throw new EraseRequired();
    }

    await loader.writeFlash({
        fileArray: images, flashSize: 'keep', flashMode: 'keep', flashFreq: 'keep',
        eraseAll: false, compress: true, calculateMD5Hash: md5, reportProgress,
    });
    if (await loader.flashMd5sum(SETTINGS_ADDRESS, SETTINGS_SIZE) !== oldSettingsHash) {
        throw new FlashMessage('The firmware was written, but the dongle’s saved settings could not be verified. Keep the dongle connected and check the technical details.');
    }
}

export async function eraseFirmware(loader, md5) {
    await loader.eraseFlash();
    const blankTable = md5(new Uint8Array(SECTOR_SIZE).fill(0xff));
    const blankSettings = md5(new Uint8Array(SETTINGS_SIZE).fill(0xff));
    if (await loader.flashMd5sum(TABLE_ADDRESS, SECTOR_SIZE) !== blankTable ||
        await loader.flashMd5sum(SETTINGS_ADDRESS, SETTINGS_SIZE) !== blankSettings) {
        throw new FlashMessage('The erase could not be verified. Keep the dongle connected and try Erase flash again.');
    }
}
