import React, { createContext, useContext, useState, useEffect } from 'react';

const LanguageContext = createContext();

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

export const LanguageProvider = ({ children }) => {
  const [language, setLanguage] = useState(() => {
    // Check localStorage first, then browser language, default to BG
    const savedLang = localStorage.getItem('language');
    if (savedLang && ['bg', 'en'].includes(savedLang)) {
      return savedLang;
    }
    
    const browserLang = navigator.language.toLowerCase();
    if (browserLang.startsWith('en')) {
      return 'en';
    }
    
    return 'bg'; // Default to Bulgarian
  });

  useEffect(() => {
    localStorage.setItem('language', language);
  }, [language]);

  const changeLanguage = (lang) => {
    if (['bg', 'en'].includes(lang)) {
      setLanguage(lang);
    }
  };

  const t = (key, fallback = key) => {
    return translations[language]?.[key] || translations['bg']?.[key] || fallback;
  };

  const value = {
    language,
    changeLanguage,
    t,
    isEnglish: language === 'en',
    isBulgarian: language === 'bg'
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
};

const translations = {
  bg: {
    // Navigation
    'nav.home': 'Начало',
    'nav.catalog': 'Каталог',
    'nav.about': 'За нас',
    'nav.contact': 'Контакти',
    'nav.admin': 'Админ панел',
    'nav.login': 'Вход',
    'nav.register': 'Регистрация',
    'nav.logout': 'Изход',
    
    // Home page
    'home.hero.title': 'Луксозно осветление за вашия дом',
    'home.hero.subtitle': 'Открийте нашата колекция от изискани осветителни тела, които ще трансформират всяко пространство в елегантен интериор.',
    'home.hero.cta': 'Разгледай каталога',
    'home.featured': 'Избрани продукти',
    'home.featured.subtitle': 'Открийте нашите най-популярни и иновативни осветителни решения',
    'home.why.title': 'Защо да изберете нас?',
    'home.why.subtitle': 'Комбинираме стил, функционалност и иновации за създаването на перфектното осветление',
    'home.cta.title': 'Готови ли сте да преобразите пространството си?',
    'home.cta.subtitle': 'Открийте нашата колекция от луксозни осветителни тела и създайте атмосферата, която мечтаете',
    'home.cta.button': 'Започнете сега',
    
    // About page
    'about.title': 'За нас',
  'about.hero.subtitle': 'Дългогодишен опит',
    'about.hero.catalog': 'Разгледай каталога',
    'about.hero.contact': 'Свържи се с нас',
    'about.story.title': 'Нашата история',
  'about.story.p1': 'MARK LIGHT LTD започна като малък семеен бизнес през 2008 година с мисията да донесе най-доброто европейско осветление в България.',
  // 'about.story.p2': '',
    'about.features.title': 'Защо да изберете нас?',
    'about.features.subtitle': 'Комбинираме страст към дизайна с професионализъм и високо качество на обслужване',
  // 'about.team.title': '',
    'about.team.subtitle': 'Професионалисти с богат опит в областта на осветлението и дизайна',
    'about.contact.title': 'Готови за нов проект?',
    'about.contact.subtitle': 'Свържете се с нас за безплатна консултация и персонализирано предложение',
    
    // Contact page
    'contact.title': 'Свържете се с нас',
    'contact.hero.subtitle': 'Имате въпроси или нужда от консултация? Ние сме тук, за да ви помогнем да намерите идеалното осветително решение.',
    'contact.info.title': 'Информация за контакт',
  'contact.info.subtitle': '',
    'contact.form.title': 'Изпратете ни съобщение',
    'contact.form.name': 'Име',
    'contact.form.phone': 'Телефон',
    'contact.form.email': 'Email',
    'contact.form.subject': 'Тема',
    'contact.form.message': 'Съобщение',
    'contact.form.submit': 'Изпрати съобщение',
    'contact.form.sending': 'Изпращане...',
    'contact.form.success': 'Вашето съобщение беше изпратено успешно! Ще се свържем с вас скоро.',
    
    // Authentication
    'auth.login.title': 'Добре дошли отново',
    'auth.login.subtitle': 'Влезте в профила си за достъп до всички функции',
    'auth.login.username': 'Потребителско име',
    'auth.login.password': 'Парола',
    'auth.login.submit': 'Влезте',
        'auth.login.register': "Don't have an account?",
    'auth.login.register.link': 'Register here',
    'auth.register.title': 'Създайте акаунт',
    'auth.register.subtitle': 'Присъединете се към нашата общност',
    'auth.register.firstName': 'Име',
    'auth.register.lastName': 'Фамилия',
    'auth.register.username': 'Потребителско име',
    'auth.register.email': 'Имейл адрес',
    'auth.register.password': 'Парола',
    'auth.register.confirmPassword': 'Потвърдете паролата',
    'auth.register.submit': 'Създай акаунт',
        'auth.register.login': 'Already have an account?',
    'auth.register.login.link': 'Sign in here',
    
    // Register page additional translations
    'register.title': 'Създайте акаунт',
    'register.subtitle': 'Присъединете се към нашата общност',
    'register.firstName': 'Име',
    'register.lastName': 'Фамилия',
    'register.username': 'Потребителско име',
    'register.email': 'Имейл адрес',
    'register.password': 'Парола',
    'register.confirmPassword': 'Потвърдете паролата',
    'register.submit': 'Създай акаунт',
    'register.loading': 'Регистрация...',
    'register.loginPrompt': 'Вече имате акаунт?',
    'register.loginLink': 'Влезте тук',
    'register.firstNamePlaceholder': 'Вашето име',
    'register.lastNamePlaceholder': 'Фамилното име',
    'register.emailPlaceholder': 'your@email.com',
    'register.usernamePlaceholder': '3-30 символа',
    'register.passwordPlaceholder': 'Минимум 6 символа',
    'register.confirmPasswordPlaceholder': 'Повторете паролата',
    'register.success': 'Успешна регистрация! Пренасочване към страницата за вход...',
    'register.errors.required': 'Моля попълнете всички задължителни полета',
    'register.errors.usernameLength': 'Потребителското име трябва да е между 3 и 30 символа',
    'register.errors.passwordLength': 'Паролата трябва да съдържа поне 6 символа',
    'register.errors.passwordMatch': 'Паролите не съвпадат',
    'register.errors.invalidEmail': 'Моля въведете валиден имейл адрес',
    'register.errors.usernameExists': 'Потребител с това потребителско име вече съществува',
    'register.errors.emailExists': 'Потребител с този имейл вече съществува',
    'register.errors.general': 'Грешка при регистрацията. Моля опитайте отново.',
    
    // Features
  'features.experience': 'Дългогодишен опит',
  'features.experience.desc': 'На добра цена',
    'features.quality': 'Гарантира за качество',
    'features.quality.desc': 'Всички наши продукти са с официална гаранция',
    'features.delivery': 'Безплатна доставка',
    'features.delivery.desc': 'Безплатна доставка при поръчки над 200 лв.',
    'features.support': '24/7 Поддръжка',
    'features.support.desc': 'Професионална поддръжка и консултации',
    
    // Contact info
    'contact.address': 'Адрес',
  'contact.address.value': 'гр. Габрово, ул. Пенчо Постомпиров 21',
    'contact.phone': 'Телефон',
    'contact.email': 'Email',
    'contact.hours': 'Работно време',
    'contact.hours.value': 'Пон-Пет: 9:00-18:00, Съб: 10:00-16:00',
    
    // Common
    'common.required': 'задължително',
    'common.loading': 'Зареждане...',
    'common.error': 'Възникна грешка',
    'common.success': 'Успешно!',
    'common.admin': 'Администратор',
    
    // Team members
    'team.founder.name': 'Иван Петров',
    'team.founder.position': 'Основател и Главен дизайнер',
    'team.founder.desc': 'С над 20 години опит в областта на осветлението и интериорния дизайн.',
    'team.manager.name': 'Мария Димитрова',
    'team.manager.position': 'Мениджър проекти',
    'team.manager.desc': 'Отговаря за планирането и изпълнението на сложни проекти за осветление.',
    'team.consultant.name': 'Георги Стоянов',
    'team.consultant.position': 'Технически консултант',
    'team.consultant.desc': 'Експерт по LED технологии и енергийно ефективни решения.'
  },
  en: {
    // Navigation
    'nav.home': 'Home',
    'nav.catalog': 'Catalog',
    'nav.about': 'About',
    'nav.contact': 'Contact',
    'nav.admin': 'Admin Panel',
    'nav.login': 'Login',
    'nav.register': 'Register',
    'nav.logout': 'Logout',
    
    // Home page
  'home.hero.title': 'MARK LIGHT LTD for Your Home',
    'home.hero.subtitle': 'Discover our collection of exquisite lighting fixtures that will transform any space into an elegant interior.',
    'home.hero.cta': 'Browse Catalog',
    'home.featured': 'Featured Products',
    'home.featured.subtitle': 'Discover our most popular and innovative lighting solutions',
    'home.why.title': 'Why Choose Us?',
    'home.why.subtitle': 'We combine style, functionality and innovation to create perfect lighting',
    'home.cta.title': 'Ready to Transform Your Space?',
  'home.cta.subtitle': 'Discover our collection of MARK LIGHT LTD  fixtures and create the atmosphere you dream of',
    'home.cta.button': 'Get Started',
    
    // About page
    'about.title': 'About Us',
    'about.hero.subtitle':  "For many years, we have been creating unique lighting solutions that transform spaces into true works of art.",
    'about.hero.catalog': 'Browse Catalog',
    'about.hero.contact': 'Contact Us',
    'about.story.title': 'Our Story',
  'about.story.p1': 'MARK LIGHT LTD started as a small family business in 2008 with the mission to bring the best European lighting to Bulgaria.',
    'about.story.p2': 'Our team of experts helps you create the perfect atmosphere in your home or office through individual lighting solutions.',
    'about.features.title': 'Why Choose Us?',
    'about.features.subtitle': 'We combine passion for design with professionalism and high quality service',
    'about.team.title': 'Our Team',
    'about.team.subtitle': 'Professionals with extensive experience in lighting and design',
    'about.contact.title': 'Ready for a New Project?',
    'about.contact.subtitle': 'Contact us for a free consultation and personalized proposal',
    
    // Contact page
    'contact.title': 'Contact Us',
    'contact.hero.subtitle': 'Have questions or need consultation? We are here to help you find the ideal lighting solution.',
    'contact.info.title': 'Contact Information',
    'contact.info.subtitle': 'Contact our team of experts for personalized consultation and the best solutions for your home or office.',
    'contact.form.title': 'Send Us a Message',
    'contact.form.name': 'Name',
    'contact.form.phone': 'Phone',
    'contact.form.email': 'Email',
    'contact.form.subject': 'Subject',
    'contact.form.message': 'Message',
    'contact.form.submit': 'Send Message',
    'contact.form.sending': 'Sending...',
    'contact.form.success': 'Your message was sent successfully! We will contact you soon.',
    
    // Authentication
    'auth.login.title': 'Welcome Back',
    'auth.login.subtitle': 'Sign in to your account to access all features',
    'auth.login.username': 'Username',
    'auth.login.password': 'Password',
    'auth.login.submit': 'Sign In',
    'auth.login.register': 'Нямате акаунт?',
    'auth.login.register.link': 'Регистрирайте се',
    'auth.register.title': 'Create Account',
    'auth.register.subtitle': 'Join our community',
    'auth.register.firstName': 'First Name',
    'auth.register.lastName': 'Last Name',
    'auth.register.username': 'Username',
    'auth.register.email': 'Email Address',
    'auth.register.password': 'Password',
    'auth.register.confirmPassword': 'Confirm Password',
    'auth.register.submit': 'Create Account',
    'auth.register.login': 'Вече имате акаунт?',
    'auth.register.login.link': 'Влезте тук',
    
    // Register page additional translations
    'register.title': 'Create Account',
    'register.subtitle': 'Join our community',
    'register.firstName': 'First Name',
    'register.lastName': 'Last Name',
    'register.username': 'Username',
    'register.email': 'Email Address',
    'register.password': 'Password',
    'register.confirmPassword': 'Confirm Password',
    'register.submit': 'Create Account',
    'register.loading': 'Registering...',
    'register.loginPrompt': 'Already have an account?',
    'register.loginLink': 'Sign in here',
    'register.firstNamePlaceholder': 'Your first name',
    'register.lastNamePlaceholder': 'Your last name',
    'register.emailPlaceholder': 'your@email.com',
    'register.usernamePlaceholder': '3-30 characters',
    'register.passwordPlaceholder': 'Minimum 6 characters',
    'register.confirmPasswordPlaceholder': 'Repeat password',
    'register.success': 'Registration successful! Redirecting to login page...',
    'register.errors.required': 'Please fill in all required fields',
    'register.errors.usernameLength': 'Username must be between 3 and 30 characters',
    'register.errors.passwordLength': 'Password must contain at least 6 characters',
    'register.errors.passwordMatch': 'Passwords do not match',
    'register.errors.invalidEmail': 'Please enter a valid email address',
    'register.errors.usernameExists': 'User with this username already exists',
    'register.errors.emailExists': 'User with this email already exists',
    'register.errors.general': 'Registration error. Please try again.',
    
    // Features
    'features.experience': 'Many Years of Experience',
    'features.quality': 'Quality Guarantee',
    'features.quality.desc': 'All our products come with official warranty',
    'features.delivery': 'Free Delivery',
    'features.delivery.desc': 'Free delivery on orders over 200 BGN',
    'features.support': '24/7 Support',
    'features.support.desc': 'Professional support and consultations',
    
    // Contact info
    'contact.address': 'Address',
  'contact.address.value': 'Gabrovo, 21 Pencho Postompirov',
    'contact.phone': 'Phone',
    'contact.email': 'Email',
    'contact.hours': 'Working Hours',
    'contact.hours.value': 'Mon-Fri: 9:00-18:00, Sat: 10:00-16:00',
    
    // Common
    'common.required': 'required',
    'common.loading': 'Loading...',
    'common.error': 'An error occurred',
    'common.success': 'Success!',
    'common.admin': 'Administrator',
    
    // Team members
    //'team.founder.name': 'Ivan Petrov',
    //'team.founder.position': 'Founder & Lead Designer',
    //'team.founder.desc': 'With over 20 years of experience in lighting and interior design.',
    //'team.manager.name': 'Maria Dimitrova',
    //'team.manager.position': 'Project Manager',
    //'team.manager.desc': 'Responsible for planning and executing complex lighting projects.',
    //'team.consultant.name': 'Georgi Stoyanov',
    //'team.consultant.position': 'Technical Consultant',
    //'team.consultant.desc': 'Expert in LED technologies and energy-efficient solutions.'
  }
};

export default LanguageContext;
