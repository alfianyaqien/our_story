'use client';

import Link from 'next/link';
import { Camera, Upload } from 'lucide-react';
import PageHeader from '@/components/PageHeader';

export default function GalleryPage() {
  return (
    <div className="min-h-screen p-4 md:p-8 bg-gradient-to-br from-love-ice via-white to-love-lavender dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <PageHeader title="Photo Gallery" />
        </div>
        
        <div className="flex justify-end mb-4">
          <button className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition shadow-md">
            <Upload size={20} />
            Upload Photos
          </button>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-12 text-center">
          <Camera className="mx-auto text-gray-300 dark:text-gray-600 mb-4" size={64} />
          <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-100 mb-2">Coming Soon!</h3>
          <p className="text-gray-500 dark:text-gray-400 mb-6">
            Photo upload feature will be available soon. Store and share your beautiful memories together.
          </p>
          <p className="text-sm text-gray-400 dark:text-gray-500">
            This feature requires file upload implementation which can be added based on your storage preference (local/cloud).
          </p>
        </div>
      </div>
    </div>
  );
}
