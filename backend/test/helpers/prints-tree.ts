import { createWriteStream } from 'node:fs';
import { copyFile, mkdir, mkdtemp, readFile, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { pipeline } from 'node:stream/promises';
import { ZipFile } from 'yazl';

export const FIXTURES = path.join(import.meta.dirname, '..', 'fixtures', 'gcode');

/** Creates a Creality Print style 3MF with one embedded plate G-code. */
export async function writeCreality3mf(file: string, plateIndex = 1): Promise<void> {
  const gcode = await readFile(path.join(FIXTURES, 'creality5-plate.gcode'));
  const zip = new ZipFile();
  zip.addBuffer(
    Buffer.from(
      '<?xml version="1.0"?><model><metadata name="Application">Creality_Print V5.1.4.10249 Release</metadata></model>',
    ),
    '3D/3dmodel.model',
  );
  zip.addBuffer(gcode, `Metadata/plate_${plateIndex}.gcode`);
  zip.end();
  await mkdir(path.dirname(file), { recursive: true });
  await pipeline(zip.outputStream, createWriteStream(file));
}

export async function put(root: string, relative: string, fixture: string): Promise<void> {
  const target = path.join(root, relative);
  await mkdir(path.dirname(target), { recursive: true });
  await copyFile(path.join(FIXTURES, fixture), target);
}

export async function putText(root: string, relative: string, text: string): Promise<void> {
  const target = path.join(root, relative);
  await mkdir(path.dirname(target), { recursive: true });
  await writeFile(target, text);
}

/**
 * A small prints folder that exercises every indexing rule:
 *
 *   Koen/Bloembak clips/lock_PLA_3h27m.gcode          counted (173.49 g, 12294 s)
 *   Koen/Bloembak clips/lock.3mf                      sliced, excluded: G-code present
 *   Koen/Bloembak clips/Nog te printen/next_PLA_11m.gcode   excluded: folder
 *   Koen/Bloembak clips/render.png                    listed, no lines
 *   Koen/Bloembak clips/.thumbs/cache.png             ignored
 *   Koen/loose_PLA_31m55s.gcode                      print without project (15.36 g)
 *   Esmee/Keychain/key_PLA_11m.gcode (+ copy)       possible duplicates (2 × 3.03 g)
 *   Esmee/Board game/parts.3mf                      sliced 3MF, no G-code: counted (224.39 g)
 *   Veerle/Empty/                                    print without files
 */
export async function makePrintsTree(): Promise<string> {
  const root = await mkdtemp(path.join(os.tmpdir(), 'pp-prints-'));
  await put(root, 'Koen/Bloembak clips/lock_PLA_3h27m.gcode', 'orca-single-slot.gcode');
  await writeCreality3mf(path.join(root, 'Koen/Bloembak clips/lock.3mf'));
  await put(root, 'Koen/Bloembak clips/Nog te printen/next_PLA_11m.gcode', 'orca-multi-slot.gcode');
  await putText(root, 'Koen/Bloembak clips/render.png', 'not really a png');
  await putText(root, 'Koen/Bloembak clips/.thumbs/cache.png', 'x');
  await put(root, 'Koen/loose_PLA_31m55s.gcode', 'creality6-no-total.gcode');
  await put(root, 'Esmee/Keychain/key_PLA_11m.gcode', 'orca-multi-slot.gcode');
  await put(root, 'Esmee/Keychain/key_PLA_11m copy.gcode', 'orca-multi-slot.gcode');
  await writeCreality3mf(path.join(root, 'Esmee/Board game/parts.3mf'), 3);
  await mkdir(path.join(root, 'Veerle/Empty'), { recursive: true });
  await putText(root, '.DS_Store', 'x');
  return root;
}
