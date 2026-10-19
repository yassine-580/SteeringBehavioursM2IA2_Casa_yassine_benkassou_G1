// Classe Obstacle : sous-classe de Vehicle
// Représente un obstacle physique avec steering behavior d'ancrage (station-keeping)
class Obstacle extends Vehicle {
  constructor(x, y, r = 60, couleur = "#2e7d32") {
    super(x, y);
    this.r = r;
    this.color = couleur;
    this.home = createVector(x, y);
    this.maxSpeed = 0.5;
    this.maxForce = 0.05;
    this.label = "OBSTACLE";
  }

  // Applique un comportement d'ancrage : reste sur son emplacement initial
  // respectant la règle selon laquelle tout objet graphique est un Vehicle
  applyBehaviors() {
    let steer = this.arrive(this.home);
    this.applyForce(steer);
  }

  // Vérifie si un point (x, y ou p5.Vector) se trouve à l'intérieur de l'obstacle
  contains(x, y) {
    let pt;
    if (x && typeof x.x === 'number' && typeof x.y === 'number') {
      pt = x;
    } else {
      pt = createVector(x, y);
    }
    return this.pos.dist(pt) <= this.r;
  }

  show(isHovered = false) {
    push();
    translate(this.pos.x, this.pos.y);

    // Indication visuelle si la souris survole l'obstacle (mode suppression)
    if (isHovered) {
      noFill();
      stroke(248, 81, 73, 220);
      strokeWeight(3);
      ellipse(0, 0, (this.r + 10) * 2);

      // Petite croix de suppression
      stroke(248, 81, 73);
      strokeWeight(2.5);
      line(-10, -10, 10, 10);
      line(-10, 10, 10, -10);
    } else {
      // Halo extérieur de détection / danger
      noFill();
      stroke(255, 100);
      strokeWeight(1.5);
      if (typeof drawingContext !== 'undefined' && drawingContext.setLineDash) {
        drawingContext.setLineDash([4, 4]);
      }
      ellipse(0, 0, (this.r + 20) * 2);
      if (typeof drawingContext !== 'undefined' && drawingContext.setLineDash) {
        drawingContext.setLineDash([]);
      }
    }

    // Corps principal de l'obstacle
    fill(isHovered ? "#3e2723" : this.color);
    stroke(isHovered ? "#d32f2f" : 0);
    strokeWeight(3);
    ellipse(0, 0, this.r * 2);

    // Motif intérieur (anneaux concentriques)
    stroke(0, 80);
    strokeWeight(2);
    ellipse(0, 0, this.r * 1.3);

    fill(20, 20, 20, 180);
    noStroke();
    ellipse(0, 0, this.r * 0.5);

    // Centre métallique
    fill(isHovered ? "#ff8a80" : 240);
    ellipse(0, 0, 10);
    pop();
  }
}