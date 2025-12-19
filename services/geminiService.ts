
import { GoogleGenAI, Type } from "@google/genai";
import { NutrientInfo, LocalFoodSuggestion, UserProfile, SpecialistId, FoodHistoryEntry, MealPlan, PlannerResults } from '../types';
import { SPECIALIST_TEAM } from "../constants";

const foodAnalysisSchema = {
  type: Type.OBJECT,
  properties: {
    calories: { type: Type.NUMBER, description: "แคลอรี่ทั้งหมดโดยประมาณของมื้ออาหาร" },
    protein: { type: Type.NUMBER, description: "โปรตีน (กรัม)" },
    carbohydrates: { type: Type.NUMBER, description: "คาร์โบไฮเดรต (กรัม)" },
    fat: { type: Type.NUMBER, description: "ไขมันรวม (กรัม)" },
    sugar: { type: Type.NUMBER, description: "น้ำตาล (กรัม)" },
    sodium: { type: Type.NUMBER, description: "โซเดียม (มิลลิกรัม)" },
    saturatedFat: { type: Type.NUMBER, description: "ไขมันอิ่มตัว (กรัม)" },
    description: { type: Type.STRING, description: "คำอธิบายสั้นๆ เกี่ยวกับมื้ออาหาร" },
    healthImpact: { 
        type: Type.STRING, 
        description: "สรุปสั้นๆ 1 ประโยคเกี่ยวกับผลกระทบต่อ NCDs" 
    },
    lifestyleAnalysis: {
        type: Type.OBJECT,
        description: "การวิเคราะห์เจาะลึก 6 เสาหลักเวชศาสตร์วิถีชีวิต",
        properties: {
            nutrition: { type: Type.STRING, description: "วิเคราะห์ด้านโภชนาการ" },
            physicalActivity: { type: Type.STRING, description: "วิเคราะห์ด้านกิจกรรมทางกาย" },
            sleep: { type: Type.STRING, description: "วิเคราะห์ด้านการนอน" },
            stress: { type: Type.STRING, description: "วิเคราะห์ด้านความเครียด" },
            substance: { type: Type.STRING, description: "วิเคราะห์ด้านสารเสพติด" },
            social: { type: Type.STRING, description: "วิเคราะห์ด้านสังคม" },
            overallRisk: { type: Type.STRING, enum: ["Low", "Medium", "High"], description: "ระดับความเสี่ยง" }
        },
        required: ['nutrition', 'physicalActivity', 'sleep', 'stress', 'substance', 'social', 'overallRisk']
    },
    items: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING },
          calories: { type: Type.NUMBER }
        },
        required: ['name', 'calories']
      }
    }
  },
  required: ['calories', 'protein', 'carbohydrates', 'fat', 'sugar', 'sodium', 'saturatedFat', 'description', 'healthImpact', 'items', 'lifestyleAnalysis']
};

export const analyzeFoodFromImage = async (base64Image: string, mimeType: string): Promise<NutrientInfo> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: [{
        parts: [
          { inlineData: { data: base64Image, mimeType } },
          { text: "Analyze this food image based on Lifestyle Medicine principles. Identify nutrients and assessment on NCDs. Return JSON." }
        ]
      }],
      config: {
        responseMimeType: 'application/json',
        responseSchema: foodAnalysisSchema,
      }
    });
    return JSON.parse(response.text);
  } catch (error) {
    console.error("AI Analysis Error:", error);
    throw new Error('ไม่สามารถวิเคราะห์รูปภาพได้ในขณะนี้');
  }
};

export const analyzeFoodFromText = async (text: string): Promise<NutrientInfo> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Analyze this food text: "${text}" based on Lifestyle Medicine principles. Return JSON.`,
      config: {
        responseMimeType: 'application/json',
        responseSchema: foodAnalysisSchema,
      }
    });
    return JSON.parse(response.text);
  } catch (error) {
    console.error("AI Text Analysis Error:", error);
    throw new Error('ไม่สามารถวิเคราะห์ข้อความได้ในขณะนี้');
  }
};

export const getLocalFoodSuggestions = async (lat: number, lon: number): Promise<LocalFoodSuggestion[]> => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: `From coordinates ${lat}, ${lon}, suggest 5 healthy local dishes (Lifestyle Medicine compliant). Return JSON array with name, description, calories.`,
            config: {
                responseMimeType: 'application/json',
                responseSchema: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            name: { type: Type.STRING },
                            description: { type: Type.STRING },
                            calories: { type: Type.NUMBER }
                        },
                        required: ['name', 'description', 'calories']
                    }
                }
            }
        });
        return JSON.parse(response.text);
    } catch (error) {
        throw new Error('ไม่สามารถค้นหาเมนูท้องถิ่นได้ในขณะนี้');
    }
};

export const getHealthCoachingTip = async (data: { 
    bmi?: any; 
    tdee?: any; 
    food?: NutrientInfo | null; 
    waterIntake?: number;
    userProfile?: UserProfile;
    specialistId?: SpecialistId;
}): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const specialist = SPECIALIST_TEAM.find(s => s.id === data.specialistId) || SPECIALIST_TEAM[0];
  const prompt = `Act as a ${specialist.name} (${specialist.role}). User Data: Condition: ${data.userProfile?.healthCondition}, BMI: ${data.bmi?.value}, Water: ${data.waterIntake}ml. Last Meal: ${data.food?.description}. Give actionable advice in Thai (2-3 sentences).`;
  
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });
    return response.text;
  } catch (error) {
    return "ขออภัย ระบบปรึกษาชั่วคราวไม่พร้อมใช้งาน";
  }
};

export const generateMealPlan = async (
  results: PlannerResults,
  cuisine: string,
  diet: string,
  healthCondition: string,
  lifestyleGoal: string,
  foodHistory: FoodHistoryEntry[]
): Promise<MealPlan> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const pastMeals = foodHistory.slice(0, 5).map(f => f.analysis.description).join(", ");
  
  // Prompt instructions enforcing Thai language
  const prompt = `Create a 7-day Meal & Activity Plan for TDEE Goal: ${results.tdee} kcal.
  Context:
  - Cuisine Preference: ${cuisine}
  - Diet Type: ${diet}
  - Health Condition: ${healthCondition}
  - Goal: ${lifestyleGoal}
  - User's Past meals: [${pastMeals}]

  IMPORTANT INSTRUCTION:
  - STRICTLY RETURN ALL TEXT IN THAI LANGUAGE ONLY (ภาษาไทยเท่านั้น).
  - Menu names MUST be in Thai (e.g. "ข้าวกะเพราไก่ไข่ดาว", "แกงส้มผักรวม"). Do not use English names.
  - Activity names MUST be in Thai (e.g. "เดินเร็ว", "โยคะ").
  - For the "day" field, use Thai format: "วันที่ 1", "วันที่ 2", etc.

  Return JSON following the schema.`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    day: { type: Type.STRING },
                    breakfast: { type: Type.OBJECT, properties: { menu: {type: Type.STRING}, protein: {type: Type.NUMBER}, carbohydrate: {type: Type.NUMBER}, fat: {type: Type.NUMBER}, calories: {type: Type.NUMBER} }, required: ['menu', 'calories'] },
                    lunch: { type: Type.OBJECT, properties: { menu: {type: Type.STRING}, protein: {type: Type.NUMBER}, carbohydrate: {type: Type.NUMBER}, fat: {type: Type.NUMBER}, calories: {type: Type.NUMBER} }, required: ['menu', 'calories'] },
                    dinner: { type: Type.OBJECT, properties: { menu: {type: Type.STRING}, protein: {type: Type.NUMBER}, carbohydrate: {type: Type.NUMBER}, fat: {type: Type.NUMBER}, calories: {type: Type.NUMBER} }, required: ['menu', 'calories'] },
                    activities: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { activity: {type: Type.STRING}, duration: {type: Type.STRING}, benefit: {type: Type.STRING}, caloriesBurned: {type: Type.NUMBER} }, required: ['activity'] } },
                    dailyTotal: { type: Type.OBJECT, properties: { protein: {type: Type.NUMBER}, carbohydrate: {type: Type.NUMBER}, fat: {type: Type.NUMBER}, calories: {type: Type.NUMBER} } }
                },
                required: ['day', 'breakfast', 'lunch', 'dinner', 'activities', 'dailyTotal']
            }
        },
      }
    });
    return JSON.parse(response.text);
  } catch (error) {
    throw new Error('ไม่สามารถสร้างแผนได้ โปรดลองใหม่อีกครั้ง');
  }
};

export const generateProactiveInsight = async (
    data: {
        bmiHistory: any[];
        sleepHistory: any[];
        moodHistory: any[];
        foodHistory: any[];
        userName: string;
    }
): Promise<{ title: string; message: string; type: 'warning' | 'info' | 'success' }> => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const prompt = `Act as Health Guardian for ${data.userName}. Trends: Weight: ${data.bmiHistory.length}, Stress: ${data.moodHistory.length}. Generate ONE short proactive insight (Thai). Return JSON {title, message, type: 'warning'|'info'|'success'}.`;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: prompt,
            config: {
                responseMimeType: 'application/json',
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        title: { type: Type.STRING },
                        message: { type: Type.STRING },
                        type: { type: Type.STRING, enum: ['warning', 'info', 'success'] }
                    }
                }
            }
        });
        return JSON.parse(response.text);
    } catch (error) {
        return { title: "สุขภาพดีเริ่มต้นที่นี่", message: "อย่าลืมบันทึกข้อมูลสุขภาพวันนี้นะครับ", type: "info" };
    }
};

export const extractHealthDataFromImage = async (
    base64Image: string, 
    mimeType: string, 
    type: 'activity' | 'sleep'
): Promise<any> => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const prompt = type === 'activity' ? "Extract Steps, Calories, Distance from screenshot. Return JSON." : "Extract Sleep Duration, Bed/Wake time. Return JSON.";
    const schema = type === 'activity' ? {
        type: Type.OBJECT,
        properties: { steps: {type: Type.NUMBER}, calories: {type: Type.NUMBER}, distance: {type: Type.NUMBER} }
    } : {
        type: Type.OBJECT,
        properties: { durationHours: {type: Type.NUMBER}, bedTime: {type: Type.STRING}, wakeTime: {type: Type.STRING} }
    };

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: [{ parts: [{ inlineData: { data: base64Image, mimeType } }, { text: prompt }] }],
            config: { responseMimeType: 'application/json', responseSchema: schema }
        });
        return JSON.parse(response.text);
    } catch (error) {
        throw new Error("AI อ่านภาพล้มเหลว");
    }
};
