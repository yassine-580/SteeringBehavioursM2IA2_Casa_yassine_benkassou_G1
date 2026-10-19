// Classe PlayerCamion : sous-classe de Camion (qui hérite de Vehicle)
// Permet au joueur de piloter manuellement son camion via le clavier (ZQSD / Touches fléchées)
// ou la souris, en appliquant rigoureusement la locomotion par steering forces (applyForce).
class PlayerCamion extends Camion {
  constructor(x, y, color = "#FF9800") {
    super(x, y, color);
    this.isPlayer = true;
    this.label = "JOUEUR";
    this.playerControlEnabled = true;
    this.pulsePhase = 0;
  }

  // Comportement de pilotage manuel sous contrôle direct du joueur
  applyPlayerBehaviors(targetOrGarage, obstacles = [], policeList = [], otherCamions = [], roadNetwork = null, cargoTarget = null) {
    if (!this.playerControlEnabled) {
      // Repli sur l'IA autonome si le joueur désactive le contrôle manuel
      super.applyBehaviors(targetOrGarage, obstacles, policeList, otherCamions, roadNetwork, cargoTarget);
      return;
    }

    let inputVector = createVector(0, 0);

    // Détection des touches de direction (Flèches OU ZQSD / WASD)
    if (typeof keyIsDown === 'function') {
      if (keyIsDown(UP_ARROW) || keyIsDown(87) /* W */ || keyIsDown(90) /* Z */) {
        inputVector.y -= 1;
      }
      if (keyIsDown(DOWN_ARROW) || keyIsDown(83) /* S */) {
        inputVector.y += 1;
      }
      if (keyIsDown(LEFT_ARROW) || keyIsDown(65) /* A */ || keyIsDown(81) /* Q */) {
        inputVector.x -= 1;
      }
      if (keyIsDown(RIGHT_ARROW) || keyIsDown(68) /* D */) {
        inputVector.x += 1;
      }
    }

    let moveForce = createVector(0, 0);

    if (inputVector.mag() > 0) {
      // Construction de la vitesse désirée selon la commande du joueur
      let desired = inputVector.normalize().mult(this.maxSpeed);
      // Calcul de la force de steering Reynolds : steer = desired - currentVelocity
      moveForce = p5.Vector.sub(desired, this.vel);
      moveForce.limit(this.maxForce * 1.5);
    } else if (this.targetMode === "mouse" && typeof mouseX === 'number' && typeof mouseY === 'number') {
      // Suivi de la souris si le joueur a activé le ciblage souris
      let mousePos = createVector(mouseX, mouseY);
      moveForce = this.arrive(mousePos, 40);
    } else {
      // Décélération douce en l'absence de commande
      let brake = this.vel.copy().mult(-0.06);
      this.applyForce(brake);
    }

    this.applyForce(moveForce);

    // Assistance d'évitement d'obstacles
    if (obstacles && obstacles.length > 0) {
      let avoidForce = this.avoid(obstacles);
      avoidForce.mult(this.avoidWeight * 0.7);
      this.applyForce(avoidForce);
    }

    // Séparation vis-à-vis des autres camions alliés
    if (otherCamions && otherCamions.length > 1) {
      let sep = this.separate(otherCamions);
      sep.mult(0.8);
      this.applyForce(sep);
    }

    // Chargement automatique au contact d'un bloc de marchandise mobile
    if (!this.hasCargo && cargoTarget && (cargoTarget.status === "on_ground" || cargoTarget.altitude === 0)) {
      if (this.pos.dist(cargoTarget.pos) < 45) {
        this.loadCargo(cargoTarget);
        if (typeof soundManager !== 'undefined' && soundManager) {
          soundManager.playCargoLoaded();
        }
      }
    }
  }

  drawVehicle() {
    super.drawVehicle();

    // Indicateur au-dessus du camion du joueur
    this.pulsePhase += 0.08;
    let pulse = (typeof sin === 'function') ? sin(this.pulsePhase) * 4 : 0;

    push();
    translate(this.pos.x, this.pos.y);

    // Halo lumineux vert sous le camion du joueur
    noFill();
    stroke(0, 230, 118, 160);
    strokeWeight(2);
    circle(0, 0, 48 + pulse);

    // Badge "★ VOUS (JOUEUR) ★"
    translate(0, -this.r_pourDessin - 24);
    noStroke();
    fill(0, 230, 118);
    textAlign(CENTER, CENTER);
    textSize(10);
    textStyle(BOLD);
    text("★ VOUS (JOUEUR) ★", 0, 0);

    // Flèche indicatrice vers le bas
    triangle(-4, 7, 4, 7, 0, 12);
    pop();
  }
}
