import 'dotenv/config';

const OMDB_API_KEY = process.env.OMDB_API_KEY?.trim();
const OMDB_BASE = 'https://www.omdbapi.com/';

export interface OmdbMovie {
  imdbID: string;
  Title: string;
  Year: string;
  Poster: string;
  Type: string;
}

export interface OmdbDetail extends OmdbMovie {
  Genre: string;
  Director: string;
  Plot: string;
  Runtime: string;
  imdbRating: string;
  Response: string;
  Error?: string;
}

// Built-in demo catalog used when no OMDB_API_KEY is configured.
// Real poster URLs from Wikimedia so the UI looks right without an API key.
interface CatalogEntry extends OmdbMovie {
  Genre: string;
  Director: string;
  Plot: string;
  Runtime: string;
  imdbRating: string;
}

const FALLBACK_CATALOG: CatalogEntry[] = [
  { imdbID: 'tt0111161', Title: 'The Shawshank Redemption', Year: '1994', Poster: 'https://upload.wikimedia.org/wikipedia/en/8/81/ShawshankRedemptionMoviePoster.jpg', Type: 'movie', Genre: 'Drama', Director: 'Frank Darabont', Plot: 'Two imprisoned men bond over years, finding solace and eventual redemption through acts of common decency.', Runtime: '142 min', imdbRating: '9.3' },
  { imdbID: 'tt0068646', Title: 'The Godfather', Year: '1972', Poster: 'https://upload.wikimedia.org/wikipedia/en/1/1c/Godfather_ver1.jpg', Type: 'movie', Genre: 'Crime, Drama', Director: 'Francis Ford Coppola', Plot: 'The aging patriarch of an organized crime dynasty transfers control of his clandestine empire to his reluctant son.', Runtime: '175 min', imdbRating: '9.2' },
  { imdbID: 'tt0468569', Title: 'The Dark Knight', Year: '2008', Poster: 'https://upload.wikimedia.org/wikipedia/en/1/1c/The_Dark_Knight_%282008%29.jpg', Type: 'movie', Genre: 'Action, Crime, Drama', Director: 'Christopher Nolan', Plot: 'Batman faces the Joker, a criminal mastermind who wants to plunge Gotham into anarchy.', Runtime: '152 min', imdbRating: '9.0' },
  { imdbID: 'tt0110912', Title: 'Pulp Fiction', Year: '1994', Poster: 'https://upload.wikimedia.org/wikipedia/en/3/3b/Pulp_Fiction_%281994%29_poster.jpg', Type: 'movie', Genre: 'Crime, Drama', Director: 'Quentin Tarantino', Plot: 'The lives of two mob hitmen, a boxer, and a pair of diner bandits intertwine in four tales of violence and redemption.', Runtime: '154 min', imdbRating: '8.9' },
  { imdbID: 'tt0060196', Title: 'The Good, the Bad and the Ugly', Year: '1966', Poster: 'https://upload.wikimedia.org/wikipedia/en/4/45/The_good_the_bad_and_the_ugly_poster.jpg', Type: 'movie', Genre: 'Western', Director: 'Sergio Leone', Plot: 'A bounty hunting scam joins two men in an uneasy alliance against a third in a race to find buried gold.', Runtime: '161 min', imdbRating: '8.8' },
  { imdbID: 'tt0114369', Title: 'Se7en', Year: '1995', Poster: 'https://upload.wikimedia.org/wikipedia/en/0/08/Se7en_movie.jpg', Type: 'movie', Genre: 'Crime, Drama, Mystery', Director: 'David Fincher', Plot: 'Two detectives hunt a serial killer who uses the seven deadly sins as his motives.', Runtime: '127 min', imdbRating: '8.6' },
  { imdbID: 'tt0137523', Title: 'Fight Club', Year: '1999', Poster: 'https://upload.wikimedia.org/wikipedia/en/f/fc/Fight_Club_poster.jpg', Type: 'movie', Genre: 'Drama', Director: 'David Fincher', Plot: 'An insomniac office worker and a soap maker form an underground fight club that spirals out of control.', Runtime: '139 min', imdbRating: '8.8' },
  { imdbID: 'tt0109830', Title: 'Forrest Gump', Year: '1994', Poster: 'https://upload.wikimedia.org/wikipedia/en/6/67/Forrest_Gump_poster.jpg', Type: 'movie', Genre: 'Drama, Romance', Director: 'Robert Zemeckis', Plot: 'The presidencies of Kennedy and Johnson, the Vietnam War, and more through the eyes of an Alabama man.', Runtime: '142 min', imdbRating: '8.8' },
  { imdbID: 'tt0167260', Title: 'The Lord of the Rings: The Return of the King', Year: '2003', Poster: 'https://upload.wikimedia.org/wikipedia/en/2/2c/Lord_of_the_Rings_-_The_Return_of_the_King_%282003%29.jpg', Type: 'movie', Genre: 'Action, Adventure, Drama', Director: 'Peter Jackson', Plot: 'Gandalf and Aragorn lead the World of Men against Sauron to draw his gaze from Frodo and Sam as they approach Mount Doom.', Runtime: '201 min', imdbRating: '9.0' },
  { imdbID: 'tt0133093', Title: 'The Matrix', Year: '1999', Poster: 'https://upload.wikimedia.org/wikipedia/en/c/c1/The_Matrix_Poster.jpg', Type: 'movie', Genre: 'Action, Sci-Fi', Director: 'Lana Wachowski, Lilly Wachowski', Plot: 'A computer hacker learns the true nature of his reality and his role in the war against its controllers.', Runtime: '136 min', imdbRating: '8.7' },
  { imdbID: 'tt1375666', Title: 'Inception', Year: '2010', Poster: 'https://upload.wikimedia.org/wikipedia/en/2/2e/Inception_%282010%29_theatrical_poster.jpg', Type: 'movie', Genre: 'Action, Adventure, Sci-Fi', Director: 'Christopher Nolan', Plot: 'A thief who steals corporate secrets through dream-sharing technology is given the inverse task of planting an idea.', Runtime: '148 min', imdbRating: '8.8' },
  { imdbID: 'tt0816692', Title: 'Interstellar', Year: '2014', Poster: 'https://upload.wikimedia.org/wikipedia/en/b/bc/Interstellar_film_poster.jpg', Type: 'movie', Genre: 'Adventure, Drama, Sci-Fi', Director: 'Christopher Nolan', Plot: 'A team of explorers travel through a wormhole in space in an attempt to ensure humanity\'s survival.', Runtime: '169 min', imdbRating: '8.7' },
  { imdbID: 'tt15398776', Title: 'Oppenheimer', Year: '2023', Poster: 'https://upload.wikimedia.org/wikipedia/en/4/4f/Oppenheimer_%28film%29.jpg', Type: 'movie', Genre: 'Biography, Drama, History', Director: 'Christopher Nolan', Plot: 'The story of J. Robert Oppenheimer and his role in developing the atomic bomb.', Runtime: '180 min', imdbRating: '8.3' },
  { imdbID: 'tt9362722', Title: 'Spider-Man: Across the Spider-Verse', Year: '2023', Poster: 'https://upload.wikimedia.org/wikipedia/en/5/52/Spider-Man_Across_the_Spider-Verse.jpg', Type: 'movie', Genre: 'Animation, Action, Adventure', Director: 'Joaquim Dos Santos', Plot: 'Miles Morales catapults across the Multiverse, where he clashes with an elite team of Spider-People.', Runtime: '140 min', imdbRating: '8.6' },
  { imdbID: 'tt6751668', Title: 'Parasite', Year: '2019', Poster: 'https://upload.wikimedia.org/wikipedia/en/5/53/Parasite_%282019_film%29.png', Type: 'movie', Genre: 'Comedy, Drama, Thriller', Director: 'Bong Joon Ho', Plot: 'Greed and class discrimination threaten the newly formed symbiotic relationship between two families.', Runtime: '132 min', imdbRating: '8.5' },
  { imdbID: 'tt0114709', Title: 'Toy Story', Year: '1995', Poster: 'https://upload.wikimedia.org/wikipedia/en/1/13/Toy_Story.jpg', Type: 'movie', Genre: 'Animation, Adventure, Comedy', Director: 'John Lasseter', Plot: 'A cowboy doll is profoundly threatened when a new spaceman action figure supplants him as top toy.', Runtime: '81 min', imdbRating: '8.3' },
  { imdbID: 'tt2382320', Title: 'No Time to Die', Year: '2021', Poster: 'https://upload.wikimedia.org/wikipedia/en/8/86/No_Time_to_Die_poster.jpg', Type: 'movie', Genre: 'Action, Adventure, Thriller', Director: 'Cary Joji Fukunaga', Plot: 'James Bond has left active service when his friend asks for help finding a missing scientist.', Runtime: '163 min', imdbRating: '7.3' },
  { imdbID: 'tt15239678', Title: 'Dune: Part Two', Year: '2024', Poster: 'https://upload.wikimedia.org/wikipedia/en/5/57/Dune_Part_Two.jpg', Type: 'movie', Genre: 'Action, Adventure, Drama', Director: 'Denis Villeneuve', Plot: 'Paul Atreides unites with the Fremen to wage war against House Harkonnen.', Runtime: '166 min', imdbRating: '8.5' },
  { imdbID: 'tt0110357', Title: 'The Lion King', Year: '1994', Poster: 'https://upload.wikimedia.org/wikipedia/en/3/3d/The_Lion_King_poster.jpg', Type: 'movie', Genre: 'Animation, Adventure, Drama', Director: 'Roger Allers, Rob Minkoff', Plot: 'A lion prince flees his kingdom after the death of his father, only to learn the true meaning of responsibility.', Runtime: '88 min', imdbRating: '8.5' },
  { imdbID: 'tt0120737', Title: 'The Lord of the Rings: The Fellowship of the Ring', Year: '2001', Poster: 'https://upload.wikimedia.org/wikipedia/en/8/8a/The_Lord_of_the_Rings_The_Fellowship_of_the_Ring_%282001%29.jpg', Type: 'movie', Genre: 'Action, Adventure, Drama', Director: 'Peter Jackson', Plot: 'A meek hobbit and his companions set out on a journey to destroy a powerful ring and save Middle-earth.', Runtime: '178 min', imdbRating: '8.9' },
  { imdbID: 'tt0102926', Title: 'The Silence of the Lambs', Year: '1991', Poster: 'https://upload.wikimedia.org/wikipedia/en/8/86/The_Silence_of_the_Lambs_poster.jpg', Type: 'movie', Genre: 'Crime, Drama, Thriller', Director: 'Jonathan Demme', Plot: 'A young FBI cadet must receive the help of an incarcerated cannibal to catch another serial killer.', Runtime: '118 min', imdbRating: '8.6' },
  { imdbID: 'tt0120815', Title: 'Saving Private Ryan', Year: '1998', Poster: 'https://upload.wikimedia.org/wikipedia/en/3/3a/Saving_Private_Ryan_%281998%29_theatrical_poster.jpg', Type: 'movie', Genre: 'Drama, War', Director: 'Steven Spielberg', Plot: 'Following the Normandy landings, a group of soldiers go behind enemy lines to retrieve a paratrooper.', Runtime: '169 min', imdbRating: '8.6' },
  { imdbID: 'tt0245429', Title: 'The Lord of the Rings: The Two Towers', Year: '2002', Poster: 'https://upload.wikimedia.org/wikipedia/en/f/f2/The_Lord_of_the_Rings_The_Two_Towers_%282002%29.jpg', Type: 'movie', Genre: 'Action, Adventure, Drama', Director: 'Peter Jackson', Plot: 'While Frodo and Sam edge closer to Mordor, their friends fight to save the people of Rohan.', Runtime: '179 min', imdbRating: '8.8' },
  { imdbID: 'tt0118799', Title: 'Life Is Beautiful', Year: '1997', Poster: 'https://upload.wikimedia.org/wikipedia/en/1/1e/Life_Is_Beautiful_movie.jpg', Type: 'movie', Genre: 'Comedy, Drama, Romance', Director: 'Roberto Benigni', Plot: 'A Jewish-Italian father uses humor to shield his son from the horrors of a concentration camp.', Runtime: '116 min', imdbRating: '8.6' },
  { imdbID: 'tt0120586', Title: 'Good Will Hunting', Year: '1997', Poster: 'https://upload.wikimedia.org/wikipedia/en/8/85/Good_Will_Hunting_theatrical_poster.jpg', Type: 'movie', Genre: 'Drama, Romance', Director: 'Gus Van Sant', Plot: 'A janitor at MIT has a gift for mathematics but needs help from a psychologist to find direction in his life.', Runtime: '126 min', imdbRating: '8.3' },
  { imdbID: 'tt0407887', Title: 'The Departed', Year: '2006', Poster: 'https://upload.wikimedia.org/wikipedia/en/2/2e/TheDepartedFinal.jpg', Type: 'movie', Genre: 'Crime, Drama, Thriller', Director: 'Martin Scorsese', Plot: 'An undercover cop and a mole in the police try to identify each other while infiltrating an Irish gang.', Runtime: '151 min', imdbRating: '8.5' },
  { imdbID: 'tt0114814', Title: 'The Usual Suspects', Year: '1995', Poster: 'https://upload.wikimedia.org/wikipedia/en/b/b9/Usual_suspects_ver1.jpg', Type: 'movie', Genre: 'Crime, Mystery, Thriller', Director: 'Bryan Singer', Plot: 'A sole survivor tells the story of how a con job gone wrong led to a deadly shootout with a mysterious criminal.', Runtime: '106 min', imdbRating: '8.5' },
  { imdbID: 'tt0120689', Title: 'The Green Mile', Year: '1999', Poster: 'https://upload.wikimedia.org/wikipedia/en/6/6d/The_Green_Mile_%281999%29_poster.jpg', Type: 'movie', Genre: 'Crime, Drama, Fantasy', Director: 'Frank Darabont', Plot: 'The lives of guards on death row are affected by one of their charges: a black man accused of murder with a mysterious gift.', Runtime: '189 min', imdbRating: '8.6' },
  { imdbID: 'tt0266543', Title: 'Finding Nemo', Year: '2003', Poster: 'https://upload.wikimedia.org/wikipedia/en/2/29/Finding_Nemo.jpg', Type: 'movie', Genre: 'Animation, Adventure, Comedy', Director: 'Andrew Stanton', Plot: 'A clown fish searches for his son who was taken by a diver and placed in a dentist\'s aquarium.', Runtime: '100 min', imdbRating: '8.3' },
  { imdbID: 'tt0361748', Title: 'Inglourious Basterds', Year: '2009', Poster: 'https://upload.wikimedia.org/wikipedia/en/c/c3/Inglourious_Basterds_poster.jpg', Type: 'movie', Genre: 'Adventure, Drama, War', Director: 'Quentin Tarantino', Plot: 'In Nazi-occupied France, a Jewish cinema owner and a group of American soldiers plot to assassinate Nazi leaders.', Runtime: '153 min', imdbRating: '8.4' },
];

function fallbackSearch(query: string, page: number): { movies: OmdbMovie[]; total: number } {
  const q = query.trim().toLowerCase();
  const matches = FALLBACK_CATALOG.filter((m) => m.Title.toLowerCase().includes(q));
  const pageSize = 10;
  const start = (page - 1) * pageSize;
  return { movies: matches.slice(start, start + pageSize), total: matches.length };
}

function fallbackDetail(imdbID: string): OmdbDetail | null {
  const entry = FALLBACK_CATALOG.find((m) => m.imdbID === imdbID);
  if (!entry) return null;
  return { ...entry, Response: 'True' };
}

export async function searchMovies(query: string, page = 1): Promise<{ movies: OmdbMovie[]; total: number; error?: string }> {
  if (!query.trim()) return { movies: [], total: 0 };
  if (!OMDB_API_KEY) return fallbackSearch(query, page);

  const url = `${OMDB_BASE}?apikey=${OMDB_API_KEY}&s=${encodeURIComponent(query)}&page=${page}&type=movie`;
  const res = await fetch(url);
  const data = (await res.json()) as { Search?: OmdbMovie[]; totalResults?: string; Response: string; Error?: string };
  if (data.Response === 'False') return { movies: [], total: 0, error: data.Error };
  return {
    movies: data.Search ?? [],
    total: parseInt(data.totalResults ?? '0', 10),
  };
}

export async function getMovieDetail(imdbID: string): Promise<OmdbDetail | null> {
  if (!OMDB_API_KEY) return fallbackDetail(imdbID);
  const url = `${OMDB_BASE}?apikey=${OMDB_API_KEY}&i=${imdbID}&plot=full`;
  const res = await fetch(url);
  const data = (await res.json()) as OmdbDetail;
  if (data.Response === 'False') return null;
  return data;
}

export function hasApiKey(): boolean {
  return Boolean(OMDB_API_KEY);
}
