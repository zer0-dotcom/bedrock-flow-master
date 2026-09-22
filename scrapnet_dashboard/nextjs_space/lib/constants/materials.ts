export interface MaterialFactor {
  id: string;
  name: string;
  category: 'ASPHALT' | 'BIOCHAR_CDR' | 'METAL' | 'RUBBER' | 'GLASS' | 'CONCRETE' | 'WOOD' | 'PLASTIC' | 'TEXTILE';
  factor: number;
  source: string;
  description: string;
}

export const MATERIAL_FACTORS: MaterialFactor[] = [
  { id: 'rap_standard', name: 'Reclaimed Asphalt Pavement (RAP)', category: 'ASPHALT', factor: 0.058, source: 'ICE v4.1', description: 'Reclaimed asphalt aggregate displacement' },
  { id: 'wma_additive', name: 'Warm Mix Asphalt with Bio-flux', category: 'ASPHALT', factor: 0.042, source: 'Ecoinvent 3.9', description: 'Low-emission paving mixture' },
  { id: 'biochar_pyrolysis', name: 'Biochar CDR (High-Temp Pyrolysis)', category: 'BIOCHAR_CDR', factor: 2.860, source: 'Verra / Ecoinvent', description: 'High stability ratio H:Corg < 0.4' },
  { id: 'biochar_soil', name: 'Biochar Soil Amendment', category: 'BIOCHAR_CDR', factor: 2.450, source: 'EBI Carbon Standard', description: 'Agricultural sequestration carbon sink' },
  { id: 'scrap_steel', name: 'Recycled Structural Steel', category: 'METAL', factor: 1.890, source: 'WorldSteel / ICE v4.1', description: 'Avoided virgin blast-furnace emissions' },
  { id: 'recycled_aluminum', name: 'Secondary Aluminum Ingot', category: 'METAL', factor: 8.240, source: 'IAI / Ecoinvent', description: 'Avoided primary smelting electrical work' },
  { id: 'gripsy_composite', name: 'GRIPSY™ Recycled Polyurethane/Rubber Composite', category: 'RUBBER', factor: 1.680, source: 'ICE v4.1 / Manufacturer Attestation', description: 'Ergonomic traction mat composite' },
  { id: 'crumb_rubber', name: 'Recycled Tire Crumb Rubber', category: 'RUBBER', factor: 1.120, source: 'WRAP UK', description: 'Mechanical ambient granulation' },
  { id: 'container_glass', name: 'Recycled Container Cullet', category: 'GLASS', factor: 0.280, source: 'FEVE / ICE v4.1', description: 'Furnace energy reduction displacement' },
  { id: 'arch_float_glass', name: 'Architectural Float Glass Cullet', category: 'GLASS', factor: 0.350, source: 'Ecoinvent 3.9', description: 'Secondary architectural glazing' },
  { id: 'borosilicate_cullet', name: 'Borosilicate Technical Glass Cullet', category: 'GLASS', factor: 0.410, source: 'ICE v4.1', description: 'High thermal resistance industrial glass' },
  { id: 'recycled_concrete', name: 'Crushed Recycled Concrete Aggregate', category: 'CONCRETE', factor: 0.024, source: 'ICE v4.1', description: 'Virgin mineral quarrying displacement' },
  { id: 'dim_lumber', name: 'Reclaimed Dimensional Lumber', category: 'WOOD', factor: 1.960, source: 'ICE v4.1', description: 'Avoided landfill biogenic decomposition' }
];
