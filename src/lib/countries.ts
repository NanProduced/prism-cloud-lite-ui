import * as countriesList from 'countries-list';

export type ContinentCode = 'AF' | 'AS' | 'EU' | 'NA' | 'SA' | 'OC' | 'AN';

export const CONTINENT_LABELS: Record<ContinentCode, string> = {
  AF: 'Africa',
  AS: 'Asia',
  EU: 'Europe',
  NA: 'North America',
  SA: 'South America',
  OC: 'Oceania',
  AN: 'Antarctica',
};

export const CONTINENT_ORDER: readonly ContinentCode[] = ['AS', 'EU', 'NA', 'SA', 'AF', 'OC', 'AN'];

export type CountryInfo = { code: string; name: string; continent: ContinentCode };

function normalizeCountryCode(code: string): string {
  return code.trim().toUpperCase();
}

export function countryFlagEmoji(code: string): string {
  const upper = normalizeCountryCode(code);
  if (!/^[A-Z]{2}$/.test(upper)) return '';
  const [a, b] = upper;
  if (!a || !b) return '';
  const A = 0x1f1e6; // Regional indicator symbol letter A
  const first = A + (a.charCodeAt(0) - 65);
  const second = A + (b.charCodeAt(0) - 65);
  return String.fromCodePoint(first, second);
}

export const COUNTRIES: CountryInfo[] = (() => {
  const list = countriesList.getCountryDataList()
    .map((c) => {
      const code = normalizeCountryCode(c.iso2);
      const continent = c.continent as ContinentCode;
      const baseName = c.name ?? code;

      const name = (() => {
        if (code === 'HK') return `${baseName} (China)`;
        if (code === 'MO') return `${baseName} (China)`;
        if (code === 'TW') return `${baseName} (China)`;
        return baseName;
      })();

      return { code, name, continent };
    })
    .filter((c) => /^[A-Z]{2}$/.test(c.code));

  const order = new Map(CONTINENT_ORDER.map((c, i) => [c, i] as const));
  return list.sort((a, b) => {
    const ao = order.get(a.continent) ?? 99;
    const bo = order.get(b.continent) ?? 99;
    if (ao !== bo) return ao - bo;
    const an = a.name.localeCompare(b.name);
    if (an !== 0) return an;
    return a.code.localeCompare(b.code);
  });
})();

const COUNTRY_BY_CODE = new Map(COUNTRIES.map((c) => [c.code, c] as const));

export function countryName(code: string): string | undefined {
  return COUNTRY_BY_CODE.get(normalizeCountryCode(code))?.name;
}

export function countryLabel(code: string): string {
  const upper = normalizeCountryCode(code);
  const name = countryName(upper);
  if (!upper) return '';
  if (!name || name === upper) return upper;
  return `${upper} — ${name}`;
}
