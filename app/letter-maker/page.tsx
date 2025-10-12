'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { PenTool, Heart, Send } from 'lucide-react';
import PageHeader from '@/components/PageHeader';

interface Template {
  id: number;
  name: string;
  category: string;
  content: string;
  placeholders: string[];
}

export default function LetterMakerPage() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [placeholderValues, setPlaceholderValues] = useState<Record<string, string>>({});
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
    template.placeholders.forEach(p => values[p] = '');
    setPlaceholderValues(values);
    setGeneratedLetter('');
  };

  const handleGenerate = () => {
    if (!selectedTemplate) return;
    
    let letter = selectedTemplate.content;
    Object.entries(placeholderValues).forEach(([key, value]) => {
      letter = letter.replace(new RegExp(`\\[${key}\\]`, 'g'), value || `[${key}]`);
    });
    
    setGeneratedLetter(letter);
  };

  const handleSendAsLoveLetter = async () => {
    // This would integrate with the love letters feature
    alert('This will send as a love letter! (Feature integration available)');
  };

  return (
    <div className="min-h-screen p-4 md:p-8 bg-gradient-to-br from-love-ice via-white to-love-lavender dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <PageHeader title="Love Letter Maker" />
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Templates */}
          <div>
            <h2 className="text-xl font-semibold mb-4 dark:text-gray-100">Choose a Template</h2>
            <div className="space-y-3">
              {templates.map((template) => (
                <div
                  key={template.id}
                  onClick={() => handleTemplateSelect(template)}
                  className={`p-4 rounded-lg cursor-pointer transition ${
                    selectedTemplate?.id === template.id
                      ? 'bg-purple-100 dark:bg-purple-900/30 shadow-lg border-2 border-purple-500 dark:border-purple-600'
                      : 'bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700/50 shadow hover:shadow-md'
                  }`}
                >
                  <h3 className="font-semibold text-gray-800 dark:text-gray-100">{template.name}</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{template.category}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Editor */}
          <div>
            {selectedTemplate ? (
              <div className="space-y-4">
                <h2 className="text-xl font-semibold dark:text-gray-100">Customize Your Letter</h2>
                
                {selectedTemplate.placeholders.map((placeholder) => (
                  <div key={placeholder}>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      {placeholder.replace(/_/g, ' ')}
                    </label>
                    <input
                      type="text"
                      value={placeholderValues[placeholder] || ''}
                      onChange={(e) => setPlaceholderValues({
                        ...placeholderValues,
                        [placeholder]: e.target.value
                      })}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                      placeholder={`Enter ${placeholder.toLowerCase().replace(/_/g, ' ')}`}
                    />
                  </div>
                ))}

                <button
                  onClick={handleGenerate}
                  className="w-full bg-purple-500 text-white font-semibold py-3 rounded-lg hover:bg-purple-600 transition shadow-md"
                >
                  Generate Letter
                </button>

                {generatedLetter && (
                  <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mt-6">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-lg font-semibold dark:text-gray-100">Your Letter</h3>
                      <button
                        onClick={handleSendAsLoveLetter}
                        className="flex items-center gap-2 px-4 py-2 bg-love-red text-white rounded-lg hover:opacity-90 transition text-sm"
                      >
                        <Send size={16} />
                        Send as Love Letter
                      </button>
                    </div>
                    <div className="bg-pink-50 dark:bg-pink-900/20 rounded-lg p-6 whitespace-pre-wrap dark:text-gray-300">
                      {generatedLetter}
                    </div>
                    <div className="mt-4 flex justify-center">
                      <Heart className="text-love-red" size={32} fill="#FF6B9D" />
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-12 text-center">
                <PenTool className="mx-auto text-gray-300 dark:text-gray-600 mb-4" size={48} />
                <p className="text-gray-500 dark:text-gray-400">Select a template to start creating</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
