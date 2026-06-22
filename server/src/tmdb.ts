import 'dotenv/config';

const TMDB_API_KEY = process.env.TMDB_API_KEY?.trim();
const TMDB_BASE = 'https://api.themoviedb.org/3';
const IMG_BASE = 'https://image.tmdb.org/t/p';

const POSTER_SIZE = 'w500';
const BACKDROP_SIZE = 'w780';
const PROFILE_SIZE = 'w185';

export type MediaType = 'movie' | 'tv';

export function posterUrl(path: string | null | undefined): string | null {
  if (!path) return null;
  return `${IMG_BASE}/${POSTER_SIZE}${path}`;
}

export function backdropUrl(path: string | null | undefined): string | null {
  if (!path) return null;
  return `${IMG_BASE}/${BACKDROP_SIZE}${path}`;
}

export function profileUrl(path: string | null | undefined): string | null {
  if (!path) return null;
  return `${IMG_BASE}/${PROFILE_SIZE}${path}`;
}

export interface MergedSearchTitle {
  tmdb_id: number;
  media_type: MediaType;
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

export interface TmdbDetail {
  id: number;
  media_type: MediaType;
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
  number_of_seasons: number | null;
  number_of_episodes: number | null;
  credits?: { crew: { job: string; name: string }[] };
  created_by?: { name: string }[];
}

export interface CastMember {
  id: number;
  name: string;
  character: string;
  profile_path: string | null;
  profile_url: string | null;
}

export interface Video {
  key: string;
  name: string;
  site: string;
  type: string;
  official: boolean;
}

export interface SimilarTitle {
  tmdb_id: number;
  media_type: MediaType;
  title_de: string;
  year: string;
  poster_path: string | null;
  poster_url: string | null;
  vote_average: number;
  overview_de: string;
}

export interface TitleExtended {
  detail: TmdbDetail;
  cast: CastMember[];
  crew_top: { job: string; name: string }[];
  trailer_key: string | null;
  trailer_name: string | null;
  similar: SimilarTitle[];
}

interface CatalogEntry {
  tmdb_id: number;
  media_type: MediaType;
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
  runtime: number | null;
  number_of_seasons: number | null;
  number_of_episodes: number | null;
  imdb_id: string;
}

const FALLBACK_CATALOG: CatalogEntry[] = [
  { tmdb_id: 278, media_type: 'movie', title_de: 'Die Verurteilten', title_original: 'The Shawshank Redemption', year: '1994', poster_path: '/9cqNxx0GxF0bflZbeSMStLwKNyu.jpg', backdrop_path: '/kXfqcdQKsN9aPpXV7y1cXcXMnKS.jpg', overview_de: 'Zwei lebenslang Inhaftierte finden über Jahre hinweg Trost und schließlich Erlösung durch gemeinsame Anständigkeit.', tagline_de: 'Hoffnung kann einen Gefangenen nicht gefangen halten.', vote_average: 8.7, genres_de: 'Drama, Krimi', director: 'Frank Darabont', runtime: 142, number_of_seasons: null, number_of_episodes: null, imdb_id: 'tt0111161' },
  { tmdb_id: 238, media_type: 'movie', title_de: 'Der Pate', title_original: 'The Godfather', year: '1972', poster_path: '/3bhkrj58Vtu7enYs73D3ufbGw9P.jpg', backdrop_path: '/tmU7GeKVybMWFButWEG8otM7q0X.jpg', overview_de: 'Das alternde Oberhaupt einer Verbrecherdynastie überträgt die Kontrolle über sein Imperium an seinen widerwilligen Sohn.', tagline_de: 'Ich werde ihm ein Angebot machen, das er nicht ablehnen kann.', vote_average: 8.7, genres_de: 'Krimi, Drama', director: 'Francis Ford Coppola', runtime: 175, number_of_seasons: null, number_of_episodes: null, imdb_id: 'tt0068646' },
  { tmdb_id: 155, media_type: 'movie', title_de: 'The Dark Knight', title_original: 'The Dark Knight', year: '2008', poster_path: '/qJ2tW6WMUDux911r6m7haRef0WH.jpg', backdrop_path: '/nMKdUUepR0i5zn0y1T4CsSB5hy7.jpg', overview_de: 'Batman stellt sich dem Joker, einem Verbrechergenie, das Gotham ins Chaos stürzen will.', tagline_de: 'Warum so ernst?', vote_average: 8.5, genres_de: 'Action, Krimi, Drama', director: 'Christopher Nolan', runtime: 152, number_of_seasons: null, number_of_episodes: null, imdb_id: 'tt0468569' },
  { tmdb_id: 680, media_type: 'movie', title_de: 'Pulp Fiction', title_original: 'Pulp Fiction', year: '1994', poster_path: '/d5iIlpz5aQfM3yjM4j3z ep4Sgq.jpg', backdrop_path: '/suaEOx1bEppsnA3QT9kC4fJF3XB.jpg', overview_de: 'Die Leben zweier Auftragskiller, eines Boxers und eines Räuberpaares verflechten sich in vier Geschichten von Gewalt und Erlösung.', tagline_de: 'Du wirst nicht beim ersten Mal wissen, ob es dir gefällt.', vote_average: 8.5, genres_de: 'Krimi, Drama', director: 'Quentin Tarantino', runtime: 154, number_of_seasons: null, number_of_episodes: null, imdb_id: 'tt0110912' },
  { tmdb_id: 429, media_type: 'movie', title_de: 'Zwei glorreiche Halunken', title_original: 'Il buono, il brutto, il cattivo', year: '1966', poster_path: '/bIf5VxP2vU4iWdYOsZqwN0VUAz6.jpg', backdrop_path: '/hBjRwymJo6nYlnWUMcKQ3FZsDxZ.jpg', overview_de: 'Eine Kopfgeldjagd verbindet zwei Männer in einem unheiligen Bündnis gegen einen dritten im Wettlauf um vergrabenes Gold.', tagline_de: 'Für drei Männer gibt es kein Zurück.', vote_average: 8.4, genres_de: 'Western', director: 'Sergio Leone', runtime: 161, number_of_seasons: null, number_of_episodes: null, imdb_id: 'tt0060196' },
  { tmdb_id: 808, media_type: 'movie', title_de: 'Sieben', title_original: 'Se7en', year: '1995', poster_path: '/6yoghtyTpDnpYCoylBoDOqWznOf.jpg', backdrop_path: '/ba4lK7PYcfvANwaCnMNVQDTwqLY.jpg', overview_de: 'Zwei Ermittler jagen einen Serienkiller, der die sieben Todsünden als Motiv nutzt.', tagline_de: 'Erleben ist besser als Töten.', vote_average: 8.4, genres_de: 'Krimi, Drama, Mystery', director: 'David Fincher', runtime: 127, number_of_seasons: null, number_of_episodes: null, imdb_id: 'tt0114369' },
  { tmdb_id: 550, media_type: 'movie', title_de: 'Fight Club', title_original: 'Fight Club', year: '1999', poster_path: '/pB8BM7pdSp6B6Ih7QudJqH4fQK4.jpg', backdrop_path: '/52AfXWuXmChDdlNyrASmdfqQ7Q1.jpg', overview_de: 'Ein schlafloser Büroarbeiter und ein Seifenmacher gründen einen unterirdischen Fightclub, der außer Kontrolle gerät.', tagline_de: 'Möge der Spaß nie aufhören.', vote_average: 8.4, genres_de: 'Drama', director: 'David Fincher', runtime: 139, number_of_seasons: null, number_of_episodes: null, imdb_id: 'tt0137523' },
  { tmdb_id: 13, media_type: 'movie', title_de: 'Forrest Gump', title_original: 'Forrest Gump', year: '1994', poster_path: '/saHP97jrTPP5ENR1CfN3PjKqk7N.jpg', backdrop_path: '/yE5d3YYsmPSPH7H2D5UxdKKYv5b.jpg', overview_de: 'Die Präsidentschaften Kennedys und Johnsons, der Vietnamkrieg und mehr, gesehen durch die Augen eines Mannes aus Alabama.', tagline_de: 'Das Leben ist wie eine Pralinenschachtel.', vote_average: 8.5, genres_de: 'Drama, Romantik', director: 'Robert Zemeckis', runtime: 142, number_of_seasons: null, number_of_episodes: null, imdb_id: 'tt0109830' },
  { tmdb_id: 122, media_type: 'movie', title_de: 'Der Herr der Ringe: Die Rückkehr des Königs', title_original: 'The Lord of the Rings: The Return of the King', year: '2003', poster_path: '/rCzpDGLbOoPGL6yjm5RGxF9xO0N.jpg', backdrop_path: '/2u7zbs8bQqXrVSf5LqGIwdfAp9m.jpg', overview_de: 'Gandalf und Aragorn führen die Welt der Menschen gegen Sauron, um seinen Blick von Frodo und Sam abzulenken.', tagline_de: 'Das Ende beginnt.', vote_average: 8.5, genres_de: 'Action, Abenteuer, Drama', director: 'Peter Jackson', runtime: 201, number_of_seasons: null, number_of_episodes: null, imdb_id: 'tt0167260' },
  { tmdb_id: 603, media_type: 'movie', title_de: 'Matrix', title_original: 'The Matrix', year: '1999', poster_path: '/f89U3ADr1ozB2vK4jM5mQkz4cUe.jpg', backdrop_path: '/fNG7i7RqMErkcqhohV2a6cV1Ehy.jpg', overview_de: 'Ein Hacker erfährt die wahre Natur seiner Realität und seine Rolle im Krieg gegen deren Kontrolleure.', tagline_de: 'Wahre Realität oder nur ein Traum?', vote_average: 8.2, genres_de: 'Action, Science Fiction', director: 'Lana Wachowski, Lilly Wachowski', runtime: 136, number_of_seasons: null, number_of_episodes: null, imdb_id: 'tt0133093' },
  { tmdb_id: 27205, media_type: 'movie', title_de: 'Inception', title_original: 'Inception', year: '2010', poster_path: '/9gk7adHYeDvHkCSEqAvQNLV5Uge.jpg', backdrop_path: '/s3TBrUVX4LEnFaA6OJDXcspj58I.jpg', overview_de: 'Ein Dieb, der Corporate Secrets via Traumteilen stiehlt, bekommt die Aufgabe, eine Idee zu pflanzen.', tagline_de: 'Dein Verstand ist der Tatort.', vote_average: 8.4, genres_de: 'Action, Abenteuer, Science Fiction', director: 'Christopher Nolan', runtime: 148, number_of_seasons: null, number_of_episodes: null, imdb_id: 'tt1375666' },
  { tmdb_id: 157335, media_type: 'movie', title_de: 'Interstellar', title_original: 'Interstellar', year: '2014', poster_path: '/gEU2QniE6E77NI6lCG6tSRxBfpm.jpg', backdrop_path: '/pbrkL804c8yAv3zDQ3kUgF7Hns9.jpg', overview_de: 'Ein Team von Forschern reist durch ein Wurmloch, um das Überleben der Menschheit zu sichern.', tagline_de: 'Wir haben uns immer erhoben. Jetzt müssen wir hinausgehen.', vote_average: 8.4, genres_de: 'Abenteuer, Drama, Science Fiction', director: 'Christopher Nolan', runtime: 169, number_of_seasons: null, number_of_episodes: null, imdb_id: 'tt0816692' },
  { tmdb_id: 872585, media_type: 'movie', title_de: 'Oppenheimer', title_original: 'Oppenheimer', year: '2023', poster_path: '/8Gxv8dS0y4GM4UDcS8q5LqNoxK.jpg', backdrop_path: '/rLb2wMT6QbOZtOhlzRf6sWugjcq.jpg', overview_de: 'Die Geschichte von J. Robert Oppenheimer und seiner Rolle bei der Entwicklung der Atombombe.', tagline_de: 'Die Welt verändert sich für immer.', vote_average: 8.1, genres_de: 'Biografie, Drama, Geschichte', director: 'Christopher Nolan', runtime: 181, number_of_seasons: null, number_of_episodes: null, imdb_id: 'tt15398776' },
  { tmdb_id: 569094, media_type: 'movie', title_de: 'Spider-Man: Across the Spider-Verse', title_original: 'Spider-Man: Across the Spider-Verse', year: '2023', poster_path: '/8Vt6mWEReuy4Of61Lnj5xJc4Njh.jpg', backdrop_path: '/4HodYYKEIsGOdinkGi2Ucz6XJiN.jpg', overview_de: 'Miles Morales katapultiert sich durch das Multiversum und gerät mit einem Elite-Team von Spider-People aneinander.', tagline_de: 'Es ist nicht die Zeit zu zögern.', vote_average: 8.4, genres_de: 'Animation, Action, Abenteuer', director: 'Joaquim Dos Santos', runtime: 140, number_of_seasons: null, number_of_episodes: null, imdb_id: 'tt9362722' },
  { tmdb_id: 496243, media_type: 'movie', title_de: 'Parasite', title_original: '기생충', year: '2019', poster_path: '/7IiTTgloJzvGI1TAYymCfbfl3vT.jpg', backdrop_path: '/TU9NIjwzjoKPwQHoHshkFcQUCG.jpg', overview_de: 'Gier und Klassendiskriminierung bedrohen die symbiotische Beziehung zwischen zwei Familien.', tagline_de: 'Halte dich fest.', vote_average: 8.5, genres_de: 'Komödie, Drama, Thriller', director: 'Bong Joon-ho', runtime: 132, number_of_seasons: null, number_of_episodes: null, imdb_id: 'tt6751668' },
  { tmdb_id: 862, media_type: 'movie', title_de: 'Toy Story', title_original: 'Toy Story', year: '1995', poster_path: '/uXDfjmbvXPzYYhwvzVf6nWvBzqN.jpg', backdrop_path: '/nLBRQX4Fqiqm3Yo9xGxD8Z5yIyG.jpg', overview_de: 'Eine Cowboy-Puppe fühlt sich bedroht, als eine neue Actionfigur ihn als Top-Spielzeug ablöst.', tagline_de: 'In den Kinderzimmern passiert mehr, als du denkst.', vote_average: 7.9, genres_de: 'Animation, Abenteuer, Komödie', director: 'John Lasseter', runtime: 81, number_of_seasons: null, number_of_episodes: null, imdb_id: 'tt0114709' },
  { tmdb_id: 490132, media_type: 'movie', title_de: 'Dune: Teil Zwei', title_original: 'Dune: Part Two', year: '2024', poster_path: '/1pdfLvkbY9ohJlCjQH2CZjjYVvJ.jpg', backdrop_path: '/87f675008iMoHGZ83hz9KYhtUfQ.jpg', overview_de: 'Paul Atreides verbündet sich mit den Fremen, um Krieg gegen das Haus Harkonnen zu führen.', tagline_de: 'Lang lebe der Kämpfer.', vote_average: 8.3, genres_de: 'Action, Abenteuer, Drama', director: 'Denis Villeneuve', runtime: 166, number_of_seasons: null, number_of_episodes: null, imdb_id: 'tt15239678' },
  { tmdb_id: 8587, media_type: 'movie', title_de: 'Der König der Löwen', title_original: 'The Lion King', year: '1994', poster_path: '/sKCr78MXSAixCKUD6CQu0K8JZAt.jpg', backdrop_path: '/wXs9LUrQzPwvgignhqpgN4usdas.jpg', overview_de: 'Ein Löwenprinz flieht nach dem Tod seines Vaters aus seinem Reich, nur um die wahre Bedeutung von Verantwortung zu lernen.', tagline_de: 'Das Leben ist eine Reise.', vote_average: 8.3, genres_de: 'Animation, Abenteuer, Drama', director: 'Roger Allers, Rob Minkoff', runtime: 88, number_of_seasons: null, number_of_episodes: null, imdb_id: 'tt0110357' },
  { tmdb_id: 120, media_type: 'movie', title_de: 'Der Herr der Ringe: Die Gefährten', title_original: 'The Lord of the Rings: The Fellowship of the Ring', year: '2001', poster_path: '/6oom5QYQ2yQTMJIbnvbkBL9cHo6.jpg', backdrop_path: '/x2RS3uTcsJJ9IfjNPcgdMtlfe5o.jpg', overview_de: 'Ein bescheidener Hobbit und seine Gefährten begeben sich auf eine Reise, um einen mächtigen Ring zu zerstören und Mittelerde zu retten.', tagline_de: 'Ein Ring, sie alle zu knechten.', vote_average: 8.4, genres_de: 'Action, Abenteuer, Drama', director: 'Peter Jackson', runtime: 178, number_of_seasons: null, number_of_episodes: null, imdb_id: 'tt0120737' },
  { tmdb_id: 273, media_type: 'movie', title_de: 'Das Schweigen der Lämmer', title_original: 'The Silence of the Lambs', year: '1991', poster_path: '/uS9m8OBk1A4UmkL9F8O29KpxGCG.jpg', backdrop_path: '/mFMnZ4UM3WJ7DUVdQduL3zVbXyM.jpg', overview_de: 'Eine junge FBI-Neueinsteigerin braucht die Hilfe eines inhaftierten Kannibalen, um einen anderen Serienkiller zu fassen.', tagline_de: 'Die furchtloseste Therapie, die es gibt.', vote_average: 8.3, genres_de: 'Krimi, Drama, Thriller', director: 'Jonathan Demme', runtime: 118, number_of_seasons: null, number_of_episodes: null, imdb_id: 'tt0102926' },
  { tmdb_id: 85, media_type: 'movie', title_de: 'Der Soldat James Ryan', title_original: 'Saving Private Ryan', year: '1998', poster_path: '/uqx37cS8cpH7jbbouPqYmQ0hHJH.jpg', backdrop_path: '/lKvhdb6ZGdi6oX4YG4QYqo3cZpM.jpg', overview_de: 'Nach der Landung in der Normandie zieht eine Gruppe Soldaten hinter feindliche Linien, um einen Fallschirmjäger zu finden.', tagline_de: 'Ein Mann ist es wert.', vote_average: 8.3, genres_de: 'Drama, Krieg', director: 'Steven Spielberg', runtime: 169, number_of_seasons: null, number_of_episodes: null, imdb_id: 'tt0120815' },
  { tmdb_id: 121, media_type: 'movie', title_de: 'Der Herr der Ringe: Die zwei Türme', title_original: 'The Lord of the Rings: The Two Towers', year: '2002', poster_path: '/5VTN0pR8gcqV6EkuuXiRc92d7nt.jpg', backdrop_path: '/p7mpSKqEYplc2t4qIyXWWLcfeZ6.jpg', overview_de: 'Während Frodo und Sam sich Mordor nähern, kämpfen ihre Freunde um das Volk von Rohan.', tagline_de: 'Das Abenteuer geht weiter.', vote_average: 8.4, genres_de: 'Action, Abenteuer, Drama', director: 'Peter Jackson', runtime: 179, number_of_seasons: null, number_of_episodes: null, imdb_id: 'tt0245429' },
  { tmdb_id: 311, media_type: 'movie', title_de: 'Das Leben ist schön', title_original: 'La vita è bella', year: '1997', poster_path: '/74hLDKjD5aGYOotO6esUVaeIDNa.jpg', backdrop_path: '/bOReOeIsHVhtcgQW6c3zKQsFhbU.jpg', overview_de: 'Ein jüdisch-italienischer Vater nutzt Humor, um seinen Sohn vor den Schrecken eines Konzentrationslagers zu schützen.', tagline_de: 'Eine tragische Komödie über das Leben.', vote_average: 8.4, genres_de: 'Komödie, Drama, Romantik', director: 'Roberto Benigni', runtime: 116, number_of_seasons: null, number_of_episodes: null, imdb_id: 'tt0118799' },
  { tmdb_id: 489, media_type: 'movie', title_de: 'Good Will Hunting', title_original: 'Good Will Hunting', year: '1997', poster_path: '/qPpOqdiXdRDuP9KffnowsSFiqgu.jpg', backdrop_path: '/d2uIRqjMg1VWoYdgwkF6BYXKxhN.jpg', overview_de: 'Ein Hausmeister am MIT hat ein mathematisches Genie, braucht aber die Hilfe eines Psychologen, um Richtung im Leben zu finden.', tagline_de: 'Manche Menschen können dich nicht lehren, was du lernen musst.', vote_average: 8.3, genres_de: 'Drama, Romantik', director: 'Gus Van Sant', runtime: 126, number_of_seasons: null, number_of_episodes: null, imdb_id: 'tt0120586' },
  { tmdb_id: 142, media_type: 'movie', title_de: 'Departed: Unter Feinden', title_original: 'The Departed', year: '2006', poster_path: '/nWaY7BujwPFmyAobpibrTwd6DjQ.jpg', backdrop_path: '/i6vz2oWQ5BAJOYpxNddQ7HzkOBC.jpg', overview_de: 'Ein verdeckter Ermittler und ein Maulwurf in der Polizei versuchen, sich gegenseitig zu identifizieren.', tagline_de: 'Lügen. Verrat. Opfer.', vote_average: 8.2, genres_de: 'Krimi, Drama, Thriller', director: 'Martin Scorsese', runtime: 151, number_of_seasons: null, number_of_episodes: null, imdb_id: 'tt0407887' },
  { tmdb_id: 630, media_type: 'movie', title_de: 'Die üblichen Verdächtigen', title_original: 'The Usual Suspects', year: '1995', poster_path: '/eAshN6u5t6C9P6VwjhYxKkbKxxx.jpg', backdrop_path: '/r8YAVtZSnr4qacmFk6hg5K9aQWI.jpg', overview_de: 'Der einzige Überlebende erzählt die Geschichte eines schiefgegangenen Coups, der zu einem Schusswechsel führte.', tagline_de: 'Wer ist Keyser Söze?', vote_average: 8.1, genres_de: 'Krimi, Mystery, Thriller', director: 'Bryan Singer', runtime: 106, number_of_seasons: null, number_of_episodes: null, imdb_id: 'tt0114814' },
  { tmdb_id: 829, media_type: 'movie', title_de: 'The Green Mile', title_original: 'The Green Mile', year: '1999', poster_path: '/velWPhVMQeQKcxggNuVeNm7v8Z3.jpg', backdrop_path: '/l6hQWH9eDksNJNiXWYR5WnWQ7Xb.jpg', overview_de: 'Das Leben der Wärter im Todestrakt wird durch einen Häftling mit mysteriösen Fähigkeiten berührt.', tagline_de: 'Ein Wunder passiert.', vote_average: 8.5, genres_de: 'Krimi, Drama, Fantasy', director: 'Frank Darabont', runtime: 189, number_of_seasons: null, number_of_episodes: null, imdb_id: 'tt0120689' },
  { tmdb_id: 12, media_type: 'movie', title_de: 'Findet Nemo', title_original: 'Finding Nemo', year: '2003', poster_path: '/eHuGQnFU5nQzZc5TqUjsuVtq5O5.jpg', backdrop_path: '/cKw4XGzKVUF6rHEZCMsBqMwEdNy.jpg', overview_de: 'Ein Clownfisch sucht nach seinem Sohn, der von einem Taucher mitgenommen und in ein Aquarium gesteckt wurde.', tagline_de: 'Es gibt 3,7 Billionen Fische im Meer. Findet einen.', vote_average: 7.8, genres_de: 'Animation, Abenteuer, Komödie', director: 'Andrew Stanton', runtime: 100, number_of_seasons: null, number_of_episodes: null, imdb_id: 'tt0266543' },
  { tmdb_id: 16869, media_type: 'movie', title_de: 'Inglourious Basterds', title_original: 'Inglourious Basterds', year: '2009', poster_path: '/7sfbQX2ologiesXNU30s5lGls0k1.jpg', backdrop_path: '/i7dTfWWQ54k3ts6zYsF3le5cwnR.jpg', overview_de: 'Im besetzten Frankreich planen eine jüdische Kinobesitzerin und amerikanische Soldaten, Nazi-Führer zu ermorden.', tagline_de: 'Ein Kino-Film, der WWII neu schreibt.', vote_average: 8.2, genres_de: 'Abenteuer, Drama, Krieg', director: 'Quentin Tarantino', runtime: 153, number_of_seasons: null, number_of_episodes: null, imdb_id: 'tt0361748' },
  { tmdb_id: 1396, media_type: 'tv', title_de: 'Breaking Bad', title_original: 'Breaking Bad', year: '2008', poster_path: '/ggFHVNu6YYI5L9pCgO9jIQ0dOi3.jpg', backdrop_path: '/tsRy63Mu5cu8etL1X7ZLyf7UP1M.jpg', overview_de: 'Ein Chemielehrer mit Krebs wird zum Methamphetamin-Koch, um seine Familie finanziell abzusichern.', tagline_de: 'Erinner meinen Namen.', vote_average: 8.9, genres_de: 'Drama, Krimi, Thriller', director: 'Vince Gilligan', runtime: 45, number_of_seasons: 5, number_of_episodes: 62, imdb_id: 'tt0903747' },
  { tmdb_id: 1399, media_type: 'tv', title_de: 'Game of Thrones', title_original: 'Game of Thrones', year: '2011', poster_path: '/1XS1oqLropftoTprbUbstQ1qEYw.jpg', backdrop_path: '/2OMB0ynKXxYenPZBdQ9DQeNTeUQ.jpg', overview_de: 'Adelshäuser kämpfen um die Herrschaft über die Sieben Königslande, während ein alter Feind aus dem Norden zurückkehrt.', tagline_de: 'Winter kommt.', vote_average: 8.5, genres_de: 'Drama, Abenteuer, Fantasy', director: 'David Benioff, D.B. Weiss', runtime: 60, number_of_seasons: 8, number_of_episodes: 73, imdb_id: 'tt0944947' },
  { tmdb_id: 70523, media_type: 'tv', title_de: 'Dark', title_original: 'Dark', year: '2017', poster_path: '/apbrbWs8M9lyOpJYU5WXrpFbk1Z.jpg', backdrop_path: '/5LWPyEmGdMjxJOukf3zUkO58giG.jpg', overview_de: 'Eine Familiensaga mit Aschenputtel-Verwicklungen, die sich über mehrere Zeitebenen erstreckt und das verschwindende Kinder aufdeckt.', tagline_de: 'Alles ist verbunden.', vote_average: 8.5, genres_de: 'Drama, Mystery, Science Fiction', director: 'Baran bo Odar, Jantje Friese', runtime: 60, number_of_seasons: 3, number_of_episodes: 26, imdb_id: 'tt5753856' },
  { tmdb_id: 66732, media_type: 'tv', title_de: 'Stranger Things', title_original: 'Stranger Things', year: '2016', poster_path: '/49WJfeN0moxb9IPf9nwwdZFURxc.jpg', backdrop_path: '/56v2KjBlU4XaOv9rVYEQBhXHOVq.jpg', overview_de: 'Als ein Junge verschwindet, entdecken seine Freunde, ihre Familie und die Polizei übernatürliche Kräfte und eine geheime Regierung.', tagline_de: 'Friendly squares off.', vote_average: 8.6, genres_de: 'Drama, Mystery, Science Fiction', director: 'The Duffer Brothers', runtime: 50, number_of_seasons: 4, number_of_episodes: 42, imdb_id: 'tt4574334' },
  { tmdb_id: 2316, media_type: 'tv', title_de: 'The Office', title_original: 'The Office', year: '2005', poster_path: '/qWnJzyZhcc74fWjSN9RY7jz9gge.jpg', backdrop_path: '/7DJKHzAi83BmQrWLrYYOqcoKfhR.jpg', overview_de: 'Alltag in einer Papierfirma, dokumentiert von einem Kamerateam — mit dem ungeschickten Chef Michael Scott.', tagline_de: 'Eine amerikanische Mittelschicht-Tragödie.', vote_average: 8.6, genres_de: 'Komödie', director: 'Greg Daniels', runtime: 22, number_of_seasons: 9, number_of_episodes: 201, imdb_id: 'tt0386676' },
  { tmdb_id: 60059, media_type: 'tv', title_de: 'Better Call Saul', title_original: 'Better Call Saul', year: '2015', poster_path: '/fC2HDm5t0kHl7mTm7jxMR31bvXN.jpg', backdrop_path: '/iWdFhH7TljB6TUrQItXfMltHNoF.jpg', overview_de: 'Vor den Ereignissen von Breaking Bad: Der Abstieg des Anwalts Jimmy McGill zum windigen Saul Goodman.', tagline_de: 'Erinnere mich.', vote_average: 8.8, genres_de: 'Drama, Krimi', director: 'Vince Gilligan, Peter Gould', runtime: 45, number_of_seasons: 6, number_of_episodes: 63, imdb_id: 'tt1492489' },
  { tmdb_id: 14362, media_type: 'tv', title_de: 'The Wire', title_original: 'The Wire', year: '2002', poster_path: '/snQYptF1qOlWvKjC4rL0bg5CTTh.jpg', backdrop_path: '/lM1venTkxpPQ6uLL6sI40UfzEIf.jpg', overview_de: 'Die Drogenszene in Baltimore aus der Sicht von Polizei, Dealern, Politikern und Medien.', tagline_de: 'Eines ist sicher: Alle tun, was sie tun.', vote_average: 8.3, genres_de: 'Drama, Krimi', director: 'David Simon', runtime: 60, number_of_seasons: 5, number_of_episodes: 60, imdb_id: 'tt0306414' },
  { tmdb_id: 94615, media_type: 'tv', title_de: 'Arcane', title_original: 'Arcane', year: '2021', poster_path: '/abf8tHznhSx9DOd3eAugKmrSDlbP.jpg', backdrop_path: '/q8eejQcg1bAqImEV8jh8RtBD4uH.jpg', overview_de: 'Die Schwestern Vi und Jinx stehen sich in dem Konflikt zwischen den reichen Städten Piltover und Zaun gegenüber.', tagline_de: 'Die Frage ist nicht, ob du kämpfst — sondern warum.', vote_average: 8.7, genres_de: 'Animation, Action, Abenteuer', director: 'Christian Linke, Alex Yee', runtime: 45, number_of_seasons: 2, number_of_episodes: 18, imdb_id: 'tt11126994' },
];

function fallbackSearch(query: string, page: number): { titles: MergedSearchTitle[]; total: number } {
  const q = query.trim().toLowerCase();
  const matches = FALLBACK_CATALOG.filter(
    (m) => m.title_de.toLowerCase().includes(q) || m.title_original.toLowerCase().includes(q),
  );
  const pageSize = 10;
  const start = (page - 1) * pageSize;
  return {
    titles: matches.slice(start, start + pageSize).map((m) => ({
      tmdb_id: m.tmdb_id,
      media_type: m.media_type,
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

function fallbackDetail(tmdb_id: number, media_type: MediaType): TmdbDetail | null {
  const e = FALLBACK_CATALOG.find((m) => m.tmdb_id === tmdb_id && m.media_type === media_type);
  if (!e) return null;
  return {
    id: e.tmdb_id,
    media_type: e.media_type,
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
    number_of_seasons: e.number_of_seasons,
    number_of_episodes: e.number_of_episodes,
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

interface RawMultiResult {
  id: number;
  media_type: string;
  title?: string;
  name?: string;
  original_title?: string;
  original_name?: string;
  release_date?: string;
  first_air_date?: string;
  poster_path: string | null;
  overview: string;
  vote_average: number;
}

interface RawMultiResponse {
  page: number;
  results: RawMultiResult[];
  total_pages: number;
  total_results: number;
}

function toMerged(r: RawMultiResult): MergedSearchTitle | null {
  if (r.media_type !== 'movie' && r.media_type !== 'tv') return null;
  if (!r.id) return null;
  const title = r.title || r.name || '';
  const original = r.original_title || r.original_name || '';
  if (!title && !original) return null;
  const date = r.release_date || r.first_air_date || '';
  return {
    tmdb_id: r.id,
    media_type: r.media_type as MediaType,
    title_de: title || original,
    title_original: original,
    year: date ? date.slice(0, 4) : '',
    poster_url: posterUrl(r.poster_path),
    overview_de: r.overview,
    vote_average: r.vote_average,
  };
}

export async function searchTitles(
  query: string,
  page = 1,
): Promise<{ titles: MergedSearchTitle[]; total: number; error?: string }> {
  if (!query.trim()) return { titles: [], total: 0 };
  if (!TMDB_API_KEY) {
    const fb = fallbackSearch(query, page);
    return { titles: fb.titles, total: fb.total };
  }

  const q = encodeURIComponent(query);
  const pathDe = `/search/multi?query=${q}&page=${page}&include_adult=false&language=de-DE`;
  const pathEn = `/search/multi?query=${q}&page=${page}&include_adult=false&language=en-US`;

  const [deRes, enRes] = await Promise.all([
    tmdbGet<RawMultiResponse>(pathDe).catch(() => null),
    tmdbGet<RawMultiResponse>(pathEn).catch(() => null),
  ]);

  if (!deRes && !enRes) return { titles: [], total: 0, error: 'Search failed' };

  // Key by composite (tmdb_id + media_type) since TMDB movie/tv id spaces overlap.
  const byKey = new Map<string, MergedSearchTitle>();
  for (const r of enRes?.results ?? []) {
    const m = toMerged(r);
    if (m) byKey.set(`${m.tmdb_id}-${m.media_type}`, m);
  }
  for (const r of deRes?.results ?? []) {
    const m = toMerged(r);
    if (m) byKey.set(`${m.tmdb_id}-${m.media_type}`, m);
  }

  const deOrder = deRes?.results.map((r) => `${r.id}-${r.media_type}`) ?? [];
  const enOrder = enRes?.results.map((r) => `${r.id}-${r.media_type}`) ?? [];
  const orderedKeys: string[] = [];
  for (const k of deOrder) if (byKey.has(k) && !orderedKeys.includes(k)) orderedKeys.push(k);
  for (const k of enOrder) if (byKey.has(k) && !orderedKeys.includes(k)) orderedKeys.push(k);

  const titles = orderedKeys.map((k) => byKey.get(k)!);
  const total = Math.max(deRes?.total_results ?? 0, enRes?.total_results ?? 0);
  return { titles, total };
}

interface RawMovieDetail {
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
  credits?: { crew: { job: string; name: string }[] };
}

interface RawTvDetail {
  id: number;
  name: string;
  original_name: string;
  first_air_date: string;
  poster_path: string | null;
  backdrop_path: string | null;
  overview: string;
  tagline?: string;
  episode_run_time: number[];
  genres: TmdbGenre[];
  vote_average: number;
  number_of_seasons: number;
  number_of_episodes: number;
  created_by: { name: string }[];
  external_ids?: { imdb_id?: string };
  credits?: { crew: { job: string; name: string }[] };
}

export async function getTitleDetail(
  tmdb_id: number,
  media_type: MediaType,
): Promise<TmdbDetail | null> {
  if (!TMDB_API_KEY) return fallbackDetail(tmdb_id, media_type);

  if (media_type === 'movie') {
    const path = `/movie/${tmdb_id}?language=de-DE&append_to_response=credits,external_ids`;
    const d = await tmdbGet<RawMovieDetail>(path);
    if (!d || !d.id) return null;
    return {
      id: d.id,
      media_type: 'movie',
      title: d.title || d.original_title,
      original_title: d.original_title,
      release_date: d.release_date,
      poster_path: d.poster_path,
      backdrop_path: d.backdrop_path,
      overview: d.overview,
      tagline: d.tagline,
      runtime: d.runtime,
      genres: d.genres,
      vote_average: d.vote_average,
      imdb_id: d.imdb_id,
      number_of_seasons: null,
      number_of_episodes: null,
      credits: d.credits,
    };
  }

  const path = `/tv/${tmdb_id}?language=de-DE&append_to_response=credits,external_ids`;
  const d = await tmdbGet<RawTvDetail>(path);
  if (!d || !d.id) return null;
  const imdbId = d.external_ids?.imdb_id ?? null;
  const runtime = d.episode_run_time?.length ? d.episode_run_time[0] : null;
  const creatorNames = d.created_by?.map((c) => c.name) ?? [];
  const crew = d.credits?.crew ?? [];
  // For TV, "Director" is rare; use creators if present, fall back to any Director.
  const mergedCrew = [
    ...creatorNames.map((name) => ({ job: 'Creator', name })),
    ...crew.filter((c) => c.job === 'Director'),
  ];
  return {
    id: d.id,
    media_type: 'tv',
    title: d.name || d.original_name,
    original_title: d.original_name,
    release_date: d.first_air_date,
    poster_path: d.poster_path,
    backdrop_path: d.backdrop_path,
    overview: d.overview,
    tagline: d.tagline ?? '',
    runtime,
    genres: d.genres,
    vote_average: d.vote_average,
    imdb_id: imdbId,
    number_of_seasons: d.number_of_seasons,
    number_of_episodes: d.number_of_episodes,
    credits: { crew: mergedCrew },
    created_by: d.created_by,
  };
}

export function hasApiKey(): boolean {
  return Boolean(TMDB_API_KEY);
}

export function directorFromDetail(detail: TmdbDetail): string | null {
  if (detail.media_type === 'tv') {
    const creator = detail.credits?.crew.find((c) => c.job === 'Creator');
    if (creator) return creator.name;
  }
  const d = detail.credits?.crew.find((c) => c.job === 'Director');
  return d?.name ?? null;
}

export function genresFromDetail(detail: TmdbDetail): string | null {
  if (!detail.genres || detail.genres.length === 0) return null;
  return detail.genres.map((g) => g.name).join(', ');
}

// --- Extended detail (cast, trailer, similar) ---

interface RawCastMember {
  id: number;
  name: string;
  character: string;
  profile_path: string | null;
}

interface RawVideo {
  key: string;
  name: string;
  site: string;
  type: string;
  official: boolean;
}

interface RawSimilar {
  results: {
    id: number;
    media_type?: string;
    title?: string;
    name?: string;
    original_title?: string;
    original_name?: string;
    release_date?: string;
    first_air_date?: string;
    poster_path: string | null;
    vote_average: number;
    overview: string;
  }[];
}

interface RawExtendedMovie extends RawMovieDetail {
  credits?: { cast: RawCastMember[]; crew: { job: string; name: string }[] };
  videos?: { results: RawVideo[] };
  similar?: RawSimilar;
}

interface RawExtendedTv extends RawTvDetail {
  credits?: { cast: RawCastMember[]; crew: { job: string; name: string }[] };
  videos?: { results: RawVideo[] };
  similar?: RawSimilar;
}

function castFromRaw(raw: RawCastMember[] | undefined, limit = 12): CastMember[] {
  if (!raw) return [];
  return raw.slice(0, limit).map((c) => ({
    id: c.id,
    name: c.name,
    character: c.character,
    profile_path: c.profile_path,
    profile_url: profileUrl(c.profile_path),
  }));
}

function firstTrailerKey(videos: RawVideo[] | undefined): { key: string; name: string } | null {
  if (!videos?.length) return null;
  // Prefer official YouTube trailers, then any YouTube trailer, then any YouTube clip.
  const yt = videos.filter((v) => v.site === 'YouTube');
  const officialTrailer = yt.find((v) => v.type === 'Trailer' && v.official);
  if (officialTrailer) return { key: officialTrailer.key, name: officialTrailer.name };
  const anyTrailer = yt.find((v) => v.type === 'Trailer');
  if (anyTrailer) return { key: anyTrailer.key, name: anyTrailer.name };
  const first = yt[0];
  if (first) return { key: first.key, name: first.name };
  return null;
}

function similarFromRaw(raw: RawSimilar | undefined, fallbackMedia: MediaType, limit = 8): SimilarTitle[] {
  if (!raw?.results) return [];
  const out: SimilarTitle[] = [];
  for (const r of raw.results) {
    if (!r.id) continue;
    const mediaType: MediaType | null =
      r.media_type === 'movie' || r.media_type === 'tv' ? r.media_type : fallbackMedia;
    if (!mediaType) continue;
    const title = r.title || r.name || '';
    if (!title) continue;
    const date = r.release_date || r.first_air_date || '';
    out.push({
      tmdb_id: r.id,
      media_type: mediaType,
      title_de: title,
      year: date ? date.slice(0, 4) : '',
      poster_path: r.poster_path,
      poster_url: posterUrl(r.poster_path),
      vote_average: r.vote_average,
      overview_de: r.overview,
    });
    if (out.length >= limit) break;
  }
  return out;
}

export async function getTitleExtended(
  tmdb_id: number,
  media_type: MediaType,
): Promise<TitleExtended | null> {
  // Fallback path: the demo catalog has no cast/trailer/similar data — return
  // the basic detail with empty arrays. The UI conditionally renders these
  // sections, so it just hides them.
  if (!TMDB_API_KEY) {
    const detail = fallbackDetail(tmdb_id, media_type);
    if (!detail) return null;
    return {
      detail,
      cast: [],
      crew_top: detail.credits?.crew ?? [],
      trailer_key: null,
      trailer_name: null,
      similar: [],
    };
  }

  const path = `/${media_type}/${tmdb_id}?language=de-DE&append_to_response=credits,videos,similar,external_ids`;

  if (media_type === 'movie') {
    const d = await tmdbGet<RawExtendedMovie>(path);
    if (!d || !d.id) return null;
    const detail: TmdbDetail = {
      id: d.id,
      media_type: 'movie',
      title: d.title || d.original_title,
      original_title: d.original_title,
      release_date: d.release_date,
      poster_path: d.poster_path,
      backdrop_path: d.backdrop_path,
      overview: d.overview,
      tagline: d.tagline,
      runtime: d.runtime,
      genres: d.genres,
      vote_average: d.vote_average,
      imdb_id: d.imdb_id,
      number_of_seasons: null,
      number_of_episodes: null,
      credits: d.credits ? { crew: d.credits.crew } : undefined,
    };
    const trailer = firstTrailerKey(d.videos?.results);
    return {
      detail,
      cast: castFromRaw(d.credits?.cast),
      crew_top: (d.credits?.crew ?? []).slice(0, 8),
      trailer_key: trailer?.key ?? null,
      trailer_name: trailer?.name ?? null,
      similar: similarFromRaw(d.similar, 'movie'),
    };
  }

  const d = await tmdbGet<RawExtendedTv>(path);
  if (!d || !d.id) return null;
  const imdbId = d.external_ids?.imdb_id ?? null;
  const runtime = d.episode_run_time?.length ? d.episode_run_time[0] : null;
  const creatorNames = d.created_by?.map((c) => c.name) ?? [];
  const crew = d.credits?.crew ?? [];
  const mergedCrew = [
    ...creatorNames.map((name) => ({ job: 'Creator', name })),
    ...crew.filter((c) => c.job === 'Director' || c.job === 'Creator'),
  ];
  const detail: TmdbDetail = {
    id: d.id,
    media_type: 'tv',
    title: d.name || d.original_name,
    original_title: d.original_name,
    release_date: d.first_air_date,
    poster_path: d.poster_path,
    backdrop_path: d.backdrop_path,
    overview: d.overview,
    tagline: d.tagline ?? '',
    runtime,
    genres: d.genres,
    vote_average: d.vote_average,
    imdb_id: imdbId,
    number_of_seasons: d.number_of_seasons,
    number_of_episodes: d.number_of_episodes,
    credits: { crew: mergedCrew },
    created_by: d.created_by,
  };
  const trailer = firstTrailerKey(d.videos?.results);
  return {
    detail,
    cast: castFromRaw(d.credits?.cast),
    crew_top: mergedCrew.slice(0, 8),
    trailer_key: trailer?.key ?? null,
    trailer_name: trailer?.name ?? null,
    similar: similarFromRaw(d.similar, 'tv'),
  };
}
