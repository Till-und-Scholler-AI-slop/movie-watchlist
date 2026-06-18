import 'dotenv/config';

const TMDB_API_KEY = process.env.TMDB_API_KEY?.trim();
const TMDB_BASE = 'https://api.themoviedb.org/3';
const IMG_BASE = 'https://image.tmdb.org/t/p';

const POSTER_SIZE = 'w500';
const BACKDROP_SIZE = 'w780';

export function posterUrl(path: string | null | undefined): string | null {
  if (!path) return null;
  return `${IMG_BASE}/${POSTER_SIZE}${path}`;
}

export function backdropUrl(path: string | null | undefined): string | null {
  if (!path) return null;
  return `${IMG_BASE}/${BACKDROP_SIZE}${path}`;
}

export interface MergedSearchMovie {
  tmdb_id: number;
  title_de: string;
  title_original: string;
  year: string;
  poster_url: string | null;
  overview_de: string;
  vote_average: number;
}

export interface TmdbGenre {
  id: number;
  name: string;
}

export interface TmdbCrewMember {
  job: string;
  name: string;
}

export interface TmdbDetail {
  id: number;
  title: string;
  original_title: string;
  release_date: string;
  poster_path: string | null;
  backdrop_path: string | null;
  overview: string;
  tagline: string;
  runtime: number | null;
  genres: TmdbGenre[];
  vote_average: number;
  imdb_id: string | null;
  credits?: { crew: TmdbCrewMember[] };
}

interface CatalogEntry {
  tmdb_id: number;
  title_de: string;
  title_original: string;
  year: string;
  poster_path: string | null;
  backdrop_path: string | null;
  overview_de: string;
  tagline_de: string;
  vote_average: number;
  genres_de: string;
  director: string;
  runtime: number;
  imdb_id: string;
}

const FALLBACK_CATALOG: CatalogEntry[] = [
  { tmdb_id: 278, title_de: 'Die Verurteilten', title_original: 'The Shawshank Redemption', year: '1994', poster_path: '/9cqNxx0GxF0bflZbeSMStLwKNyu.jpg', backdrop_path: '/kXfqcdQKsN9aPpXV7y1cXcXMnKS.jpg', overview_de: 'Zwei lebenslang Inhaftierte finden über Jahre hinweg Trost und schließlich Erlösung durch gemeinsame Anständigkeit.', tagline_de: 'Hoffnung kann einen Gefangenen nicht gefangen halten.', vote_average: 8.7, genres_de: 'Drama, Krimi', director: 'Frank Darabont', runtime: 142, imdb_id: 'tt0111161' },
  { tmdb_id: 238, title_de: 'Der Pate', title_original: 'The Godfather', year: '1972', poster_path: '/3bhkrj58Vtu7enYs73D3ufbGw9P.jpg', backdrop_path: '/tmU7GeKVybMWFButWEG8otM7q0X.jpg', overview_de: 'Das alternde Oberhaupt einer Verbrecherdynastie überträgt die Kontrolle über sein Imperium an seinen widerwilligen Sohn.', tagline_de: 'Ich werde ihm ein Angebot machen, das er nicht ablehnen kann.', vote_average: 8.7, genres_de: 'Krimi, Drama', director: 'Francis Ford Coppola', runtime: 175, imdb_id: 'tt0068646' },
  { tmdb_id: 155, title_de: 'The Dark Knight', title_original: 'The Dark Knight', year: '2008', poster_path: '/qJ2tW6WMUDux911r6m7haRef0WH.jpg', backdrop_path: '/nMKdUUepR0i5zn0y1T4CsSB5hy7.jpg', overview_de: 'Batman stellt sich dem Joker, einem Verbrechergenie, das Gotham ins Chaos stürzen will.', tagline_de: 'Warum so ernst?', vote_average: 8.5, genres_de: 'Action, Krimi, Drama', director: 'Christopher Nolan', runtime: 152, imdb_id: 'tt0468569' },
  { tmdb_id: 680, title_de: 'Pulp Fiction', title_original: 'Pulp Fiction', year: '1994', poster_path: '/d5iIlpz5aQfM3yjM4j3z ep4Sgq.jpg', backdrop_path: '/suaEOx1bEppsnA3QT9kC4fJF3XB.jpg', overview_de: 'Die Leben zweier Auftragskiller, eines Boxers und eines Räuberpaares verflechten sich in vier Geschichten von Gewalt und Erlösung.', tagline_de: 'Du wirst nicht beim ersten Mal wissen, ob es dir gefällt.', vote_average: 8.5, genres_de: 'Krimi, Drama', director: 'Quentin Tarantino', runtime: 154, imdb_id: 'tt0110912' },
  { tmdb_id: 429, title_de: 'Zwei glorreiche Halunken', title_original: 'Il buono, il brutto, il cattivo', year: '1966', poster_path: '/bIf5VxP2vU4iWdYOsZqwN0VUAz6.jpg', backdrop_path: '/hBjRwymJo6nYlnWUMcKQ3FZsDxZ.jpg', overview_de: 'Eine Kopfgeldjagd verbindet zwei Männer in einem unheiligen Bündnis gegen einen dritten im Wettlauf um vergrabenes Gold.', tagline_de: 'Für drei Männer gibt es kein Zurück.', vote_average: 8.4, genres_de: 'Western', director: 'Sergio Leone', runtime: 161, imdb_id: 'tt0060196' },
  { tmdb_id: 808, title_de: 'Sieben', title_original: 'Se7en', year: '1995', poster_path: '/6yoghtyTpDnpYCoylBoDOqWznOf.jpg', backdrop_path: '/ba4lK7PYcfvANwaCnMNVQDTwqLY.jpg', overview_de: 'Zwei Ermittler jagen einen Serienkiller, der die sieben Todsünden als Motiv nutzt.', tagline_de: 'Erleben ist besser als Töten.', vote_average: 8.4, genres_de: 'Krimi, Drama, Mystery', director: 'David Fincher', runtime: 127, imdb_id: 'tt0114369' },
  { tmdb_id: 550, title_de: 'Fight Club', title_original: 'Fight Club', year: '1999', poster_path: '/pB8BM7pdSp6B6Ih7QudJqH4fQK4.jpg', backdrop_path: '/52AfXWuXmChDdlNyrASmdfqQ7Q1.jpg', overview_de: 'Ein schlafloser Büroarbeiter und ein Seifenmacher gründen einen unterirdischen Fightclub, der außer Kontrolle gerät.', tagline_de: 'Möge der Spaß nie aufhören.', vote_average: 8.4, genres_de: 'Drama', director: 'David Fincher', runtime: 139, imdb_id: 'tt0137523' },
  { tmdb_id: 13, title_de: 'Forrest Gump', title_original: 'Forrest Gump', year: '1994', poster_path: '/saHP97jrTPP5ENR1CfN3PjKqk7N.jpg', backdrop_path: '/yE5d3YYsmPSPH7H2D5UxdKKYv5b.jpg', overview_de: 'Die Präsidentschaften Kennedys und Johnsons, der Vietnamkrieg und mehr, gesehen durch die Augen eines Mannes aus Alabama.', tagline_de: 'Das Leben ist wie eine Pralinenschachtel.', vote_average: 8.5, genres_de: 'Drama, Romantik', director: 'Robert Zemeckis', runtime: 142, imdb_id: 'tt0109830' },
  { tmdb_id: 122, title_de: 'Der Herr der Ringe: Die Rückkehr des Königs', title_original: 'The Lord of the Rings: The Return of the King', year: '2003', poster_path: '/rCzpDGLbOoPGL6yjm5RGxF9xO0N.jpg', backdrop_path: '/2u7zbs8bQqXrVSf5LqGIwdfAp9m.jpg', overview_de: 'Gandalf und Aragorn führen die Welt der Menschen gegen Sauron, um seinen Blick von Frodo und Sam abzulenken.', tagline_de: 'Das Ende beginnt.', vote_average: 8.5, genres_de: 'Action, Abenteuer, Drama', director: 'Peter Jackson', runtime: 201, imdb_id: 'tt0167260' },
  { tmdb_id: 603, title_de: 'Matrix', title_original: 'The Matrix', year: '1999', poster_path: '/f89U3ADr1ozB2vK4jM5mQkz4cUe.jpg', backdrop_path: '/fNG7i7RqMErkcqhohV2a6cV1Ehy.jpg', overview_de: 'Ein Hacker erfährt die wahre Natur seiner Realität und seine Rolle im Krieg gegen deren Kontrolleure.', tagline_de: 'Wahre Realität oder nur ein Traum?', vote_average: 8.2, genres_de: 'Action, Science Fiction', director: 'Lana Wachowski, Lilly Wachowski', runtime: 136, imdb_id: 'tt0133093' },
  { tmdb_id: 27205, title_de: 'Inception', title_original: 'Inception', year: '2010', poster_path: '/9gk7adHYeDvHkCSEqAvQNLV5Uge.jpg', backdrop_path: '/s3TBrUVX4LEnFaA6OJDXcspj58I.jpg', overview_de: 'Ein Dieb, der Corporate Secrets via Traumteilen stiehlt, bekommt die Aufgabe, eine Idee zu pflanzen.', tagline_de: 'Dein Verstand ist der Tatort.', vote_average: 8.4, genres_de: 'Action, Abenteuer, Science Fiction', director: 'Christopher Nolan', runtime: 148, imdb_id: 'tt1375666' },
  { tmdb_id: 157335, title_de: 'Interstellar', title_original: 'Interstellar', year: '2014', poster_path: '/gEU2QniE6E77NI6lCG6tSRxBfpm.jpg', backdrop_path: '/pbrkL804c8yAv3zDQ3kUgF7Hns9.jpg', overview_de: 'Ein Team von Forschern reist durch ein Wurmloch, um das Überleben der Menschheit zu sichern.', tagline_de: 'Wir haben uns immer erhoben. Jetzt müssen wir hinausgehen.', vote_average: 8.4, genres_de: 'Abenteuer, Drama, Science Fiction', director: 'Christopher Nolan', runtime: 169, imdb_id: 'tt0816692' },
  { tmdb_id: 872585, title_de: 'Oppenheimer', title_original: 'Oppenheimer', year: '2023', poster_path: '/8Gxv8dS0y4GM4UDcS8q5LqNoxK.jpg', backdrop_path: '/rLb2wMT6QbOZtOhlzRf6sWugjcq.jpg', overview_de: 'Die Geschichte von J. Robert Oppenheimer und seiner Rolle bei der Entwicklung der Atombombe.', tagline_de: 'Die Welt verändert sich für immer.', vote_average: 8.1, genres_de: 'Biografie, Drama, Geschichte', director: 'Christopher Nolan', runtime: 181, imdb_id: 'tt15398776' },
  { tmdb_id: 569094, title_de: 'Spider-Man: Across the Spider-Verse', title_original: 'Spider-Man: Across the Spider-Verse', year: '2023', poster_path: '/8Vt6mWEReuy4Of61Lnj5xJc4Njh.jpg', backdrop_path: '/4HodYYKEIsGOdinkGi2Ucz6XJiN.jpg', overview_de: 'Miles Morales katapultiert sich durch das Multiversum und gerät mit einem Elite-Team von Spider-People aneinander.', tagline_de: 'Es ist nicht die Zeit zu zögern.', vote_average: 8.4, genres_de: 'Animation, Action, Abenteuer', director: 'Joaquim Dos Santos', runtime: 140, imdb_id: 'tt9362722' },
  { tmdb_id: 496243, title_de: 'Parasite', title_original: '기생충', year: '2019', poster_path: '/7IiTTgloJzvGI1TAYymCfbfl3vT.jpg', backdrop_path: '/TU9NIjwzjoKPwQHoHshkFcQUCG.jpg', overview_de: 'Gier und Klassendiskriminierung bedrohen die symbiotische Beziehung zwischen zwei Familien.', tagline_de: 'Halte dich fest.', vote_average: 8.5, genres_de: 'Komödie, Drama, Thriller', director: 'Bong Joon-ho', runtime: 132, imdb_id: 'tt6751668' },
  { tmdb_id: 862, title_de: 'Toy Story', title_original: 'Toy Story', year: '1995', poster_path: '/uXDfjmbvXPzYYhwvzVf6nWvBzqN.jpg', backdrop_path: '/nLBRQX4Fqiqm3Yo9xGxD8Z5yIyG.jpg', overview_de: 'Eine Cowboy-Puppe fühlt sich bedroht, als eine neue Actionfigur ihn als Top-Spielzeug ablöst.', tagline_de: 'In den Kinderzimmern passiert mehr, als du denkst.', vote_average: 7.9, genres_de: 'Animation, Abenteuer, Komödie', director: 'John Lasseter', runtime: 81, imdb_id: 'tt0114709' },
  { tmdb_id: 490132, title_de: 'Dune: Teil Zwei', title_original: 'Dune: Part Two', year: '2024', poster_path: '/1pdfLvkbY9ohJlCjQH2CZjjYVvJ.jpg', backdrop_path: '/87f675008iMoHGZ83hz9KYhtUfQ.jpg', overview_de: 'Paul Atreides verbündet sich mit den Fremen, um Krieg gegen das Haus Harkonnen zu führen.', tagline_de: 'Lang lebe der Kämpfer.', vote_average: 8.3, genres_de: 'Action, Abenteuer, Drama', director: 'Denis Villeneuve', runtime: 166, imdb_id: 'tt15239678' },
  { tmdb_id: 8587, title_de: 'Der König der Löwen', title_original: 'The Lion King', year: '1994', poster_path: '/sKCr78MXSAixCKUD6CQu0K8JZAt.jpg', backdrop_path: '/wXs9LUrQzPwvgignhqpgN4usdas.jpg', overview_de: 'Ein Löwenprinz flieht nach dem Tod seines Vaters aus seinem Reich, nur um die wahre Bedeutung von Verantwortung zu lernen.', tagline_de: 'Das Leben ist eine Reise.', vote_average: 8.3, genres_de: 'Animation, Abenteuer, Drama', director: 'Roger Allers, Rob Minkoff', runtime: 88, imdb_id: 'tt0110357' },
  { tmdb_id: 120, title_de: 'Der Herr der Ringe: Die Gefährten', title_original: 'The Lord of the Rings: The Fellowship of the Ring', year: '2001', poster_path: '/6oom5QYQ2yQTMJIbnvbkBL9cHo6.jpg', backdrop_path: '/x2RS3uTcsJJ9IfjNPcgdMtlfe5o.jpg', overview_de: 'Ein bescheidener Hobbit und seine Gefährten begeben sich auf eine Reise, um einen mächtigen Ring zu zerstören und Mittelerde zu retten.', tagline_de: 'Ein Ring, sie alle zu knechten.', vote_average: 8.4, genres_de: 'Action, Abenteuer, Drama', director: 'Peter Jackson', runtime: 178, imdb_id: 'tt0120737' },
  { tmdb_id: 273, title_de: 'Das Schweigen der Lämmer', title_original: 'The Silence of the Lambs', year: '1991', poster_path: '/uS9m8OBk1A4UmkL9F8O29KpxGCG.jpg', backdrop_path: '/mFMnZ4UM3WJ7DUVdQduL3zVbXyM.jpg', overview_de: 'Eine junge FBI-Neueinsteigerin braucht die Hilfe eines inhaftierten Kannibalen, um einen anderen Serienkiller zu fassen.', tagline_de: 'Die furchtloseste Therapie, die es gibt.', vote_average: 8.3, genres_de: 'Krimi, Drama, Thriller', director: 'Jonathan Demme', runtime: 118, imdb_id: 'tt0102926' },
  { tmdb_id: 85, title_de: 'Der Soldat James Ryan', title_original: 'Saving Private Ryan', year: '1998', poster_path: '/uqx37cS8cpH7jbbouPqYmQ0hHJH.jpg', backdrop_path: '/lKvhdb6ZGdi6oX4YG4QYqo3cZpM.jpg', overview_de: 'Nach der Landung in der Normandie zieht eine Gruppe Soldaten hinter feindliche Linien, um einen Fallschirmjäger zu finden.', tagline_de: 'Ein Mann ist es wert.', vote_average: 8.3, genres_de: 'Drama, Krieg', director: 'Steven Spielberg', runtime: 169, imdb_id: 'tt0120815' },
  { tmdb_id: 121, title_de: 'Der Herr der Ringe: Die zwei Türme', title_original: 'The Lord of the Rings: The Two Towers', year: '2002', poster_path: '/5VTN0pR8gcqV6EkuuXiRc92d7nt.jpg', backdrop_path: '/p7mpSKqEYplc2t4qIyXWWLcfeZ6.jpg', overview_de: 'Während Frodo und Sam sich Mordor nähern, kämpfen ihre Freunde um das Volk von Rohan.', tagline_de: 'Das Abenteuer geht weiter.', vote_average: 8.4, genres_de: 'Action, Abenteuer, Drama', director: 'Peter Jackson', runtime: 179, imdb_id: 'tt0245429' },
  { tmdb_id: 311, title_de: 'Das Leben ist schön', title_original: 'La vita è bella', year: '1997', poster_path: '/74hLDKjD5aGYOotO6esUVaeIDNa.jpg', backdrop_path: '/bOReOeIsHVhtcgQW6c3zKQsFhbU.jpg', overview_de: 'Ein jüdisch-italienischer Vater nutzt Humor, um seinen Sohn vor den Schrecken eines Konzentrationslagers zu schützen.', tagline_de: 'Eine tragische Komödie über das Leben.', vote_average: 8.4, genres_de: 'Komödie, Drama, Romantik', director: 'Roberto Benigni', runtime: 116, imdb_id: 'tt0118799' },
  { tmdb_id: 489, title_de: 'Good Will Hunting', title_original: 'Good Will Hunting', year: '1997', poster_path: '/qPpOqdiXdRDuP9KffnowsSFiqgu.jpg', backdrop_path: '/d2uIRqjMg1VWoYdgwkF6BYXKxhN.jpg', overview_de: 'Ein Hausmeister am MIT hat ein mathematisches Genie, braucht aber die Hilfe eines Psychologen, um Richtung im Leben zu finden.', tagline_de: 'Manche Menschen können dich nicht lehren, was du lernen musst.', vote_average: 8.3, genres_de: 'Drama, Romantik', director: 'Gus Van Sant', runtime: 126, imdb_id: 'tt0120586' },
  { tmdb_id: 142, title_de: 'Departed: Unter Feinden', title_original: 'The Departed', year: '2006', poster_path: '/nWaY7BujwPFmyAobpibrTwd6DjQ.jpg', backdrop_path: '/i6vz2oWQ5BAJOYpxNddQ7HzkOBC.jpg', overview_de: 'Ein verdeckter Ermittler und ein Maulwurf in der Polizei versuchen, sich gegenseitig zu identifizieren.', tagline_de: 'Lügen. Verrat. Opfer.', vote_average: 8.2, genres_de: 'Krimi, Drama, Thriller', director: 'Martin Scorsese', runtime: 151, imdb_id: 'tt0407887' },
  { tmdb_id: 630, title_de: 'Die üblichen Verdächtigen', title_original: 'The Usual Suspects', year: '1995', poster_path: '/eAshN6u5t6C9P6VwjhYxKkbKxxx.jpg', backdrop_path: '/r8YAVtZSnr4qacmFk6hg5K9aQWI.jpg', overview_de: 'Der einzige Überlebende erzählt die Geschichte eines schiefgegangenen Coups, der zu einem Schusswechsel führte.', tagline_de: 'Wer ist Keyser Söze?', vote_average: 8.1, genres_de: 'Krimi, Mystery, Thriller', director: 'Bryan Singer', runtime: 106, imdb_id: 'tt0114814' },
  { tmdb_id: 829, title_de: 'The Green Mile', title_original: 'The Green Mile', year: '1999', poster_path: '/velWPhVMQeQKcxggNuVeNm7v8Z3.jpg', backdrop_path: '/l6hQWH9eDksNJNiXWYR5WnWQ7Xb.jpg', overview_de: 'Das Leben der Wärter im Todestrakt wird durch einen Häftling mit mysteriösen Fähigkeiten berührt.', tagline_de: 'Ein Wunder passiert.', vote_average: 8.5, genres_de: 'Krimi, Drama, Fantasy', director: 'Frank Darabont', runtime: 189, imdb_id: 'tt0120689' },
  { tmdb_id: 12, title_de: 'Findet Nemo', title_original: 'Finding Nemo', year: '2003', poster_path: '/eHuGQnFU5nQzZc5TqUjsuVtq5O5.jpg', backdrop_path: '/cKw4XGzKVUF6rHEZCMsBqMwEdNy.jpg', overview_de: 'Ein Clownfisch sucht nach seinem Sohn, der von einem Taucher mitgenommen und in ein Aquarium gesteckt wurde.', tagline_de: 'Es gibt 3,7 Billionen Fische im Meer. Findet einen.', vote_average: 7.8, genres_de: 'Animation, Abenteuer, Komödie', director: 'Andrew Stanton', runtime: 100, imdb_id: 'tt0266543' },
  { tmdb_id: 16869, title_de: 'Inglourious Basterds', title_original: 'Inglourious Basterds', year: '2009', poster_path: '/7sfbQX2ologiesXNU30s5lGls0k1.jpg', backdrop_path: '/i7dTfWWQ54k3ts6zYsF3le5cwnR.jpg', overview_de: 'Im besetzten Frankreich planen eine jüdische Kinobesitzerin und amerikanische Soldaten, Nazi-Führer zu ermorden.', tagline_de: 'Ein Kino-Film, der WWII neu schreibt.', vote_average: 8.2, genres_de: 'Abenteuer, Drama, Krieg', director: 'Quentin Tarantino', runtime: 153, imdb_id: 'tt0361748' },
];

function fallbackSearch(query: string, page: number): { movies: MergedSearchMovie[]; total: number } {
  const q = query.trim().toLowerCase();
  const matches = FALLBACK_CATALOG.filter(
    (m) => m.title_de.toLowerCase().includes(q) || m.title_original.toLowerCase().includes(q),
  );
  const pageSize = 10;
  const start = (page - 1) * pageSize;
  return {
    movies: matches.slice(start, start + pageSize).map((m) => ({
      tmdb_id: m.tmdb_id,
      title_de: m.title_de,
      title_original: m.title_original,
      year: m.year,
      poster_url: posterUrl(m.poster_path),
      overview_de: m.overview_de,
      vote_average: m.vote_average,
    })),
    total: matches.length,
  };
}

function fallbackDetail(tmdb_id: number): TmdbDetail | null {
  const e = FALLBACK_CATALOG.find((m) => m.tmdb_id === tmdb_id);
  if (!e) return null;
  return {
    id: e.tmdb_id,
    title: e.title_de,
    original_title: e.title_original,
    release_date: e.year ? `${e.year}-01-01` : '',
    poster_path: e.poster_path,
    backdrop_path: e.backdrop_path,
    overview: e.overview_de,
    tagline: e.tagline_de,
    runtime: e.runtime,
    genres: e.genres_de.split(', ').map((g) => ({ id: 0, name: g })),
    vote_average: e.vote_average,
    imdb_id: e.imdb_id,
    credits: { crew: [{ job: 'Director', name: e.director }] },
  };
}

async function tmdbGet<T>(path: string): Promise<T | null> {
  if (!TMDB_API_KEY) return null;
  const url = `${TMDB_BASE}${path}${path.includes('?') ? '&' : '?'}api_key=${TMDB_API_KEY}`;
  const res = await fetch(url);
  if (!res.ok) {
    if (res.status === 404) return null;
    throw new Error(`TMDB request failed (${res.status})`);
  }
  return (await res.json()) as T;
}

interface RawSearchResult {
  id: number;
  title: string;
  original_title: string;
  release_date: string;
  poster_path: string | null;
  overview: string;
  vote_average: number;
}

interface RawSearchResponse {
  page: number;
  results: RawSearchResult[];
  total_pages: number;
  total_results: number;
}

function toMerged(r: RawSearchResult): MergedSearchMovie {
  return {
    tmdb_id: r.id,
    title_de: r.title || r.original_title,
    title_original: r.original_title,
    year: r.release_date ? r.release_date.slice(0, 4) : '',
    poster_url: posterUrl(r.poster_path),
    overview_de: r.overview,
    vote_average: r.vote_average,
  };
}

export async function searchMovies(
  query: string,
  page = 1,
): Promise<{ movies: MergedSearchMovie[]; total: number; error?: string }> {
  if (!query.trim()) return { movies: [], total: 0 };
  if (!TMDB_API_KEY) return fallbackSearch(query, page);

  const q = encodeURIComponent(query);
  const pathDe = `/search/movie?query=${q}&page=${page}&include_adult=false&language=de-DE`;
  const pathEn = `/search/movie?query=${q}&page=${page}&include_adult=false&language=en-US`;

  const [deRes, enRes] = await Promise.all([
    tmdbGet<RawSearchResponse>(pathDe).catch(() => null),
    tmdbGet<RawSearchResponse>(pathEn).catch(() => null),
  ]);

  if (!deRes && !enRes) return { movies: [], total: 0, error: 'Search failed' };

  const byId = new Map<number, MergedSearchMovie>();
  for (const r of enRes?.results ?? []) {
    if (r.id && (r.title || r.original_title)) byId.set(r.id, toMerged(r));
  }
  for (const r of deRes?.results ?? []) {
    if (r.id && (r.title || r.original_title)) byId.set(r.id, toMerged(r));
  }

  const deOrder = deRes?.results.map((r) => r.id) ?? [];
  const enOrder = enRes?.results.map((r) => r.id) ?? [];
  const orderedIds: number[] = [];
  for (const id of deOrder) if (byId.has(id) && !orderedIds.includes(id)) orderedIds.push(id);
  for (const id of enOrder) if (byId.has(id) && !orderedIds.includes(id)) orderedIds.push(id);

  const movies = orderedIds.map((id) => byId.get(id)!);
  const total = Math.max(deRes?.total_results ?? 0, enRes?.total_results ?? 0);
  return { movies, total };
}

interface RawDetail {
  id: number;
  title: string;
  original_title: string;
  release_date: string;
  poster_path: string | null;
  backdrop_path: string | null;
  overview: string;
  tagline: string;
  runtime: number | null;
  genres: TmdbGenre[];
  vote_average: number;
  imdb_id: string | null;
  credits?: { crew: TmdbCrewMember[] };
  external_ids?: { imdb_id?: string };
}

export async function getMovieDetail(tmdb_id: number): Promise<TmdbDetail | null> {
  if (!TMDB_API_KEY) return fallbackDetail(tmdb_id);
  const path = `/movie/${tmdb_id}?language=de-DE&append_to_response=credits,external_ids`;
  const data = await tmdbGet<RawDetail>(path);
  if (!data || !data.id) return null;
  const imdbId = data.imdb_id ?? data.external_ids?.imdb_id ?? null;
  return {
    id: data.id,
    title: data.title || data.original_title,
    original_title: data.original_title,
    release_date: data.release_date,
    poster_path: data.poster_path,
    backdrop_path: data.backdrop_path,
    overview: data.overview,
    tagline: data.tagline,
    runtime: data.runtime,
    genres: data.genres,
    vote_average: data.vote_average,
    imdb_id: imdbId,
    credits: data.credits,
  };
}

export function hasApiKey(): boolean {
  return Boolean(TMDB_API_KEY);
}

export function directorFromDetail(detail: TmdbDetail): string | null {
  const d = detail.credits?.crew.find((c) => c.job === 'Director');
  return d?.name ?? null;
}

export function genresFromDetail(detail: TmdbDetail): string | null {
  if (!detail.genres || detail.genres.length === 0) return null;
  return detail.genres.map((g) => g.name).join(', ');
}
