export type ShippingMode = "home" | "desk";

export type WilayaShipping = {
  wilaya: string;
  home: number; // A domicile
  desk: number; // Stop Desk
};

export const ECONOMIC_SHIPPING: WilayaShipping[] = [
  { wilaya: "Alger", home: 400, desk: 400 },
  { wilaya: "Tipaza", home: 600, desk: 400 },
  { wilaya: "Boumerdès", home: 600, desk: 400 },
  { wilaya: "Blida", home: 600, desk: 400 },
  { wilaya: "Relizane", home: 700, desk: 400 },
  { wilaya: "Aïn Témouchent", home: 700, desk: 400 },
  { wilaya: "Aïn Defla", home: 700, desk: 400 },
  { wilaya: "Mila", home: 700, desk: 400 },
  { wilaya: "Souk Ahras", home: 700, desk: 400 },
  { wilaya: "Khenchela", home: 700, desk: 400 },
  { wilaya: "Tissemsilt", home: 700, desk: 400 },
  { wilaya: "El Tarf", home: 700, desk: 400 },
  { wilaya: "Bordj Bou Arreridj", home: 700, desk: 400 },
  { wilaya: "Oran", home: 700, desk: 400 },
  { wilaya: "Mascara", home: 700, desk: 400 },
  { wilaya: "M'Sila", home: 700, desk: 400 },
  { wilaya: "Mostaganem", home: 700, desk: 400 },
  { wilaya: "Médéa", home: 700, desk: 400 },
  { wilaya: "Constantine", home: 700, desk: 400 },
  { wilaya: "Guelma", home: 700, desk: 400 },
  { wilaya: "Annaba", home: 700, desk: 400 },
  { wilaya: "Sidi Bel Abbès", home: 700, desk: 400 },
  { wilaya: "Skikda", home: 700, desk: 400 },
  { wilaya: "Saïda", home: 700, desk: 400 },
  { wilaya: "Sétif", home: 700, desk: 400 },
  { wilaya: "Jijel", home: 700, desk: 400 },
  { wilaya: "Tizi Ouzou", home: 700, desk: 400 },
  { wilaya: "Tiaret", home: 700, desk: 400 },
  { wilaya: "Tlemcen", home: 700, desk: 400 },
  { wilaya: "Bouira", home: 700, desk: 400 },
  { wilaya: "Béjaïa", home: 700, desk: 400 },
  { wilaya: "Batna", home: 700, desk: 400 },
  { wilaya: "Oum El Bouaghi", home: 700, desk: 400 },
  { wilaya: "Chlef", home: 700, desk: 400 },
  { wilaya: "Ghardaïa", home: 850, desk: 550 },
  { wilaya: "El Oued", home: 850, desk: 550 },
  { wilaya: "Ouargla", home: 850, desk: 550 },
  { wilaya: "Djelfa", home: 850, desk: 550 },
  { wilaya: "Tébessa", home: 850, desk: 550 },
  { wilaya: "Biskra", home: 850, desk: 550 },
  { wilaya: "Laghouat", home: 850, desk: 550 },
  { wilaya: "Ouled Djellal", home: 900, desk: 500 },
  { wilaya: "Touggourt", home: 900, desk: 500 },
  { wilaya: "El M'Ghair", home: 900, desk: 500 },
  { wilaya: "El Menia", home: 900, desk: 500 },
  { wilaya: "Timimoun", home: 1300, desk: 850 },
  { wilaya: "Bordj Badji Mokhtar", home: 1300, desk: 850 },
  { wilaya: "Béni Abbès", home: 1300, desk: 850 },
  { wilaya: "Naâma", home: 1350, desk: 900 },
  { wilaya: "El Bayadh", home: 1350, desk: 900 },
  { wilaya: "Béchar", home: 1350, desk: 900 },
  { wilaya: "Adrar", home: 1350, desk: 900 },
  { wilaya: "In Salah", home: 1500, desk: 1250 },
  { wilaya: "In Guezzam", home: 1500, desk: 1250 },
  { wilaya: "Djanet", home: 1500, desk: 1250 },
  { wilaya: "Tindouf", home: 1550, desk: 1300 },
  { wilaya: "Illizi", home: 1550, desk: 1300 },
  { wilaya: "Tamanrasset", home: 1550, desk: 1300 },
];

export function getEconomicShippingByWilaya(
  wilaya: string,
): WilayaShipping | undefined {
  return ECONOMIC_SHIPPING.find(
    (w) => w.wilaya.toLowerCase() === wilaya.toLowerCase(),
  );
}
