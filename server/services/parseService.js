const fs = require('fs');
const mammoth = require('mammoth');

const parseCV = async (filePath, fileExt) => {
  try {
    if (fileExt === 'pdf') {
      const pdf = require('pdf-parse');
      const pdfParse = pdf.default || pdf;
      const dataBuffer = fs.readFileSync(filePath);
      const data = await pdfParse(dataBuffer);
      return data.text;

    } else if (fileExt === 'docx') {
      const result = await mammoth.extractRawText({ path: filePath });
      return result.value;

    } else if (fileExt === 'txt') {
      return fs.readFileSync(filePath, 'utf8');

    } else {
      throw new Error('Unsupported file type');
    }
  } catch (error) {
    throw new Error('Failed to parse CV: ' + error.message);
  }
};

module.exports = { parseCV };
