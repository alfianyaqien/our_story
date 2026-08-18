'use client';

import { useEffect, useState } from 'react';
import { PenTool, Heart, Send } from 'lucide-react';
import { AppShell } from '@/components/AppShell';
import { PageTitle } from '@/components/ui/PageTitle';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input, Field } from '@/components/ui/Input';
import { EmptyState } from '@/components/ui/Feedback';
import { cn } from '@/lib/utils';

interface Template {
  id: number;
  name: string;
  category: string;
  content: string;
  placeholders: string[];
}

export default function LetterMakerPage() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(
    null
  );
  const [placeholderValues, setPlaceholderValues] = useState<
    Record<string, string>
  >({});
  const [generatedLetter, setGeneratedLetter] = useState('');

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    const response = await fetch('/api/letter-templates');
    if (response.ok) {
      const data = await response.json();
      setTemplates(data.templates);
    }
  };

  const handleTemplateSelect = (template: Template) => {
    setSelectedTemplate(template);
    const values: Record<string, string> = {};
    template.placeholders.forEach((p) => (values[p] = ''));
    setPlaceholderValues(values);
    setGeneratedLetter('');
  };

  const handleGenerate = () => {
    if (!selectedTemplate) return;

    let letter = selectedTemplate.content;
    Object.entries(placeholderValues).forEach(([key, value]) => {
      letter = letter.replace(
        new RegExp(`\\[${key}\\]`, 'g'),
        value || `[${key}]`
      );
    });

    setGeneratedLetter(letter);
  };

  const handleSendAsLoveLetter = async () => {
    // This would integrate with the love letters feature
    alert('This will send as a love letter! (Feature integration available)');
  };

  return (
    <AppShell>
      <PageTitle
        title="Love Letter Maker"
        description="Start from a template, make it yours."
      />

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Templates */}
        <div>
          <h2 className="mb-4 text-lg font-semibold text-fg">
            Choose a template
          </h2>
          <div className="space-y-3">
            {templates.length === 0 && (
              <Card className="p-6 text-center text-sm text-muted">
                No templates available.
              </Card>
            )}
            {templates.map((template) => (
              <button
                key={template.id}
                onClick={() => handleTemplateSelect(template)}
                className={cn(
                  'w-full rounded-2xl border p-4 text-left transition-all',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/50',
                  selectedTemplate?.id === template.id
                    ? 'border-brand-300 bg-brand-50 shadow-card dark:border-brand-800 dark:bg-brand-900/25'
                    : 'border-default bg-surface shadow-soft hover:shadow-card'
                )}
              >
                <h3 className="truncate font-semibold text-fg">
                  {template.name}
                </h3>
                <p className="mt-0.5 text-sm text-muted">{template.category}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Editor */}
        <div>
          {selectedTemplate ? (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-fg">
                Customize your letter
              </h2>

              {selectedTemplate.placeholders.map((placeholder) => (
                <Field
                  key={placeholder}
                  label={placeholder.replace(/_/g, ' ')}
                  htmlFor={`ph-${placeholder}`}
                >
                  <Input
                    id={`ph-${placeholder}`}
                    type="text"
                    value={placeholderValues[placeholder] || ''}
                    onChange={(e) =>
                      setPlaceholderValues({
                        ...placeholderValues,
                        [placeholder]: e.target.value,
                      })
                    }
                    placeholder={`Enter ${placeholder
                      .toLowerCase()
                      .replace(/_/g, ' ')}`}
                  />
                </Field>
              ))}

              <Button size="lg" className="w-full" onClick={handleGenerate}>
                Generate letter
              </Button>

              {generatedLetter && (
                <Card className="mt-6 p-6">
                  <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                    <h3 className="text-base font-semibold text-fg">
                      Your letter
                    </h3>
                    <Button
                      variant="subtle"
                      size="sm"
                      onClick={handleSendAsLoveLetter}
                    >
                      <Send className="h-4 w-4" />
                      Send as love letter
                    </Button>
                  </div>
                  <div className="whitespace-pre-wrap break-words rounded-xl border border-default bg-surface-2 p-6 leading-relaxed text-fg">
                    {generatedLetter}
                  </div>
                  <div className="mt-4 flex justify-center">
                    <Heart
                      className="h-8 w-8 text-brand-500"
                      fill="currentColor"
                    />
                  </div>
                </Card>
              )}
            </div>
          ) : (
            <Card>
              <EmptyState
                icon={PenTool}
                title="No template selected"
                description="Pick one from the list to start writing."
              />
            </Card>
          )}
        </div>
      </div>
    </AppShell>
  );
}
