// Classe CargoBox : sous-classe de Vehicle
// Représente une cargaison (palette de caisses / cartons de marchandises)
class CargoBox extends Vehicle {
  constructor(x, y, level = 1) {
    super(x, y);
    this.home = createVector(x, y);
    this.r = 22;
    this.maxSpeed = 2.5;
    this.maxForce = 0.2;
    this.color = "#D7CCC8";

    // États : "in_air", "on_ground", "loaded", "delivered"
    this.status = "in_air";
    this.carrier = null; // Référence au Camion porteur
    this.level = level;
    this.altitude = 100; // Hauteur au-dessus du sol lors du largage aérien (treuillage)
    this.w = 34;
    this.h = 26;
    this.wanderTheta = (typeof Math !== 'undefined' ? Math.random() : 0) * (typeof PI !== 'undefined' ? PI * 2 : 6.28);
  }

  // Comportement de déambulation autonome (Wander de Craig Reynolds)
  wander() {
    let wanderR = 24;
    let wanderD = 45;
    let change = 0.3;
    if (typeof random === 'function') {
      this.wanderTheta += random(-change, change);
    } else {
      this.wanderTheta += (Math.random() - 0.5) * change * 2;
    }

    let circlePos = this.vel.copy();
    if (circlePos.mag() === 0) circlePos = createVector(1, 0);
    circlePos.normalize();
    circlePos.mult(wanderD);
    circlePos.add(this.pos);

    let h = this.vel.heading();
    let circleOffset = createVector(wanderR * Math.cos(this.wanderTheta + h), wanderR * Math.sin(this.wanderTheta + h));
    let target = p5.Vector.add(circlePos, circleOffset);

    return this.seek(target);
  }

  // Reste dans l'espace jouable de l'écran
  stayWithinBounds() {
    let steer = createVector(0, 0);
    let margin = 70;
    let desired = null;
    let w = (typeof width !== 'undefined') ? width : 1200;
    let h = (typeof height !== 'undefined') ? height : 800;

    if (this.pos.x < margin) desired = createVector(this.maxSpeed, this.vel.y);
    else if (this.pos.x > w - margin) desired = createVector(-this.maxSpeed, this.vel.y);

    if (this.pos.y < margin) desired = createVector(this.vel.x, this.maxSpeed);
    else if (this.pos.y > h - margin) desired = createVector(this.vel.x, -this.maxSpeed);

    if (desired) {
      steer = p5.Vector.sub(desired, this.vel);
      steer.limit(this.maxForce * 1.5);
    }
    return steer;
  }

  // Maintien au sol, déambulation aléatoire ou suivi solide du camion transporteur
  applyBehaviors(helipadPos = null, obstacles = []) {
    if (this.status === "in_air") {
      // Descend doucement au sol
      if (this.altitude > 0) {
        this.altitude = Math.max(0, this.altitude - 1.8);
      }
      if (this.altitude <= 0) {
        this.altitude = 0;
        this.status = "on_ground";
        if (typeof p5 !== 'undefined' && p5.Vector && typeof p5.Vector.random2D === 'function') {
          this.vel = p5.Vector.random2D().mult(1.5);
        } else {
          this.vel = createVector(1, 0);
        }
      }
      if (helipadPos) {
        let steer = this.arrive(helipadPos, 20);
        this.applyForce(steer);
      }
    } else if (this.status === "on_ground") {
      // Bloc de marchandise mobile : se déplace de façon autonome (wander) en attendant d'être chargé
      this.maxSpeed = 1.8;
      this.maxForce = 0.22;
      let wanderForce = this.wander();
      let boundForce = this.stayWithinBounds();
      wanderForce.add(boundForce);

      if (obstacles && obstacles.length > 0) {
        let avoidForce = this.avoid(obstacles);
        avoidForce.mult(2.0);
        wanderForce.add(avoidForce);
      }

      this.applyForce(wanderForce);
    } else if (this.status === "loaded" && this.carrier) {
      // Solidement arrimé sur la remorque du camion transporteur (verrouillage physique)
      let heading = this.carrier.vel.heading();
      let offset = p5.Vector.fromAngle(heading + Math.PI);
      offset.mult(14);
      this.pos.x = this.carrier.pos.x + offset.x;
      this.pos.y = this.carrier.pos.y + offset.y;
      this.vel = this.carrier.vel.copy();
    }
  }

  // Attache la cargaison à un camion
  loadOnto(camion) {
    this.carrier = camion;
    this.status = "loaded";
    if (camion && camion.vel) {
      let offset = p5.Vector.fromAngle(camion.vel.heading() + Math.PI);
      offset.mult(14);
      this.pos.x = camion.pos.x + offset.x;
      this.pos.y = camion.pos.y + offset.y;
      this.vel = camion.vel.copy();
    }
  }

  // Marque la cargaison comme livrée au garage
  deliver() {
    this.status = "delivered";
    this.carrier = null;
  }

  show() {
    if (this.status === "delivered") return;

    push();
    translate(this.pos.x, this.pos.y);

    // Orientation : alignée avec le camion si chargée, ou avec sa vitesse de déambulation si au sol
    if (this.status === "loaded" && this.carrier && this.carrier.vel) {
      rotate(this.carrier.vel.heading());
    } else if (this.status === "on_ground" && this.vel && this.vel.mag() > 0.05) {
      rotate(this.vel.heading());
    }

    // 1. Ombre portée au sol proportionnelle à l'altitude
    if (this.altitude > 0) {
      let shadowAlpha = map(this.altitude, 0, 100, 140, 40);
      let shadowScale = map(this.altitude, 0, 100, 1.0, 0.5);
      noStroke();
      fill(0, 0, 0, shadowAlpha);
      rectMode(CENTER);
      rect(0, this.altitude * 0.4, this.w * shadowScale, this.h * shadowScale, 3);
    }

    // Décalage visuel selon l'altitude
    translate(0, -this.altitude);

    rectMode(CENTER);

    // Roulettes autonomes lorsque la palette se déplace seule au sol
    if (this.status === "on_ground") {
      fill(30);
      noStroke();
      rect(-this.w / 2 + 4, -this.h / 2 - 2, 6, 3, 1);
      rect(this.w / 2 - 4, -this.h / 2 - 2, 6, 3, 1);
      rect(-this.w / 2 + 4, this.h / 2 + 2, 6, 3, 1);
      rect(this.w / 2 - 4, this.h / 2 + 2, 6, 3, 1);
    }

    // 2. Palette en bois de base
    fill(141, 110, 99);
    stroke(93, 64, 55);
    strokeWeight(1.5);
    rect(0, 0, this.w, this.h, 2);

    // Lattes de la palette
    stroke(62, 39, 35, 180);
    strokeWeight(1);
    line(-this.w / 2 + 3, -this.h / 2, -this.w / 2 + 3, this.h / 2);
    line(0, -this.h / 2, 0, this.h / 2);
    line(this.w / 2 - 3, -this.h / 2, this.w / 2 - 3, this.h / 2);

    // 3. Cartons de marchandises étiquetés
    fill(215, 204, 200);
    stroke(121, 85, 72);
    strokeWeight(1);
    rect(-6, -4, 16, 14, 2);
    rect(7, -3, 14, 15, 2);
    rect(0, 5, 22, 11, 2);

    // Bandes de cerclage / sécurisation jaunes et noires
    stroke(255, 193, 7);
    strokeWeight(1.5);
    line(-this.w / 2 + 2, 0, this.w / 2 - 2, 0);

    // Étiquette "CARGO"
    fill(255, 255, 255, 220);
    noStroke();
    rect(0, 5, 12, 5, 1);
    fill(0);
    textAlign(CENTER, CENTER);
    textSize(5);
    textStyle(BOLD);
    text("CARGO", 0, 5);

    // Anneau de treuillage si en l'air
    if (this.altitude > 0) {
      stroke(200);
      strokeWeight(1.5);
      noFill();
      circle(0, -12, 6);
      line(0, -12, 0, -25);
    }

    pop();
  }
}
