import express from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { generateLegalDocumentWithAI, refineSectionWithAI } from './src/server/geminiService';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: '10mb' }));

// API: Generate complete legal document
app.post('/api/generate', async (req, res) => {
  try {
    const input = req.body;
    if (!input || !input.documentType) {
      return res.status(400).json({ error: 'Invalid input schema: documentType is required.' });
    }

    const aiResult = await generateLegalDocumentWithAI(input);
    return res.json({ success: true, data: aiResult });
  } catch (error: any) {
    console.error('Error generating document with AI:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to generate document with AI. Fallback available.'
    });
  }
});

// API: Refine specific section
app.post('/api/refine-section', async (req, res) => {
  try {
    const { sectionHeading, sectionContent, instruction, documentType, jurisdiction } = req.body;
    if (!sectionContent || !instruction) {
      return res.status(400).json({ error: 'sectionContent and instruction are required.' });
    }

    const revisedContent = await refineSectionWithAI({
      sectionHeading: sectionHeading || 'Section',
      sectionContent,
      instruction,
      documentType: documentType || 'Legal Document',
      jurisdiction: jurisdiction || 'General'
    });

    return res.json({ success: true, revisedContent });
  } catch (error: any) {
    console.error('Error refining section with AI:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to refine section with AI.'
    });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    hasGeminiKey: Boolean(process.env.GEMINI_API_KEY),
    timestamp: new Date().toISOString()
  });
});

// Serve frontend in production
const distPath = path.resolve(process.cwd(), 'dist');
app.use(express.static(distPath));

app.get('*', (req, res) => {
  res.sendFile(path.join(distPath, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`LegalEase AI server listening on port ${PORT}`);
});
