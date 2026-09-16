function concat(parts: Uint8Array[]) {
  const total = parts.reduce((sum, part) => sum + part.length, 0);
  const out = new Uint8Array(total);
  let offset = 0;
  for (const part of parts) {
    out.set(part, offset);
    offset += part.length;
  }
  return out;
}

function u16(value: number) {
  const bytes = new Uint8Array(2);
  new DataView(bytes.buffer).setUint16(0, value, true);
  return bytes;
}

function u32(value: number) {
  const bytes = new Uint8Array(4);
  new DataView(bytes.buffer).setUint32(0, value >>> 0, true);
  return bytes;
}

const CRC_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let index = 0; index < 256; index += 1) {
    let crc = index;
    for (let bit = 0; bit < 8; bit += 1) {
      crc = crc & 1 ? 0xedb88320 ^ (crc >>> 1) : crc >>> 1;
    }
    table[index] = crc >>> 0;
  }
  return table;
})();

export function crc32(data: Uint8Array) {
  let crc = 0xffffffff;
  for (let index = 0; index < data.length; index += 1) {
    crc = CRC_TABLE[(crc ^ data[index]!) & 0xff]! ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

export function zipStore(files: { name: string; data: Uint8Array }[]) {
  const locals: Uint8Array[] = [];
  const centrals: Uint8Array[] = [];
  let offset = 0;
  for (const file of files) {
    const nameBytes = new TextEncoder().encode(file.name);
    const crc = crc32(file.data);
    const local = concat([
      new Uint8Array([0x50, 0x4b, 0x03, 0x04]),
      u16(20),
      u16(0x0800),
      u16(0),
      u16(0),
      u16(0),
      u32(crc),
      u32(file.data.length),
      u32(file.data.length),
      u16(nameBytes.length),
      u16(0),
      nameBytes,
      file.data,
    ]);
    locals.push(local);
    centrals.push(concat([
      new Uint8Array([0x50, 0x4b, 0x01, 0x02]),
      u16(20),
      u16(20),
      u16(0x0800),
      u16(0),
      u16(0),
      u16(0),
      u32(crc),
      u32(file.data.length),
      u32(file.data.length),
      u16(nameBytes.length),
      u16(0),
      u16(0),
      u16(0),
      u16(0),
      u32(0),
      u32(offset),
      nameBytes,
    ]));
    offset += local.length;
  }
  const central = concat(centrals);
  const end = concat([
    new Uint8Array([0x50, 0x4b, 0x05, 0x06]),
    u16(0),
    u16(0),
    u16(files.length),
    u16(files.length),
    u32(central.length),
    u32(offset),
    u16(0),
  ]);
  return concat([...locals, central, end]);
}

export async function zipBlobs(files: { name: string; blob: Blob }[]) {
  const entries = [];
  for (const file of files) {
    entries.push({ name: file.name, data: new Uint8Array(await file.blob.arrayBuffer()) });
  }
  return new Blob([zipStore(entries)], { type: "application/zip" });
}
