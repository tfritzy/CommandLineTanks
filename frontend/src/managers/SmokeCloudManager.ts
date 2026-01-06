import { getConnection } from "../spacetimedb-connection";
import { type Infer } from "spacetimedb";
import SmokeCloudRow from "../../module_bindings/smoke_cloud_type";
import { type EventContext } from "../../module_bindings";
import { SmokeCloudParticles } from "../objects/particles/SmokeCloudParticles";
import { subscribeToTable, type TableSubscription } from "../utils/tableSubscription";

export class SmokeCloudManager {
  private particleSystems: Map<string, SmokeCloudParticles> = new Map();
  private worldId: string;
  private subscription: TableSubscription<typeof SmokeCloudRow> | null = null;
  private keysToDelete: string[] = [];

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

    this.subscription = subscribeToTable({
      table: connection.db.smokeCloud,
      handlers: {
        onInsert: (_ctx: EventContext, cloud: Infer<typeof SmokeCloudRow>) => {
          if (cloud.worldId !== this.worldId) return;
          const particles = new SmokeCloudParticles(cloud.positionX, cloud.positionY, cloud.radius);
          this.particleSystems.set(cloud.id, particles);
        },
        onDelete: (_ctx: EventContext, cloud: Infer<typeof SmokeCloudRow>) => {
          if (cloud.worldId !== this.worldId) return;
          const system = this.particleSystems.get(cloud.id);
          if (system) {
            system.stopEmitting();
          }
        }
      }
    });
  }

  public update(deltaTime: number): void {
    this.keysToDelete.length = 0;
    for (const [id, system] of this.particleSystems) {
      system.update(deltaTime);
      if (system.getIsDead()) {
        this.keysToDelete.push(id);
      }
    }
    for (let i = 0; i < this.keysToDelete.length; i++) {
      this.particleSystems.delete(this.keysToDelete[i]);
    }
  }

  public draw(ctx: CanvasRenderingContext2D, cameraX: number, cameraY: number, viewportWidth: number, viewportHeight: number): void {
    for (const system of this.particleSystems.values()) {
      system.draw(ctx, cameraX, cameraY, viewportWidth, viewportHeight);
    }
  }

  public destroy() {
    if (this.subscription) {
      this.subscription.unsubscribe();
      this.subscription = null;
    }
  }
}
