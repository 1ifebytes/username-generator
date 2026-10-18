/**
 * i18n Manager Module
 * Manages internationalization for all supported UI languages.
 */
const I18nManager = (function() {
    const LANGUAGE_KEY = 'languagePreference';
    let currentLanguage = 'en';
    let storage = null;

    // Native display names, in the order shown in the language selector.
    const LANGUAGE_NAMES = {
        'en': 'English',
        'zh': '简体中文',
        'zh-TW': '繁體中文',
        'ja': '日本語',
        'ko': '한국어',
        'es': 'Español',
        'fr': 'Français',
        'de': 'Deutsch'
    };

    // Translation dictionaries
    const translations = {
        en: {
            'app.title': 'Username Generator',
            'app.subtitle': 'Chrome Extension',
            'app.description': 'Customize a readable username, sync length controls, and copy with one click.',
            'quick.moreOptions': 'More options & history →',
            'quick.mode': 'Mode',
            'quick.length': 'Length',
            'quick.autoCopy': 'Auto-copy',
            'preset.label': 'Quick presets',
            'history.exportJson': 'Export JSON',
            'alert.exportSuccess': 'Exported {count} usernames.',
            'history.importJson': 'Import JSON',
            'alert.importSuccess': 'Imported {count} usernames.',
            'alert.importFailed': 'Import failed: {reason}',
            'preset.gaming': 'Gaming ID',
            'preset.gaming.tooltip': 'Letters and numbers, no symbols, no ambiguous characters',
            'preset.social': 'Social handle',
            'preset.social.tooltip': 'Lowercase and numbers, easy to read',
            'preset.word': 'Readable word',
            'preset.word.tooltip': 'Pronounceable letters only',
            'preset.strong': 'Strong',
            'preset.strong.tooltip': 'All characters, 16 long',
            'batch.generate': 'Generate 10',
            'quick.hint.enter': 'Enter to generate',
            'quick.hint.copy': 'Ctrl+C to copy',
            'history.generateOne': 'Generate one',
            'customize.title': 'Customize your username',
            'mode.easyToSay': 'Easy to say',
            'mode.easyToRead': 'Easy to read',
            'mode.allCharacters': 'All characters',
            'mode.easyToSay.tooltip': 'Avoid numbers and special characters',
            'mode.easyToRead.tooltip': 'Avoid ambiguous characters like I, l, 1, O, 0, S, 5, B, 8, Z, and 2',
            'mode.allCharacters.tooltip': 'Any character combinations like !, 7, h, K, and l1',
            'char.uppercase': 'Uppercase',
            'char.lowercase': 'Lowercase',
            'char.numbers': 'Numbers',
            'char.symbols': 'Symbols',
            'length.label': 'Username Length',
            'button.generate': 'Generate Username',
            'button.copy': 'Copy Username',
            'a11y.copy': 'Copy username',
            'history.title': 'History',
            'history.subtitle': 'Recent usernames',
            'history.clear': 'Clear all',
            'history.loadMore': 'Load more',
            'history.export': 'Export CSV',
            'history.search': 'Search history...',
            'history.clearSearch': 'Clear search',
            'history.empty': 'No usernames yet. Generate one to get started.',
            'favorites.title': 'Favorites',
            'favorites.subtitle': 'Saved usernames',
            'favorites.empty': 'No favorites yet. Star a username to save it.',
            'favorites.favorited': 'Favorited',
            'theme.system': 'System',
            'theme.light': 'Light',
            'theme.dark': 'Dark',
            'alert.copySuccess': 'Username copied to clipboard!',
            'alert.copyFailed': 'Copy failed. Please try again.',
            'alert.noHistory': 'No history to export.',
            'alert.favoritesCleared': 'All favorites cleared.',
            'confirm.clearFavorites': 'Are you sure you want to clear all favorites?',
            'shortcut.generated': 'Generated!',
            'shortcut.copied': 'Copied!'
        },
        zh: {
            'app.title': '用户名生成器',
            'app.subtitle': 'Chrome 扩展',
            'app.description': '自定义可读用户名，同步长度控制，一键复制。',
            'quick.moreOptions': '更多选项与历史 →',
            'quick.mode': '模式',
            'quick.length': '长度',
            'quick.autoCopy': '自动复制',
            'preset.label': '快速预设',
            'history.exportJson': '导出 JSON',
            'alert.exportSuccess': '已导出 {count} 条用户名。',
            'history.importJson': '导入 JSON',
            'alert.importSuccess': '已导入 {count} 条用户名。',
            'alert.importFailed': '导入失败：{reason}',
            'preset.gaming': '游戏 ID',
            'preset.gaming.tooltip': '字母加数字，不含符号与易混字符',
            'preset.social': '社交账号',
            'preset.social.tooltip': '小写加数字，易于阅读',
            'preset.word': '易读单词',
            'preset.word.tooltip': '仅易发音字母',
            'preset.strong': '高强度',
            'preset.strong.tooltip': '全部字符，长度 16',
            'batch.generate': '生成 10 个',
            'quick.hint.enter': 'Enter 生成',
            'quick.hint.copy': 'Ctrl+C 复制',
            'history.generateOne': '生成一个',
            'customize.title': '自定义您的用户名',
            'mode.easyToSay': '易于发音',
            'mode.easyToRead': '易于阅读',
            'mode.allCharacters': '全部字符',
            'mode.easyToSay.tooltip': '避免数字和特殊字符',
            'mode.easyToRead.tooltip': '避免易混淆字符，如 I、l、1、O、0、S、5、B、8、Z 和 2',
            'mode.allCharacters.tooltip': '任何字符组合，如 !、7、h、K 和 l1',
            'char.uppercase': '大写',
            'char.lowercase': '小写',
            'char.numbers': '数字',
            'char.symbols': '符号',
            'length.label': '用户名长度',
            'button.generate': '生成用户名',
            'button.copy': '复制用户名',
            'a11y.copy': '复制用户名',
            'history.title': '历史记录',
            'history.subtitle': '最近生成的用户名',
            'history.clear': '全部清空',
            'history.loadMore': '加载更多',
            'history.export': '导出 CSV',
            'history.search': '搜索历史...',
            'history.clearSearch': '清除搜索',
            'history.empty': '暂无用户名。生成一个以开始使用。',
            'favorites.title': '收藏',
            'favorites.subtitle': '已保存的用户名',
            'favorites.empty': '暂无收藏。星标用户名以保存。',
            'favorites.favorited': '已收藏',
            'theme.system': '跟随系统',
            'theme.light': '浅色',
            'theme.dark': '深色',
            'alert.copySuccess': '用户名已复制到剪贴板！',
            'alert.copyFailed': '复制失败，请重试。',
            'alert.noHistory': '没有历史记录可导出。',
            'alert.favoritesCleared': '所有收藏已清空。',
            'confirm.clearFavorites': '确定要清空所有收藏吗？',
            'shortcut.generated': '已生成！',
            'shortcut.copied': '已复制！'
        },
        'zh-TW': {
            'app.title': '使用者名稱產生器',
            'app.subtitle': 'Chrome 擴充功能',
            'app.description': '自訂易讀的使用者名稱，同步長度控制，一鍵複製。',
            'quick.moreOptions': '更多選項與歷史 →',
            'quick.mode': '模式',
            'quick.length': '長度',
            'quick.autoCopy': '自動複製',
            'preset.label': '快速預設',
            'history.exportJson': '匯出 JSON',
            'alert.exportSuccess': '已匯出 {count} 筆使用者名稱。',
            'history.importJson': '匯入 JSON',
            'alert.importSuccess': '已匯入 {count} 筆使用者名稱。',
            'alert.importFailed': '匯入失敗：{reason}',
            'preset.gaming': '遊戲 ID',
            'preset.gaming.tooltip': '字母加數字，不含符號與易混字元',
            'preset.social': '社群帳號',
            'preset.social.tooltip': '小寫加數字，易於閱讀',
            'preset.word': '易讀單字',
            'preset.word.tooltip': '僅易發音字母',
            'preset.strong': '高強度',
            'preset.strong.tooltip': '全部字元，長度 16',
            'batch.generate': '產生 10 個',
            'quick.hint.enter': 'Enter 產生',
            'quick.hint.copy': 'Ctrl+C 複製',
            'history.generateOne': '產生一個',
            'customize.title': '自訂您的使用者名稱',
            'mode.easyToSay': '易於發音',
            'mode.easyToRead': '易於閱讀',
            'mode.allCharacters': '全部字元',
            'mode.easyToSay.tooltip': '避免數字和特殊字元',
            'mode.easyToRead.tooltip': '避免易混淆字元，如 I、l、1、O、0、S、5、B、8、Z 和 2',
            'mode.allCharacters.tooltip': '任何字元組合，如 !、7、h、K 和 l1',
            'char.uppercase': '大寫',
            'char.lowercase': '小寫',
            'char.numbers': '數字',
            'char.symbols': '符號',
            'length.label': '使用者名稱長度',
            'button.generate': '產生使用者名稱',
            'button.copy': '複製使用者名稱',
            'a11y.copy': '複製使用者名稱',
            'history.title': '歷史記錄',
            'history.subtitle': '最近產生的使用者名稱',
            'history.clear': '全部清除',
            'history.loadMore': '載入更多',
            'history.export': '匯出 CSV',
            'history.search': '搜尋歷史...',
            'history.clearSearch': '清除搜尋',
            'history.empty': '尚無使用者名稱。產生一個以開始使用。',
            'favorites.title': '收藏',
            'favorites.subtitle': '已儲存的使用者名稱',
            'favorites.empty': '尚無收藏。將使用者名稱加星號以儲存。',
            'favorites.favorited': '已收藏',
            'theme.system': '跟隨系統',
            'theme.light': '淺色',
            'theme.dark': '深色',
            'alert.copySuccess': '使用者名稱已複製到剪貼簿！',
            'alert.copyFailed': '複製失敗，請再試一次。',
            'alert.noHistory': '沒有歷史記錄可匯出。',
            'alert.favoritesCleared': '所有收藏已清除。',
            'confirm.clearFavorites': '確定要清除所有收藏嗎？',
            'shortcut.generated': '已產生！',
            'shortcut.copied': '已複製！'
        },
        ja: {
            'app.title': 'ユーザー名生成ツール',
            'app.subtitle': 'Chrome拡張機能',
            'app.description': '読みやすいユーザー名をカスタマイズし、長さを同期して、ワンクリックでコピー。',
            'quick.moreOptions': 'その他のオプションと履歴 →',
            'quick.mode': 'モード',
            'quick.length': '長さ',
            'quick.autoCopy': '自動コピー',
            'preset.label': 'クイックプリセット',
            'history.exportJson': 'JSON エクスポート',
            'alert.exportSuccess': '{count} 件のユーザー名をエクスポートしました。',
            'history.importJson': 'JSON インポート',
            'alert.importSuccess': '{count} 件のユーザー名をインポートしました。',
            'alert.importFailed': 'インポートに失敗しました: {reason}',
            'preset.gaming': 'ゲーム ID',
            'preset.gaming.tooltip': '英数字のみ、記号と紛らわしい文字なし',
            'preset.social': 'SNS ハンドル',
            'preset.social.tooltip': '小文字と数字、読みやすい',
            'preset.word': '読みやすい単語',
            'preset.word.tooltip': '発音しやすい英字のみ',
            'preset.strong': '強力',
            'preset.strong.tooltip': 'すべての文字、長さ 16',
            'batch.generate': '10 個生成',
            'quick.hint.enter': 'Enter で生成',
            'quick.hint.copy': 'Ctrl+C でコピー',
            'history.generateOne': '生成する',
            'customize.title': 'ユーザー名をカスタマイズ',
            'mode.easyToSay': '発音しやすい',
            'mode.easyToRead': '読みやすい',
            'mode.allCharacters': 'すべての文字',
            'mode.easyToSay.tooltip': '数字と特殊文字を避ける',
            'mode.easyToRead.tooltip': 'I、l、1、O、0、S、5、B、8、Z、2 など紛らわしい文字を避ける',
            'mode.allCharacters.tooltip': '!、7、h、K、l1 など任意の文字の組み合わせ',
            'char.uppercase': '大文字',
            'char.lowercase': '小文字',
            'char.numbers': '数字',
            'char.symbols': '記号',
            'length.label': 'ユーザー名の長さ',
            'button.generate': 'ユーザー名を生成',
            'button.copy': 'ユーザー名をコピー',
            'a11y.copy': 'ユーザー名をコピー',
            'history.title': '履歴',
            'history.subtitle': '最近のユーザー名',
            'history.clear': 'すべてクリア',
            'history.loadMore': 'もっと見る',
            'history.export': 'CSVエクスポート',
            'history.search': '履歴を検索...',
            'history.clearSearch': '検索をクリア',
            'history.empty': 'まだユーザー名がありません。生成を始めてください。',
            'favorites.title': 'お気に入り',
            'favorites.subtitle': '保存されたユーザー名',
            'favorites.empty': 'お気に入りはまだありません。スターで保存してください。',
            'favorites.favorited': 'お気に入り済み',
            'theme.system': 'システム',
            'theme.light': 'ライト',
            'theme.dark': 'ダーク',
            'alert.copySuccess': 'ユーザー名をクリップボードにコピーしました！',
            'alert.copyFailed': 'コピーに失敗しました。もう一度お試しください。',
            'alert.noHistory': 'エクスポートする履歴がありません。',
            'alert.favoritesCleared': 'すべてのお気に入りをクリアしました。',
            'confirm.clearFavorites': 'すべてのお気に入りをクリアしてもよろしいですか？',
            'shortcut.generated': '生成しました！',
            'shortcut.copied': 'コピーしました！'
        },
        ko: {
            'app.title': '사용자 이름 생성기',
            'app.subtitle': 'Chrome 확장 프로그램',
            'app.description': '읽기 쉬운 사용자 이름을 만들고 길이를 동기화하며 한 번에 복사하세요.',
            'quick.moreOptions': '더 많은 옵션 및 기록 →',
            'quick.mode': '모드',
            'quick.length': '길이',
            'quick.autoCopy': '자동 복사',
            'preset.label': '빠른 프리셋',
            'history.exportJson': 'JSON 내보내기',
            'alert.exportSuccess': '사용자 이름 {count}개를 내보냈습니다.',
            'history.importJson': 'JSON 가져오기',
            'alert.importSuccess': '사용자 이름 {count}개를 가져왔습니다.',
            'alert.importFailed': '가져오기 실패: {reason}',
            'preset.gaming': '게임 ID',
            'preset.gaming.tooltip': '영문과 숫자만, 기호와 혼동 문자 없음',
            'preset.social': '소셜 핸들',
            'preset.social.tooltip': '소문자와 숫자, 읽기 쉬움',
            'preset.word': '읽기 쉬운 단어',
            'preset.word.tooltip': '발음하기 쉬운 영문만',
            'preset.strong': '강력',
            'preset.strong.tooltip': '모든 문자, 길이 16',
            'batch.generate': '10개 생성',
            'quick.hint.enter': 'Enter로 생성',
            'quick.hint.copy': 'Ctrl+C로 복사',
            'history.generateOne': '생성하기',
            'customize.title': '사용자 이름 사용자 지정',
            'mode.easyToSay': '발음하기 쉬움',
            'mode.easyToRead': '읽기 쉬움',
            'mode.allCharacters': '모든 문자',
            'mode.easyToSay.tooltip': '숫자와 특수 문자를 피합니다',
            'mode.easyToRead.tooltip': 'I, l, 1, O, 0, S, 5, B, 8, Z, 2처럼 혼동하기 쉬운 문자를 피합니다',
            'mode.allCharacters.tooltip': '!, 7, h, K, l1 등 모든 문자 조합',
            'char.uppercase': '대문자',
            'char.lowercase': '소문자',
            'char.numbers': '숫자',
            'char.symbols': '기호',
            'length.label': '사용자 이름 길이',
            'button.generate': '사용자 이름 생성',
            'button.copy': '사용자 이름 복사',
            'a11y.copy': '사용자 이름 복사',
            'history.title': '기록',
            'history.subtitle': '최근 사용자 이름',
            'history.clear': '모두 지우기',
            'history.loadMore': '더 보기',
            'history.export': 'CSV 내보내기',
            'history.search': '기록 검색...',
            'history.clearSearch': '검색 지우기',
            'history.empty': '아직 사용자 이름이 없습니다. 하나 생성해 보세요.',
            'favorites.title': '즐겨찾기',
            'favorites.subtitle': '저장된 사용자 이름',
            'favorites.empty': '아직 즐겨찾기가 없습니다. 별표를 눌러 저장하세요.',
            'favorites.favorited': '즐겨찾기됨',
            'theme.system': '시스템',
            'theme.light': '라이트',
            'theme.dark': '다크',
            'alert.copySuccess': '사용자 이름을 클립보드에 복사했습니다!',
            'alert.copyFailed': '복사에 실패했습니다. 다시 시도하세요.',
            'alert.noHistory': '내보낼 기록이 없습니다.',
            'alert.favoritesCleared': '모든 즐겨찾기를 지웠습니다.',
            'confirm.clearFavorites': '모든 즐겨찾기를 지우시겠습니까?',
            'shortcut.generated': '생성됨!',
            'shortcut.copied': '복사됨!'
        },
        es: {
            'app.title': 'Generador de nombres de usuario',
            'app.subtitle': 'Extensión de Chrome',
            'app.description': 'Crea un nombre de usuario legible, sincroniza la longitud y cópialo con un clic.',
            'quick.moreOptions': 'Más opciones e historial →',
            'quick.mode': 'Modo',
            'quick.length': 'Longitud',
            'quick.autoCopy': 'Copiar automáticamente',
            'preset.label': 'Ajustes rápidos',
            'history.exportJson': 'Exportar JSON',
            'alert.exportSuccess': 'Se exportaron {count} nombres.',
            'history.importJson': 'Importar JSON',
            'alert.importSuccess': 'Se importaron {count} nombres.',
            'alert.importFailed': 'Error al importar: {reason}',
            'preset.gaming': 'ID de juego',
            'preset.gaming.tooltip': 'Letras y números, sin símbolos ni caracteres ambiguos',
            'preset.social': 'Usuario social',
            'preset.social.tooltip': 'Minúsculas y números, fácil de leer',
            'preset.word': 'Palabra legible',
            'preset.word.tooltip': 'Solo letras fáciles de pronunciar',
            'preset.strong': 'Fuerte',
            'preset.strong.tooltip': 'Todos los caracteres, longitud 16',
            'batch.generate': 'Generar 10',
            'quick.hint.enter': 'Enter para generar',
            'quick.hint.copy': 'Ctrl+C para copiar',
            'history.generateOne': 'Generar uno',
            'customize.title': 'Personaliza tu nombre de usuario',
            'mode.easyToSay': 'Fácil de pronunciar',
            'mode.easyToRead': 'Fácil de leer',
            'mode.allCharacters': 'Todos los caracteres',
            'mode.easyToSay.tooltip': 'Evita números y caracteres especiales',
            'mode.easyToRead.tooltip': 'Evita caracteres ambiguos como I, l, 1, O, 0, S, 5, B, 8, Z y 2',
            'mode.allCharacters.tooltip': 'Cualquier combinación de caracteres como !, 7, h, K y l1',
            'char.uppercase': 'Mayúsculas',
            'char.lowercase': 'Minúsculas',
            'char.numbers': 'Números',
            'char.symbols': 'Símbolos',
            'length.label': 'Longitud del nombre',
            'button.generate': 'Generar nombre',
            'button.copy': 'Copiar nombre',
            'a11y.copy': 'Copiar nombre de usuario',
            'history.title': 'Historial',
            'history.subtitle': 'Nombres recientes',
            'history.clear': 'Borrar todo',
            'history.loadMore': 'Cargar más',
            'history.export': 'Exportar CSV',
            'history.search': 'Buscar en el historial...',
            'history.clearSearch': 'Borrar búsqueda',
            'history.empty': 'Aún no hay nombres. Genera uno para empezar.',
            'favorites.title': 'Favoritos',
            'favorites.subtitle': 'Nombres guardados',
            'favorites.empty': 'Aún no hay favoritos. Marca un nombre para guardarlo.',
            'favorites.favorited': 'En favoritos',
            'theme.system': 'Sistema',
            'theme.light': 'Claro',
            'theme.dark': 'Oscuro',
            'alert.copySuccess': '¡Nombre copiado al portapapeles!',
            'alert.copyFailed': 'Error al copiar. Inténtalo de nuevo.',
            'alert.noHistory': 'No hay historial para exportar.',
            'alert.favoritesCleared': 'Todos los favoritos se han borrado.',
            'confirm.clearFavorites': '¿Seguro que quieres borrar todos los favoritos?',
            'shortcut.generated': '¡Generado!',
            'shortcut.copied': '¡Copiado!'
        },
        fr: {
            'app.title': "Générateur de noms d'utilisateur",
            'app.subtitle': 'Extension Chrome',
            'app.description': 'Créez un nom d’utilisateur lisible, synchronisez la longueur et copiez en un clic.',
            'quick.moreOptions': "Plus d'options et historique →",
            'quick.mode': 'Mode',
            'quick.length': 'Longueur',
            'quick.autoCopy': 'Copie automatique',
            'preset.label': 'Préréglages',
            'history.exportJson': 'Exporter en JSON',
            'alert.exportSuccess': '{count} noms exportés.',
            'history.importJson': 'Importer un JSON',
            'alert.importSuccess': '{count} noms importés.',
            'alert.importFailed': 'Échec de l’import : {reason}',
            'preset.gaming': 'ID de jeu',
            'preset.gaming.tooltip': 'Lettres et chiffres, sans symboles ni caractères ambigus',
            'preset.social': 'Pseudo social',
            'preset.social.tooltip': 'Minuscules et chiffres, facile à lire',
            'preset.word': 'Mot lisible',
            'preset.word.tooltip': 'Lettres faciles à prononcer uniquement',
            'preset.strong': 'Fort',
            'preset.strong.tooltip': 'Tous les caractères, longueur 16',
            'batch.generate': 'En générer 10',
            'quick.hint.enter': 'Entrée pour générer',
            'quick.hint.copy': 'Ctrl+C pour copier',
            'history.generateOne': 'En générer un',
            'customize.title': 'Personnalisez votre nom d’utilisateur',
            'mode.easyToSay': 'Facile à prononcer',
            'mode.easyToRead': 'Facile à lire',
            'mode.allCharacters': 'Tous les caractères',
            'mode.easyToSay.tooltip': 'Évite les chiffres et les caractères spéciaux',
            'mode.easyToRead.tooltip': 'Évite les caractères ambigus comme I, l, 1, O, 0, S, 5, B, 8, Z et 2',
            'mode.allCharacters.tooltip': 'Toute combinaison de caractères comme !, 7, h, K et l1',
            'char.uppercase': 'Majuscules',
            'char.lowercase': 'Minuscules',
            'char.numbers': 'Chiffres',
            'char.symbols': 'Symboles',
            'length.label': 'Longueur du nom',
            'button.generate': 'Générer le nom',
            'button.copy': 'Copier le nom',
            'a11y.copy': 'Copier le nom d’utilisateur',
            'history.title': 'Historique',
            'history.subtitle': 'Noms récents',
            'history.clear': 'Tout effacer',
            'history.loadMore': 'Afficher plus',
            'history.export': 'Exporter en CSV',
            'history.search': "Rechercher dans l'historique...",
            'history.clearSearch': 'Effacer la recherche',
            'history.empty': "Aucun nom pour l'instant. Générez-en un pour commencer.",
            'favorites.title': 'Favoris',
            'favorites.subtitle': 'Noms enregistrés',
            'favorites.empty': 'Aucun favori. Ajoutez une étoile à un nom pour l’enregistrer.',
            'favorites.favorited': 'En favori',
            'theme.system': 'Système',
            'theme.light': 'Clair',
            'theme.dark': 'Sombre',
            'alert.copySuccess': 'Nom copié dans le presse-papiers !',
            'alert.copyFailed': 'Échec de la copie. Réessayez.',
            'alert.noHistory': 'Aucun historique à exporter.',
            'alert.favoritesCleared': 'Tous les favoris ont été effacés.',
            'confirm.clearFavorites': 'Voulez-vous vraiment effacer tous les favoris ?',
            'shortcut.generated': 'Généré !',
            'shortcut.copied': 'Copié !'
        },
        de: {
            'app.title': 'Benutzernamen-Generator',
            'app.subtitle': 'Chrome-Erweiterung',
            'app.description': 'Erstelle einen lesbaren Benutzernamen, synchronisiere die Länge und kopiere ihn mit einem Klick.',
            'quick.moreOptions': 'Weitere Optionen & Verlauf →',
            'quick.mode': 'Modus',
            'quick.length': 'Länge',
            'quick.autoCopy': 'Automatisch kopieren',
            'preset.label': 'Schnellvorlagen',
            'history.exportJson': 'JSON exportieren',
            'alert.exportSuccess': '{count} Benutzernamen exportiert.',
            'history.importJson': 'JSON importieren',
            'alert.importSuccess': '{count} Benutzernamen importiert.',
            'alert.importFailed': 'Import fehlgeschlagen: {reason}',
            'preset.gaming': 'Spiel-ID',
            'preset.gaming.tooltip': 'Buchstaben und Zahlen, keine Sonderzeichen, keine mehrdeutigen Zeichen',
            'preset.social': 'Social-Handle',
            'preset.social.tooltip': 'Kleinbuchstaben und Zahlen, gut lesbar',
            'preset.word': 'Lesbares Wort',
            'preset.word.tooltip': 'Nur gut aussprechbare Buchstaben',
            'preset.strong': 'Stark',
            'preset.strong.tooltip': 'Alle Zeichen, Länge 16',
            'batch.generate': '10 generieren',
            'quick.hint.enter': 'Enter zum Generieren',
            'quick.hint.copy': 'Strg+C zum Kopieren',
            'history.generateOne': 'Einen generieren',
            'customize.title': 'Benutzernamen anpassen',
            'mode.easyToSay': 'Leicht auszusprechen',
            'mode.easyToRead': 'Leicht zu lesen',
            'mode.allCharacters': 'Alle Zeichen',
            'mode.easyToSay.tooltip': 'Zahlen und Sonderzeichen vermeiden',
            'mode.easyToRead.tooltip': 'Mehrdeutige Zeichen wie I, l, 1, O, 0, S, 5, B, 8, Z und 2 vermeiden',
            'mode.allCharacters.tooltip': 'Beliebige Zeichenkombinationen wie !, 7, h, K und l1',
            'char.uppercase': 'Großbuchstaben',
            'char.lowercase': 'Kleinbuchstaben',
            'char.numbers': 'Zahlen',
            'char.symbols': 'Symbole',
            'length.label': 'Länge des Benutzernamens',
            'button.generate': 'Benutzernamen generieren',
            'button.copy': 'Benutzernamen kopieren',
            'a11y.copy': 'Benutzernamen kopieren',
            'history.title': 'Verlauf',
            'history.subtitle': 'Neueste Benutzernamen',
            'history.clear': 'Alles löschen',
            'history.loadMore': 'Mehr laden',
            'history.export': 'CSV exportieren',
            'history.search': 'Verlauf durchsuchen...',
            'history.clearSearch': 'Suche löschen',
            'history.empty': 'Noch keine Benutzernamen. Generiere einen, um zu starten.',
            'favorites.title': 'Favoriten',
            'favorites.subtitle': 'Gespeicherte Benutzernamen',
            'favorites.empty': 'Noch keine Favoriten. Markiere einen Benutzernamen mit einem Stern.',
            'favorites.favorited': 'Favorisiert',
            'theme.system': 'System',
            'theme.light': 'Hell',
            'theme.dark': 'Dunkel',
            'alert.copySuccess': 'Benutzername in die Zwischenablage kopiert!',
            'alert.copyFailed': 'Kopieren fehlgeschlagen. Bitte erneut versuchen.',
            'alert.noHistory': 'Kein Verlauf zum Exportieren.',
            'alert.favoritesCleared': 'Alle Favoriten gelöscht.',
            'confirm.clearFavorites': 'Möchtest du wirklich alle Favoriten löschen?',
            'shortcut.generated': 'Generiert!',
            'shortcut.copied': 'Kopiert!'
        }
    };

    /**
     * Get locale code for date formatting
     * @param {string} language - Language code
     * @returns {string} - Locale code (e.g., 'zh-CN', 'ja-JP')
     */
    function getLocaleCode(language) {
        const localeMap = {
            'en': 'en-US',
            'zh': 'zh-CN',
            'zh-TW': 'zh-TW',
            'ja': 'ja-JP',
            'ko': 'ko-KR',
            'es': 'es-ES',
            'fr': 'fr-FR',
            'de': 'de-DE'
        };
        return localeMap[language] || 'en-US';
    }

    /**
     * Persist language preference to storage
     * @param {string} language - Language to persist
     */
    function persistLanguage(language) {
        if (!storage) return;

        storage.set({ [LANGUAGE_KEY]: language }, () => {
            if (chrome.runtime && chrome.runtime.lastError) {
                console.error('Failed to persist language preference', chrome.runtime.lastError);
            }
        });
    }

    return {
        /**
         * Initialize the i18n manager
         * @param {Object} storageInstance - Chrome storage instance
         * @param {Function} callback - Callback after initialization
         */
        init: function(storageInstance, callback) {
            storage = storageInstance;

            if (!storage) {
                this.setLanguage('en');
                if (callback) callback();
                return;
            }

            storage.get([LANGUAGE_KEY], (result) => {
                if (chrome.runtime && chrome.runtime.lastError) {
                    console.error('Failed to load language preference', chrome.runtime.lastError);
                    currentLanguage = 'en';
                } else {
                    currentLanguage = result[LANGUAGE_KEY] || 'en';
                }

                this.updateUITranslations();
                this.updateDateLocale();
                if (callback) callback();
            });
        },

        /**
         * Set the current language
         * @param {string} language - Language code (e.g. 'en', 'zh', 'zh-TW')
         */
        setLanguage: function(language) {
            if (!translations[language]) {
                console.warn(`Language ${language} not supported, falling back to en`);
                language = 'en';
            }

            currentLanguage = language;
            persistLanguage(language);
            this.updateUITranslations();
            this.updateDateLocale();
        },

        /**
         * Get the current language
         * @returns {string} - Current language code
         */
        getLanguage: function() {
            return currentLanguage;
        },

        /**
         * Get a translation by key
         * @param {string} key - Translation key
         * @returns {string} - Translated text
         */
        t: function(key) {
            return translations[currentLanguage]?.[key] || translations['en'][key] || key;
        },

        /**
         * Update all UI elements with translations
         */
        updateUITranslations: function() {
            // Update text content
            document.querySelectorAll('[data-i18n]').forEach(el => {
                const key = el.getAttribute('data-i18n');
                el.textContent = this.t(key);
            });

            // Update placeholders
            document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
                const key = el.getAttribute('data-i18n-placeholder');
                el.placeholder = this.t(key);
            });

            // Update titles
            document.querySelectorAll('[data-i18n-title]').forEach(el => {
                const key = el.getAttribute('data-i18n-title');
                el.title = this.t(key);
            });

            // Update aria-labels
            document.querySelectorAll('[data-i18n-aria-label]').forEach(el => {
                const key = el.getAttribute('data-i18n-aria-label');
                el.setAttribute('aria-label', this.t(key));
            });
        },

        /**
         * Update date formatting locale
         */
        updateDateLocale: function() {
            if (window.__usernameGeneratorState) {
                window.__usernameGeneratorState.locale = getLocaleCode(currentLanguage);
            }
        },

        /**
         * Get all supported languages
         * @returns {Array} - Array of language codes
         */
        getSupportedLanguages: function() {
            return Object.keys(translations);
        },

        /**
         * Get language display name
         * @param {string} code - Language code
         * @returns {string} - Native display name
         */
        getLanguageName: function(code) {
            return LANGUAGE_NAMES[code] || code;
        },

        /**
         * Check whether a language defines a translation key.
         * Used to keep dictionaries in sync.
         * @param {string} language - Language code
         * @param {string} key - Translation key
         * @returns {boolean}
         */
        hasTranslation: function(language, key) {
            return Boolean(
                translations[language] &&
                Object.prototype.hasOwnProperty.call(translations[language], key)
            );
        }
    };
})();
