/**
 * Utility class for generating noise for terrain and other procedural elements
 */
export class NoiseGenerator {
  private readonly F2 = 0.5 * (Math.sqrt(3.0) - 1.0);
  private readonly G2 = (3.0 - Math.sqrt(3.0)) / 6.0;
  private p: number[] = [];

  /**
   * Create a new noise generator with an optional seed
   * @param seed Random seed for noise generation
   */
  constructor(seed = Math.random()) {
    this.p = new Array(512);
    for (let i = 0; i < 256; i++) {
      this.p[i] = i;
    }

    // Fisher-Yates shuffle
    const rand = () => {
      seed = (seed * 16807) % 2147483647;
      return (seed - 1) / 2147483646;
    };

    for (let i = 255; i > 0; i--) {
      const j = Math.floor(rand() * (i + 1));
      [this.p[i], this.p[j]] = [this.p[j], this.p[i]];
    }

    // Duplicate for optimization
    for (let i = 0; i < 256; i++) {
      this.p[i + 256] = this.p[i];
    }
  }

  /**
   * Calculate 2D gradient for noise generation
   */
  private grad2(hash: number, x: number, y: number): number {
    const h = hash & 7;
    const u = h < 4 ? x : y;
    const v = h < 4 ? y : x;
    return ((h & 1) ? -u : u) + ((h & 2) ? -2.0 * v : 2.0 * v);
  }

  /**
   * Generate 2D noise at a given coordinate
   * @param x X coordinate
   * @param y Y coordinate
   * @returns Noise value in range [-1, 1]
   */
  noise2D(x: number, y: number): number {
    const n0 = this.hash(x, y);
    const n1 = this.hash(x + 1, y);
    const n2 = this.hash(x, y + 1);
    const n3 = this.hash(x + 1, y + 1);

    const xi = Math.floor(x) & 255;
    const yi = Math.floor(y) & 255;
    const xf = x - Math.floor(x);
    const yf = y - Math.floor(y);

    const u = xf * xf * xf * (xf * (xf * 6 - 15) + 10);
    const v = yf * yf * yf * (yf * (yf * 6 - 15) + 10);

    return this.lerp(
      this.lerp(n0, n1, u),
      this.lerp(n2, n3, u),
      v
    );
  }

  /**
   * Generate 3D noise by combining multiple 2D noise layers
   * @param x X coordinate
   * @param y Y coordinate
   * @param z Z coordinate
   * @returns Noise value in range [-1, 1]
   */
  noise3D(x: number, y: number, z: number): number {
    // Simplified 3D noise by combining 2D noises at different offsets
    return (
      this.noise2D(x, y) * 0.5 +
      this.noise2D(y + 31.416, z) * 0.25 +
      this.noise2D(x, z + 42.624) * 0.25
    );
  }

  /**
   * Hash function for noise generation
   */
  private hash(x: number, y: number): number {
    const xi = Math.floor(x) & 255;
    const yi = Math.floor(y) & 255;
    const xf = x - Math.floor(x);
    const yf = y - Math.floor(y);
    
    const index = (xi + this.p[yi & 255]) & 255;
    const hash = this.p[index];
    
    return this.grad2(hash, xf, yf);
  }

  /**
   * Linear interpolation
   */
  private lerp(a: number, b: number, t: number): number {
    return a + t * (b - a);
  }

  /**
   * Generate fractal noise (multiple octaves of noise)
   * @param x X coordinate
   * @param y Y coordinate
   * @param octaves Number of octaves to combine
   * @param persistence How much each octave contributes
   * @returns Noise value normalized to [0, 1] range
   */
  fractal2D(x: number, y: number, octaves: number = 6, persistence: number = 0.5): number {
    let total = 0;
    let frequency = 1;
    let amplitude = 1;
    let maxValue = 0;
    
    // Add successive octaves
    for (let i = 0; i < octaves; i++) {
      total += this.noise2D(x * frequency, y * frequency) * amplitude;
      maxValue += amplitude;
      amplitude *= persistence;
      frequency *= 2;
    }
    
    // Normalize to [0, 1]
    return (total / maxValue + 1) / 2;
  }
}