export type Locale = 'en' | 'tr'

export const DEFAULT_LOCALE: Locale = 'en'

export const LOCALES: Record<Locale, { label: string; nativeLabel: string }> = {
  en: { label: 'English', nativeLabel: 'English' },
  tr: { label: 'Turkish', nativeLabel: 'Türkçe' },
}

export function isLocale(v: unknown): v is Locale {
  return v === 'en' || v === 'tr'
}

export interface Dict {
  menu: {
    file: string
    settings: string
    documents: string
    themeSection: string
    languageSection: string
  }
  actions: {
    newDocument: string
    openFromDisk: string
    importFile: string
    saveToDisk: string
    unlinkDisk: string
    downloadMd: string
    backupExport: string
    backupImport: string
    exportHtml: string
    exportPdf: string
    deleteDocument: string
  }
  keywords: {
    newDocument: string
    open: string
    save: string
    unlink: string
    download: string
    backupExport: string
    backupImport: string
    exportHtml: string
    exportPdf: string
    delete: string
    theme: string
    language: string
    openSwitch: string
  }
  confirm: {
    deleteActive: (title: string) => string
    deleteOther: (title: string) => string
    importDone: (imported: number, skipped: number) => string
    importInvalid: string
  }
  theme: {
    light: { label: string; description: string }
    dark: { label: string; description: string }
    prefix: string
  }
  palette: {
    placeholder: string
    empty: string
    buttonLabel: string
    buttonTooltip: (mod: string) => string
    sectionLabel: {
      action: string
      theme: string
      language: string
      document: string
    }
    footer: {
      navigate: string
      run: string
      toggle: string
      esc: string
    }
  }
  documentsMenu: {
    searchPlaceholder: string
    empty: string
    linkedHint: string
    agoSuffix: string
  }
  status: {
    ready: string
    saving: string
    editing: string
    saved: string
    savedAgo: (s: number) => string
    saveFailed: string
    syncedToDisk: string
    words: string
    chars: string
  }
  page: {
    loading: string
    notFound: string
    diskChip: string
  }
}

const en: Dict = {
  menu: {
    file: 'File',
    settings: 'Settings',
    documents: 'Documents',
    themeSection: 'Theme',
    languageSection: 'Language',
  },
  actions: {
    newDocument: 'New document',
    openFromDisk: 'Open from disk…',
    importFile: 'Import file…',
    saveToDisk: 'Save to disk…',
    unlinkDisk: 'Unlink disk file',
    downloadMd: 'Download .md',
    backupExport: 'Export backup…',
    backupImport: 'Import backup…',
    exportHtml: 'Export HTML',
    exportPdf: 'Export PDF (Print)',
    deleteDocument: 'Delete this document',
  },
  keywords: {
    newDocument: 'create blank new',
    open: 'open import upload disk file',
    save: 'save disk file link',
    unlink: 'unlink disconnect disk',
    download: 'export markdown download',
    backupExport: 'backup export json all documents',
    backupImport: 'backup import restore json',
    exportHtml: 'export html download',
    exportPdf: 'export pdf print',
    delete: 'delete remove trash',
    theme: 'theme appearance',
    language: 'language locale english turkish',
    openSwitch: 'open switch document',
  },
  confirm: {
    deleteActive: (t) => `Delete "${t}"? This cannot be undone.`,
    deleteOther: (t) => `Delete "${t}"?`,
    importDone: (i, s) => `Imported ${i} document(s). ${s} already existed and were skipped.`,
    importInvalid: 'This file is not a valid Typemono backup.',
  },
  theme: {
    light: { label: 'Light', description: 'Clean serif (Typora-like)' },
    dark: { label: 'Dark', description: 'Serif on deep background' },
    prefix: 'Theme',
  },
  palette: {
    placeholder: 'Search documents and actions…',
    empty: 'No matches.',
    buttonLabel: 'Search…',
    buttonTooltip: (mod) => `Search (${mod}+K)`,
    sectionLabel: {
      action: 'Actions',
      theme: 'Theme',
      language: 'Language',
      document: 'Documents',
    },
    footer: {
      navigate: 'navigate',
      run: 'run',
      toggle: 'toggle',
      esc: 'Esc',
    },
  },
  documentsMenu: {
    searchPlaceholder: 'Search documents…',
    empty: 'No documents match.',
    linkedHint: 'Linked to disk',
    agoSuffix: 'ago',
  },
  status: {
    ready: 'Ready',
    saving: 'Saving…',
    editing: 'Editing',
    saved: 'Saved',
    savedAgo: (s) => `Saved ${s}s ago`,
    saveFailed: 'Save failed',
    syncedToDisk: '· synced to disk',
    words: 'words',
    chars: 'chars',
  },
  page: {
    loading: 'Loading…',
    notFound: 'Document not found.',
    diskChip: 'Disk',
  },
}

const tr: Dict = {
  menu: {
    file: 'Dosya',
    settings: 'Ayarlar',
    documents: 'Belgeler',
    themeSection: 'Tema',
    languageSection: 'Dil',
  },
  actions: {
    newDocument: 'Yeni belge',
    openFromDisk: 'Diskten aç…',
    importFile: 'Dosya içe aktar…',
    saveToDisk: 'Diske kaydet…',
    unlinkDisk: 'Disk bağlantısını kaldır',
    downloadMd: '.md indir',
    backupExport: 'Yedek dışa aktar…',
    backupImport: 'Yedek içe aktar…',
    exportHtml: 'HTML olarak aktar',
    exportPdf: 'PDF olarak aktar (Yazdır)',
    deleteDocument: 'Bu belgeyi sil',
  },
  keywords: {
    newDocument: 'yeni oluştur boş',
    open: 'aç içe aktar yükle disk dosya',
    save: 'kaydet disk dosya bağla',
    unlink: 'bağlantıyı kaldır ayır disk',
    download: 'dışa markdown indir',
    backupExport: 'yedek dışa aktar json tüm belgeler',
    backupImport: 'yedek içe aktar geri yükle json',
    exportHtml: 'dışa html indir',
    exportPdf: 'dışa pdf yazdır',
    delete: 'sil kaldır çöp',
    theme: 'tema görünüm',
    language: 'dil yerel ingilizce türkçe',
    openSwitch: 'aç geçiş belge',
  },
  confirm: {
    deleteActive: (t) => `"${t}" silinsin mi? Bu işlem geri alınamaz.`,
    deleteOther: (t) => `"${t}" silinsin mi?`,
    importDone: (i, s) => `${i} belge içe aktarıldı. ${s} belge zaten mevcut olduğundan atlandı.`,
    importInvalid: 'Bu dosya geçerli bir Typemono yedeği değil.',
  },
  theme: {
    light: { label: 'Açık', description: 'Zarif serif (Typora benzeri)' },
    dark: { label: 'Koyu', description: 'Koyu zemin üstünde serif' },
    prefix: 'Tema',
  },
  palette: {
    placeholder: 'Belgelerde ve komutlarda ara…',
    empty: 'Eşleşme yok.',
    buttonLabel: 'Ara…',
    buttonTooltip: (mod) => `Ara (${mod}+K)`,
    sectionLabel: {
      action: 'Eylemler',
      theme: 'Tema',
      language: 'Dil',
      document: 'Belgeler',
    },
    footer: {
      navigate: 'gezin',
      run: 'çalıştır',
      toggle: 'aç/kapat',
      esc: 'Esc',
    },
  },
  documentsMenu: {
    searchPlaceholder: 'Belgelerde ara…',
    empty: 'Eşleşen belge yok.',
    linkedHint: 'Diskle bağlı',
    agoSuffix: 'önce',
  },
  status: {
    ready: 'Hazır',
    saving: 'Kaydediliyor…',
    editing: 'Düzenleniyor',
    saved: 'Kaydedildi',
    savedAgo: (s) => `${s} sn önce kaydedildi`,
    saveFailed: 'Kayıt başarısız',
    syncedToDisk: '· diskle eşlendi',
    words: 'kelime',
    chars: 'karakter',
  },
  page: {
    loading: 'Yükleniyor…',
    notFound: 'Belge bulunamadı.',
    diskChip: 'Disk',
  },
}

export const DICTS: Record<Locale, Dict> = { en, tr }

export function getDict(locale: Locale): Dict {
  return DICTS[locale] ?? DICTS[DEFAULT_LOCALE]
}
