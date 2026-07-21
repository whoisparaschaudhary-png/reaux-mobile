import React, { useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { showAppAlert } from '../../stores/useUIStore';
import { useImagePicker } from '../../hooks/useImagePicker';
import { colors, fontFamily, typography, spacing, borderRadius, shadows } from '../../theme';
import { ms } from '../../utils/responsive';
import type { CyclePlan, CycleCategory, CycleLevel, CycleType, CycleRiskSeverity } from '../../types/models';
import type { CreateCycleRequest } from '../../types/api';

const CATEGORIES: { label: string; value: CycleCategory }[] = [
  { label: 'Bulking', value: 'bulking' },
  { label: 'Cutting', value: 'cutting' },
  { label: 'Recomp', value: 'recomp' },
  { label: 'PCT', value: 'pct' },
  { label: 'Other', value: 'other' },
];

const LEVELS: { label: string; value: CycleLevel }[] = [
  { label: 'Beginner', value: 'beginner' },
  { label: 'Intermediate', value: 'intermediate' },
  { label: 'Advanced', value: 'advanced' },
];

const TYPES: { label: string; value: CycleType }[] = [
  { label: 'Oral', value: 'oral' },
  { label: 'Injectable', value: 'injectable' },
  { label: 'Inj + Oral', value: 'inj-oral' },
];

const SEVERITIES: { label: string; value: CycleRiskSeverity }[] = [
  { label: 'Low', value: 'low' },
  { label: 'Medium', value: 'medium' },
  { label: 'High', value: 'high' },
];

interface CompoundDraft { name: string; dosage: string; frequency: string }
interface PhaseDraft { name: string; label: string; note: string; compounds: CompoundDraft[] }
interface PctItemDraft { name: string; dosage: string; duration: string }
interface RiskDraft { title: string; description: string; severity: CycleRiskSeverity }

const emptyCompound = (): CompoundDraft => ({ name: '', dosage: '', frequency: '' });
const emptyPhase = (): PhaseDraft => ({ name: '', label: '', note: '', compounds: [emptyCompound()] });
const emptyPctItem = (): PctItemDraft => ({ name: '', dosage: '', duration: '' });
const emptyRisk = (): RiskDraft => ({ title: '', description: '', severity: 'medium' });

interface CycleFormProps {
  initial?: CyclePlan | null;
  submitLabel: string;
  submitting: boolean;
  onSubmit: (payload: CreateCycleRequest | FormData) => Promise<void>;
}

export const CycleForm: React.FC<CycleFormProps> = ({ initial, submitLabel, submitting, onSubmit }) => {
  const [title, setTitle] = useState(initial?.title ?? '');
  const [description, setDescription] = useState(initial?.description ?? '');
  const [category, setCategory] = useState<CycleCategory>(initial?.category ?? 'bulking');
  const [level, setLevel] = useState<CycleLevel>(initial?.level ?? 'beginner');
  const [type, setType] = useState<CycleType>(initial?.type ?? 'inj-oral');
  const [durationWeeks, setDurationWeeks] = useState(initial?.durationWeeks ? String(initial.durationWeeks) : '');
  const [estimatedGain, setEstimatedGain] = useState(initial?.estimatedGain ?? '');
  const [tags, setTags] = useState((initial?.tags ?? []).join(', '));

  const [phases, setPhases] = useState<PhaseDraft[]>(
    initial?.phases?.length
      ? initial.phases.map((p) => ({
          name: p.name ?? '',
          label: p.label ?? '',
          note: p.note ?? '',
          compounds: p.compounds?.length
            ? p.compounds.map((c) => ({ name: c.name ?? '', dosage: c.dosage ?? '', frequency: c.frequency ?? '' }))
            : [emptyCompound()],
        }))
      : [emptyPhase()],
  );
  const [pctStartNote, setPctStartNote] = useState(initial?.pct?.startNote ?? '');
  const [pctItems, setPctItems] = useState<PctItemDraft[]>(
    initial?.pct?.items?.length
      ? initial.pct.items.map((i) => ({ name: i.name ?? '', dosage: i.dosage ?? '', duration: i.duration ?? '' }))
      : [],
  );
  const [risks, setRisks] = useState<RiskDraft[]>(
    initial?.risks?.length
      ? initial.risks.map((r) => ({ title: r.title ?? '', description: r.description ?? '', severity: r.severity ?? 'medium' }))
      : [],
  );

  const [openPicker, setOpenPicker] = useState<'category' | 'level' | 'type' | null>(null);
  const { image, pickImage, clearImage } = useImagePicker();
  const existingImage = initial?.image;

  // ---- phase helpers ----
  const updatePhase = (idx: number, patch: Partial<PhaseDraft>) =>
    setPhases((prev) => prev.map((p, i) => (i === idx ? { ...p, ...patch } : p)));
  const updateCompound = (pIdx: number, cIdx: number, patch: Partial<CompoundDraft>) =>
    setPhases((prev) =>
      prev.map((p, i) =>
        i === pIdx ? { ...p, compounds: p.compounds.map((c, j) => (j === cIdx ? { ...c, ...patch } : c)) } : p,
      ),
    );
  const addCompound = (pIdx: number) =>
    setPhases((prev) => prev.map((p, i) => (i === pIdx ? { ...p, compounds: [...p.compounds, emptyCompound()] } : p)));
  const removeCompound = (pIdx: number, cIdx: number) =>
    setPhases((prev) =>
      prev.map((p, i) => (i === pIdx ? { ...p, compounds: p.compounds.filter((_, j) => j !== cIdx) } : p)),
    );

  const handleSubmit = useCallback(async () => {
    if (!title.trim()) {
      showAppAlert('Validation', 'Please enter a cycle title.');
      return;
    }
    const durationNum = durationWeeks.trim() ? Number(durationWeeks) : NaN;
    if (durationWeeks.trim() && (Number.isNaN(durationNum) || durationNum <= 0)) {
      showAppAlert('Validation', 'Duration (weeks) must be a number greater than 0.');
      return;
    }

    // Clean nested structures — drop empty rows.
    const cleanPhases = phases
      .map((p) => ({
        name: p.name.trim(),
        label: p.label.trim() || undefined,
        note: p.note.trim() || undefined,
        compounds: p.compounds
          .filter((c) => c.name.trim())
          .map((c) => ({ name: c.name.trim(), dosage: c.dosage.trim() || undefined, frequency: c.frequency.trim() || undefined })),
      }))
      .filter((p) => p.name && p.compounds.length > 0);

    const cleanPctItems = pctItems
      .filter((i) => i.name.trim())
      .map((i) => ({ name: i.name.trim(), dosage: i.dosage.trim() || undefined, duration: i.duration.trim() || undefined }));
    const pct = pctStartNote.trim() || cleanPctItems.length > 0
      ? { startNote: pctStartNote.trim() || undefined, items: cleanPctItems }
      : undefined;

    const cleanRisks = risks
      .filter((r) => r.title.trim())
      .map((r) => ({ title: r.title.trim(), description: r.description.trim() || undefined, severity: r.severity }));

    const tagList = tags.split(',').map((t) => t.trim().replace(/^#/, '')).filter(Boolean);

    try {
      if (image && image.uri) {
        const form = new FormData();
        form.append('title', title.trim());
        form.append('category', category);
        form.append('level', level);
        form.append('type', type);
        if (description.trim()) form.append('description', description.trim());
        if (durationNum > 0) form.append('durationWeeks', String(durationNum));
        if (estimatedGain.trim()) form.append('estimatedGain', estimatedGain.trim());
        if (cleanPhases.length > 0) form.append('phases', JSON.stringify(cleanPhases));
        if (pct) form.append('pct', JSON.stringify(pct));
        if (cleanRisks.length > 0) form.append('risks', JSON.stringify(cleanRisks));
        if (tagList.length > 0) form.append('tags', JSON.stringify(tagList));
        form.append('isPublished', 'true');
        const imageFile: any = { uri: image.uri, type: image.type || 'image/jpeg', name: image.fileName || `cycle-${Date.now()}.jpg` };
        form.append('image', imageFile);
        await onSubmit(form);
      } else {
        await onSubmit({
          title: title.trim(),
          category,
          level,
          type,
          description: description.trim() || undefined,
          durationWeeks: durationNum > 0 ? durationNum : undefined,
          estimatedGain: estimatedGain.trim() || undefined,
          phases: cleanPhases.length > 0 ? cleanPhases : undefined,
          pct,
          risks: cleanRisks.length > 0 ? cleanRisks : undefined,
          tags: tagList.length > 0 ? tagList : undefined,
          isPublished: true,
        });
      }
    } catch (error: any) {
      let errorMessage = error?.message || 'Failed to save cycle';
      const fieldErrors = error?.errors?.fieldErrors;
      if (fieldErrors && typeof fieldErrors === 'object') {
        const firstMessages = Object.values(fieldErrors).flat();
        if (Array.isArray(firstMessages) && firstMessages.length > 0 && typeof firstMessages[0] === 'string') {
          errorMessage = firstMessages[0];
        }
      }
      showAppAlert('Error', errorMessage);
    }
  }, [title, description, category, level, type, durationWeeks, estimatedGain, tags, phases, pctStartNote, pctItems, risks, image, onSubmit]);

  const renderDropdown = (
    label: string,
    key: 'category' | 'level' | 'type',
    options: { label: string; value: string }[],
    value: string,
    setValue: (v: any) => void,
  ) => (
    <View style={styles.fieldSpacing}>
      <Text style={styles.label}>{label}</Text>
      <TouchableOpacity
        style={styles.dropdown}
        onPress={() => setOpenPicker(openPicker === key ? null : key)}
        activeOpacity={0.7}
      >
        <Text style={styles.dropdownText}>{options.find((o) => o.value === value)?.label || `Select ${label}`}</Text>
        <Ionicons name={openPicker === key ? 'chevron-up' : 'chevron-down'} size={20} color={colors.text.secondary} />
      </TouchableOpacity>
      {openPicker === key && (
        <View style={[styles.optionList, shadows.card]}>
          {options.map((o) => (
            <TouchableOpacity
              key={o.value}
              style={[styles.option, value === o.value && styles.optionActive]}
              onPress={() => {
                setValue(o.value);
                setOpenPicker(null);
              }}
              activeOpacity={0.7}
            >
              <Text style={[styles.optionText, value === o.value && styles.optionTextActive]}>{o.label}</Text>
              {value === o.value && <Ionicons name="checkmark" size={18} color={colors.primary.yellowDark} />}
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );

  return (
    <View>
      <Input label="Cycle Title" placeholder="e.g. Test E + Deca Mass Builder" value={title} onChangeText={setTitle} />

      {renderDropdown('Category', 'category', CATEGORIES, category, setCategory)}
      {renderDropdown('Level', 'level', LEVELS, level, setLevel)}
      {renderDropdown('Type', 'type', TYPES, type, setType)}

      <View style={styles.rowTwo}>
        <View style={styles.rowItem}>
          <Input label="Duration (weeks)" placeholder="16" value={durationWeeks} onChangeText={setDurationWeeks} keyboardType="number-pad" />
        </View>
        <View style={styles.rowItem}>
          <Input label="Est. Gain" placeholder="15-20 lbs" value={estimatedGain} onChangeText={setEstimatedGain} />
        </View>
      </View>

      <Input
        label="Description"
        placeholder="Describe this cycle protocol..."
        value={description}
        onChangeText={setDescription}
        multiline
        style={styles.fieldSpacing}
      />

      {/* Image */}
      <View style={styles.fieldSpacing}>
        <Text style={styles.label}>Cover Image</Text>
        {image || existingImage ? (
          <View style={styles.imagePreviewContainer}>
            <Image source={{ uri: image?.uri || existingImage }} style={styles.imagePreview} contentFit="cover" transition={200} />
            {image ? (
              <TouchableOpacity style={styles.removeImageButton} onPress={clearImage} activeOpacity={0.7}>
                <Ionicons name="close-circle" size={28} color={colors.status.error} />
              </TouchableOpacity>
            ) : (
              <TouchableOpacity style={styles.changeImageButton} onPress={pickImage} activeOpacity={0.7}>
                <Text style={styles.changeImageText}>Change</Text>
              </TouchableOpacity>
            )}
          </View>
        ) : (
          <TouchableOpacity style={styles.uploadButton} onPress={pickImage} activeOpacity={0.7}>
            <Ionicons name="cloud-upload-outline" size={28} color={colors.text.light} />
            <Text style={styles.uploadText}>Tap to upload image</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Phases */}
      <View style={styles.sectionHeaderRow}>
        <Text style={styles.sectionTitle}>Protocol Phases</Text>
        <TouchableOpacity onPress={() => setPhases((p) => [...p, emptyPhase()])} activeOpacity={0.7} style={styles.addChip}>
          <Ionicons name="add" size={16} color={colors.text.onPrimary} />
          <Text style={styles.addChipText}>Phase</Text>
        </TouchableOpacity>
      </View>

      {phases.map((phase, pIdx) => (
        <View key={pIdx} style={[styles.nestedCard, shadows.card]}>
          <View style={styles.nestedHeader}>
            <Text style={styles.nestedTitle}>Phase {pIdx + 1}</Text>
            {phases.length > 1 && (
              <TouchableOpacity onPress={() => setPhases((p) => p.filter((_, i) => i !== pIdx))} hitSlop={8}>
                <Ionicons name="trash-outline" size={18} color={colors.status.error} />
              </TouchableOpacity>
            )}
          </View>
          <Input label="Weeks / Name" placeholder="e.g. Weeks 1-6" value={phase.name} onChangeText={(t) => updatePhase(pIdx, { name: t })} />
          <Input label="Phase Label" placeholder="e.g. Kickstart Phase" value={phase.label} onChangeText={(t) => updatePhase(pIdx, { label: t })} style={styles.fieldSpacing} />

          <Text style={[styles.label, styles.fieldSpacing]}>Compounds</Text>
          {phase.compounds.map((compound, cIdx) => (
            <View key={cIdx} style={styles.compoundBlock}>
              <View style={styles.compoundHeader}>
                <Text style={styles.compoundIndex}>#{cIdx + 1}</Text>
                {phase.compounds.length > 1 && (
                  <TouchableOpacity onPress={() => removeCompound(pIdx, cIdx)} hitSlop={8}>
                    <Ionicons name="close-circle-outline" size={18} color={colors.text.light} />
                  </TouchableOpacity>
                )}
              </View>
              <Input placeholder="Compound (e.g. Testosterone Enanthate)" value={compound.name} onChangeText={(t) => updateCompound(pIdx, cIdx, { name: t })} />
              <View style={styles.rowTwo}>
                <View style={styles.rowItem}>
                  <Input placeholder="500mg / week" value={compound.dosage} onChangeText={(t) => updateCompound(pIdx, cIdx, { dosage: t })} style={styles.fieldSpacingSm} />
                </View>
                <View style={styles.rowItem}>
                  <Input placeholder="Pin Mon/Thu" value={compound.frequency} onChangeText={(t) => updateCompound(pIdx, cIdx, { frequency: t })} style={styles.fieldSpacingSm} />
                </View>
              </View>
            </View>
          ))}
          <TouchableOpacity onPress={() => addCompound(pIdx)} activeOpacity={0.7} style={styles.addRow}>
            <Ionicons name="add-circle-outline" size={18} color={colors.primary.yellowDark} />
            <Text style={styles.addRowText}>Add compound</Text>
          </TouchableOpacity>

          <Input label="Note (optional)" placeholder="e.g. Drop Dianabol. Monitor E2 levels." value={phase.note} onChangeText={(t) => updatePhase(pIdx, { note: t })} multiline style={styles.fieldSpacing} />
        </View>
      ))}

      {/* PCT */}
      <View style={styles.sectionHeaderRow}>
        <Text style={styles.sectionTitle}>Post Cycle Therapy</Text>
        <TouchableOpacity onPress={() => setPctItems((p) => [...p, emptyPctItem()])} activeOpacity={0.7} style={styles.addChip}>
          <Ionicons name="add" size={16} color={colors.text.onPrimary} />
          <Text style={styles.addChipText}>Item</Text>
        </TouchableOpacity>
      </View>
      <Input label="PCT Start Note" placeholder="e.g. Start 14-18 days after last injection." value={pctStartNote} onChangeText={setPctStartNote} multiline />
      {pctItems.map((item, i) => (
        <View key={i} style={[styles.nestedCard, shadows.card]}>
          <View style={styles.nestedHeader}>
            <Text style={styles.nestedTitle}>PCT Item {i + 1}</Text>
            <TouchableOpacity onPress={() => setPctItems((p) => p.filter((_, j) => j !== i))} hitSlop={8}>
              <Ionicons name="trash-outline" size={18} color={colors.status.error} />
            </TouchableOpacity>
          </View>
          <Input placeholder="Name (e.g. Nolvadex)" value={item.name} onChangeText={(t) => setPctItems((p) => p.map((x, j) => (j === i ? { ...x, name: t } : x)))} />
          <View style={styles.rowTwo}>
            <View style={styles.rowItem}>
              <Input placeholder="40/40/20/20 mg" value={item.dosage} onChangeText={(t) => setPctItems((p) => p.map((x, j) => (j === i ? { ...x, dosage: t } : x)))} style={styles.fieldSpacingSm} />
            </View>
            <View style={styles.rowItem}>
              <Input placeholder="Daily for 4 weeks" value={item.duration} onChangeText={(t) => setPctItems((p) => p.map((x, j) => (j === i ? { ...x, duration: t } : x)))} style={styles.fieldSpacingSm} />
            </View>
          </View>
        </View>
      ))}

      {/* Risks */}
      <View style={styles.sectionHeaderRow}>
        <Text style={styles.sectionTitle}>Potential Risks</Text>
        <TouchableOpacity onPress={() => setRisks((r) => [...r, emptyRisk()])} activeOpacity={0.7} style={styles.addChip}>
          <Ionicons name="add" size={16} color={colors.text.onPrimary} />
          <Text style={styles.addChipText}>Risk</Text>
        </TouchableOpacity>
      </View>
      {risks.map((risk, i) => (
        <View key={i} style={[styles.nestedCard, shadows.card]}>
          <View style={styles.nestedHeader}>
            <Text style={styles.nestedTitle}>Risk {i + 1}</Text>
            <TouchableOpacity onPress={() => setRisks((r) => r.filter((_, j) => j !== i))} hitSlop={8}>
              <Ionicons name="trash-outline" size={18} color={colors.status.error} />
            </TouchableOpacity>
          </View>
          <Input placeholder="Title (e.g. Water Retention)" value={risk.title} onChangeText={(t) => setRisks((r) => r.map((x, j) => (j === i ? { ...x, title: t } : x)))} />
          <Input placeholder="Description" value={risk.description} onChangeText={(t) => setRisks((r) => r.map((x, j) => (j === i ? { ...x, description: t } : x)))} multiline style={styles.fieldSpacingSm} />
          <View style={styles.severityRow}>
            {SEVERITIES.map((s) => (
              <TouchableOpacity
                key={s.value}
                style={[styles.severityChip, risk.severity === s.value && styles.severityChipActive]}
                onPress={() => setRisks((r) => r.map((x, j) => (j === i ? { ...x, severity: s.value } : x)))}
                activeOpacity={0.7}
              >
                <Text style={[styles.severityText, risk.severity === s.value && styles.severityTextActive]}>{s.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      ))}

      <Input label="Tags (comma separated)" placeholder="e.g. wet-bulk, 16-week, intermediate" value={tags} onChangeText={setTags} style={styles.fieldSpacing} />

      <View style={styles.submitSection}>
        <Button title={submitLabel} onPress={handleSubmit} variant="primary" size="lg" fullWidth loading={submitting} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  fieldSpacing: { marginTop: spacing.lg },
  fieldSpacingSm: { marginTop: spacing.sm },
  label: {
    fontFamily: fontFamily.medium,
    fontSize: ms(14),
    lineHeight: ms(20),
    color: colors.text.primary,
    marginBottom: spacing.sm,
  },
  sectionTitle: {
    ...typography.h4,
    color: colors.text.primary,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.xxl,
    marginBottom: spacing.sm,
  },
  addChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.primary.yellow,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.pill,
  },
  addChipText: {
    fontFamily: fontFamily.bold,
    fontSize: ms(12),
    lineHeight: ms(16),
    color: colors.text.onPrimary,
  },
  rowTwo: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.lg,
  },
  rowItem: { flex: 1 },
  dropdown: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1.5,
    borderColor: colors.border.gray,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.background.white,
    paddingHorizontal: spacing.lg,
    minHeight: 48,
  },
  dropdownText: {
    fontFamily: fontFamily.regular,
    fontSize: ms(16),
    lineHeight: ms(24),
    color: colors.text.primary,
  },
  optionList: {
    backgroundColor: colors.background.white,
    borderRadius: borderRadius.lg,
    marginTop: spacing.xs,
    overflow: 'hidden',
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  optionActive: { backgroundColor: colors.primary.yellowLight },
  optionText: {
    fontFamily: fontFamily.regular,
    fontSize: ms(15),
    lineHeight: ms(22),
    color: colors.text.primary,
  },
  optionTextActive: { fontFamily: fontFamily.medium },
  imagePreviewContainer: {
    position: 'relative',
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
  },
  imagePreview: {
    width: '100%',
    height: 180,
    borderRadius: borderRadius.lg,
  },
  removeImageButton: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
  },
  changeImageButton: {
    position: 'absolute',
    bottom: spacing.sm,
    right: spacing.sm,
    backgroundColor: colors.overlay.dark,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.pill,
  },
  changeImageText: {
    fontFamily: fontFamily.medium,
    fontSize: ms(12),
    color: colors.text.white,
  },
  uploadButton: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 140,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: colors.border.gray,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.border.light,
    gap: spacing.sm,
  },
  uploadText: {
    fontFamily: fontFamily.medium,
    fontSize: ms(14),
    lineHeight: ms(20),
    color: colors.text.light,
  },
  nestedCard: {
    backgroundColor: colors.background.card,
    borderRadius: borderRadius.card,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  nestedHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  nestedTitle: {
    fontFamily: fontFamily.bold,
    fontSize: ms(15),
    lineHeight: ms(20),
    color: colors.text.primary,
  },
  compoundBlock: {
    backgroundColor: colors.background.light,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginTop: spacing.sm,
  },
  compoundHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  compoundIndex: {
    fontFamily: fontFamily.medium,
    fontSize: ms(12),
    color: colors.text.light,
  },
  addRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.md,
  },
  addRowText: {
    fontFamily: fontFamily.medium,
    fontSize: ms(13),
    color: colors.primary.yellowDark,
  },
  severityRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  severityChip: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border.gray,
  },
  severityChipActive: {
    backgroundColor: colors.primary.yellowLight,
    borderColor: colors.primary.yellow,
  },
  severityText: {
    fontFamily: fontFamily.medium,
    fontSize: ms(13),
    color: colors.text.secondary,
  },
  severityTextActive: {
    color: colors.text.primary,
  },
  submitSection: {
    marginTop: spacing.xxl,
  },
});
