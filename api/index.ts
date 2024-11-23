const express = require("express");
const cheerio = require('cheerio');
const axios = require("axios");

const router = express.Router();

const app = express();

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

const checkNewsForHoax = async (req, res, next) => {
    const { baseUrl } = req.body;
    
    try {
        // Ambil halaman utama menggunakan axios
        const { data: mainPageData } = await axios.get(baseUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/111.0.0.0 Safari/537.36',
                'Accept-Language': 'en-US,en;q=0.9',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
            },
        });

        // Load data HTML dengan cheerio
        const $ = cheerio.load(mainPageData);
        
        const articles = [];

        // Mengambil elemen artikel dan kontennya
        $('article').each(async (index, element) => {
            const content = $(element).find('p, .entry-content, .post-content, .article-body, .article-text, .content-text, .main-content, .article-content, .news-content, .post-body, .story-body, .content-body, .news-body, .post-entry, .single-post-content, .article-main, .story-content, .entry-body, .body-text, .content-article, .article-excerpt, .article-main-body')
                .text().trim();


            const cleanText = (text) => {
                return text
                      .toLowerCase() // Mengubah semua huruf menjadi huruf kecil
                      .replace(/[^a-z0-9\s]/g, '') // Menghapus semua karakter selain huruf, angka, dan spasi
                      .replace(/\s+/g, ' ') // Menghapus spasi ganda menjadi satu spasi
                      .trim(); // Menghapus spasi di awal dan akhir teks
            };

            if (content) {
                 const response = await axios.post('https://model-api-hofe-production.up.railway.app/predict', { "texts": [cleanText(content)] });

                 articles.push(response.data)

                  // Kirim data yang sudah di-scrape
                 res.json(articles);
            }
        });
    } catch (error) {
        console.error('Error scraping latest news:', error);
        res.status(500).json({ message: 'Error scraping latest news', error });
    }
};

router.get("/", getAllNews);
router.post("/predict", checkNewsForHoax);

app.use("/api/news", router);

app.listen(3000, () => console.log("Server ready on port 3000."));