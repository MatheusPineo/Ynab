const fs = require('fs');

async function fetchCountries() {
  const res = await fetch('https://restcountries.com/v3.1/all?fields=cca2,translations,name');
  const data = await res.json();
  
  let countries = data.map(c => ({
      code: c.cca2,
      name: c.translations?.por?.common || c.name.common,
  })).sort((a,b) => a.name.localeCompare(b.name));
  
  let content = `export interface Country {
  code: string;
  name: string;
}

export const COUNTRIES: Country[] = [
`;
  countries.forEach(c => {
      content += `  { code: "${c.code}", name: "${c.name.replace(/"/g, '\\"')}" },\n`;
  });
  content += `];\n`;
  
  fs.writeFileSync('src/constants/countries.ts', content);
  console.log("Done fetching countries");
}

fetchCountries();
