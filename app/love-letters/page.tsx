'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Mail, Send, Heart, Inbox } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import PageHeader from '@/components/PageHeader';

interface LoveLetter {
  id: number;
  fromUserId: number;
  toUserId: number;
  senderName: string;
  receiverName: string;
  subject: string;
  content: string;
  createdAt: string;
  isRead: boolean;
  isSent: boolean;
}

export default function LoveLettersPage() {
  const [letters, setLetters] = useState<LoveLetter[]>([]);
  const [showCompose, setShowCompose] = useState(false);
  const [selectedLetter, setSelectedLetter] = useState<LoveLetter | null>(null);
  const [filter, setFilter] = useState<'all' | 'received' | 'sent'>('all');
  const router = useRouter();

  useEffect(() => {
    fetchLetters();
  }, []);

  const fetchLetters = async () => {
    const response = await fetch('/api/love-letters');
    if (response.ok) {
      const data = await response.json();
      setLetters(data.letters);
    }
  };

  const filteredLetters = letters.filter(letter => {
    if (filter === 'received') return !letter.isSent;
    if (filter === 'sent') return letter.isSent;
    return true;
  });

  return (
    <div className="min-h-screen p-4 md:p-8 bg-gradient-to-br from-love-ice via-white to-love-lavender dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <PageHeader title="Love Letters" />
        </div>
        
        <div className="flex justify-end mb-4">
          <button
            onClick={() => setShowCompose(true)}
            className="flex items-center gap-2 px-4 py-2 love-gradient text-white rounded-lg hover:opacity-90 transition shadow-md"
          >
            <Send size={20} />
            <span>New Letter</span>
          </button>
        </div>

        {!showCompose && !selectedLetter && (
          <>
            {/* Filter */}
            <div className="flex gap-2 mb-6">
              {['all', 'received', 'sent'].map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f as any)}
                  className={`px-4 py-2 rounded-lg capitalize transition ${
                    filter === f
                      ? 'love-gradient text-white'
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>

            {/* Letters List */}
            <div className="grid gap-4">
              {filteredLetters.length === 0 ? (
                <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-xl shadow">
                  <Heart className="mx-auto text-gray-300 dark:text-gray-600 mb-4" size={48} />
                  <p className="text-gray-500 dark:text-gray-400">No letters yet. Write your first love letter!</p>
                </div>
              ) : (
                filteredLetters.map((letter) => (
                  <div
                    key={letter.id}
                    onClick={() => setSelectedLetter(letter)}
                    className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700/50 rounded-xl shadow-lg p-6 cursor-pointer card-hover"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          {letter.isSent ? (
                            <Send size={16} className="text-blue-500" />
                          ) : (
                            <Inbox size={16} className="text-pink-500" />
                          )}
                          <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                            {letter.isSent ? `To: ${letter.receiverName}` : `From: ${letter.senderName}`}
                          </span>
                        </div>
                        <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-2">
                          {letter.subject}
                        </h3>
                        <p className="text-gray-600 dark:text-gray-400 line-clamp-2">{letter.content}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {formatDistanceToNow(new Date(letter.createdAt), { addSuffix: true })}
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </>
        )}

        {showCompose && <ComposeForm onClose={() => { setShowCompose(false); fetchLetters(); }} />}
        {selectedLetter && <LetterView letter={selectedLetter} onClose={() => setSelectedLetter(null)} />}
      </div>
    </div>
  );
}

function ComposeForm({ onClose }: { onClose: () => void }) {
  const [subject, setSubject] = useState('');
  const [content, setContent] = useState('');
  const [toUserId, setToUserId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const response = await fetch('/api/love-letters', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ toUserId: parseInt(toUserId), subject, content }),
    });

    if (response.ok) {
      onClose();
    }
    setIsSubmitting(false);
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
      <h2 className="text-2xl font-bold mb-6 dark:text-gray-100">Compose Love Letter</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">To</label>
          <select
            value={toUserId}
            onChange={(e) => setToUserId(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-love-red focus:border-transparent outline-none"
            required
          >
            <option value="">Select recipient</option>
            <option value="1">Partner 1</option>
            <option value="2">Partner 2</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Subject</label>
          <input
            type="text"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-love-red focus:border-transparent outline-none"
            placeholder="What's this letter about?"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Message</label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={10}
            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-love-red focus:border-transparent outline-none resize-none"
            placeholder="Pour your heart out..."
            required
          />
        </div>

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex-1 love-gradient text-white font-semibold py-3 rounded-lg hover:opacity-90 transition disabled:opacity-50"
          >
            {isSubmitting ? 'Sending...' : 'Send Letter'}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-3 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 font-semibold rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}

function LetterView({ letter, onClose }: { letter: LoveLetter; onClose: () => void }) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8">
      <button
        onClick={onClose}
        className="mb-6 flex items-center gap-2 text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-gray-100 transition"
      >
        <Mail size={20} />
        Back to letters
      </button>

      <div className="mb-6">
        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 mb-2">
          {letter.isSent ? (
            <>
              <Send size={16} />
              <span>To: {letter.receiverName}</span>
            </>
          ) : (
            <>
              <Inbox size={16} />
              <span>From: {letter.senderName}</span>
            </>
          )}
        </div>
        <h2 className="text-3xl font-bold text-gray-800 dark:text-gray-100 mb-2">{letter.subject}</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {formatDistanceToNow(new Date(letter.createdAt), { addSuffix: true })}
        </p>
      </div>

      <div className="prose max-w-none">
        <div className="bg-pink-50 dark:bg-pink-900/20 rounded-lg p-6 whitespace-pre-wrap dark:text-gray-300">
          {letter.content}
        </div>
      </div>

      <div className="mt-6 flex justify-center">
        <Heart className="text-love-red" size={32} fill="#FF6B9D" />
      </div>
    </div>
  );
}
