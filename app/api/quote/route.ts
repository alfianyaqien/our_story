import { NextResponse } from 'next/server';

// Fallback quotes in case the API is down
const fallbackQuotes = [
  {
    text: "In all the world, there is no heart for me like yours. In all the world, there is no love for you like mine.",
    author: "Maya Angelou"
  },
  {
    text: "Love is not about how many days, months, or years you have been together. Love is about how much you love each other every single day.",
    author: "Unknown"
  },
  {
    text: "The best thing to hold onto in life is each other.",
    author: "Audrey Hepburn"
  },
  {
    text: "I love you not only for what you are, but for what I am when I am with you.",
    author: "Roy Croft"
  },
  {
    text: "You know you're in love when you can't fall asleep because reality is finally better than your dreams.",
    author: "Dr. Seuss"
  },
  {
    text: "Being deeply loved by someone gives you strength, while loving someone deeply gives you courage.",
    author: "Lao Tzu"
  },
  {
    text: "The greatest happiness of life is the conviction that we are loved; loved for ourselves, or rather, loved in spite of ourselves.",
    author: "Victor Hugo"
  },
  {
    text: "I would rather share one lifetime with you than face all the ages of this world alone.",
    author: "J.R.R. Tolkien"
  }
];

export async function GET() {
  try {
    // Try to fetch from ZenQuotes API (free, no key required)
    const response = await fetch('https://zenquotes.io/api/random', {
      cache: 'no-store',
      headers: {
        'User-Agent': 'OurStoryApp/1.0'
      }
    });

    if (response.ok) {
      const data = await response.json();
      
      // ZenQuotes returns an array with one quote
      if (data && data.length > 0) {
        return NextResponse.json({
          quote: {
            text: data[0].q,
            author: data[0].a
          }
        });
      }
    }

    // If API fails, use fallback
    throw new Error('API failed');

  } catch (error) {
    // Return a random fallback quote
    const randomQuote = fallbackQuotes[Math.floor(Math.random() * fallbackQuotes.length)];
    
    return NextResponse.json({
      quote: randomQuote,
      source: 'fallback'
    });
  }
}
