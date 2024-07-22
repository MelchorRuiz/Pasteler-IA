import english from './en.json';
import spanish from './es.json';
import french from './fr.json';

const LANG = {
	ENGLISH: 'en',
	SPANISH: 'es',
  FRENCH: 'fr',
};

export const getI18N = (currentLocale : string = 'es') => {
	if (currentLocale === LANG.ENGLISH) return english;
  if (currentLocale === LANG.FRENCH) return french;
	return spanish;
};
