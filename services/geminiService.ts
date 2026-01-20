import { GoogleGenAI, Type, Schema } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const diagnoseIssue = async (vehicleModel: string, description: string): Promise<string> => {
  try {
    const prompt = `You are an expert automotive technician. A customer with a ${vehicleModel} has reported: "${description}". 
    Provide a concise technical diagnosis of potential causes and a list of recommended checks. 
    Format as a bulleted list. Keep it under 150 words.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        temperature: 0.4,
      }
    });

    return response.text || "Could not generate diagnosis.";
  } catch (error) {
    console.error("Gemini diagnosis failed", error);
    return "AI service temporarily unavailable.";
  }
};

export const generateCustomerReport = async (jobDetails: any): Promise<string> => {
  try {
    const prompt = `Generate a friendly, non-technical service summary for a vehicle owner based on these technical notes: 
    ${JSON.stringify(jobDetails)}. 
    Explain what was done, why it was important, and any future recommendations.
    Assume the audience is a Kenyan car owner, keep the tone professional but warm.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });

    return response.text || "Could not generate report.";
  } catch (error) {
    console.error("Gemini report generation failed", error);
    return "AI service temporarily unavailable.";
  }
};

export const generateMarketingMessage = async (campaignType: string, customerName: string = "Customer"): Promise<string> => {
  try {
    const prompt = `Write a short, engaging SMS marketing message for a Kenyan auto garage called 'GariHub'.
    Target: ${campaignType} (e.g., service due, holiday offer, rainy season check).
    Customer Name: ${customerName}.
    Include a call to action and placeholder for a booking link. Max 160 chars.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });

    return response.text || "Visit GariHub for your car service needs!";
  } catch (error) {
    console.error("Gemini marketing generation failed", error);
    return "Visit GariHub for your car service needs!";
  }
};

export const estimateRepairCost = async (vehicle: string, issues: string): Promise<{ low: number, high: number, currency: string }> => {
    try {
        const schema: Schema = {
            type: Type.OBJECT,
            properties: {
                low: { type: Type.NUMBER, description: "Low end estimate in KES" },
                high: { type: Type.NUMBER, description: "High end estimate in KES" },
                currency: { type: Type.STRING, description: "Currency code, usually KES" }
            },
            required: ["low", "high", "currency"]
        }

        const prompt = `Estimate the repair cost range in Kenyan Shillings (KES) for a ${vehicle} with the following issues: ${issues}. Consider local Nairobi market rates for parts and labor. Return ONLY JSON.`;

        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: schema
            }
        });

        const text = response.text;
        if (!text) return { low: 0, high: 0, currency: 'KES' };
        return JSON.parse(text);

    } catch (error) {
        console.error("Cost estimation failed", error);
        return { low: 0, high: 0, currency: 'KES' };
    }
}