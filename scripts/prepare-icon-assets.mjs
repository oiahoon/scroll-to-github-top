#!/usr/bin/env node

import { deflateSync, inflateSync } from "node:zlib";
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname } from "node:path";

const PNG_SIGNATURE = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

function crc32(buffer) {
  let crc = 0xffffffff;
  for (const byte of buffer) {
    crc ^= byte;
    for (let i = 0; i < 8; i += 1) {
      crc = (crc >>> 1) ^ (0xedb88320 & -(crc & 1));
    }
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function parsePng(file) {
  const input = readFileSync(file);
  if (!input.subarray(0, 8).equals(PNG_SIGNATURE)) {
    throw new Error(`${file} is not a PNG`);
  }

  let offset = 8;
  let width = 0;
  let height = 0;
  let colorType = 0;
  const idat = [];

  while (offset < input.length) {
    const length = input.readUInt32BE(offset);
    const type = input.subarray(offset + 4, offset + 8).toString("ascii");
    const data = input.subarray(offset + 8, offset + 8 + length);
    offset += 12 + length;

    if (type === "IHDR") {
      width = data.readUInt32BE(0);
      height = data.readUInt32BE(4);
      const bitDepth = data[8];
      colorType = data[9];
      const interlace = data[12];
      if (bitDepth !== 8 || interlace !== 0 || ![2, 6].includes(colorType)) {
        throw new Error(`${file} must be an 8-bit RGB or RGBA non-interlaced PNG`);
      }
    } else if (type === "IDAT") {
      idat.push(data);
    } else if (type === "IEND") {
      break;
    }
  }

  const channels = colorType === 6 ? 4 : 3;
  const rowBytes = width * channels;
  const raw = inflateSync(Buffer.concat(idat));
  const pixels = Buffer.alloc(width * height * channels);

  for (let y = 0; y < height; y += 1) {
    const filter = raw[y * (rowBytes + 1)];
    const rowStart = y * rowBytes;
    const rawStart = y * (rowBytes + 1) + 1;

    for (let x = 0; x < rowBytes; x += 1) {
      const left = x >= channels ? pixels[rowStart + x - channels] : 0;
      const up = y > 0 ? pixels[rowStart + x - rowBytes] : 0;
      const upLeft = y > 0 && x >= channels ? pixels[rowStart + x - rowBytes - channels] : 0;
      const value = raw[rawStart + x];

      let predictor = 0;
      if (filter === 1) predictor = left;
      else if (filter === 2) predictor = up;
      else if (filter === 3) predictor = Math.floor((left + up) / 2);
      else if (filter === 4) {
        const p = left + up - upLeft;
        const pa = Math.abs(p - left);
        const pb = Math.abs(p - up);
        const pc = Math.abs(p - upLeft);
        predictor = pa <= pb && pa <= pc ? left : pb <= pc ? up : upLeft;
      } else if (filter !== 0) {
        throw new Error(`Unsupported PNG filter ${filter}`);
      }

      pixels[rowStart + x] = (value + predictor) & 0xff;
    }
  }

  const rgba = Buffer.alloc(width * height * 4);
  for (let i = 0, j = 0; i < pixels.length; i += channels, j += 4) {
    rgba[j] = pixels[i];
    rgba[j + 1] = pixels[i + 1];
    rgba[j + 2] = pixels[i + 2];
    rgba[j + 3] = channels === 4 ? pixels[i + 3] : 255;
  }

  return { width, height, rgba };
}

function writePng(file, width, height, rgba) {
  const scanlineBytes = width * 4 + 1;
  const raw = Buffer.alloc(scanlineBytes * height);
  for (let y = 0; y < height; y += 1) {
    raw[y * scanlineBytes] = 0;
    rgba.copy(raw, y * scanlineBytes + 1, y * width * 4, (y + 1) * width * 4);
  }

  const chunks = [];
  const pushChunk = (type, data) => {
    const typeBuffer = Buffer.from(type);
    const length = Buffer.alloc(4);
    length.writeUInt32BE(data.length);
    const crc = Buffer.alloc(4);
    crc.writeUInt32BE(crc32(Buffer.concat([typeBuffer, data])));
    chunks.push(length, typeBuffer, data, crc);
  };

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;

  pushChunk("IHDR", ihdr);
  pushChunk("IDAT", deflateSync(raw, { level: 9 }));
  pushChunk("IEND", Buffer.alloc(0));

  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, Buffer.concat([PNG_SIGNATURE, ...chunks]));
}

function keyMagenta(rgba, color = [255, 0, 255]) {
  const out = Buffer.from(rgba);
  const transparentThreshold = 70;
  const solidThreshold = 150;

  for (let i = 0; i < out.length; i += 4) {
    const r = out[i];
    const g = out[i + 1];
    const b = out[i + 2];
    const distance = Math.hypot(r - color[0], g - color[1], b - color[2]);
    const magentaChroma = Math.min(r, b) - g;

    if (r > 120 && b > 120 && magentaChroma > 70) {
      out[i] = 0;
      out[i + 1] = 0;
      out[i + 2] = 0;
      out[i + 3] = 0;
      continue;
    }

    if (distance <= transparentThreshold) {
      out[i] = 0;
      out[i + 1] = 0;
      out[i + 2] = 0;
      out[i + 3] = 0;
      continue;
    }

    if (distance < solidThreshold || (r > 90 && b > 90 && magentaChroma > 35)) {
      const distanceAlpha = Math.max(0, Math.min(1, (distance - transparentThreshold) / (solidThreshold - transparentThreshold)));
      const chromaAlpha = Math.max(0, Math.min(1, (70 - magentaChroma) / 35));
      const alpha = Math.round(Math.max(distanceAlpha, chromaAlpha) * 255);
      if (alpha < 8) {
        out[i] = 0;
        out[i + 1] = 0;
        out[i + 2] = 0;
        out[i + 3] = 0;
        continue;
      }
      const matte = 1 - alpha / 255;
      out[i] = Math.max(0, Math.min(255, Math.round((r - color[0] * matte) / (alpha / 255))));
      out[i + 1] = Math.max(0, Math.min(255, Math.round((g - color[1] * matte) / (alpha / 255))));
      out[i + 2] = Math.max(0, Math.min(255, Math.round((b - color[2] * matte) / (alpha / 255))));
      out[i + 3] = alpha;
    }
  }

  return out;
}

function bounds(width, height, rgba) {
  let minX = width;
  let minY = height;
  let maxX = -1;
  let maxY = -1;
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      if (rgba[(y * width + x) * 4 + 3] > 10) {
        minX = Math.min(minX, x);
        minY = Math.min(minY, y);
        maxX = Math.max(maxX, x);
        maxY = Math.max(maxY, y);
      }
    }
  }
  if (maxX < minX || maxY < minY) {
    throw new Error("No visible icon pixels after chroma key");
  }
  return { minX, minY, maxX, maxY };
}

function sampleBilinear(src, width, height, x, y) {
  const x0 = Math.max(0, Math.min(width - 1, Math.floor(x)));
  const y0 = Math.max(0, Math.min(height - 1, Math.floor(y)));
  const x1 = Math.max(0, Math.min(width - 1, x0 + 1));
  const y1 = Math.max(0, Math.min(height - 1, y0 + 1));
  const tx = x - x0;
  const ty = y - y0;
  const result = [0, 0, 0, 0];

  for (let channel = 0; channel < 4; channel += 1) {
    const a = src[(y0 * width + x0) * 4 + channel];
    const b = src[(y0 * width + x1) * 4 + channel];
    const c = src[(y1 * width + x0) * 4 + channel];
    const d = src[(y1 * width + x1) * 4 + channel];
    result[channel] = Math.round((a * (1 - tx) + b * tx) * (1 - ty) + (c * (1 - tx) + d * tx) * ty);
  }

  return result;
}

function fitToCanvas(width, height, rgba, size, maxArtworkSize) {
  const box = bounds(width, height, rgba);
  const pad = Math.round(Math.max(box.maxX - box.minX, box.maxY - box.minY) * 0.03);
  const cropX = Math.max(0, box.minX - pad);
  const cropY = Math.max(0, box.minY - pad);
  const cropW = Math.min(width - cropX, box.maxX - box.minX + 1 + pad * 2);
  const cropH = Math.min(height - cropY, box.maxY - box.minY + 1 + pad * 2);
  const scale = Math.min(maxArtworkSize / cropW, maxArtworkSize / cropH);
  const outW = Math.max(1, Math.round(cropW * scale));
  const outH = Math.max(1, Math.round(cropH * scale));
  const offsetX = Math.round((size - outW) / 2);
  const offsetY = Math.round((size - outH) / 2);
  const out = Buffer.alloc(size * size * 4);

  for (let y = 0; y < outH; y += 1) {
    for (let x = 0; x < outW; x += 1) {
      const srcX = cropX + x / scale;
      const srcY = cropY + y / scale;
      const px = sampleBilinear(rgba, width, height, srcX, srcY);
      const index = ((offsetY + y) * size + offsetX + x) * 4;
      out[index] = px[0];
      out[index + 1] = px[1];
      out[index + 2] = px[2];
      out[index + 3] = px[3];
    }
  }

  return out;
}

function resizeRgba(width, height, rgba, size) {
  const out = Buffer.alloc(size * size * 4);
  const scaleX = width / size;
  const scaleY = height / size;
  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      const px = sampleBilinear(rgba, width, height, (x + 0.5) * scaleX - 0.5, (y + 0.5) * scaleY - 0.5);
      const index = (y * size + x) * 4;
      out[index] = px[0];
      out[index + 1] = px[1];
      out[index + 2] = px[2];
      out[index + 3] = px[3];
    }
  }
  return out;
}

const [inputFile, outputPrefix] = process.argv.slice(2);
if (!inputFile || !outputPrefix) {
  console.error("Usage: node scripts/prepare-icon-assets.mjs <source.png> <output-prefix>");
  process.exit(1);
}

const source = parsePng(inputFile);
const transparent = keyMagenta(source.rgba);
const sourceTransparentFile = `${outputPrefix}-transparent.png`;
writePng(sourceTransparentFile, source.width, source.height, transparent);

const baseSize = 1024;
const base = fitToCanvas(source.width, source.height, transparent, baseSize, 768);
writePng(`${outputPrefix}-1024.png`, baseSize, baseSize, base);

for (const size of [512, 128, 48, 32, 16]) {
  writePng(`${outputPrefix}-${size}.png`, size, size, resizeRgba(baseSize, baseSize, base, size));
}

console.log(`Prepared icon assets from ${inputFile}`);
