const { Builder, By, until } = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');
const axios = require('axios');
const fs = require('fs');
const path = require('path');

var capabilities = {
    "browserName" : "chrome",
    'bstack:options' : {
        "os" : "Windows",
        "osVersion" : "10",
        "browserVersion" : "120.0",
      "userName" : "USERNAME",
      "accessKey" : "ACCESS_KEY",
      "consoleLogs" : "info",
      "projectName" : "BS",
      "buildName" : "assignment",
   }
  }

// const capabilitiesList = [
//   {
//     'browserName': 'Safari',
//     'os': 'OS X',
//     'osVersion': 'Monterey',
//     'browserVersion': '15.6'
//   },
//   {
//     'browserName': 'Safari',
//     'os': 'OS X',
//     'osVersion': 'Monterey',
//     'browserVersion': '15.6'
//   },
//   {
//     'browserName': 'Chrome',
//     'os': 'Windows',
//     'osVersion': '10',
//     'browserVersion': '120.0'
//   },
//   {
//     'browserName': 'chrome',
//     'osVersion': '13.0',
//     'deviceName': 'Samsung Galaxy S23 Ultra'
//   },
//   {
//     'browserName': 'safari',
//     'osVersion': '18',
//     'deviceName': 'iPhone 13 Pro Max'
//   }
// ];

async function downloadImage(url, filePath) {
  const writer = fs.createWriteStream(filePath);
  const response = await axios({
    url,
    method: 'GET',
    responseType: 'stream',
  });
  response.data.pipe(writer);
  return new Promise((resolve, reject) => {
    writer.on('finish', resolve);
    writer.on('error', reject);
  });
}

async function translateText(text, targetLang = 'en') {
    try {
      const response = await axios.get('https://api.mymemory.translated.net/get', {
        params: {
          q: text,
          langpair: 'es|en'
        }
      });
      return response.data.responseData.translatedText;
    } catch (error) {
      console.error('Error translating text:', error);
      return text;
    }
  }

  function countRepeatedWords(translatedTitles) {
    const wordCount = {};
  
    for (let i = 0; i < translatedTitles.length; i++) {
      const title = translatedTitles[i].toLowerCase();
      const words = title.match(/\b\w+\b/g);

      if (words) {
        for (let j = 0; j < words.length; j++) {
          const word = words[j]; 

          if (word) {
            if (wordCount[word]) {
              wordCount[word] += 1; 
            } else {
              wordCount[word] = 1;
            }
          }
        }
      }
    }
    const repeatedWords = [];
    for (let word in wordCount) {
      if (wordCount[word] > 2) {
        repeatedWords.push({ word: word, count: wordCount[word] });
      }
    }
    return repeatedWords;
  }
  

(async function BrowserStackAssignment() {
    
    const driver = new Builder()
    .usingServer('https://hub-cloud.browserstack.com/wd/hub')
    .withCapabilities(capabilities)
    .build();
  try {
//For TASK 1:

    await driver.get('https://elpais.com/');
    

    await driver.sleep(2000);
    const cookieButton = await driver.wait(
      until.elementLocated(By.id('didomi-notice-agree-button')),
      5000 
    );
    await cookieButton.click();

    await driver.sleep(2000);
    const pageLang = await driver.executeScript('return document.documentElement.lang');
    if (pageLang != 'es-ES') {
      let languageSelector = await driver.wait(
        until.elementIsVisible(driver.findElement(By.css('li#edition_head a'))),
        10000
      );
      await driver.executeScript("arguments[0].click();", languageSelector);
      console.log('Language successfully changed to Spanish!');
    } else {
      console.log('Page Language is Spanish i.e :', pageLang);
    }

// For TASK 2:
await driver.sleep(2000);
const opinionLink = await driver.wait(
  until.elementLocated(By.id('btn_open_hamburger')), 
  2000 
);
await opinionLink.click();
await driver.sleep(2000);


  await driver.wait(
    until.elementLocated(By.css('#hamburger_container > nav > div:nth-child(1) > ul > li:nth-child(2) > a')), 
    10000 
  ).click();
  await driver.sleep(2000);
  
    await driver.wait(until.elementLocated(By.css('article')), 10000);
    let articles = [];
    const articleElements = await driver.findElements(By.css('article'));

    for (let i = 0; i < Math.min(5, articleElements.length); i++) {
      const article = articleElements[i];
      const title = await article.findElement(By.css('h2')).getText();
      const translatedTitle = await translateText(title);
    //   const link = await article.findElement(By.css('a')).getAttribute('href'); we can fetch link if needed
      const summary = await article.findElement(By.css('p')).getText();
      
      let imageUrl = '';
      try {
        imageUrl = await article.findElement(By.css('img')).getAttribute('src');
      } catch (error) {
        console.log(`No Image Available For Article : ${i+1}`);
      }

      if (imageUrl) {

        // if (!imageUrl.startsWith('http')) {
        //   imageUrl = `https:${imageUrl}`;
        // }

        const fileName = `article_${i+1}.jpeg`;
        const filePath = path.join(__dirname, 'images', fileName);

        if (!fs.existsSync(path.join(__dirname, 'images'))) {
          fs.mkdirSync(path.join(__dirname, 'images'));
        }

        try {
          await downloadImage(imageUrl, filePath);
        } catch (error) {
          console.error('Error downloading image:', error);
        }
      }

      articles.push({
        title,
        translatedTitle,
        // link,
        summary,
        imageUrl,
      });
    }

    console.log('First Five Articles: \n');
    articles.forEach((article, index) => {
      console.log(`${index + 1}. ${article.title}`);
      console.log(`Summary: ${article.summary}`);
      console.log('----------------------------');
    });

    console.log('First Five Translated Headers')
    articles.forEach((article,index) => {
        console.log(`${index+1}. ${article.translatedTitle}`);
        console.log('----------------------------');
    });

//TASK3 
const translatedTitles = articles.map(article => article.translatedTitle);
const repeatedWords = countRepeatedWords(translatedTitles);

console.log('Repeated words (more than twice) in the translated titles: (If Any)');
if (repeatedWords.length > 0) {
  repeatedWords.forEach(({ word, count }) => {
    console.log(`"${word}" occurred ${count} times`);
  });
} else {
  console.log('No repeated words found more than twice');
}

  } catch (err) {
    console.error('Error:', err);
  } finally {
    await driver.quit();
  }
})();