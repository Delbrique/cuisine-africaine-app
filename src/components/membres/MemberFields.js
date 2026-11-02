import React from 'react';
import { Autocomplete, Box, Chip, Collapse, MenuItem, TextField } from '@mui/material';
import { ChipSelect } from '../ui';
import { ALLERGIES, ANTECEDENTS, GROUPES_SANGUINS, PROFESSIONS, ROLES, SEXES, SITUATIONS, SUGGESTIONS } from '../../constants';
import { withRas } from './memberModel';

const grid = { display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' } };

/** Champ texte libre avec suggestions. */
export function SuggestField({ label, value, onChange, options, placeholder }) {
  return (
    <Autocomplete
      freeSolo
      options={options}
      value={value || null}
      inputValue={value || ''}
      onInputChange={(_, v) => onChange(v)}
      renderInput={(params) => <TextField {...params} label={label} placeholder={placeholder} />}
    />
  );
}

export function IdentityFields({ form, set, showEmail = true, emailDisabled = false }) {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      {showEmail && (
        <TextField
          label="Email" type="email" value={form.email} required disabled={emailDisabled}
          onChange={(e) => set({ email: e.target.value })}
          helperText={emailDisabled ? "L'email identifie le membre et ne peut pas être modifié." : undefined}
        />
      )}
      <Box sx={grid}>
        <TextField label="Nom complet" value={form.nomComplet} required onChange={(e) => set({ nomComplet: e.target.value })} />
        <TextField label="Âge" type="number" value={form.age} required inputProps={{ min: 0, max: 130 }} onChange={(e) => set({ age: e.target.value })} />
      </Box>
      <ChipSelect label="Sexe" options={SEXES} value={form.sexe} single allowEmpty={false} onChange={(v) => set({ sexe: v })} />
    </Box>
  );
}

export function RoleHealthFields({ form, set }) {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      <Box>
        <ChipSelect
          label="Rôle dans la famille" color="secondary"
          options={[...ROLES, 'Autre']} value={form.roleFamille}
          onChange={(v) => set({ roleFamille: v })}
        />
        <Collapse in={form.roleFamille.includes('Autre')}>
          <TextField size="small" label="Précisez le rôle" value={form.autreRoleFamille} onChange={(e) => set({ autreRoleFamille: e.target.value })} sx={{ mt: 1.5, maxWidth: 360 }} fullWidth />
        </Collapse>
      </Box>
      <Box>
        <ChipSelect
          label="Antécédents médicaux" color="warning"
          options={[{ value: 'RAS', label: 'Rien à signaler' }, ...ANTECEDENTS, 'Autre']}
          value={form.antecedentsMedicaux}
          onChange={(v) => set({ antecedentsMedicaux: withRas(form.antecedentsMedicaux, v) })}
        />
        <Collapse in={form.antecedentsMedicaux.includes('Autre')}>
          <TextField size="small" label="Précisez l'antécédent" value={form.autreAntecedent} onChange={(e) => set({ autreAntecedent: e.target.value })} sx={{ mt: 1.5, maxWidth: 360 }} fullWidth />
        </Collapse>
      </Box>
    </Box>
  );
}

export function AllergyFields({ form, set }) {
  return (
    <Box>
      <ChipSelect
        label="Allergies connues" color="error"
        options={[{ value: 'RAS', label: 'Aucune' }, ...ALLERGIES, 'Autre']}
        value={form.allergiesConnues}
        onChange={(v) => set({ allergiesConnues: withRas(form.allergiesConnues, v) })}
      />
      <Collapse in={form.allergiesConnues.includes('Autre')}>
        <TextField size="small" label="Précisez l'allergie" value={form.autreAllergie} onChange={(e) => set({ autreAllergie: e.target.value })} sx={{ mt: 1.5, maxWidth: 360 }} fullWidth />
      </Collapse>
    </Box>
  );
}

export function PersonalFields({ form, set }) {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
      <Box sx={grid}>
        <TextField label="Date de naissance" type="date" value={form.dateNaissance} onChange={(e) => set({ dateNaissance: e.target.value })} InputLabelProps={{ shrink: true }} />
        <TextField label="Lieu de naissance" value={form.lieuNaissance} onChange={(e) => set({ lieuNaissance: e.target.value })} />
        <SuggestField label="Langues parlées" value={form.languesParlees} onChange={(v) => set({ languesParlees: v })} options={SUGGESTIONS.langues} placeholder="Ex : Français, Ewondo" />
        <TextField label="Nationalité" value={form.nationalite} onChange={(e) => set({ nationalite: e.target.value })} />
        <TextField select label="Situation matrimoniale" value={form.situationMatrimoniale} onChange={(e) => set({ situationMatrimoniale: e.target.value })}>
          <MenuItem value=""><em>Non précisée</em></MenuItem>
          {SITUATIONS.map((s) => <MenuItem key={s} value={s}>{s}</MenuItem>)}
        </TextField>
        <TextField label="Téléphone" type="tel" value={form.telephone} onChange={(e) => set({ telephone: e.target.value })} placeholder="+237 6XX XXX XXX" />
      </Box>
      <Box>
        <ChipSelect label="Profession" single options={PROFESSIONS} value={form.profession} onChange={(v) => set({ profession: v })} />
        <Collapse in={form.profession === 'Étudiant'}>
          <TextField size="small" label="Niveau d'étude" value={form.niveauEtude} onChange={(e) => set({ niveauEtude: e.target.value })} sx={{ mt: 1.5, maxWidth: 360 }} fullWidth />
        </Collapse>
        <Collapse in={form.profession === 'Autre'}>
          <TextField size="small" label="Précisez la profession" value={form.autreProfession} onChange={(e) => set({ autreProfession: e.target.value })} sx={{ mt: 1.5, maxWidth: 360 }} fullWidth />
        </Collapse>
      </Box>
    </Box>
  );
}

export function BodyFields({ form, set }) {
  return (
    <Box sx={{ ...grid, gridTemplateColumns: { xs: '1fr 1fr', sm: '1fr 1fr 1fr' } }}>
      <TextField label="Taille (cm)" type="number" value={form.taille} inputProps={{ min: 0 }} onChange={(e) => set({ taille: e.target.value })} />
      <TextField label="Poids (kg)" type="number" value={form.poids} inputProps={{ min: 0 }} onChange={(e) => set({ poids: e.target.value })} />
      <TextField select label="Groupe sanguin" value={form.groupeSanguin} onChange={(e) => set({ groupeSanguin: e.target.value })} sx={{ gridColumn: { xs: 'span 2', sm: 'auto' } }}>
        <MenuItem value=""><em>Inconnu</em></MenuItem>
        {GROUPES_SANGUINS.map((g) => <MenuItem key={g} value={g}>{g}</MenuItem>)}
      </TextField>
    </Box>
  );
}

export function EmergencyFields({ form, set }) {
  return (
    <Box sx={grid}>
      <TextField label="Nom du contact" value={form.nomCompletContactUrgence} onChange={(e) => set({ nomCompletContactUrgence: e.target.value })} />
      <TextField label="Lien de parenté" value={form.relationContactUrgence} onChange={(e) => set({ relationContactUrgence: e.target.value })} placeholder="Époux, frère, amie…" />
      <TextField label="Téléphone du contact" type="tel" value={form.telephoneContactUrgence} onChange={(e) => set({ telephoneContactUrgence: e.target.value })} placeholder="+237 6XX XXX XXX" sx={{ gridColumn: { sm: 'span 2' } }} />
    </Box>
  );
}

export function PreferenceFields({ form, set, plats = [] }) {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
      <Autocomplete
        multiple
        options={plats.map((p) => p.id)}
        getOptionLabel={(id) => plats.find((p) => p.id === id)?.nom || 'Plat supprimé'}
        value={form.platsPreferes}
        onChange={(_, v) => set({ platsPreferes: v })}
        noOptionsText="Aucun plat — ajoutez-en dans « Plats »"
        renderTags={(value, getTagProps) =>
          value.map((id, i) => {
            const { key, ...rest } = getTagProps({ index: i });
            return <Chip key={key} color="secondary" label={plats.find((p) => p.id === id)?.nom || 'Plat supprimé'} {...rest} />;
          })
        }
        renderInput={(params) => <TextField {...params} label="Plats préférés" placeholder="Rechercher un plat" />}
      />
      <Autocomplete
        multiple freeSolo
        options={SUGGESTIONS.loisirs}
        value={form.loisirsHobbies}
        onChange={(_, v) => set({ loisirsHobbies: v })}
        renderTags={(value, getTagProps) =>
          value.map((v, i) => {
            const { key, ...rest } = getTagProps({ index: i });
            return <Chip key={key} label={v} {...rest} />;
          })
        }
        renderInput={(params) => <TextField {...params} label="Loisirs" placeholder="Ajouter un loisir" />}
      />
      <Box sx={grid}>
        <SuggestField label="Couleur préférée" value={form.couleurPreferee} onChange={(v) => set({ couleurPreferee: v })} options={SUGGESTIONS.couleurs} />
        <SuggestField label="Film / série préféré(e)" value={form.filmSeriePrefere} onChange={(v) => set({ filmSeriePrefere: v })} options={SUGGESTIONS.films} />
      </Box>
      <SuggestField label="Animaux de compagnie" value={form.animauxCompagnie} onChange={(v) => set({ animauxCompagnie: v })} options={SUGGESTIONS.animaux} placeholder="Ex : Chien (Buddy)" />
    </Box>
  );
}
