// Classe Garage : sous-classe de Vehicle
// Représente l'objectif que les camions cherchent à atteindre pour décharger
class Garage extends Vehicle {
  constructor(x, y, w = 130, h = 95) {
    super(x, y);
    this.w = w;
    this.h = h;
    this.r = Math.max(w, h) / 2;
    this.entryRadius = 50;
    this.home = createVector(x, y);
    this.maxSpeed = 0.2;
    this.maxForce = 0.05;
    this.deliveredCount = 0;
    this.color = "#FFB300";
  }

  // Comportement de maintien en position
  applyBehaviors() {
    let steer = this.arrive(this.home);
    this.applyForce(steer);
  }

  // Vérifie si un véhicule est entré dans la zone de déchargement du garage
  contains(vehicle) {
    if (!vehicle || !vehicle.pos) return false;
    let d = this.pos.dist(vehicle.pos);
    return d < this.entryRadius;
  }

  show() {
    push();
    translate(this.pos.x, this.pos.y);

    // Halo d'attraction / zone d'accueil
    noStroke();
    fill(255, 179, 0, 35);
    circle(0, 0, this.entryRadius * 2.4);

    // Bâtiment principal (rectangle centré)
    rectMode(CENTER);

    // Ombre portée
    fill(0, 0, 0, 80);
    rect(4, 6, this.w, this.h, 10);

    // Murs du hangar
    fill(38, 50, 56);
    stroke(255, 179, 0);
    strokeWeight(2.5);
    rect(0, 0, this.w, this.h, 8);

    // Bandes de signalisation chantier au sol (jaune / noir)
    push();
    strokeWeight(3);
    for (let lx = -this.w / 2 + 10; lx < this.w / 2; lx += 16) {
      stroke(255, 193, 7, 200);
      line(lx, this.h / 2 - 8, lx + 8, this.h / 2 - 2);
    }
    pop();

    // Porte de garage ouverte (baie sombre avec rampe)
    fill(20, 24, 28);
    stroke(255, 179, 0, 180);
    strokeWeight(1.5);
    rect(0, 6, this.w * 0.65, this.h * 0.55, 4);

    // Grille de quai de chargement
    stroke(255, 179, 0, 60);
    strokeWeight(1);
    for (let gy = -4; gy <= 20; gy += 6) {
      line(-this.w * 0.28, gy, this.w * 0.28, gy);
    }

    // Enseigne lumineuse "GARAGE"
    noStroke();
    fill(255, 179, 0);
    textAlign(CENTER, CENTER);
    textSize(11);
    textStyle(BOLD);
    text("GARAGE", 0, -this.h / 2 + 14);

    // Compteur de livraisons
    fill(129, 199, 132);
    textSize(9);
    text(`LIVRÉS : ${this.deliveredCount}`, 0, this.h / 2 + 14);

    pop();
  }
}
