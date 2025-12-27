import { getConnection } from "../spacetimedb-connection";
import { type Infer } from "spacetimedb";
import SmokeCloudRow from "../../module_bindings/smoke_cloud_type";
import { type EventContext } from "../../module_bindings";
import { SmokeCloudParticles } from "../objects/particles/SmokeCloudParticles";

export class SmokeCloudManager {
  private particleSystems: Map<string, SmokeCloudParticles> = new Map();
  private worldId: string;

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

    connection
      .subscriptionBuilder()
      .onError((e) => console.error("Smoke cloud subscription error", e))
      .subscribe([`SELECT * FROM smoke_cloud WHERE WorldId = '${this.worldId}'`]);

    connection.db.smokeCloud.onInsert((_ctx: EventContext, cloud: Infer<typeof SmokeCloudRow>) => {
      if (cloud.worldId === this.worldId) {
        const particles = new SmokeCloudParticles(cloud.positionX, cloud.positionY, cloud.radius);
        this.particleSystems.set(cloud.id, particles);
      }
    });

    connection.db.smokeCloud.onDelete((_ctx: EventContext, cloud: Infer<typeof SmokeCloudRow>) => {
      const system = this.particleSystems.get(cloud.id);
      if (system) {
        system.stopEmitting();
      }
    });
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
  }
}
