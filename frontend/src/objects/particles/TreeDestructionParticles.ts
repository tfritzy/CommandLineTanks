import type { Particle } from "./ParticleTypes";
import { COLORS } from "../../theme/colors";

const TWO_PI = Math.PI * 2;

export interface TreeParticle extends Particle {
  type: 'stick' | 'leaf';
  rotation: number;
  rotationSpeed: number;
}

export class TreeDestructionParticles {
  private particles: TreeParticle[] = [];
  private isDead = false;
  private x: number;
  private y: number;
  private cachedPosition: { x: number; y: number };
  private windVelocityX: number;

  constructor(x: number, y: number, isDeadTree: boolean) {
    this.x = x;
    this.y = y;
    this.cachedPosition = { x, y };
    this.windVelocityX = (Math.random() - 0.5) * 2.0;

    const stickColor = COLORS.TERRAIN.DEAD_TREE_BASE;
    const leafColor = COLORS.TERRAIN.TREE_FOLIAGE;

    // Create sticks
    const stickCount = 3 + Math.floor(Math.random() * 3);
    for (let i = 0; i < stickCount; i++) {
      const angle = Math.random() * TWO_PI;
      const speed = 1.0 + Math.random() * 2.0;
      
      this.particles.push({
        x, y,
        velocityX: Math.cos(angle) * speed,
        velocityY: Math.sin(angle) * speed,
        size: 0.3 + Math.random() * 0.3, // Length of the stick
        lifetime: 0,
        maxLifetime: 0.5 + Math.random() * 0.5,
        color: stickColor,
        type: 'stick',
        rotation: Math.random() * TWO_PI,
        rotationSpeed: (Math.random() - 0.5) * 10
      });
    }

    // Create leaves
    const leafCount = 20 + Math.floor(Math.random() * 15);
    for (let i = 0; i < leafCount; i++) {
      const angle = Math.random() * TWO_PI;
      const speed = 1.5 + Math.random() * 3.0;
      
      this.particles.push({
        x, y,
        velocityX: Math.cos(angle) * speed,
        velocityY: Math.sin(angle) * speed,
        size: 0.1 + Math.random() * 0.1,
        lifetime: 0,
        maxLifetime: 1.0 + Math.random() * 1.0, // Leaves live longer to drift
        color: leafColor,
        type: 'leaf',
        rotation: Math.random() * TWO_PI,
        rotationSpeed: (Math.random() - 0.5) * 8
      });
    }
  }

  public update(deltaTime: number): void {
    let allDead = true;
    for (const p of this.particles) {
      p.lifetime += deltaTime;
      if (p.lifetime < p.maxLifetime) {
        // Apply wind/drift to leaves more than sticks
        const windScale = p.type === 'leaf' ? 1.0 : 0.3;
        p.velocityX += this.windVelocityX * windScale * deltaTime;
        
        // Add a bit of "flutter" noise to leaf velocity
        if (p.type === 'leaf') {
          p.velocityX += (Math.random() - 0.5) * 2.0 * deltaTime;
          p.velocityY += (Math.random() - 0.5) * 2.0 * deltaTime;
        }

        p.x += p.velocityX * deltaTime;
        p.y += p.velocityY * deltaTime;
        
        // Top-down "air resistance" (friction with ground/air)
        // Sticks stop faster, leaves drift longer
        const friction = p.type === 'leaf' ? 0.94 : 0.9;
        p.velocityX *= friction;
        p.velocityY *= friction;
        
        // Rotation
        p.rotation += p.rotationSpeed * deltaTime;
        
        allDead = false;
      }
    }
    this.isDead = allDead;
  }

  public getParticles(): TreeParticle[] {
    return this.particles;
  }

  public getIsDead(): boolean {
    return this.isDead;
  }

  public getPosition(): { x: number; y: number } {
    this.cachedPosition.x = this.x;
    this.cachedPosition.y = this.y;
    return this.cachedPosition;
  }
}
