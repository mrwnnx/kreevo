// One-off: rasterize the square mark (src/app/icon.svg) into a multi-size
// PNG-encoded .ico to replace the legacy favicon.ico. Run with: node scripts/gen-favicon.mjs
import sharp from 'sharp'
import { readFileSync, writeFileSync } from 'node:fs'

const svg = readFileSync(new URL('../src/app/icon.svg', import.meta.url))
const sizes = [16, 32, 48]

const pngs = await Promise.all(
  sizes.map((s) => sharp(svg, { density: 384 }).resize(s, s).png().toBuffer()),
)

// Pack PNGs into ICO container
const header = Buffer.alloc(6)
header.writeUInt16LE(0, 0) // reserved
header.writeUInt16LE(1, 2) // type = icon
header.writeUInt16LE(pngs.length, 4) // count

const entries = []
let offset = 6 + pngs.length * 16
pngs.forEach((png, i) => {
  const e = Buffer.alloc(16)
  e.writeUInt8(sizes[i] >= 256 ? 0 : sizes[i], 0) // width
  e.writeUInt8(sizes[i] >= 256 ? 0 : sizes[i], 1) // height
  e.writeUInt8(0, 2) // palette
  e.writeUInt8(0, 3) // reserved
  e.writeUInt16LE(1, 4) // planes
  e.writeUInt16LE(32, 6) // bpp
  e.writeUInt32LE(png.length, 8) // size
  e.writeUInt32LE(offset, 12) // offset
  offset += png.length
  entries.push(e)
})

const ico = Buffer.concat([header, ...entries, ...pngs])
writeFileSync(new URL('../src/app/favicon.ico', import.meta.url), ico)
console.log(`favicon.ico written: ${ico.length} bytes, sizes ${sizes.join('/')}`)
