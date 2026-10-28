import type { CatalogTest, Icd10Code, TestDefinition } from '../types'

// Reference ranges are simplified adult ranges for the prototype only.
export const TEST_DEFINITIONS: TestDefinition[] = [
  { loinc: '4548-4', name: 'HbA1c (glycated hemoglobin)', shortName: 'HbA1c', unit: '%', refLow: 4.0, refHigh: 5.6, decimals: 1 },
  { loinc: '2345-7', name: 'Glucose, fasting', shortName: 'Glucose', unit: 'mmol/L', refLow: 3.9, refHigh: 5.5, decimals: 1 },
  { loinc: '2093-3', name: 'Total cholesterol', shortName: 'Cholesterol', unit: 'mmol/L', refLow: null, refHigh: 5.2, decimals: 1 },
  { loinc: '2089-1', name: 'LDL cholesterol', shortName: 'LDL', unit: 'mmol/L', refLow: null, refHigh: 3.0, decimals: 1 },
  { loinc: '2571-8', name: 'Triglycerides', shortName: 'Triglycerides', unit: 'mmol/L', refLow: null, refHigh: 1.7, decimals: 1 },
  { loinc: '2160-0', name: 'Creatinine', shortName: 'Creatinine', unit: 'µmol/L', refLow: 62, refHigh: 115, decimals: 0 },
  { loinc: '718-7', name: 'Hemoglobin', shortName: 'Hemoglobin', unit: 'g/L', refLow: 120, refHigh: 160, decimals: 0 },
  { loinc: '6690-2', name: 'White blood cells', shortName: 'WBC', unit: '10⁹/L', refLow: 4.0, refHigh: 10.0, decimals: 1 },
  { loinc: '777-3', name: 'Platelets', shortName: 'Platelets', unit: '10⁹/L', refLow: 150, refHigh: 400, decimals: 0 },
  { loinc: '3016-3', name: 'TSH (thyroid-stimulating hormone)', shortName: 'TSH', unit: 'mIU/L', refLow: 0.4, refHigh: 4.0, decimals: 2 },
  { loinc: '2276-4', name: 'Ferritin', shortName: 'Ferritin', unit: 'ng/mL', refLow: 15, refHigh: 150, decimals: 0 },
  { loinc: '1989-3', name: 'Vitamin D (25-OH)', shortName: 'Vitamin D', unit: 'ng/mL', refLow: 30, refHigh: 100, decimals: 0 },
]

export const CATALOG: CatalogTest[] = [
  { id: 'hba1c', name: 'HbA1c', loinc: '4548-4', components: ['4548-4'], priceAzn: 18 },
  { id: 'glucose', name: 'Fasting glucose', loinc: '2345-7', components: ['2345-7'], priceAzn: 6 },
  { id: 'cholesterol', name: 'Total cholesterol', loinc: '2093-3', components: ['2093-3'], priceAzn: 7 },
  { id: 'lipid', name: 'Lipid panel', loinc: '57698-3', components: ['2093-3', '2089-1', '2571-8'], priceAzn: 22 },
  { id: 'creatinine', name: 'Creatinine', loinc: '2160-0', components: ['2160-0'], priceAzn: 7 },
  { id: 'cbc', name: 'Complete blood count', loinc: '58410-2', components: ['718-7', '6690-2', '777-3'], priceAzn: 12 },
  { id: 'hemoglobin', name: 'Hemoglobin', loinc: '718-7', components: ['718-7'], priceAzn: 5 },
  { id: 'tsh', name: 'TSH', loinc: '3016-3', components: ['3016-3'], priceAzn: 15 },
  { id: 'ferritin', name: 'Ferritin', loinc: '2276-4', components: ['2276-4'], priceAzn: 16 },
  { id: 'vitd', name: 'Vitamin D (25-OH)', loinc: '1989-3', components: ['1989-3'], priceAzn: 35 },
]

export const ICD10: Icd10Code[] = [
  { code: 'E11', name: 'Type 2 diabetes mellitus' },
  { code: 'I10', name: 'Essential (primary) hypertension' },
  { code: 'Z34', name: 'Supervision of normal pregnancy' },
  { code: 'D50', name: 'Iron deficiency anemia' },
  { code: 'E03', name: 'Hypothyroidism' },
  { code: 'E78', name: 'Hyperlipidemia' },
  { code: 'I25', name: 'Chronic ischemic heart disease' },
  { code: 'N18', name: 'Chronic kidney disease' },
  { code: 'O24', name: 'Diabetes mellitus in pregnancy' },
  { code: 'E66', name: 'Obesity' },
  { code: 'R07', name: 'Pain in throat and chest' },
  { code: 'J06', name: 'Acute upper respiratory infection' },
  { code: 'K21', name: 'Gastro-esophageal reflux disease' },
  { code: 'M54', name: 'Dorsalgia (back pain)' },
]

export const BAKU_AREAS = ['Nasimi', 'Yasamal', 'Narimanov', 'Sabail', 'Khatai', 'Nizami', 'Binagadi']
