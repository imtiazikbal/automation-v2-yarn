const express = require('express');
const cors = require('cors');
const puppeteer = require('puppeteer')
const cron = require('node-cron');
const app = express()
app.use(cors())
app.use(express.json())

app.get('/morning/3', async (req, res) => {
  const currentDate = new Date();

  function getDateAfterDays() {
    let daysToAdd = 55;
    if (currentDate.getHours() > 10) daysToAdd = 3;

    const millisecondsInADay = 1000 * 60 * 60 * 24;
    const futureDate = new Date(currentDate.getTime() + daysToAdd * millisecondsInADay);

    const futureDay = futureDate.getDate();
    const futureMonth = futureDate.getMonth() + 1;
    const futureYear = futureDate.getFullYear();

    return { futureDay, futureMonth, futureYear };
  }

  const { futureDay, futureMonth,futureYear} = getDateAfterDays();
  console.log(futureDay, futureMonth, futureYear)

  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: { width: 1920, height: 1080 },
    args: ['--window-size=1920,700'],
    userDataDir: "temporary",
  });
//   const browser = await puppeteer.launch({
//     headless: false,
//     executablePath: '/usr/bin/google-chrome', // Path to Google Chrome
//     defaultViewport: { width: 1920, height: 1080 },
//     args: ['--window-size=1920,700'],
//     userDataDir: 'temporary',
// });
  const page = await browser.newPage();
  await page.goto("https://www.recreation.gov", { waitUntil: "networkidle2" })

  const loginButton = await page.waitForSelector('button#ga-global-nav-log-in-link', { timeout: 1000 }).catch(() => null);
  if (loginButton) {
    await loginButton.click();
    await page.type('input[type="email"]#email', 'hltc1@yahoo.com');
    await page.type('input[type="password"]', 'USSArizona@1577');
    await page.click('button[type="submit"]');
  }

  // Type the value into the input field
   await page.waitForSelector('#hero-search-input', 'USS Arizona Memorial (Authorized Commercial Users)');
   await page.type('#hero-search-input', 'USS Arizona Memorial (Authorized Commercial Users)');
  // // Wait for the suggestion container to appear
  //  await page.waitForSelector('.search-suggestion-container');
  // need stay 2 second

  // Wait for 2 seconds
  await new Promise(resolve => setTimeout(resolve, 500));


  // setTimeout(async () => {
  //   await page.click('.sarsa--autosuggest-listbox-section');
  // }, 2000);
  await page.waitForSelector('.sarsa--autosuggest-popover');
  // After typing in the search input and waiting for suggestions
await page.waitForSelector('.nav-search-bar-container-popup'); // Ensure the parent element is present

setTimeout(async () => {
  await page.click('.sarsa--autosuggest-listbox-section');
}, 500);
await page.waitForSelector('button[data-test-id="dropdown-base-trigger"]');

  await page.click('button[data-test-id="dropdown-base-trigger"]');
  for (let i = 0; i < 8; i++) await page.click('button[aria-label="Add General Admissions"]');
  await page.waitForSelector('button[data-test-id="dropdown-base-trigger"]');
  await page.click('button[data-test-id="dropdown-base-trigger"]');

  // calender selection
  await new Promise(resolve => setTimeout(resolve, 1000));
  await page.waitForSelector('div[role="spinbutton"][aria-label="month, "]', `${futureMonth}`);
  await page.type('div[role="spinbutton"][aria-label="month, "]', `${futureMonth}`);

  const dayInput = await page.waitForSelector('div[role="spinbutton"][aria-label="day, "]') // await page.$('div[role="spinbutton"][aria-label="day, "]');
  await dayInput?.type(`${futureDay}`);

  
  
  // if (currentDate.getHours() > 10) await sleepUntil(localToUTC(16, 59, 59, 200))
  // else await sleepUntil(localToUTC(0, 59, 59, 200));

  // const yearInput = await page.waitForSelector('div[role="spinbutton"][aria-label="year, "]');
  // await yearInput?.type(`${futureYear}`);


  // Replace this with your desired year

  
  const yearInput = await page.waitForSelector('div[role="spinbutton"][aria-label="year, "]');
   await yearInput?.click();
   await yearInput?.type(`${futureYear}`);


  const secondLabelSelector = 'label:nth-child(3)';
  await page.waitForSelector(secondLabelSelector);
  console.log('Label click time   :::=>', new Date());
  await page.click(secondLabelSelector);

  console.log('Request click time  :::=>', new Date());
  await page.click('button[data-component="Button"][id="request-tickets"]');
  console.log('Request Finish time :::=>', new Date());

  return res.send('Ok')
})

function localToUTC(hour, minute, second, millisecond) {
  const now = new Date();
  const utcTime = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate(), hour, minute, second, millisecond));
  return utcTime;
}

async function sleepUntil(targetTime) {
  const currentTime = new Date();
  const timeDifference = targetTime.getTime() - currentTime.getTime();
  console.log(timeDifference);
  if (timeDifference <= 0) return;
  await new Promise(resolve => setTimeout(resolve, timeDifference));
}

app.listen(3003, () => {
  console.log('Server is running 3003')
})


cron.schedule('51 * * * *', async () => {
  await fetch('http://localhost:3003/morning/3');
}, {
  timezone: 'Asia/Dhaka'
});
