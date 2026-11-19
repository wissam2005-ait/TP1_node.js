// Repository des inspections, en mémoire.

export function createMemoryInspectionsRepository(initialInspections = []) {
  const inspections = [...initialInspections];

  return {
    // Les inspections d'une ruche, de la plus récente à la plus ancienne.
    async findByHive(hiveId) {
      return inspections
        .filter((i) => i.hive_id === hiveId)
        .sort((a, b) => Date.parse(b.inspected_at) - Date.parse(a.inspected_at));
    },

    async findById(id) {
      return inspections.find((i) => i.id === id) ?? null;
    },

    async add(inspection) {
      inspections.push(inspection);
      return inspection;
    },
  };
}