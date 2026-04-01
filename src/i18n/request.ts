import {getRequestConfig} from 'next-intl/server';
import {routing} from './routing';
import {cookies} from 'next/headers';

export default getRequestConfig(async () => {
  const cookieStore = await cookies();
  const nextLocaleCookie = cookieStore.get('NEXT_LOCALE')?.value;
  
  const resolvedLocale =
    nextLocaleCookie && routing.locales.includes(nextLocaleCookie as 'en' | 'ta')
      ? nextLocaleCookie
      : routing.defaultLocale;

  return {
    locale: resolvedLocale,
    messages: (await import(`../../messages/${resolvedLocale}.json`)).default
  };
});
