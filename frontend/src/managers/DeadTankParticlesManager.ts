import { DeadTankParticles } from "../objects/particles/DeadTankParticles";
import { DrawableManager } from "./DrawableManager";

export class DeadTankParticlesManager extends DrawableManager<DeadTankParticles> {
  public spawnParticles(x: number, y: number, alliance: number): void {
    const particles = new DeadTankParticles(x, y, alliance);
    this.add(particles);
  }
}
