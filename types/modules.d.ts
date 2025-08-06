declare module 'pdf-parse' {
  interface PDFData {
    text: string;
    numpages: number;
  }
  
  function pdf(buffer: Buffer): Promise<PDFData>;
  export = pdf;
}

declare module 'pptx2json' {
  interface PPTXData {
    slides: Array<{
      texts?: string[];
    }>;
  }
  
  function toJson(buffer: Buffer): Promise<PPTXData>;
  export = { toJson };
} 