import { createContext, useContext, useState } from 'react'

const LanguageContext = createContext()

export const translations = {
  en: {
    home: 'Home', about: 'About', contact: 'Contact', faq: 'FAQ',
    conferences: 'Conferences', create: 'Create', profile: 'Profile',
    admin: 'Admin', login: 'Login', logout: 'Sign Out', getStarted: 'Get Started',
    searchPlaceholder: 'Search conferences...',
    allCategories: 'All Categories', newest: 'Newest', oldest: 'Oldest',
    noConferences: 'No conferences found', tryAdjusting: 'Try adjusting your search or filters',
    found: 'Found', conferencesWord: 'conferences',
    addConference: '+ Add Conference', clearFilters: 'Clear Filters',
    register: 'Create Account', emailAddress: 'Email Address',
    password: 'Password', confirmPassword: 'Confirm Password',
    createAccount: 'Create account', signingIn: 'Signing in...',
    signIn: 'Sign in', alreadyHave: 'Already have an account?',
    dontHave: "Don't have an account?", createOne: 'Create one →',
    back: '← Back', backToConferences: '← Back to conferences',
    overview: 'Overview', agenda: 'Agenda', venue: 'Venue', submitPaper: 'Submit Paper',
    quickInfo: 'Conference Details', save: 'Save', saved: 'Saved', share: 'Share',
    visitWebsite: '🌐 Visit Official Website', addToCalendar: '📅 Add to Calendar',
  },
  ru: {
    home: 'Главная', about: 'О нас', contact: 'Контакты', faq: 'Вопросы',
    conferences: 'Конференции', create: 'Создать', profile: 'Профиль',
    admin: 'Админ', login: 'Войти', logout: 'Выйти', getStarted: 'Начать',
    searchPlaceholder: 'Поиск конференций...',
    allCategories: 'Все категории', newest: 'Новые', oldest: 'Старые',
    noConferences: 'Конференции не найдены', tryAdjusting: 'Попробуйте изменить фильтры',
    found: 'Найдено', conferencesWord: 'конференций',
    addConference: '+ Добавить', clearFilters: 'Сбросить',
    register: 'Регистрация', emailAddress: 'Email адрес',
    password: 'Пароль', confirmPassword: 'Подтвердите пароль',
    createAccount: 'Создать аккаунт', signingIn: 'Входим...',
    signIn: 'Войти', alreadyHave: 'Уже есть аккаунт?',
    dontHave: 'Нет аккаунта?', createOne: 'Создать →',
    back: '← Назад', backToConferences: '← К конференциям',
    overview: 'Обзор', agenda: 'Программа', venue: 'Место', submitPaper: 'Подать статью',
    quickInfo: 'Детали конференции', save: 'Сохранить', saved: 'Сохранено', share: 'Поделиться',
    visitWebsite: '🌐 Официальный сайт', addToCalendar: '📅 В календарь',
  }
}

export function LanguageProvider({ children }) {
  const [lang, setLang] = useState(() => localStorage.getItem('lang') || 'en')
  const toggleLang = () => {
    const newLang = lang === 'en' ? 'ru' : 'en'
    setLang(newLang)
    localStorage.setItem('lang', newLang)
  }
  const t = translations[lang]
  return (
    <LanguageContext.Provider value={{ lang, toggleLang, t }}>
      {children}
    </LanguageContext.Provider>
  )
}

export const useLang = () => useContext(LanguageContext)