/**
 * Full NLEX exit list, kept as reference data.
 *
 * Nothing imports this. The app runs on `nlexSegments.ts`, which carries a
 * curated subset under shortened display names ("Sta. Ines", "CDV / Ph.
 * Arena") chosen to fit a phone. This file is the longer list it was cut
 * from - the minor exits (Lawang Bato, Lingunan, Libis Baesa, Novaliches,
 * Pandayan, Libtong, F. Raymundo) live only here, so it is worth keeping
 * even though it is unwired.
 *
 * If you wire it up, add to `nlexSegments.ts` rather than importing both:
 * one source of exit names is the point.
 */
export interface NlexExit {
  name: string;
  city: string;
  lanesPerDirection: number;
}

export const northboundExits: NlexExit[] = [
  { name: 'Balintawak Cloverleaf', city: 'Quezon City', lanesPerDirection: 4 },
  { name: 'Novaliches', city: 'Quezon City', lanesPerDirection: 4 },
  { name: 'Smart Connect / Harbor Link Interchange', city: 'Valenzuela', lanesPerDirection: 4 },
  { name: 'Paso de Blas / Valenzuela City', city: 'Valenzuela', lanesPerDirection: 4 },
  { name: 'Lawang Bato', city: 'Valenzuela', lanesPerDirection: 4 },
  { name: 'Libtong', city: 'Meycauayan', lanesPerDirection: 4 },
  { name: 'Meycauayan', city: 'Meycauayan', lanesPerDirection: 4 },
  { name: 'F. Raymundo', city: 'Meycauayan', lanesPerDirection: 4 },
  { name: 'Marilao', city: 'Marilao', lanesPerDirection: 4 },
  { name: 'Ciudad de Victoria / Philippine Arena', city: 'Bocaue', lanesPerDirection: 4 },
  { name: 'Bocaue', city: 'Bocaue', lanesPerDirection: 4 },
  { name: 'Tambubong', city: 'Bocaue', lanesPerDirection: 4 },
  { name: 'Balagtas', city: 'Balagtas', lanesPerDirection: 4 },
  { name: 'Tabang', city: 'Guiguinto', lanesPerDirection: 3 },
  { name: 'Santa Rita', city: 'Guiguinto', lanesPerDirection: 3 },
  { name: 'Pulilan', city: 'Pulilan', lanesPerDirection: 2 },
  { name: 'San Simon', city: 'San Simon', lanesPerDirection: 2 },
  { name: 'San Fernando', city: 'San Fernando', lanesPerDirection: 2 },
  { name: 'Mexico', city: 'Mexico', lanesPerDirection: 2 },
  { name: 'Angeles', city: 'Angeles City', lanesPerDirection: 2 },
  { name: 'Dau', city: 'Mabalacat', lanesPerDirection: 2 },
  { name: 'Clark / SCTEX Interchange', city: 'Mabalacat', lanesPerDirection: 2 },
  { name: 'Santa Ines', city: 'Mabalacat', lanesPerDirection: 2 },
];

export const southboundExits: NlexExit[] = [
  { name: 'Santa Ines', city: 'Mabalacat', lanesPerDirection: 2 },
  { name: 'Clark / SCTEX Interchange', city: 'Mabalacat', lanesPerDirection: 2 },
  { name: 'Dau', city: 'Mabalacat', lanesPerDirection: 2 },
  { name: 'Angeles', city: 'Angeles City', lanesPerDirection: 2 },
  { name: 'Mexico', city: 'Mexico', lanesPerDirection: 2 },
  { name: 'San Fernando', city: 'San Fernando', lanesPerDirection: 2 },
  { name: 'San Simon', city: 'San Simon', lanesPerDirection: 2 },
  { name: 'Pulilan', city: 'Pulilan', lanesPerDirection: 2 },
  { name: 'Santa Rita', city: 'Guiguinto', lanesPerDirection: 3 },
  { name: 'Tabang', city: 'Guiguinto', lanesPerDirection: 3 },
  { name: 'Balagtas', city: 'Balagtas', lanesPerDirection: 3 },
  { name: 'Tambubong', city: 'Bocaue', lanesPerDirection: 4 },
  { name: 'Bocaue', city: 'Bocaue', lanesPerDirection: 4 },
  { name: 'Ciudad de Victoria / Philippine Arena', city: 'Bocaue', lanesPerDirection: 4 },
  { name: 'Marilao', city: 'Marilao', lanesPerDirection: 4 },
  { name: 'Pandayan', city: 'Meycauayan', lanesPerDirection: 4 },
  { name: 'Meycauayan', city: 'Meycauayan', lanesPerDirection: 4 },
  { name: 'Lingunan', city: 'Valenzuela', lanesPerDirection: 4 },
  { name: 'Paso de Blas / Valenzuela City', city: 'Valenzuela', lanesPerDirection: 4 },
  { name: 'Smart Connect / Harbor Link Interchange', city: 'Valenzuela', lanesPerDirection: 4 },
  { name: 'Libis Baesa', city: 'Caloocan', lanesPerDirection: 4 },
  { name: 'Skyway Balintawak Exit', city: 'Caloocan', lanesPerDirection: 4 },
  { name: 'Balintawak Cloverleaf', city: 'Quezon City', lanesPerDirection: 4 },
];
