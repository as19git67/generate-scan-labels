import PdfPrinter from 'pdfmake';
import RobotoFont from 'pdfmake/build/vfs_fonts.js';
import nconf from 'nconf';
import fs from 'fs';

nconf.argv().env().file({file: 'config.json'});

nconf.defaults({
  start: 1
});

const zeroPad = (num, places) => String(num).padStart(places, '0');

async function createPdf() {

  const startNumber = nconf.get('start');

  let fonts = {
    Roboto: {
      normal: Buffer.from(RobotoFont.pdfMake.vfs['Roboto-Regular.ttf'], 'base64'),
      bold: Buffer.from(RobotoFont.pdfMake.vfs['Roboto-Medium.ttf'], 'base64'),
      italics: Buffer.from(RobotoFont.pdfMake.vfs['Roboto-Italic.ttf'], 'base64'),
      bolditalics: Buffer.from(RobotoFont.pdfMake.vfs['Roboto-MediumItalic.ttf'], 'base64')
    }
  };

  let printer = new PdfPrinter(fonts);

  const rowsPerPage = 27;
  const columnsPerPage = 7;
  const pointsPerCentimeter = 72 / 2.54;
  const pgSize = 'A4';
  const pageWidthCm = 21;
  const pageHeightCm = 29.7;

  const pageMarginLeft = Math.floor(0.8 * pointsPerCentimeter);
  const pageMarginTop = Math.floor(1.0 * pointsPerCentimeter);
  const pageMarginRight = Math.floor(0.8 * pointsPerCentimeter);
  const pageMarginBottom = Math.floor(1.0 * pointsPerCentimeter);

  const cellWidth = Math.floor(2.5 * pointsPerCentimeter);
  const columnGap = Math.floor(0.2 * pointsPerCentimeter);


  let number = startNumber;
  const widths = [];
  for (let column = 0; column < columnsPerPage; column++) {
    widths.push(cellWidth + columnGap);
  }
  const heights = [];
  for (let row = 0; row < rowsPerPage; row++) {
    heights.push(0.895 * pointsPerCentimeter);
  }

  const body = [];
  for (let row = 0; row < rowsPerPage; row++) {
    const bodyRow = [];
    for (let column = 0; column < columnsPerPage; column++) {
      bodyRow.push(`#${zeroPad(number, 4)}`);
      number++;
    }
    body.push(bodyRow);
  }

  const docDefinition = {
    pageSize: pgSize,

    pageOrientation: 'portrait',

    // [left, top, right, bottom] or [horizontal, vertical] or just a number for equal margins
    pageMargins: [pageMarginLeft, pageMarginTop, pageMarginRight, pageMarginBottom],
    styles: {
      defaultStyle: {
        fontSize: 13,
        columnGap: columnGap,
        margin: [0.2 * pointsPerCentimeter, 0, 0, 0]
      }
    },
    content: [
      {
        layout: 'noBorders',
        style: 'defaultStyle',
        table: {
          heights: heights,
          widths: widths,
          body: body
        }
      }
    ]
  };

  nconf.set('start', number);

  await new Promise(async (resolve, reject) => {
    nconf.save((err) => {
      if (err) {
        reject(err);
      } else {
        resolve();
      }
    });
  });
  return printer.createPdfKitDocument(docDefinition);
}

new Promise(async (resolve, reject) => {
  try {
    let pdfDoc = await createPdf();
    console.log("PDF created");
    const filename = `Etiketten für Scanner.pdf`;
    let stream = pdfDoc.pipe(fs.createWriteStream(filename));
    stream.on('finish', () => {
      console.log(`${filename} gespeichert`);
      resolve();
    });
    pdfDoc.end();
  } catch (ex) {
    console.log(ex);
  }
}).then(() => {
  console.log("Etiketten fertig");
});
