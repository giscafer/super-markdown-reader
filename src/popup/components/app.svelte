<script lang="ts">
  import storage from '@/core/storage'
  import Warning from './warning.svelte'
  import Header from './header.svelte'
  import Radio from '@smui/radio'
  import Switch from '@smui/switch'
  import FormField from '@smui/form-field'
  import Select, { Option } from '@smui/select'
  import Chip, { Set, Text } from '@smui/chips'
  import MD_PLUGINS from '@/config/md-plugins'
  import PAGE_THEMES from '@/config/page-themes'
  import COLOR_THEMES from '@/config/color-themes'
  import { getDefaultData, type Data, type HistoryItem } from '@/core/data'
  import { clearHistory, historyLabels, normalizeHistory } from '@/core/history'
  import { listDirectory } from '@/core/folder'
  import type { FolderEntry } from '@/core/folder'
  import pkg from '../../../package.json'
  import i18n from '@/config/i18n'

  let localize = i18n()
  let homepage = pkg.homepage
  let isAllowViewFile = true
  let data = getDefaultData()
  let expandedFolder = ''
  let folderEntries: FolderEntry[] = []
  let folderLoading = false
  let folderError = ''

  // Get if file allowed access
  chrome.extension.isAllowedFileSchemeAccess(
    (isAllow: boolean) => (isAllowViewFile = !!isAllow),
  )

  storage.get().then((_data: Data) => {
    // need an assignment to updata UI
    data = {
      ...data,
      ..._data,
      visitHistory: normalizeHistory(_data.visitHistory || []),
    }
  })

  $: if (data.language) {
    updateConfig('language', data.language)
    changeLocale(data.language)
  }

  $: currentSwatch =
    COLOR_THEMES.find(theme => theme.id === data.colorTheme)?.swatch ||
    COLOR_THEMES[0].swatch

  function updateConfig(key, value) {
    setTimeout(() => {
      chrome.runtime.sendMessage({ action: 'storage', data: { key, value } })
    }, 0)
  }

  function changeLocale(language) {
    localize = i18n(language)
  }

  function openUrl(url: string) {
    chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
      if (tabs[0]?.id) {
        chrome.tabs.update(tabs[0].id, { url })
      }
    })
  }

  async function onClearHistory() {
    await clearHistory()
    data = { ...data, visitHistory: [] }
    expandedFolder = ''
    folderEntries = []
  }

  function loadFolderEntries(url: string) {
    folderLoading = true
    folderEntries = []
    folderError = ''
    chrome.runtime.sendMessage(
      { action: 'listDir', data: { url } },
      async res => {
        let result = res
        const lastError = chrome.runtime.lastError
        if (
          (lastError || !result || result.error) &&
          result?.error !== 'file_access'
        ) {
          try {
            result = await listDirectory(url)
          } catch (error) {
            result = { dir: url, entries: [], error: String(error) }
          }
        }
        folderLoading = false
        folderEntries = (result && result.entries) || []
        folderError = folderEntries.length ? '' : (result && result.error) || ''
      },
    )
  }

  function toggleFolder(item: HistoryItem) {
    if (expandedFolder === item.folder) {
      expandedFolder = ''
      folderEntries = []
      return
    }
    expandedFolder = item.folder
    loadFolderEntries(item.folder)
  }
</script>

<main style="--mdc-theme-primary: {currentSwatch}; --mdc-theme-secondary: {currentSwatch}">
  <Header {homepage} />

  {#if !isAllowViewFile}
    <Warning {localize} />
  {/if}

  <div class="form" disabled={!data.enable}>
    <div class="form-item inline">
      <span class="label-item">{localize('label_enable')}:</span>
      <FormField align="end">
        <Switch
          bind:checked={data.enable}
          color="primary"
          on:change={() => updateConfig('enable', data.enable)}
        />
      </FormField>
    </div>

    <div class="form-item inline">
      <span class="label-item">{localize('label_centered')}:</span>
      <FormField align="end">
        <Switch
          disabled={!data.enable}
          bind:checked={data.centered}
          color="primary"
          on:change={() => updateConfig('centered', data.centered)}
        />
      </FormField>
    </div>

    <div class="form-item inline">
      <span class="label-item">{localize('label_auto-refresh')}:</span>
      <FormField align="end">
        <Switch
          disabled={!data.enable}
          bind:checked={data.refresh}
          color="primary"
          on:change={() => updateConfig('refresh', data.refresh)}
        />
      </FormField>
    </div>

    <div class="form-item">
      <div class="label-item">{localize('label_md-plugins')}:</div>
      <Set
        let:chip
        bind:selected={data.mdPlugins}
        chips={MD_PLUGINS}
        nonInteractive={!data.enable}
        filter={data.enable}
      >
        <Chip
          {chip}
          title={chip}
          on:click={() =>
            data.enable && updateConfig('mdPlugins', data.mdPlugins)}
          ><Text>{localize(chip)}</Text></Chip
        >
      </Set>
    </div>

    <div class="form-item">
      <div class="label-item">{localize('label_theme')}:</div>
      {#each PAGE_THEMES as mode}
        <FormField>
          <span slot="label"> {localize(mode)} </span>
          <Radio
            disabled={!data.enable}
            bind:group={data.pageTheme}
            bind:value={mode}
            on:change={() => updateConfig('pageTheme', mode)}
          />
        </FormField>
      {/each}
    </div>

    <div class="form-item">
      <div class="label-item">{localize('label_color')}:</div>
      <div class="color-swatches">
        {#each COLOR_THEMES as theme}
          <button
            type="button"
            class="swatch"
            class:active={data.colorTheme === theme.id}
            disabled={!data.enable}
            title={localize(`color_${theme.id}`)}
            style="background:{theme.swatch};color:{theme.swatch}"
            on:click={() => {
              data.colorTheme = theme.id
              updateConfig('colorTheme', theme.id)
            }}
          />
        {/each}
      </div>
    </div>

    <div class="form-item">
      <div class="label-item">{localize('label_language')}:</div>
      <FormField style="padding-left: 10px">
        <Select bind:value={data.language}>
          {#each i18n.locales as locale}
            <Option value={locale}>{localize(locale)}</Option>
          {/each}
        </Select>
      </FormField>
    </div>

    <div class="form-item history">
      <div class="history-head">
        <span class="label-item">{localize('label_history')}</span>
        {#if data.visitHistory && data.visitHistory.length}
          <button type="button" class="clear-btn" on:click={onClearHistory}>
            {localize('history_clear')}
          </button>
        {/if}
      </div>
      {#if !data.visitHistory || !data.visitHistory.length}
        <p class="empty">{localize('history_empty')}</p>
      {:else}
        <ul class="history-list">
          {#each data.visitHistory.slice(0, 12) as item}
            <li class="history-item">
              <button
                type="button"
                class="history-link"
                title={item.url}
                on:click={() => openUrl(item.url)}
              >
                <span class="history-name">{historyLabels(item).title}</span>
                <span class="history-path">{historyLabels(item).folder}</span>
              </button>
              <button
                type="button"
                class="folder-btn"
                class:active={expandedFolder === item.folder}
                title={localize('history_open_folder')}
                on:click={() => toggleFolder(item)}
              >
                {localize('history_open_folder')}
              </button>
              {#if expandedFolder === item.folder}
                <div class="folder-files">
                  {#if folderLoading}
                    <p class="empty">{localize('side_loading')}</p>
                  {:else if folderError}
                    <p class="empty">
                      {localize(
                        folderError === 'file_access'
                          ? 'side_file_access'
                          : 'side_list_error',
                      )}
                    </p>
                  {:else if !folderEntries.length}
                    <p class="empty">{localize('side_empty_files')}</p>
                  {:else}
                    {#each folderEntries as entry}
                      <button
                        type="button"
                        class="folder-file"
                        on:click={() =>
                          entry.type === 'file'
                            ? openUrl(entry.url)
                            : loadFolderEntries(entry.url)}
                      >
                        {entry.type === 'dir' ? `${entry.name}/` : entry.name}
                      </button>
                    {/each}
                  {/if}
                </div>
              {/if}
            </li>
          {/each}
        </ul>
      {/if}
    </div>
  </div>
</main>

<style>
  main {
    overflow: auto;
    box-sizing: border-box;
    width: 360px;
    max-height: 599px;
    padding: 22px 24px 10px;
    border: 1px solid #24315870;
    border-radius: 1px;
  }
  .form-item {
    margin-bottom: 6px;
  }
  .form-item.inline {
    display: flex;
    justify-content: space-between;
    margin-bottom: 15px;
  }
  .label-item {
    font-weight: bolder;
    font-size: 13px;
    color: #243158e3;
  }
  .color-swatches {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    padding: 8px 0 4px;
  }
  .swatch {
    width: 22px;
    height: 22px;
    padding: 0;
    border: 2px solid #fff;
    border-radius: 50%;
    box-shadow: 0 0 0 1px rgba(36, 49, 88, 0.25);
    cursor: pointer;
  }
  .swatch.active {
    box-shadow: 0 0 0 2px #fff, 0 0 0 4px currentColor;
  }
  .swatch:disabled {
    opacity: 0.4;
    cursor: default;
  }
  .history {
    margin-top: 12px;
    padding-top: 10px;
    border-top: 1px solid #e6e8ef;
  }
  .history-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 8px;
  }
  .clear-btn,
  .folder-btn {
    padding: 0;
    border: none;
    background: none;
    font-size: 12px;
    color: var(--mdc-theme-primary);
    cursor: pointer;
  }
  .empty {
    margin: 0 0 8px;
    font-size: 12px;
    color: #7a8194;
  }
  .history-list {
    margin: 0;
    padding: 0;
    list-style: none;
  }
  .history-item {
    margin-bottom: 6px;
  }
  .history-link {
    display: flex;
    flex-direction: column;
    gap: 2px;
    width: 100%;
    padding: 6px 0;
    border: none;
    background: none;
    text-align: left;
    cursor: pointer;
  }
  .history-name {
    overflow: hidden;
    font-size: 13px;
    color: #243158e3;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .history-path {
    overflow: hidden;
    font-size: 11px;
    color: #7a8194;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .folder-btn {
    margin-bottom: 4px;
  }
  .folder-btn.active {
    font-weight: 600;
  }
  .folder-files {
    display: flex;
    flex-direction: column;
    gap: 2px;
    padding: 4px 0 8px 8px;
    border-left: 2px solid #e6e8ef;
  }
  .folder-file {
    overflow: hidden;
    padding: 4px 0;
    border: none;
    background: none;
    font-size: 12px;
    color: #243158e3;
    text-align: left;
    text-overflow: ellipsis;
    white-space: nowrap;
    cursor: pointer;
  }
  .folder-file:hover,
  .history-link:hover .history-name {
    color: var(--mdc-theme-primary);
  }
</style>
