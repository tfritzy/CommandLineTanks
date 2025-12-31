import { getConnection } from "../spacetimedb-connection";
import { type Infer } from "spacetimedb";
import SmokeCloudRow from "../../module_bindings/smoke_cloud_type";
import { type EventContext } from "../../module_bindings";
import { SmokeCloudParticles } from "../objects/particles/SmokeCloudParticles";

export class SmokeCloudManager {
  private particleSystems: Map<string, SmokeCloudParticles> = new Map();
  private worldId: string;
  private handleCloudInsert: ((ctx: EventContext, cloud: Infer<typeof SmokeCloudRow>) => void) | null = null;
  private handleCloudDelete: ((ctx: EventContext, cloud: Infer<typeof SmokeCloudRow>) => void) | null = null;

  constructor(worldId: string) {
    this.worldId = worldId;
    this.subscribeToSmokeClouds();
  }

  private subscribeToSmokeClouds() {
    const connection = getConnection();
    if (!connection) {
      console.warn("Cannot subscribe to smoke clouds: connection not available");
      return;
    }

    this.handleCloudInsert = (_ctx: EventContext, cloud: Infer<typeof SmokeCloudRow>) => {
      if (cloud.worldId !== this.worldId) return;
      const particles = new SmokeCloudParticles(cloud.positionX, cloud.positionY, cloud.radius);
      this.particleSystems.set(cloud.id, particles);
    };

    this.handleCloudDelete = (_ctx: EventContext, cloud: Infer<typeof SmokeCloudRow>) => {
      if (cloud.worldId !== this.worldId) return;
      const system = this.particleSystems.get(cloud.id);
      if (system) {
        system.stopEmitting();
      }
    };

    connection.db.smokeCloud.onInsert(this.handleCloudInsert);
    connection.db.smokeCloud.onDelete(this.handleCloudDelete);

    for (const cloud of connection.db.smokeCloud.iter()) {
      if (cloud.worldId === this.worldId) {
        const particles = new SmokeCloudParticles(cloud.positionX, cloud.positionY, cloud.radius);
        this.particleSystems.set(cloud.id, particles);
      }
    }
  }

  public update(deltaTime: number): void {
    for (const [id, system] of this.particleSystems.entries()) {
      system.update(deltaTime);
      if (system.getIsDead()) {
        this.particleSystems.delete(id);
      }
    }
  }

  public draw(ctx: CanvasRenderingContext2D, cameraX: number, cameraY: number, viewportWidth: number, viewportHeight: number): void {
    for (const system of this.particleSystems.values()) {
      system.draw(ctx, cameraX, cameraY, viewportWidth, viewportHeight);
    }
  }

  public destroy() {
    const connection = getConnection();
    if (connection) {
      if (this.handleCloudInsert) connection.db.smokeCloud.removeOnInsert(this.handleCloudInsert);
      if (this.handleCloudDelete) connection.db.smokeCloud.removeOnDelete(this.handleCloudDelete);
    }
  }
}
