import english from './en.json';
import spanish from './es.json';
import french from './fr.json';

const LANG = {
	ENGLISH: 'en',
	SPANISH: 'es',
  FRENCH: 'fr',
};

const PATHS_IN_SPANISH = {
	home: '/',
	catalog: '/catalogo',
	about_us: '/nosotros',
	recommendations: '/recomendaciones',
	contact: '/contacto',
	blog: '/blog',
};

const PATHS_IN_ENGLISH = {
	home: '/en',
	catalog: '/en/catalog',
	about_us: '/en/about-us',
	recommendations: '/en/recommendations',
	contact: '/en/contact',
	blog: '/en/blog',
};

const PATHS_IN_FRENCH = {
	home: '/fr',
	catalog: '/fr/catalogue',
	about_us: '/fr/sur-nous',
	recommendations: '/fr/recommandations',
	contact: '/fr/contact',
	blog: '/fr/blog',
};

export const getI18N = (currentLocale : string = 'es') => {
	if (currentLocale === LANG.ENGLISH) return english;
  if (currentLocale === LANG.FRENCH) return french;
	return spanish;
};

export const getPaths = (currentLocale : string = 'es') => {
	if (currentLocale === LANG.ENGLISH) return PATHS_IN_ENGLISH;
	if (currentLocale === LANG.FRENCH) return PATHS_IN_FRENCH;
	return PATHS_IN_SPANISH;
}