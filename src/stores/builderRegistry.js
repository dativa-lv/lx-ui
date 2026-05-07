const map = new Map();

export const builderRegistry = {
  register(entry) {
    map.set(entry.id, entry);
  },

  update(id, patch) {
    const current = map.get(id);
    if (!current) return;
    Object.assign(current, patch);
  },

  unregister(id) {
    map.delete(id);
  },

  get(id) {
    return map.get(id);
  },

  all() {
    return map;
  },
};
