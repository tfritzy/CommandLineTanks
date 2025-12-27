import { Projectile } from "./Projectile";
import { NormalProjectile } from "./NormalProjectile";
import { GrenadeProjectile } from "./GrenadeProjectile";
import { RocketProjectile } from "./RocketProjectile";
import { MissileProjectile } from "./MissileProjectile";
import { MoagProjectile } from "./MoagProjectile";
import { BoomerangProjectile } from "./BoomerangProjectile";
import { SpiderMineProjectile } from "./SpiderMineProjectile";

export * from "./Projectile";
export * from "./NormalProjectile";
export * from "./GrenadeProjectile";
export * from "./RocketProjectile";
export * from "./MissileProjectile";
export * from "./MoagProjectile";
export * from "./BoomerangProjectile";
export * from "./SpiderMineProjectile";

export class ProjectileFactory {
  public static create(
    type: string,
    x: number,
    y: number,
    velocityX: number,
    velocityY: number,
    size: number,
    alliance: number,
    explosionRadius?: number,
    trackingStrength?: number,
    trackingRadius?: number
  ): Projectile {
    switch (type) {
      case "Grenade":
        return new GrenadeProjectile(x, y, velocityX, velocityY, size, alliance, explosionRadius, trackingStrength, trackingRadius);
      case "Rocket":
        return new RocketProjectile(x, y, velocityX, velocityY, size, alliance, explosionRadius, trackingStrength, trackingRadius);
      case "Missile":
        return new MissileProjectile(x, y, velocityX, velocityY, size, alliance, explosionRadius, trackingStrength, trackingRadius);
      case "Moag":
        return new MoagProjectile(x, y, velocityX, velocityY, size, alliance, explosionRadius, trackingStrength, trackingRadius);
      case "Boomerang":
        return new BoomerangProjectile(x, y, velocityX, velocityY, size, alliance, explosionRadius, trackingStrength, trackingRadius);
      case "SpiderMine":
        return new SpiderMineProjectile(x, y, velocityX, velocityY, size, alliance, explosionRadius, trackingStrength, trackingRadius);
      default:
        return new NormalProjectile(x, y, velocityX, velocityY, size, alliance, explosionRadius, trackingStrength, trackingRadius);
    }
  }
}
