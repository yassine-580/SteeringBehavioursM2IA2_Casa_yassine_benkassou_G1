// Classe Roadblock : sous-classe de Vehicle
// Barrage routier tactique déployé par les forces de l'ordre (Niveaux 3, 4 et 5)
class Roadblock extends Vehicle {
  constructor(x, y, angle = 0, width = 60) {
    super(x, y);
    this.home = createVector(x, y);
    this.w = width;
    this.h = 24;
    this.r = width / 2;
    this.angle = angle;
    this.maxSpeed = 0.2;
    this.maxForce = 0.05;
    this.strobePhase = 0;
  }

  // Maintien stationnaire de la barrière via steering arrive
  applyBehaviors() {
    let steer = this.arrive(this.home);
    this.applyForce(steer);
  }

  // Vérifie si un véhicule heurte le barrage routier
  checkCollision(vehicle) {
    if (!vehicle || !vehicle.pos) return false;
    let d = this.pos.dist(vehicle.pos);
    let rContact = this.r + (vehicle.r_pourDessin || 16);
    if (d < rContact) {
      if (vehicle.dureeDeVie !== undefined) {
        vehicle.dureeDeVie = Math.max(0, vehicle.dureeDeVie - 1.2);
        vehicle.hitFlash = 5;
      }
      return true;
    }
    return false;
  }

  show() {
    this.strobePhase += 0.2;
    let isRed = sin(this.strobePhase) > 0;

    push();
    translate(this.pos.x, this.pos.y);
    rotate(this.angle);

    rectMode(CENTER);

    // 1. Blocs béton de soutien aux extrémités
    fill(97, 97, 97);
    stroke(33);
    strokeWeight(1.5);
    rect(-this.w / 2 + 6, 0, 12, this.h, 2);
    rect(this.w / 2 - 6, 0, 12, this.h, 2);

    // 2. Barrière principale à chevrons rouge et blanc
    fill(245, 245, 245);
    stroke(33);
    strokeWeight(1.5);
    rect(0, 0, this.w - 12, 14, 2);

    // Chevrons diagonaux rouges de signalisation chantier/police
    push();
    strokeWeight(2.5);
    stroke(211, 47, 47);
    for (let x = -this.w / 2 + 10; x <= this.w / 2 - 14; x += 10) {
      line(x, -6, x + 6, 6);
    }
    pop();

    // 3. Gyrophares stroboscopiques de barrage (ambre / bleu)
    noStroke();
    fill(isRed ? color(255, 23, 68) : color(255, 179, 0));
    circle(-this.w / 2 + 6, -this.h / 2 - 2, 7);

    fill(!isRed ? color(33, 150, 243) : color(255, 179, 0));
    circle(this.w / 2 - 6, -this.h / 2 - 2, 7);

    // Lueur d'avertissement au sol
    fill(isRed ? 255 : 33, isRed ? 23 : 150, 243, 30);
    ellipse(0, 0, this.w * 1.3, this.h * 1.8);

    pop();
  }
}
