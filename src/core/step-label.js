/** Build a localized instruction title from an already-sanitized descriptor. */
const ROLE_LABELS = {
  en: {
    button: 'Click', link: 'Open link', checkbox: 'Toggle checkbox',
    radio: 'Select option', select: 'Open list', textbox: 'Click the input field',
    password: 'Click the password field', tab: 'Open tab', menuitem: 'Open menu item',
  },
  ru: {
    button: 'Нажмите', link: 'Перейдите по ссылке', checkbox: 'Нажмите на флажок',
    radio: 'Выберите вариант', select: 'Откройте список', textbox: 'Нажмите на поле ввода',
    password: 'Нажмите на поле пароля', tab: 'Откройте вкладку', menuitem: 'Откройте пункт меню',
  },
};

export function formatStepTitle(descriptor, locale = 'ru') {
  const language = String(locale).toLowerCase().startsWith('en') ? 'en' : 'ru';
  const role = descriptor?.role;
  const prefix = ROLE_LABELS[language][role] || (language === 'en' ? 'Click' : 'Нажмите');
  const label = typeof descriptor?.label === 'string' ? descriptor.label.trim() : '';
  return label ? `${prefix} «${label}»` : prefix;
}
