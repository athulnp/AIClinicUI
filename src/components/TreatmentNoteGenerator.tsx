import { useState, useEffect } from 'react';
import { Loader2, Sparkles, Save, RotateCcw, AlertCircle } from 'lucide-react';
import { treatmentNotesApi } from '../api/services';
import { generateTreatmentNoteSchema, createTreatmentNoteSchema } from '../validations/treatmentNoteValidation';
import { Button, Input, Card, CardHeader } from './ui';
import type { GenerateTreatmentNoteFormData, CreateTreatmentNoteFormData } from '../validations/treatmentNoteValidation';

interface TreatmentNoteGeneratorProps {
  patientId: number;
  appointmentId: number;
  onSave?: () => void;
}

export function TreatmentNoteGenerator({ patientId, appointmentId, onSave }: TreatmentNoteGeneratorProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [generatedNote, setGeneratedNote] = useState('');
  const [finalNote, setFinalNote] = useState('');
  const [savedNotes, setSavedNotes] = useState<any[]>([]);
  const [loadingNotes, setLoadingNotes] = useState(false);
  const [formData, setFormData] = useState<GenerateTreatmentNoteFormData>({
    patientId,
    appointmentId,
    procedureType: '',
    toothNumber: '',
    symptoms: '',
    diagnosis: '',
    treatmentPerformed: '',
    additionalNotes: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    loadSavedNotes();
  }, [appointmentId]);

  const loadSavedNotes = async () => {
    setLoadingNotes(true);
    try {
      const notes = await treatmentNotesApi.getByAppointment(appointmentId);
      setSavedNotes(notes || []);
    } catch (error) {
      console.error('Error loading saved treatment notes:', error);
    } finally {
      setLoadingNotes(false);
    }
  };

  const setFieldError = (field: string, message: string) => {
    setErrors((prev) => ({ ...prev, [field]: message }));
  };

  const clearFieldError = (field: string) => {
    setErrors((prev) => {
      const newErrors = { ...prev };
      delete newErrors[field];
      return newErrors;
    });
  };

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const result = generateTreatmentNoteSchema.safeParse(formData);
    if (!result.success) {
      const newErrors: Record<string, string> = {};
      result.error.issues.forEach((err) => {
        newErrors[err.path.join('.')] = err.message;
      });
      setErrors(newErrors);
      return;
    }

    setIsGenerating(true);
    setErrors({});
    try {
      const response = await treatmentNotesApi.generate(formData);
      setGeneratedNote(response.generatedNote);
      setFinalNote(response.generatedNote);
    } catch (error: any) {
      console.error('Error generating treatment note:', error);
      setFieldError('general', 'Failed to generate treatment note. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    const saveData: CreateTreatmentNoteFormData = {
      ...formData,
      aiGeneratedNote: generatedNote,
      finalNote,
    };

    const result = createTreatmentNoteSchema.safeParse(saveData);
    if (!result.success) {
      const newErrors: Record<string, string> = {};
      result.error.issues.forEach((err) => {
        newErrors[err.path.join('.')] = err.message;
      });
      setErrors(newErrors);
      return;
    }

    setIsSaving(true);
    setErrors({});
    try {
      await treatmentNotesApi.save(saveData);
      await loadSavedNotes();
      onSave?.();
    } catch (error: any) {
      console.error('Error saving treatment note:', error);
      setFieldError('general', 'Failed to save treatment note. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleRegenerate = async () => {
    handleGenerate(new Event('submit') as any);
  };

  return (
    <Card className="w-full">
      <CardHeader title="AI Treatment Notes Generator" />
      <div className="px-6 py-5 space-y-6">
        {/* Warning Banner */}
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-start gap-3">
          <AlertCircle className="text-amber-600 mt-0.5 flex-shrink-0" size={20} />
          <div className="text-sm text-amber-800">
            <strong>Important:</strong> AI-generated notes must be reviewed and edited by the dentist before saving. Never auto-save AI-generated clinical notes.
          </div>
        </div>

        <form onSubmit={handleGenerate} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Procedure Type"
              value={formData.procedureType}
              onChange={(e) => {
                setFormData({ ...formData, procedureType: e.target.value });
                clearFieldError('procedureType');
              }}
              error={errors.procedureType}
              placeholder="e.g., Root Canal, Filling, Extraction"
            />
            <Input
              label="Tooth Number (Optional)"
              value={formData.toothNumber}
              onChange={(e) => {
                setFormData({ ...formData, toothNumber: e.target.value });
                clearFieldError('toothNumber');
              }}
              error={errors.toothNumber}
              placeholder="e.g., 26, 18, 31"
            />
          </div>

          <div>
            <label className="block text-sm mb-2 font-semibold text-[#191c1d]">Symptoms</label>
            <textarea
              className={`w-full rounded-lg border border-[#bfc7d1] bg-white px-4 py-3 text-[#191c1d] outline-none transition-all duration-200 focus:border-[#005d90] focus:bg-white focus:ring-2 focus:ring-[#005d90]/20 placeholder:text-[#707881] min-h-[100px] ${errors.symptoms ? 'border-[#ba1a1a] focus:border-[#ba1a1a] focus:ring-[#ba1a1a]/20' : ''}`}
              value={formData.symptoms}
              onChange={(e) => {
                setFormData({ ...formData, symptoms: e.target.value });
                clearFieldError('symptoms');
              }}
              placeholder="Describe patient symptoms..."
              rows={3}
            />
            {errors.symptoms && (
              <span className="mt-2 block text-xs text-[#ba1a1a]">{errors.symptoms}</span>
            )}
          </div>

          <div>
            <label className="block text-sm mb-2 font-semibold text-[#191c1d]">Diagnosis</label>
            <textarea
              className={`w-full rounded-lg border border-[#bfc7d1] bg-white px-4 py-3 text-[#191c1d] outline-none transition-all duration-200 focus:border-[#005d90] focus:bg-white focus:ring-2 focus:ring-[#005d90]/20 placeholder:text-[#707881] min-h-[100px] ${errors.diagnosis ? 'border-[#ba1a1a] focus:border-[#ba1a1a] focus:ring-[#ba1a1a]/20' : ''}`}
              value={formData.diagnosis}
              onChange={(e) => {
                setFormData({ ...formData, diagnosis: e.target.value });
                clearFieldError('diagnosis');
              }}
              placeholder="Enter diagnosis..."
              rows={3}
            />
            {errors.diagnosis && (
              <span className="mt-2 block text-xs text-[#ba1a1a]">{errors.diagnosis}</span>
            )}
          </div>

          <div>
            <label className="block text-sm mb-2 font-semibold text-[#191c1d]">Treatment Performed</label>
            <textarea
              className={`w-full rounded-lg border border-[#bfc7d1] bg-white px-4 py-3 text-[#191c1d] outline-none transition-all duration-200 focus:border-[#005d90] focus:bg-white focus:ring-2 focus:ring-[#005d90]/20 placeholder:text-[#707881] min-h-[100px] ${errors.treatmentPerformed ? 'border-[#ba1a1a] focus:border-[#ba1a1a] focus:ring-[#ba1a1a]/20' : ''}`}
              value={formData.treatmentPerformed}
              onChange={(e) => {
                setFormData({ ...formData, treatmentPerformed: e.target.value });
                clearFieldError('treatmentPerformed');
              }}
              placeholder="Describe treatment performed..."
              rows={3}
            />
            {errors.treatmentPerformed && (
              <span className="mt-2 block text-xs text-[#ba1a1a]">{errors.treatmentPerformed}</span>
            )}
          </div>

          <div>
            <label className="block text-sm mb-2 font-semibold text-[#191c1d]">Additional Notes (Optional)</label>
            <textarea
              className={`w-full rounded-lg border border-[#bfc7d1] bg-white px-4 py-3 text-[#191c1d] outline-none transition-all duration-200 focus:border-[#005d90] focus:bg-white focus:ring-2 focus:ring-[#005d90]/20 placeholder:text-[#707881] min-h-[80px] ${errors.additionalNotes ? 'border-[#ba1a1a] focus:border-[#ba1a1a] focus:ring-[#ba1a1a]/20' : ''}`}
              value={formData.additionalNotes}
              onChange={(e) => {
                setFormData({ ...formData, additionalNotes: e.target.value });
                clearFieldError('additionalNotes');
              }}
              placeholder="Any additional notes..."
              rows={2}
            />
            {errors.additionalNotes && (
              <span className="mt-2 block text-xs text-[#ba1a1a]">{errors.additionalNotes}</span>
            )}
          </div>

          {errors.general && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-800">
              {errors.general}
            </div>
          )}

          <div className="flex justify-end">
            <Button
              type="submit"
              variant="primary"
              disabled={isGenerating}
              className="gap-2"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="animate-spin" size={18} />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles size={18} />
                  Generate AI Note
                </>
              )}
            </Button>
          </div>
        </form>

        {generatedNote && (
          <div className="border-t border-[#e1e3e4] pt-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-[#191c1d]">AI Generated Note</h3>
              <Button
                variant="outline"
                onClick={handleRegenerate}
                disabled={isGenerating}
                className="gap-2"
              >
                <RotateCcw size={16} />
                Regenerate
              </Button>
            </div>
            <textarea
              className="w-full rounded-lg border border-[#bfc7d1] bg-white px-4 py-3 text-[#191c1d] outline-none transition-all duration-200 focus:border-[#005d90] focus:bg-white focus:ring-2 focus:ring-[#005d90]/20 min-h-[300px]"
              value={finalNote}
              onChange={(e) => setFinalNote(e.target.value)}
              placeholder="AI-generated note will appear here..."
              rows={12}
            />
            <div className="flex justify-end gap-3">
              <Button
                variant="primary"
                onClick={handleSave}
                disabled={isSaving || !finalNote.trim()}
                className="gap-2"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="animate-spin" size={18} />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save size={18} />
                    Save Final Note
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </div>

      {savedNotes.length > 0 && (
        <div className="px-6 pb-6">
          <h3 className="text-lg font-semibold text-[#191c1d] mb-4">Saved Treatment Notes</h3>
          {loadingNotes ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="animate-spin text-[#005d90]" size={24} />
            </div>
          ) : (
            <div className="space-y-4">
              {savedNotes.map((note) => (
                <div key={note.id} className="border border-[#bfc7d1] rounded-lg p-4 bg-white">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <span className="text-sm font-medium text-[#005d90]">{note.procedureType}</span>
                      {note.toothNumber && (
                        <span className="text-sm text-slate-600 ml-2">Tooth #{note.toothNumber}</span>
                      )}
                    </div>
                    <span className="text-xs text-slate-400">
                      {new Date(note.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  {note.aiGeneratedNote && (
                    <div className="mb-2">
                      <span className="text-xs font-medium text-slate-500 uppercase">AI Generated:</span>
                      <p className="text-sm text-slate-700 whitespace-pre-wrap mt-1">{note.aiGeneratedNote}</p>
                    </div>
                  )}
                  {note.finalNote && (
                    <div>
                      <span className="text-xs font-medium text-slate-500 uppercase">Final Note:</span>
                      <p className="text-sm text-slate-900 whitespace-pre-wrap mt-1">{note.finalNote}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </Card>
  );
}
