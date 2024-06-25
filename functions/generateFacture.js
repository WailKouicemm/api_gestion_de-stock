const ejs = require("ejs");
const puppeteer = require("puppeteer");
const path = require("path");
const fs = require("fs");
const generateFacture = async (data)=>{
    ejs.renderFile(path.join(__dirname,"..","assets","factureSkin.ejs"),data,{}, async (err,str)=>{
        fs.writeFileSync( path.join(__dirname,"..","storage",`facture_${data.order.id}.html`),Buffer.from(str, "utf-8"),{encoding:"utf-8"});
        /*const browser = await puppeteer.launch({args: ['--no-sandbox', '--disable-setuid-sandbox'],executablePath: '/usr/bin/google-chrome',headless:"new"});
        const page = await browser.newPage();
        await page.goto("file://"+ path.join(__dirname,"..","assets",data.order.id+".html"));
        await page.waitForTimeout(3000);
        await page.pdf({
            path: path.join(__dirname,"..","storage",`facture_${data.order.id}.pdf`),
            format: 'A4',
            printBackground:true,
        });
        await browser.close();
        fs.rmSync(path.join(__dirname,"..","assets",data.order.id+".html"))*/
    });
}

module.exports = generateFacture