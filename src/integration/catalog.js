import drafts from './draft-exercises.json' with { type: 'json' };
import { testExercise } from '../test-exercise.js';
import { validateCatalog } from '../models/exercise.js';

// Enda stället som senare byts till en databas-/API-adapter.
// Utkasten har ingen riktig video eller fastställd längd och är inte nedladdningsbara.
// Teknikprovet använder samma nätfilm och ID som ditt fungerande B2-prov.
export async function loadCatalog() {
  const technical = {
    ...testExercise,
    title_sv: 'Testfilm',
    category_sv: 'Test',
    session_type: 'short',
    description_sv: 'Ladda ned filmen. Stäng sedan av internet och spela den igen.',
    is_technical: true
  };
  validateCatalog([technical]);
  return [technical, ...drafts.map(row => ({ ...row }))];
}
