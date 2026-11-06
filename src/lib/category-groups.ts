import type { Category } from './store'
import { getDefaultCategoryGroup, type CategoryGroup } from './constants'

export function buildCategoryGroupMap(categories: Category[]) {
  const map = new Map<string, CategoryGroup>()

  categories.forEach((category) => {
    if (category.type === 'expense') {
      map.set(
        category.name,
        category.group ?? getDefaultCategoryGroup(category.name, 'expense')
      )
    }
  })

  return map
}

export function getCategoryGroupFromMap(
  categoryName: string,
  map: Map<string, CategoryGroup>
): CategoryGroup {
  return map.get(categoryName) ?? getDefaultCategoryGroup(categoryName, 'expense')
}
