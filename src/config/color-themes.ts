export type ColorTheme =
  | 'indigo'
  | 'emerald'
  | 'cyan'
  | 'violet'
  | 'rose'
  | 'orange'
  | 'amber'
  | 'slate'

export interface ColorThemeMeta {
  id: ColorTheme
  swatch: string
}

export const COLOR_THEMES: ColorThemeMeta[] = [
  { id: 'indigo', swatch: '#607cd2' },
  { id: 'emerald', swatch: '#2f9e6d' },
  { id: 'cyan', swatch: '#0e8f9e' },
  { id: 'violet', swatch: '#7c5cbf' },
  { id: 'rose', swatch: '#c4496a' },
  { id: 'orange', swatch: '#d4783c' },
  { id: 'amber', swatch: '#c4922a' },
  { id: 'slate', swatch: '#5b6570' },
]

export default COLOR_THEMES
