import MD_PLUGINS from '@/config/md-plugins'
import PAGE_THEMES from '@/config/page-themes'
import COLOR_THEMES, { type ColorTheme } from '@/config/color-themes'
import i18n from '@/config/i18n'

export type SideTab = 'files' | 'outline' | 'history'

export interface HistoryItem {
  url: string
  title: string
  folder: string
  visitedAt: number
}

export interface Data {
  enable?: boolean
  refresh?: boolean
  language?: string
  centered?: boolean
  mdPlugins?: typeof MD_PLUGINS
  pageTheme?: typeof PAGE_THEMES[0]
  colorTheme?: ColorTheme
  hiddenSide?: boolean
  sideTab?: SideTab
  visitHistory?: HistoryItem[]
}

export function getDefaultData(mergeData: Data = {}): Data {
  return {
    enable: true,
    refresh: false,
    centered: true,
    hiddenSide: false,
    language: i18n().locale,
    mdPlugins: [...MD_PLUGINS],
    pageTheme: PAGE_THEMES[0],
    colorTheme: COLOR_THEMES[0].id,
    sideTab: 'files',
    visitHistory: [],
    ...mergeData,
  }
}
