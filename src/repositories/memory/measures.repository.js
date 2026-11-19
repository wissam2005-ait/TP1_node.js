// Repository des mesures, en mémoire.

export function createMemoryMeasuresRepository(initialMeasures = []) {
  const measures = [...initialMeasures];

  return {
    // Les mesures d'une ruche, de la plus récente à la plus ancienne, page par page.
    async findByHive(hiveId, { limit, offset }) {
      return measures
        .filter((m) => m.hive_id === hiveId)
        .sort((a, b) => Date.parse(b.timestamp) - Date.parse(a.timestamp))
        .slice(offset, offset + limit);
    },

    async add(measure) {
      measures.push(measure);
      return measure;
    },
  };
}