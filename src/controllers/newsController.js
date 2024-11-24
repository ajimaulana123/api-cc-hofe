import axios from "axios";
import * as cheerio from "cheerio";
import puppeteer from 'puppeteer-core';
import chromium from 'chrome-aws-lambda';

/**
 * @description Mengecek berita apakah hoaks atau tidak
 */
const checkNewsForHoax = async (req, res, next) => {
    const { text } = req.body;  // Ambil teks dari body request

    try {
        // Kirimkan teks langsung ke API prediksi
        const response = await axios.post('https://model-api-hofe-production.up.railway.app/predict', {
            "texts": [text]  // Kirim teks dalam format array
        });

        // Ambil hasil prediksi dari API response
        const predictionResults = response.data;

        // Kirim hasil prediksi sebagai response
        res.json(predictionResults);

    } catch (error) {
        console.error('Error processing text:', error);
        res.status(500).json({ message: 'Error processing text', error });
    }
};

/**
 * @description Mendapatkan semua berita
 */
const getAllNews = async (req, res) => {
    const baseUrl = 'https://turnbackhoax.id/';

    try {
        // Ambil halaman utama
        const { data: mainPageData } = await axios.get(baseUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/111.0.0.0 Safari/537.36',
                'Accept-Language': 'en-US,en;q=0.9',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
            },
        });

        // Scrape opsi terbaru
        const $ = cheerio.load(mainPageData);
        let latestOptionUrl = '';
        $('select option').each((index, element) => {
            const value = $(element).attr('value');
            if (value && !latestOptionUrl) {
                latestOptionUrl = value; // Ambil URL terbaru (indeks pertama)
            }
        });

        if (!latestOptionUrl) {
            return res.status(404).json({ message: 'No latest URL found' });
        }

        // Hit URL terbaru
        const { data: latestPageData } = await axios.get(latestOptionUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/111.0.0.0 Safari/537.36',
                'Accept-Language': 'en-US,en;q=0.9',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
            },
        });

        // Scrape berita dari URL terbaru
        const $$ = cheerio.load(latestPageData);
        const articles = [];

        $$('article').each((index, element) => {
            const title = $$(element).find('.entry-title a').text().trim();
            const link = $$(element).find('.entry-title a').attr('href').trim();
            const date = $$(element).find('.mh-meta-date').text().trim();
            const image = $$(element).find('.mh-loop-thumb img').attr('src');
            const content = $$(element).find('.mh-excerpt p').text().trim(); // Pastikan ini sesuai dengan struktur yang ada

            articles.push({
                title,
                link,
                date,
                image,
                content,
            });
        });

        res.json(articles);
    } catch (error) {
        console.error('Error scraping latest news:', error);
        res.status(500).json({ message: 'Error scraping latest news', error });
    }
};

export { checkNewsForHoax, getAllNews };
