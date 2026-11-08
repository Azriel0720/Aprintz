const hiddenCategorySlugs = new Set(['large-format', 'offset-printing']);
const hiddenCategoryNames = new Set(['large format', 'offset printing']);

export function isHiddenPublicCategory(slug?: string | null, name?: string | null) {
  return hiddenCategorySlugs.has(slug?.trim().toLowerCase() ?? '')
    || hiddenCategoryNames.has(name?.trim().toLowerCase() ?? '');
}
