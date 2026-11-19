// Test d'une règle métier, sans serveur ni base de données.
// Lancement : npm test (= node --test)

import { test } from "node:test";
import assert from "node:assert/strict";
import { createMeasuresService } from "../src/services/measures.service.js";
import { ValidationError } from "../src/errors.js";

// Un faux repository : il garde dans "added" tout ce qu'on lui donne.
function createFakeMeasuresRepository() {
  return {
    added: [],
    async add(measure) {
      this.added.push(measure);
      return measure;
    },
    async findByHive() {
      return [];
    },
  };
}

// Un faux service des ruches : la ruche existe toujours.
const fakeHivesService = {
  async getHive(id) {
    return { id, site_id: "SN-CASA", status: "active" };
  },
};

// Une mesure valide, qu'on modifie champ par champ dans chaque test.
const validMeasure = {
  hive_id: "SN-CASA-001",
  timestamp: "2026-10-31T10:00:00Z",
  weight_kg: 36.84,
  temp_internal_c: 34.4,
  humidity_pct: 64,
  battery_pct: 88,
};

test("refuse un poids hors de sa plage physique", async () => {
  // Préparer : un faux repository qui garde ce qu'on lui donne, injecté dans le service
  const measuresRepository = createFakeMeasuresRepository();
  const service = createMeasuresService({ hivesService: fakeHivesService, measuresRepository });

  // Agir : ajouter une mesure de 500 kg
  const ajout = service.addMeasure("SN-CASA-001", { ...validMeasure, weight_kg: 500 });

  // Vérifier : une ValidationError est levée, et rien n'est enregistré
  await assert.rejects(ajout, ValidationError);
  assert.equal(measuresRepository.added.length, 0);
});

test("enregistre une mesure valide", async () => {
  // Préparer
  const measuresRepository = createFakeMeasuresRepository();
  const service = createMeasuresService({ hivesService: fakeHivesService, measuresRepository });

  // Agir
  const measure = await service.addMeasure("SN-CASA-001", validMeasure);

  // Vérifier : la mesure est enregistrée une fois, avec le site de la ruche
  assert.equal(measuresRepository.added.length, 1);
  assert.equal(measure.site_id, "SN-CASA");
  assert.equal(measure.weight_kg, 36.84);
});