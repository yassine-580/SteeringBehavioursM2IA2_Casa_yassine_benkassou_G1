// Classe Helipad : sous-classe de Vehicle
// Zone d'atterrissage et de largage aérien clairement délimitée au sol
class Helipad extends Vehicle {
  constructor(x, y, radius = 60) {
    super(x, y);
    this.home = createVector(x, y);
    this.r = radius;
    this.entryRadius = radius * 0.85;
    this.maxSpeed = 0.2;
    this.maxForce = 0.05;
    this.color = "#FFC107";
    this.status = "ATTENTE"; // "ATTENTE", "LARGAGE", "CHARGEMENT", "DISPONIBLE"
    this.pulsePhase = 0;
  }

  // Maintien stationnaire de la zone d'atterrissage via steering arrive
  applyBehaviors() {
    let steer = this.arrive(this.home);
    this.applyForce(steer);
  }

  // Vérifie si un camion ou un hélicoptère est sur la zone
  contains(entity) {
    if (!entity || !entity.pos) return false;
    return this.pos.dist(entity.pos) < this.entryRadius;
  }

  show() {
    this.pulsePhase += 0.05;
    let pulse = sin(this.pulsePhase) * 4;

    push();
    translate(this.pos.x, this.pos.y);

    // 1. Cercle extérieur de balisage lumineux au sol
    noFill();
    stroke(255, 193, 7, 60);
    strokeWeight(6);
    circle(0, 0, this.r * 2 + 16 + pulse);

    // 2. Dalle béton de l'héliport
    fill(33, 38, 45);
    stroke(255, 193, 7);
    strokeWeight(2.5);
    circle(0, 0, this.r * 2);

    // 3. Anneau de marquage intérieur jaune
    stroke(255, 193, 7, 200);
    strokeWeight(2);
    circle(0, 0, this.r * 1.4);

    // 4. Balises lumineuses périmétriques (4 feux d'approche)
    for (let a = 0; a < TWO_PI; a += HALF_PI / 2) {
      let lx = cos(a) * (this.r - 4);
      let ly = sin(a) * (this.r - 4);
      noStroke();
      fill(255, 235, 59, 220);
      circle(lx, ly, 4);
    }

    // 5. Grand "H" d'atterrissage central
    fill(255, 193, 7);
    noStroke();
    rectMode(CENTER);
    rect(-12, 0, 6, 32, 2); // Barre gauche
    rect(12, 0, 6, 32, 2);  // Barre droite
    rect(0, 0, 24, 6, 2);   // Barre transversale

    // 6. Label de statut au sol
    fill(255, 255, 255, 200);
    textAlign(CENTER, CENTER);
    textSize(9);
    textStyle(BOLD);
    text(`HÉLIPORT • ${this.status}`, 0, this.r + 14);

    pop();
  }
}
