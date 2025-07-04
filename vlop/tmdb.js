const axios = require('axios');
require('dotenv').config();

const TMDB_BASE_URL = 'https://api.themoviedb.org/3';

class TMDBApi {
    constructor() {
        this.axios = axios.create({
            baseURL: TMDB_BASE_URL,
            headers: {
                'Authorization': `Bearer ${process.env.TMDB_API_KEY}`,
                'Content-Type': 'application/json'
            }
        });
    }

    async searchContent(query) {
        try {
            const [movieResults, tvResults] = await Promise.all([
                this.axios.get('/search/movie', { 
                    params: { 
                        query,
                        include_adult: false,
                        language: 'en-US'
                    }
                }),
                this.axios.get('/search/tv', { 
                    params: { 
                        query,
                        include_adult: false,
                        language: 'en-US'
                    }
                })
            ]);

            const movies = movieResults.data.results.map(movie => ({
                id: movie.id,
                type: 'movie',
                title: movie.title,
                overview: movie.overview,
                poster_path: movie.poster_path,
                vote_average: movie.vote_average,
                release_date: movie.release_date,
                popularity: movie.popularity,
                mediaId: `movie_${movie.id}`
            }));

            const shows = tvResults.data.results.map(show => ({
                id: show.id,
                type: 'tv',
                title: show.name,
                overview: show.overview,
                poster_path: show.poster_path,
                vote_average: show.vote_average,
                release_date: show.first_air_date,
                popularity: show.popularity,
                mediaId: `tv_${show.id}`
            }));

            return [...movies, ...shows]
                .sort((a, b) => b.popularity - a.popularity)
                .slice(0, 5);
        } catch (error) {
            console.error('Error searching content:', error);
            throw error;
        }
    }

    async getContentDetails(id, type) {
        try {
            const endpoint = type === 'movie' ? `/movie/${id}` : `/tv/${id}`;
            const response = await this.axios.get(endpoint, {
                params: {
                    append_to_response: 'credits,similar,videos',
                    language: 'en-US'
                }
            });

            const data = response.data;
            return {
                id: data.id,
                type,
                title: type === 'movie' ? data.title : data.name,
                overview: data.overview,
                poster_path: data.poster_path,
                backdrop_path: data.backdrop_path,
                vote_average: data.vote_average,
                release_date: type === 'movie' ? data.release_date : data.first_air_date,
                genres: data.genres?.map(g => g.name) || [],
                runtime: type === 'movie' ? data.runtime : data.episode_run_time?.[0],
                status: data.status,
                tagline: data.tagline,
                mediaId: `${type}_${data.id}`,
                videos: data.videos?.results || [],
                credits: data.credits,
                similar: data.similar?.results || []
            };
        } catch (error) {
            console.error(`Error getting ${type} details:`, error);
            throw error;
        }
    }

    async getTrending() {
        try {
            const response = await this.axios.get('/trending/all/day', {
                params: {
                    language: 'en-US'
                }
            });

            return response.data.results.map(item => ({
                id: item.id,
                type: item.media_type,
                title: item.media_type === 'movie' ? item.title : item.name,
                overview: item.overview,
                poster_path: item.poster_path,
                vote_average: item.vote_average,
                release_date: item.media_type === 'movie' ? item.release_date : item.first_air_date,
                popularity: item.popularity,
                mediaId: `${item.media_type}_${item.id}`
            })).slice(0, 5);
        } catch (error) {
            console.error('Error getting trending:', error);
            throw error;
        }
    }

    async getPopular() {
        try {
            const [movieResponse, tvResponse] = await Promise.all([
                this.axios.get('/movie/popular', {
                    params: {
                        language: 'en-US',
                        page: 1
                    }
                }),
                this.axios.get('/tv/popular', {
                    params: {
                        language: 'en-US',
                        page: 1
                    }
                })
            ]);

            const movies = movieResponse.data.results.map(movie => ({
                id: movie.id,
                type: 'movie',
                title: movie.title,
                overview: movie.overview,
                poster_path: movie.poster_path,
                vote_average: movie.vote_average,
                release_date: movie.release_date,
                popularity: movie.popularity,
                mediaId: `movie_${movie.id}`
            }));

            const shows = tvResponse.data.results.map(show => ({
                id: show.id,
                type: 'tv',
                title: show.name,
                overview: show.overview,
                poster_path: show.poster_path,
                vote_average: show.vote_average,
                release_date: show.first_air_date,
                popularity: show.popularity,
                mediaId: `tv_${show.id}`
            }));

            return [...movies, ...shows]
                .sort((a, b) => b.popularity - a.popularity)
                .slice(0, 5);
        } catch (error) {
            console.error('Error getting popular:', error);
            throw error;
        }
    }
}

module.exports = new TMDBApi();