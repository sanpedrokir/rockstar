export const DIFFICULTIES = ["easy", "normal", "hard"] as const;
export type Difficulty = (typeof DIFFICULTIES)[number];

export type Song = { id: number; title: string; artist: string; difficulty: Difficulty };

export const SONGS: Song[] = [
  { id: 1, title: "Holiday", artist: "Scorpions", difficulty: "normal" },
  { id: 2, title: "Rock You Like a Hurricane", artist: "Scorpions", difficulty: "easy" },
  { id: 3, title: "Wind of Change", artist: "Scorpions", difficulty: "easy" },
  { id: 4, title: "Still Loving You", artist: "Scorpions", difficulty: "normal" },
  { id: 5, title: "No One Like You", artist: "Scorpions", difficulty: "hard" },

  { id: 6, title: "Paranoid", artist: "Black Sabbath", difficulty: "easy" },
  { id: 7, title: "Iron Man", artist: "Black Sabbath", difficulty: "easy" },
  { id: 8, title: "War Pigs", artist: "Black Sabbath", difficulty: "normal" },
  { id: 9, title: "Sweet Leaf", artist: "Black Sabbath", difficulty: "hard" },

  { id: 10, title: "Sweet Child O' Mine", artist: "Guns N' Roses", difficulty: "easy" },
  { id: 11, title: "Welcome to the Jungle", artist: "Guns N' Roses", difficulty: "easy" },
  { id: 12, title: "Paradise City", artist: "Guns N' Roses", difficulty: "normal" },
  { id: 13, title: "November Rain", artist: "Guns N' Roses", difficulty: "normal" },
  { id: 14, title: "Patience", artist: "Guns N' Roses", difficulty: "hard" },

  { id: 15, title: "Since You Been Gone", artist: "Rainbow", difficulty: "normal" },
  { id: 16, title: "Man on the Silver Mountain", artist: "Rainbow", difficulty: "hard" },
  { id: 17, title: "Stargazer", artist: "Rainbow", difficulty: "hard" },
  { id: 18, title: "Long Live Rock 'n' Roll", artist: "Rainbow", difficulty: "hard" },

  { id: 19, title: "Back in Black", artist: "AC/DC", difficulty: "easy" },
  { id: 20, title: "Highway to Hell", artist: "AC/DC", difficulty: "easy" },
  { id: 21, title: "Thunderstruck", artist: "AC/DC", difficulty: "easy" },
  { id: 22, title: "You Shook Me All Night Long", artist: "AC/DC", difficulty: "normal" },
  { id: 23, title: "T.N.T.", artist: "AC/DC", difficulty: "normal" },

  { id: 24, title: "The Number of the Beast", artist: "Iron Maiden", difficulty: "easy" },
  { id: 25, title: "Run to the Hills", artist: "Iron Maiden", difficulty: "normal" },
  { id: 26, title: "Fear of the Dark", artist: "Iron Maiden", difficulty: "normal" },
  { id: 27, title: "The Trooper", artist: "Iron Maiden", difficulty: "hard" },
  { id: 28, title: "Aces High", artist: "Iron Maiden", difficulty: "hard" },

  { id: 29, title: "Enter Sandman", artist: "Metallica", difficulty: "easy" },
  { id: 30, title: "Master of Puppets", artist: "Metallica", difficulty: "easy" },
  { id: 31, title: "Nothing Else Matters", artist: "Metallica", difficulty: "easy" },
  { id: 32, title: "One", artist: "Metallica", difficulty: "normal" },
  { id: 33, title: "For Whom the Bell Tolls", artist: "Metallica", difficulty: "hard" },

  { id: 34, title: "Pour Some Sugar on Me", artist: "Def Leppard", difficulty: "easy" },
  { id: 35, title: "Photograph", artist: "Def Leppard", difficulty: "normal" },
  { id: 36, title: "Rock of Ages", artist: "Def Leppard", difficulty: "normal" },
  { id: 37, title: "Hysteria", artist: "Def Leppard", difficulty: "hard" },

  { id: 38, title: "Kickstart My Heart", artist: "Mötley Crüe", difficulty: "normal" },
  { id: 39, title: "Dr. Feelgood", artist: "Mötley Crüe", difficulty: "normal" },
  { id: 40, title: "Girls, Girls, Girls", artist: "Mötley Crüe", difficulty: "normal" },
  { id: 41, title: "Home Sweet Home", artist: "Mötley Crüe", difficulty: "hard" },

  { id: 42, title: "18 and Life", artist: "Skid Row", difficulty: "normal" },
  { id: 43, title: "I Remember You", artist: "Skid Row", difficulty: "hard" },
  { id: 44, title: "Youth Gone Wild", artist: "Skid Row", difficulty: "hard" },

  { id: 45, title: "Feel Like Makin' Love", artist: "Bad Company", difficulty: "normal" },
  { id: 46, title: "Can't Get Enough", artist: "Bad Company", difficulty: "hard" },

  { id: 47, title: "Another Brick in the Wall", artist: "Pink Floyd", difficulty: "easy" },
  { id: 48, title: "Comfortably Numb", artist: "Pink Floyd", difficulty: "easy" },
  { id: 49, title: "Wish You Were Here", artist: "Pink Floyd", difficulty: "easy" },
  { id: 50, title: "Money", artist: "Pink Floyd", difficulty: "normal" },
  { id: 51, title: "Time", artist: "Pink Floyd", difficulty: "hard" },

  { id: 52, title: "Hotel California", artist: "Eagles", difficulty: "easy" },
  { id: 53, title: "Take It Easy", artist: "Eagles", difficulty: "normal" },
  { id: 54, title: "Life in the Fast Lane", artist: "Eagles", difficulty: "normal" },
  { id: 55, title: "Desperado", artist: "Eagles", difficulty: "hard" },

  { id: 56, title: "Bohemian Rhapsody", artist: "Queen", difficulty: "easy" },
  { id: 57, title: "We Will Rock You", artist: "Queen", difficulty: "easy" },
  { id: 58, title: "Don't Stop Me Now", artist: "Queen", difficulty: "easy" },

  { id: 59, title: "Smells Like Teen Spirit", artist: "Nirvana", difficulty: "easy" },
  { id: 60, title: "Come as You Are", artist: "Nirvana", difficulty: "normal" },

  { id: 61, title: "Stairway to Heaven", artist: "Led Zeppelin", difficulty: "easy" },
  { id: 62, title: "Whole Lotta Love", artist: "Led Zeppelin", difficulty: "easy" },
  { id: 63, title: "Kashmir", artist: "Led Zeppelin", difficulty: "normal" },

  { id: 64, title: "Paint It Black", artist: "The Rolling Stones", difficulty: "easy" },
  { id: 65, title: "Sympathy for the Devil", artist: "The Rolling Stones", difficulty: "normal" },

  { id: 66, title: "Smoke on the Water", artist: "Deep Purple", difficulty: "easy" },
  { id: 67, title: "Highway Star", artist: "Deep Purple", difficulty: "normal" },

  { id: 68, title: "Livin' on a Prayer", artist: "Bon Jovi", difficulty: "easy" },
  { id: 69, title: "Wanted Dead or Alive", artist: "Bon Jovi", difficulty: "normal" },

  { id: 70, title: "Don't Stop Believin'", artist: "Journey", difficulty: "easy" },

  { id: 71, title: "Dream On", artist: "Aerosmith", difficulty: "easy" },
  { id: 72, title: "Walk This Way", artist: "Aerosmith", difficulty: "easy" },

  { id: 73, title: "Jump", artist: "Van Halen", difficulty: "easy" },
  { id: 74, title: "Panama", artist: "Van Halen", difficulty: "normal" },

  { id: 75, title: "Baba O'Riley", artist: "The Who", difficulty: "easy" },
  { id: 76, title: "Dreams", artist: "Fleetwood Mac", difficulty: "normal" },
  { id: 77, title: "With or Without You", artist: "U2", difficulty: "easy" },
  { id: 78, title: "The Final Countdown", artist: "Europe", difficulty: "easy" },

  { id: 79, title: "Here I Go Again", artist: "Whitesnake", difficulty: "normal" },
  { id: 80, title: "Breaking the Law", artist: "Judas Priest", difficulty: "normal" },
  { id: 81, title: "Rock and Roll All Nite", artist: "Kiss", difficulty: "easy" },
  { id: 82, title: "Crazy Train", artist: "Ozzy Osbourne", difficulty: "easy" },
  { id: 83, title: "Rainbow in the Dark", artist: "Dio", difficulty: "hard" },
  { id: 84, title: "Sharp Dressed Man", artist: "ZZ Top", difficulty: "normal" },
  { id: 85, title: "More Than a Feeling", artist: "Boston", difficulty: "normal" },
  { id: 86, title: "Tom Sawyer", artist: "Rush", difficulty: "normal" },
  { id: 87, title: "School's Out", artist: "Alice Cooper", difficulty: "normal" },
  { id: 88, title: "We're Not Gonna Take It", artist: "Twisted Sister", difficulty: "normal" },
  { id: 89, title: "Every Rose Has Its Thorn", artist: "Poison", difficulty: "normal" },
];

export function shuffle<T>(arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}
