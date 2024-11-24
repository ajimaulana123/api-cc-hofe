import axios from "axios";
import * as cheerio from "cheerio";
import puppeteer from 'puppeteer-core';
import chromium from 'chrome-aws-lambda';

/**
 * @description Mengecek berita apakah hoaks atau tidak
 */
const checkNewsForHoax = async (req, res, next) => {
    const { baseUrl } = req.body;

    try {
        const browser = await puppeteer.launch({
            executablePath: await chromium.executablePath || '/usr/bin/chromium-browser', // Tambahkan fallback
            headless: true,
            args: chromium.args,
            defaultViewport: chromium.defaultViewport,
        });
        
        const page = await browser.newPage();

        // Set user agent and other headers
        await page.setUserAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/111.0.0.0 Safari/537.36");

        // Navigate to the URL
        await page.goto(baseUrl, { waitUntil: 'domcontentloaded' });

        // Get page content after it has rendered
        const mainPageData = await page.content();

        // Parse HTML with cheerio
        const $ = cheerio.load(mainPageData);

        const articles = [];

        // Function to clean text
        const cleanText = (text) => {
            return text
                .toLowerCase() // Convert all text to lowercase
                .replace(/[^a-z0-9\s]/g, '') // Remove all non-alphanumeric characters
                .replace(/\s+/g, ' ') // Replace multiple spaces with a single space
                .trim(); // Trim leading and trailing spaces
        };

        // Process all articles asynchronously
        const promises = $('article').map(async (index, element) => {
            const content = $(element).find('p, .entry-content, .post-content, .article-body, .article-text, .content-text, .main-content, .article-content, .news-content, .post-body, .story-body, .content-body, .news-body, .post-entry, .single-post-content, .article-main, .story-content, .entry-body, .body-text, .content-article, .article-excerpt, .article-main-body')
                .text()
                .trim();

            if (content) {
                const cleanedContent = cleanText(content);
                const response = await axios.post('https://model-api-hofe-production.up.railway.app/predict', { "texts": [cleanedContent] });

                // Add prediction results to the articles array
                return response.data;
            }
        }).get(); // `.get()` to return array from map

        // Wait for all articles to be processed
        const results = await Promise.all(promises);
        articles.push(...results); // Combine prediction results into the articles array

        // Send the processed articles data as response
        res.json(articles);

        // Close the Puppeteer browser
        await browser.close();

    } catch (error) {
        console.error('Error scraping latest news:', error);
        res.status(500).json({ message: 'Error scraping latest news', error });
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
