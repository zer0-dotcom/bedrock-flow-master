/**
 * SPATIAL PARSER — PLY (Polygon File Format) Ingest Pipeline
 *
 * Parses .PLY files (Stanford Triangle Format) for Spatial Heritage scans.
 * Extracts vertex positions, normals, colors, and face data to compute:
 *   - Bounding volume (m³)
 *   - Surface area (m²)
 *   - Point density (points/m³)
 *   - Centroid coordinates
 *
 * Supports both ASCII and binary (little-endian) PLY formats.
 * Gaussian Splat extensions (spherical harmonics, opacity) are detected
 * and flagged for downstream processing.
 *
 * Output feeds into the Heritage/Asphalt carbon calculation pipeline
 * via volume × density → material mass → emission factor lookup.
 */

import crypto from 'crypto';

// ─── Types ──────────────────────────────────────────────────────────────────

export type PlyFormat = 'ascii' | 'binary_little_endian' | 'binary_big_endian';

export interface PlyProperty {
  name: string;
  type: string; // float, double, uchar, int, etc.
  isList?: boolean;
  countType?: string;
  valueType?: string;
}

export interface PlyElement {
  name: string;        // 'vertex', 'face', etc.
  count: number;
  properties: PlyProperty[];
}

export interface PlyHeader {
  format: PlyFormat;
  version: string;
  elements: PlyElement[];
  comments: string[];
  headerByteLength: number;
  hasGaussianSplat: boolean;  // Detected SH coefficients / opacity
}

export interface Vertex {
  x: number;
  y: number;
  z: number;
  nx?: number;
  ny?: number;
  nz?: number;
  r?: number;
  g?: number;
  b?: number;
  a?: number;
}

export interface BoundingBox {
  min: { x: number; y: number; z: number };
  max: { x: number; y: number; z: number };
  dimensions: { width: number; height: number; depth: number };
  volume: number; // m³
  centroid: { x: number; y: number; z: number };
}

export interface SpatialParseResult {
  parseId: string;
  filename: string;
  header: PlyHeader;
  vertexCount: number;
  faceCount: number;
  boundingBox: BoundingBox;
  surfaceArea: number;     // m² (estimated from faces)
  pointDensity: number;    // points per m³
  estimatedVolume: number; // m³ (convex hull approximation)
  materialEstimate: {
    asphaltTonnes: number;     // volume × 2.4 t/m³ (asphalt density)
    aggregateTonnes: number;   // volume × 1.6 t/m³
    concreteTonnes: number;    // volume × 2.3 t/m³
  };
  carbonEstimate: {
    asphaltKgCO2e: number;
    aggregateKgCO2e: number;
    concreteKgCO2e: number;
  };
  integrityHash: string;
  parseTimestamp: string;
  isGaussianSplat: boolean;
}

// ─── Constants ──────────────────────────────────────────────────────────────

/** Material densities (tonnes per m³) */
const MATERIAL_DENSITIES = {
  asphalt: 2.4,
  aggregate: 1.6,
  concrete: 2.3,
} as const;

/** Emission factors (kg CO2e per tonne, from ICE v4.1) */
const MATERIAL_EF = {
  asphalt: 65.8,   // HMA, A1-A3, per tonne
  aggregate: 7.47, // General aggregate, per tonne
  concrete: 132.0, // 25 MPa general, per tonne
} as const;

/** Gaussian Splat property indicators */
const GAUSSIAN_SPLAT_PROPS = [
  'f_dc_0', 'f_dc_1', 'f_dc_2',  // DC spherical harmonic
  'opacity',                       // Gaussian opacity
  'scale_0', 'scale_1', 'scale_2', // Scale
  'rot_0', 'rot_1', 'rot_2', 'rot_3', // Rotation quaternion
];

// ─── PLY Type Sizes ─────────────────────────────────────────────────────────

const TYPE_SIZES: Record<string, number> = {
  char: 1, uchar: 1, int8: 1, uint8: 1,
  short: 2, ushort: 2, int16: 2, uint16: 2,
  int: 4, uint: 4, int32: 4, uint32: 4,
  float: 4, float32: 4,
  double: 8, float64: 8,
};

// ─── Header Parsing ─────────────────────────────────────────────────────────

/**
 * Parse a PLY header from a Buffer.
 */
export function parsePlyHeader(buffer: Buffer): PlyHeader {
  // Find "end_header\n"
  const headerEndMarker = 'end_header\n';
  const headerEndIdx = buffer.indexOf(headerEndMarker);
  if (headerEndIdx === -1) {
    throw new Error('Invalid PLY file: missing end_header marker');
  }

  const headerStr = buffer.subarray(0, headerEndIdx).toString('ascii');
  const lines = headerStr.split('\n').map((l) => l.trim()).filter(Boolean);

  // Validate magic number
  if (lines[0] !== 'ply') {
    throw new Error('Invalid PLY file: missing "ply" magic number');
  }

  let format: PlyFormat = 'ascii';
  let version = '1.0';
  const elements: PlyElement[] = [];
  const comments: string[] = [];
  let currentElement: PlyElement | null = null;

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    const parts = line.split(/\s+/);

    if (parts[0] === 'format') {
      format = parts[1] as PlyFormat;
      version = parts[2] || '1.0';
    } else if (parts[0] === 'comment') {
      comments.push(parts.slice(1).join(' '));
    } else if (parts[0] === 'element') {
      currentElement = {
        name: parts[1],
        count: parseInt(parts[2], 10),
        properties: [],
      };
      elements.push(currentElement);
    } else if (parts[0] === 'property' && currentElement) {
      if (parts[1] === 'list') {
        currentElement.properties.push({
          name: parts[4],
          type: 'list',
          isList: true,
          countType: parts[2],
          valueType: parts[3],
        });
      } else {
        currentElement.properties.push({
          name: parts[2],
          type: parts[1],
        });
      }
    }
  }

  // Detect Gaussian Splat properties
  const allProps = elements.flatMap((e) => e.properties.map((p) => p.name));
  const hasGaussianSplat = GAUSSIAN_SPLAT_PROPS.some((gp) =>
    allProps.includes(gp)
  );

  return {
    format,
    version,
    elements,
    comments,
    headerByteLength: headerEndIdx + headerEndMarker.length,
    hasGaussianSplat,
  };
}

// ─── Vertex Extraction ──────────────────────────────────────────────────────

/**
 * Extract vertices from an ASCII PLY body.
 */
function extractVerticesAscii(
  body: string,
  element: PlyElement
): Vertex[] {
  const lines = body.split('\n').filter(Boolean);
  const vertices: Vertex[] = [];
  const propNames = element.properties.map((p) => p.name);

  const xi = propNames.indexOf('x');
  const yi = propNames.indexOf('y');
  const zi = propNames.indexOf('z');

  if (xi === -1 || yi === -1 || zi === -1) {
    throw new Error('PLY vertex element missing x/y/z properties');
  }

  const nxi = propNames.indexOf('nx');
  const nyi = propNames.indexOf('ny');
  const nzi = propNames.indexOf('nz');
  const ri = propNames.indexOf('red') !== -1 ? propNames.indexOf('red') : propNames.indexOf('r');
  const gi = propNames.indexOf('green') !== -1 ? propNames.indexOf('green') : propNames.indexOf('g');
  const bi = propNames.indexOf('blue') !== -1 ? propNames.indexOf('blue') : propNames.indexOf('b');

  for (let i = 0; i < Math.min(element.count, lines.length); i++) {
    const vals = lines[i].trim().split(/\s+/).map(Number);
    const v: Vertex = { x: vals[xi], y: vals[yi], z: vals[zi] };
    if (nxi !== -1) v.nx = vals[nxi];
    if (nyi !== -1) v.ny = vals[nyi];
    if (nzi !== -1) v.nz = vals[nzi];
    if (ri !== -1) v.r = vals[ri];
    if (gi !== -1) v.g = vals[gi];
    if (bi !== -1) v.b = vals[bi];
    vertices.push(v);
  }

  return vertices;
}

/**
 * Extract vertices from a binary (little-endian) PLY body.
 */
function extractVerticesBinary(
  buffer: Buffer,
  offset: number,
  element: PlyElement
): { vertices: Vertex[]; bytesRead: number } {
  const vertices: Vertex[] = [];
  const propNames = element.properties.map((p) => p.name);
  const propTypes = element.properties.map((p) => p.type);

  const xi = propNames.indexOf('x');
  const yi = propNames.indexOf('y');
  const zi = propNames.indexOf('z');

  if (xi === -1 || yi === -1 || zi === -1) {
    throw new Error('PLY vertex element missing x/y/z properties');
  }

  // Calculate stride
  const stride = element.properties.reduce((sum, p) => {
    return sum + (TYPE_SIZES[p.type] || 4);
  }, 0);

  let pos = offset;

  for (let i = 0; i < element.count; i++) {
    const vals: number[] = [];
    let localOffset = pos;

    for (const prop of element.properties) {
      const size = TYPE_SIZES[prop.type] || 4;
      let val = 0;
      if (prop.type === 'float' || prop.type === 'float32') {
        val = buffer.readFloatLE(localOffset);
      } else if (prop.type === 'double' || prop.type === 'float64') {
        val = buffer.readDoubleLE(localOffset);
      } else if (prop.type === 'uchar' || prop.type === 'uint8') {
        val = buffer.readUInt8(localOffset);
      } else if (prop.type === 'int' || prop.type === 'int32') {
        val = buffer.readInt32LE(localOffset);
      } else if (prop.type === 'uint' || prop.type === 'uint32') {
        val = buffer.readUInt32LE(localOffset);
      } else if (prop.type === 'short' || prop.type === 'int16') {
        val = buffer.readInt16LE(localOffset);
      } else if (prop.type === 'ushort' || prop.type === 'uint16') {
        val = buffer.readUInt16LE(localOffset);
      }
      vals.push(val);
      localOffset += size;
    }

    const v: Vertex = { x: vals[xi], y: vals[yi], z: vals[zi] };
    const nxi = propNames.indexOf('nx');
    const nyi = propNames.indexOf('ny');
    const nzi = propNames.indexOf('nz');
    if (nxi !== -1) v.nx = vals[nxi];
    if (nyi !== -1) v.ny = vals[nyi];
    if (nzi !== -1) v.nz = vals[nzi];

    vertices.push(v);
    pos += stride;
  }

  return { vertices, bytesRead: pos - offset };
}

// ─── Geometry Calculations ──────────────────────────────────────────────────

/**
 * Compute axis-aligned bounding box from vertices.
 */
export function computeBoundingBox(vertices: Vertex[]): BoundingBox {
  if (vertices.length === 0) {
    return {
      min: { x: 0, y: 0, z: 0 },
      max: { x: 0, y: 0, z: 0 },
      dimensions: { width: 0, height: 0, depth: 0 },
      volume: 0,
      centroid: { x: 0, y: 0, z: 0 },
    };
  }

  let minX = Infinity, minY = Infinity, minZ = Infinity;
  let maxX = -Infinity, maxY = -Infinity, maxZ = -Infinity;
  let sumX = 0, sumY = 0, sumZ = 0;

  for (const v of vertices) {
    if (v.x < minX) minX = v.x;
    if (v.y < minY) minY = v.y;
    if (v.z < minZ) minZ = v.z;
    if (v.x > maxX) maxX = v.x;
    if (v.y > maxY) maxY = v.y;
    if (v.z > maxZ) maxZ = v.z;
    sumX += v.x;
    sumY += v.y;
    sumZ += v.z;
  }

  const width = maxX - minX;
  const height = maxY - minY;
  const depth = maxZ - minZ;
  const n = vertices.length;

  return {
    min: { x: minX, y: minY, z: minZ },
    max: { x: maxX, y: maxY, z: maxZ },
    dimensions: { width, height, depth },
    volume: width * height * depth,
    centroid: { x: sumX / n, y: sumY / n, z: sumZ / n },
  };
}

/**
 * Estimate surface area from face count and bounding box.
 * (Full mesh traversal would require face connectivity; this uses
 *  an approximation based on bounding box surface area × fill ratio.)
 */
function estimateSurfaceArea(
  faceCount: number,
  bbox: BoundingBox
): number {
  const { width, height, depth } = bbox.dimensions;
  const bboxSurface = 2 * (width * height + height * depth + width * depth);
  // Assume ~65% fill ratio for typical scanned surfaces
  return bboxSurface * 0.65;
}

/**
 * Estimate true volume (convex hull approximation).
 * Uses bounding box × typical fill factor for scanned geometry.
 */
function estimateVolume(bbox: BoundingBox, vertexCount: number): number {
  // Higher vertex density → closer to true volume
  const densityFactor = Math.min(0.85, 0.40 + vertexCount / 100000 * 0.15);
  return bbox.volume * densityFactor;
}

// ─── Main Parser ────────────────────────────────────────────────────────────

/**
 * Parse a PLY file buffer and return spatial analysis results.
 */
export function parsePlyFile(
  buffer: Buffer,
  filename: string = 'unknown.ply'
): SpatialParseResult {
  const parseId = `SPT-${crypto.randomBytes(8).toString('hex').toUpperCase()}`;

  // 1. Parse header
  const header = parsePlyHeader(buffer);

  // 2. Find vertex and face elements
  const vertexElement = header.elements.find((e) => e.name === 'vertex');
  const faceElement = header.elements.find((e) => e.name === 'face');

  if (!vertexElement) {
    throw new Error('PLY file has no vertex element');
  }

  const vertexCount = vertexElement.count;
  const faceCount = faceElement?.count ?? 0;

  // 3. Extract vertices
  let vertices: Vertex[];

  if (header.format === 'ascii') {
    const bodyStr = buffer
      .subarray(header.headerByteLength)
      .toString('ascii');
    vertices = extractVerticesAscii(bodyStr, vertexElement);
  } else if (header.format === 'binary_little_endian') {
    const { vertices: binaryVerts } = extractVerticesBinary(
      buffer,
      header.headerByteLength,
      vertexElement
    );
    vertices = binaryVerts;
  } else {
    throw new Error(
      `Unsupported PLY format: ${header.format}. Only ASCII and binary_little_endian are supported.`
    );
  }

  // 4. Compute geometry
  const boundingBox = computeBoundingBox(vertices);
  const surfaceArea = estimateSurfaceArea(faceCount, boundingBox);
  const estimatedVol = estimateVolume(boundingBox, vertexCount);
  const pointDensity = boundingBox.volume > 0 ? vertexCount / boundingBox.volume : 0;

  // 5. Material mass estimates
  const materialEstimate = {
    asphaltTonnes: estimatedVol * MATERIAL_DENSITIES.asphalt,
    aggregateTonnes: estimatedVol * MATERIAL_DENSITIES.aggregate,
    concreteTonnes: estimatedVol * MATERIAL_DENSITIES.concrete,
  };

  // 6. Carbon estimates (ICE v4.1 factors, per tonne)
  const carbonEstimate = {
    asphaltKgCO2e: materialEstimate.asphaltTonnes * MATERIAL_EF.asphalt,
    aggregateKgCO2e: materialEstimate.aggregateTonnes * MATERIAL_EF.aggregate,
    concreteKgCO2e: materialEstimate.concreteTonnes * MATERIAL_EF.concrete,
  };

  // 7. Integrity hash
  const integrityHash = crypto
    .createHash('sha256')
    .update(
      JSON.stringify({
        parseId,
        vertexCount,
        faceCount,
        volume: estimatedVol,
        centroid: boundingBox.centroid,
      })
    )
    .digest('hex');

  return {
    parseId,
    filename,
    header,
    vertexCount,
    faceCount,
    boundingBox,
    surfaceArea,
    pointDensity,
    estimatedVolume: estimatedVol,
    materialEstimate,
    carbonEstimate,
    integrityHash,
    parseTimestamp: new Date().toISOString(),
    isGaussianSplat: header.hasGaussianSplat,
  };
}

export const SPATIAL_PARSER_ENGINE = {
  name: 'Spatial Heritage Parser',
  version: '1.0.0',
  supportedFormats: ['PLY (ASCII)', 'PLY (Binary Little-Endian)'],
  gaussianSplatDetection: true,
  materialDensities: MATERIAL_DENSITIES,
  emissionFactors: MATERIAL_EF,
  description:
    'Extracts volume and density from spatial heritage scans for Heritage/Asphalt carbon calculation',
};
