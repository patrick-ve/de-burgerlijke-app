import { GoogleGenAI } from '@google/genai';

const ai = new GoogleGenAI({
  apiKey: 'AIzaSyD4P1DGKzm5YFPhJdXO8ZmnqVn2bLEfHcA',
});

async function main() {
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-preview-05-20',
    contents: [
      'Obtain the full text contents from https://werkenbij.q42.nl/front-end-developer/nl',
    ],
  });
  console.log(response.text);
}

main();
