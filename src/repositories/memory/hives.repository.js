// Repository des ruches, en mémoire. Sa seule question : comment lire et écrire les données ?
// Les méthodes sont async : demain, le repository PostgreSQL aura la même forme.

export function createMemoryHivesRepository(initialHives = []) {
  const hives = [...initialHives];

  return {
    async findAll({ siteId } = {}) {
      if (siteId === undefined) return [...hives];
      return hives.filter((h) => h.site_id === siteId);
    },

    async findById(id) {
      return hives.find((h) => h.id === id) ?? null;
    },
  };
}