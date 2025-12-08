import { Tank } from './objects/Tank';

export class Game {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private animationFrameId: number | null = null;
  private time: number = 0;
  private lastFrameTime: number = 0;
  private tank: Tank;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Failed to get 2D context');
    }
    this.ctx = ctx;
    
    this.resizeCanvas();
    window.addEventListener('resize', () => this.resizeCanvas());
    
    // Create a tank in the center of the screen
    this.tank = new Tank(
      window.innerWidth / 2,
      window.innerHeight / 2,
      0,
      0
    );
  }

  private resizeCanvas() {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
  }

  private drawGrid() {
    const gridSize = 50; // Size of each grid cell in pixels
    
    this.ctx.strokeStyle = '#dddddd';
    this.ctx.lineWidth = 1;

    // Draw vertical lines
    for (let x = 0; x <= this.canvas.width; x += gridSize) {
      this.ctx.beginPath();
      this.ctx.moveTo(x, 0);
      this.ctx.lineTo(x, this.canvas.height);
      this.ctx.stroke();
    }

    // Draw horizontal lines
    for (let y = 0; y <= this.canvas.height; y += gridSize) {
      this.ctx.beginPath();
      this.ctx.moveTo(0, y);
      this.ctx.lineTo(this.canvas.width, y);
      this.ctx.stroke();
    }
  }

  private update(currentTime: number = 0) {
    // Calculate delta time in seconds
    const deltaTime = this.lastFrameTime === 0 ? 0 : (currentTime - this.lastFrameTime) / 1000;
    this.lastFrameTime = currentTime;
    this.time += deltaTime;
    
    // Clear canvas with white background
    this.ctx.fillStyle = '#ffffff';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    // Draw grid
    this.drawGrid();

    // Update tank rotations
    const bodyRotationSpeed = 0.5; // radians per second
    const turretRotationSpeed = 1.5; // radians per second (3x faster)
    
    this.tank.setBodyRotation(this.time * bodyRotationSpeed);
    this.tank.setTurretRotation(this.time * turretRotationSpeed);
    
    // Draw tank
    this.tank.draw(this.ctx);

    this.animationFrameId = requestAnimationFrame((time) => this.update(time));
  }

  public start() {
    if (!this.animationFrameId) {
      this.lastFrameTime = 0;
      this.update();
    }
  }

  public stop() {
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }

  public destroy() {
    this.stop();
    window.removeEventListener('resize', () => this.resizeCanvas());
  }
}
