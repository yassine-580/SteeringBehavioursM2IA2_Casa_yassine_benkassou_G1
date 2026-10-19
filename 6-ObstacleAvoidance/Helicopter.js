// Classe Helicopter : sous-classe de Vehicle
// Hélicoptère lourd de transport qui assure la phase 1 (Livraison aérienne et treuillage)
class Helicopter extends Vehicle {
  constructor(startX, startY, helipadPos) {
    super(startX, startY);
    this.targetHelipad = helipadPos ? helipadPos.copy() : createVector(150, 150);
    this.exitPoint = createVector(startX < width / 2 ? -200 : width + 200, -150);

    this.maxSpeed = 4.2;
    this.maxForce = 0.22;
    this.r = 38;
    this.rotorAngle = 0;
    this.rotorSpeed = 0.45;
    this.tailRotorAngle = 0;

    // Phases de vol : "approach" (approche), "hover_drop" (vol stationnaire / treuillage), "depart" (évacuation), "done"
    this.flightPhase = "approach";
    this.hoverTimer = 0;
    this.cargoBox = null;
    this.color = "#37474F"; // Gris militaire tactique
  }

  attachCargo(cargoBox) {
    this.cargoBox = cargoBox;
  }

  // Comportement de pilotage autonome selon la phase de livraison aérienne
  applyBehaviors(obstacles = []) {
    let steerForce = createVector(0, 0);

    if (this.flightPhase === "approach") {
      // 1. Approche en décélération vers l'héliport (arrive)
      steerForce = this.arrive(this.targetHelipad, 100);

      // Si stabilisé à la verticale de l'héliport
      if (this.pos.dist(this.targetHelipad) < 25 && this.vel.mag() < 1.2) {
        this.flightPhase = "hover_drop";
        this.hoverTimer = 0;
      }
    } else if (this.flightPhase === "hover_drop") {
      // 2. Maintien stationnaire précis au-dessus de l'héliport
      steerForce = this.arrive(this.targetHelipad, 15);
      this.hoverTimer++;

      // Treuillage de la marchandise vers le sol
      if (this.cargoBox) {
        this.cargoBox.pos.x = this.pos.x;
        this.cargoBox.pos.y = this.pos.y;
        if (this.cargoBox.altitude <= 0) {
          // La marchandise a touché le sol
          this.cargoBox.status = "on_ground";
          this.cargoBox.home = this.targetHelipad.copy();
          this.cargoBox = null; // Décrochage du treuil
          this.flightPhase = "depart";
        }
      } else {
        this.flightPhase = "depart";
      }
    } else if (this.flightPhase === "depart") {
      // 3. Départ plein gaz vers le point de sortie hors champ (seek)
      this.maxSpeed = 5.5;
      this.maxForce = 0.35;
      steerForce = this.seek(this.exitPoint);

      if (this.pos.x < -150 || this.pos.x > width + 150 || this.pos.y < -120) {
        this.flightPhase = "done";
      }
    }

    // Évitement souple des obstacles très hauts
    let avoidForce = createVector(0, 0);
    if (obstacles && obstacles.length > 0) {
      avoidForce = this.avoid(obstacles);
      avoidForce.mult(1.5);
    }

    this.applyForce(steerForce);
    this.applyForce(avoidForce);
  }

  isFinished() {
    return this.flightPhase === "done";
  }

  show() {
    if (this.flightPhase === "done") return;

    this.rotorAngle += this.rotorSpeed;
    this.tailRotorAngle += 0.8;

    push();

    // 1. Ombre portée au sol de l'hélicoptère
    push();
    translate(this.pos.x, this.pos.y + 45);
    rotate(this.vel.heading());
    noStroke();
    fill(0, 0, 0, 70);
    ellipse(0, 0, 60, 24);
    rect(-28, -2, 28, 4);
    circle(-38, 0, 16);
    pop();

    // 2. Câble de treuil descendant vers le cargo si en largage
    if (this.flightPhase === "hover_drop" && this.cargoBox && this.cargoBox.altitude > 0) {
      stroke(180);
      strokeWeight(1.8);
      line(this.pos.x, this.pos.y, this.pos.x, this.pos.y - this.cargoBox.altitude);
    }

    // 3. Corps de l'hélicoptère
    translate(this.pos.x, this.pos.y);
    rotate(this.vel.heading());

    // Patins d'atterrissage
    stroke(80);
    strokeWeight(2.5);
    line(-18, -14, 18, -14);
    line(-18, 14, 18, 14);
    line(-8, -14, -4, -9);
    line(8, -14, 12, -9);
    line(-8, 14, -4, 9);
    line(8, 14, 12, 9);

    // Poutre de queue
    stroke(38, 50, 56);
    strokeWeight(5);
    line(0, 0, -42, 0);

    // Aileron arrière
    fill(207, 216, 220);
    noStroke();
    rect(-42, -6, 5, 12, 1);

    // Fuselage principal
    fill(this.color);
    stroke(38, 50, 56);
    strokeWeight(1.5);
    ellipse(2, 0, 48, 22);

    // Verrière cockpit avant (bleu réfléchissant)
    fill(41, 182, 246, 220);
    stroke(2, 119, 189);
    strokeWeight(1);
    ellipse(16, 0, 14, 14);

    // Feux de navigation stroboscopiques
    let strobe = sin(frameCount * 0.3) > 0;
    noStroke();
    fill(strobe ? color(255, 23, 68) : color(100, 0, 0));
    circle(-6, -11, 4);
    fill(strobe ? color(0, 230, 118) : color(0, 100, 0));
    circle(-6, 11, 4);

    // 4. Rotor principal animé
    push();
    rotate(this.rotorAngle);
    // Disque de balayage du rotor
    noStroke();
    fill(255, 255, 255, 25);
    circle(0, 0, 80);

    // Pales du rotor
    stroke(20);
    strokeWeight(3.5);
    line(-38, 0, 38, 0);
    line(0, -38, 0, 38);

    // Moyeu de rotor central
    fill(255, 193, 7);
    stroke(30);
    strokeWeight(1);
    circle(0, 0, 7);
    pop();

    // 5. Rotor de queue arrière
    push();
    translate(-43, 0);
    rotate(this.tailRotorAngle);
    stroke(220);
    strokeWeight(2);
    line(-9, 0, 9, 0);
    pop();

    pop();
  }
}
