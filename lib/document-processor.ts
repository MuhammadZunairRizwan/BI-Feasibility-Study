import pdf from 'pdf-parse';
import mammoth from 'mammoth';
import * as XLSX from 'xlsx';

export async function processDocument(
  buffer: Buffer,
  mimeType: string,
  filename: string
): Promise<string> {
  const extension = filename.split('.').pop()?.toLowerCase();

  try {
    switch (extension) {
      case 'pdf':
        return await extractPdfText(buffer);
      case 'doc':
      case 'docx':
        return await extractWordText(buffer);
      case 'xls':
      case 'xlsx':
        return await extractExcelText(buffer);
      case 'csv':
        return buffer.toString('utf-8');
      case 'txt':
        return buffer.toString('utf-8');
      default:
        console.warn(`Unsupported file type: ${extension}`);
        return '';
    }
  } catch (error) {
    console.error(`Error processing document ${filename}:`, error);
    return '';
  }
}

async function extractPdfText(buffer: Buffer): Promise<string> {
  try {
    const data = await pdf(buffer);
    return data.text;
  } catch (error) {
    console.error('PDF extraction error:', error);
    return '';
  }
}

async function extractWordText(buffer: Buffer): Promise<string> {
  try {
    const result = await mammoth.extractRawText({ buffer });
    return result.value;
  } catch (error) {
    console.error('Word extraction error:', error);
    return '';
  }
}

async function extractExcelText(buffer: Buffer): Promise<string> {
  try {
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    let text = '';

    workbook.SheetNames.forEach((sheetName) => {
      const worksheet = workbook.Sheets[sheetName];
      const csv = XLSX.utils.sheet_to_csv(worksheet);
      text += `Sheet: ${sheetName}\n${csv}\n\n`;
    });

    return text;
  } catch (error) {
    console.error('Excel extraction error:', error);
    return '';
  }
}
