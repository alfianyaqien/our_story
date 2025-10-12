import { NextResponse } from 'next/server';

// Fallback Islamic quotes in case the API is down
const fallbackQuotes = [
  {
    text: "And He found you lost and guided [you].",
    author: "Quran 93:7"
  },
  {
    text: "Indeed, with hardship comes ease.",
    author: "Quran 94:6"
  },
  {
    text: "So remember Me; I will remember you.",
    author: "Quran 2:152"
  },
  {
    text: "Verily, in the remembrance of Allah do hearts find rest.",
    author: "Quran 13:28"
  },
  {
    text: "And He is with you wherever you are.",
    author: "Quran 57:4"
  },
  {
    text: "Allah does not burden a soul beyond that it can bear.",
    author: "Quran 2:286"
  },
  {
    text: "The best among you are those who have the best manners and character.",
    author: "Prophet Muhammad (PBUH)"
  },
  {
    text: "Kindness is a mark of faith, and whoever is not kind has no faith.",
    author: "Prophet Muhammad (PBUH)"
  },
  {
    text: "Do not be people without minds of your own, saying that if others treat you well you will treat them well.",
    author: "Prophet Muhammad (PBUH)"
  },
  {
    text: "The strong person is not the one who can wrestle someone else down. The strong person is the one who can control himself when he is angry.",
    author: "Prophet Muhammad (PBUH)"
  }
];

export async function GET() {
  try {
    const response = await fetch('https://api.hadith.gading.dev/quotes/random', {
      cache: 'no-store',
      headers: {
        'User-Agent': 'OurStoryApp/1.0'
      }
    });

    if (response.ok) {
      const data = await response.json();
      
      if (data && data.indo) {
        return NextResponse.json({
          quote: {
            text: data.indo,
            author: "Islamic Quote"
          }
        });
      }
    }

    throw new Error('API failed');

  } catch (error) {
    const randomQuote = fallbackQuotes[Math.floor(Math.random() * fallbackQuotes.length)];
    
    return NextResponse.json({
      quote: randomQuote,
      source: 'fallback'
    });
  }
}
