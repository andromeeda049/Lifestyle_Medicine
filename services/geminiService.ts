import { GoogleGenAI, Type } from "@google/genai";
import { NutrientInfo, BMIHistoryEntry, TDEEHistoryEntry, MealPlan, PlannerResults, LocalFoodSuggestion, UserProfile, SpecialistId } from '../types';
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
            nutrition: { type: Type.STRING, description: "วิเคราะห์ด้านโภชนาการ (ดี/ไม่ดี อย่างไร)" },
            physicalActivity: { type: Type.STRING, description: "อาหารนี้เหมาะก่อน/หลังออกกำลังกายไหม? ให้พลังงานอย่างไร?" },
            sleep: { type: Type.STRING, description: "อาหารนี้ส่งผลต่อการนอนหลับอย่างไร? (เช่น มีคาเฟอีน, ย่อยยาก)" },
            stress: { type: Type.STRING, description: "ส่งผลต่อความเครียด/อารมณ์อย่างไร?" },
            substance: { type: Type.STRING, description: "มีความเสี่ยงจากสารปรุงแต่ง/แปรรูป หรือแอลกอฮอล์ไหม?" },
            social: { type: Type.STRING, description: "แง่มุมทางสังคม (เช่น อาหารที่เหมาะแก่การแบ่งปัน หรือควรเลี่ยงงานปาร์ตี้)" },
            overallRisk: { type: Type.STRING, enum: ["Low", "Medium", "High"], description: "ระดับความเสี่ยงต่อ NCDs" }
        },
        required: ['nutrition', 'physicalActivity', 'sleep', 'stress', 'substance', 'social', 'overallRisk']
    },
    items: {
      type: Type.ARRAY,
      description: "รายการอาหารแต่ละอย่าง",
      items: {
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING, description: "ชื่ออาหาร" },
          calories: { type: Type.NUMBER, description: "แคลอรี่" }
        },
        required: ['name', 'calories']
      }
    }
  },
  required: ['calories', 'protein', 'carbohydrates', 'fat', 'sugar', 'sodium', 'saturatedFat', 'description', 'healthImpact', 'items', 'lifestyleAnalysis']
};

export const analyzeFoodFromImage = async (base64Image: string, mimeType: string, apiKey: string): Promise<NutrientInfo> => {
  if (!apiKey) throw new Error('กรุณาตั้งค่า API Key ก่อนใช้งาน');
  const ai = new GoogleGenAI({ apiKey });
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [
        {
          parts: [
            {
              inlineData: {
                data: base64Image,
                mimeType: mimeType
              }
            },
            {
              text: "Analyze this food image based on Lifestyle Medicine principles (6 Pillars). Identify nutrients and assess impact on NCDs (Diabetes, Hypertension, etc.). Return JSON."
            }
          ]
        }
      ],
      config: {
        responseMimeType: 'application/json',
        responseSchema: foodAnalysisSchema,
      }
    });

    const jsonText = response.text.trim();
    const parsedJson = JSON.parse(jsonText);
    return parsedJson as NutrientInfo;
  } catch (error) {
    console.error("Error analyzing food image with Gemini:", error);
    throw new Error('ไม่สามารถวิเคราะห์รูปภาพได้ กรุณาลองใหม่อีกครั้ง');
  }
};

export const analyzeFoodFromText = async (text: string, apiKey: string): Promise<NutrientInfo> => {
  if (!apiKey) throw new Error('กรุณาตั้งค่า API Key ก่อนใช้งาน');
  const ai = new GoogleGenAI({ apiKey });
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Analyze this food text: "${text}" based on Lifestyle Medicine principles. Identify nutrients and assess impact on NCDs. Return JSON.`,
      config: {
        responseMimeType: 'application/json',
        responseSchema: foodAnalysisSchema,
      }
    });

    const jsonText = response.text.trim();
    const parsedJson = JSON.parse(jsonText);
    return parsedJson as NutrientInfo;
  } catch (error) {
    console.error("Error analyzing food text with Gemini:", error);
    throw new Error('ไม่สามารถวิเคราะห์ข้อความได้ กรุณาลองใหม่อีกครั้ง');
  }
};

const localFoodSuggestionSchema = {
    type: Type.ARRAY,
    description: "รายการแนะนำอาหารท้องถิ่น",
    items: {
        type: Type.OBJECT,
        properties: {
            name: { type: Type.STRING, description: "ชื่อเมนูอาหารท้องถิ่น" },
            description: { type: Type.STRING, description: "คำอธิบายและประโยชน์ทางสุขภาพ" },
            calories: { type: Type.NUMBER, description: "แคลอรี่โดยประมาณ" },
        },
        required: ['name', 'description', 'calories']
    }
};

export const getLocalFoodSuggestions = async (lat: number, lon: number, apiKey: string): Promise<LocalFoodSuggestion[]> => {
    if (!apiKey) throw new Error('กรุณาตั้งค่า API Key ก่อนใช้งาน');
    const ai = new GoogleGenAI({ apiKey });
    const prompt = `
From coordinates ${lat}, ${lon}, suggest 5-7 healthy local dishes (Lifestyle Medicine compliant: Low Sodium, Low Sugar, Good Fats).
Return JSON array.
`;
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                responseMimeType: 'application/json',
                responseSchema: localFoodSuggestionSchema,
            }
        });
        return JSON.parse(response.text.trim()) as LocalFoodSuggestion[];
    } catch (error) {
        console.error("Error getting local food suggestions:", error);
        throw new Error('ไม่สามารถค้นหาอาหารท้องถิ่นได้ในขณะนี้');
    }
}

export const getHealthCoachingTip = async (data: { 
    bmi?: BMIHistoryEntry; 
    tdee?: TDEEHistoryEntry; 
    food?: NutrientInfo | null; 
    waterIntake?: number;
    userProfile?: UserProfile;
    specialistId?: SpecialistId;
}, apiKey: string): Promise<string> => {
  if (!apiKey) return "กรุณาตั้งค่า API Key ในหน้าตั้งค่าก่อนใช้งานฟีเจอร์นี้";
  const ai = new GoogleGenAI({ apiKey });

  const specialist = SPECIALIST_TEAM.find(s => s.id === data.specialistId) || SPECIALIST_TEAM[0];
  
  let prompt = `Act as a ${specialist.name} (${specialist.role}) in a Lifestyle Medicine Team.\n`;
  prompt += "Give a personalized, empathetic, and actionable advice (2-3 sentences) in Thai.\n\n";
  prompt += "User Data:\n";
  if (data.userProfile?.healthCondition) prompt += `- Condition: ${data.userProfile.healthCondition} (Critically important context)\n`;
  if (data.bmi) prompt += `- BMI: ${data.bmi.value.toFixed(2)}\n`;
  if (data.waterIntake !== undefined) prompt += `- Water Today: ${data.waterIntake} ml\n`;
  if (data.food) {
    prompt += `- Last Meal: ${data.food.description} (Risk: ${data.food.lifestyleAnalysis?.overallRisk || 'Unknown'})\n`;
  }
  
  prompt += `\nFocus your advice on your area of expertise (${specialist.role}) to help prevent/manage NCDs.`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });
    return response.text.trim();
  } catch (error) {
    console.error("Error getting health coaching tip:", error);
    throw new Error('ไม่สามารถรับคำแนะนำจาก AI ได้ในขณะนี้');
  }
};

const mealSchema = {
  type: Type.OBJECT,
  properties: {
    menu: { type: Type.STRING, description: "ชื่อเมนู (เน้นวัตถุดิบท้องถิ่น)" },
    protein: { type: Type.NUMBER, description: "โปรตีน (g)" },
    carbohydrate: { type: Type.NUMBER, description: "คาร์บ (g)" },
    fat: { type: Type.NUMBER, description: "ไขมัน (g)" },
    calories: { type: Type.NUMBER, description: "แคลอรี่ (kcal)" },
  },
  required: ['menu', 'protein', 'carbohydrate', 'fat', 'calories']
};

const activitySchema = {
    type: Type.OBJECT,
    properties: {
        activity: { type: Type.STRING, description: "กิจกรรมแนะนำ (เช่น เดินเร็ว, สมาธิ)" },
        duration: { type: Type.STRING, description: "ระยะเวลา (เช่น 30 นาที)" },
        benefit: { type: Type.STRING, description: "ประโยชน์ต่อเป้าหมายสุขภาพ" }
    },
    required: ['activity', 'duration', 'benefit']
};

const mealPlanSchema = {
    type: Type.ARRAY,
    items: {
        type: Type.OBJECT,
        properties: {
            day: { type: Type.STRING },
            breakfast: mealSchema,
            lunch: mealSchema,
            dinner: mealSchema,
            activities: { 
                type: Type.ARRAY, 
                items: activitySchema,
                description: "กิจกรรม Lifestyle Medicine ประจำวัน (1-2 อย่าง)" 
            },
            dailyTotal: {
                type: Type.OBJECT,
                properties: {
                    protein: { type: Type.NUMBER },
                    carbohydrate: { type: Type.NUMBER },
                    fat: { type: Type.NUMBER },
                    calories: { type: Type.NUMBER },
                },
                required: ['protein', 'carbohydrate', 'fat', 'calories']
            }
        },
        required: ['day', 'breakfast', 'lunch', 'dinner', 'activities', 'dailyTotal']
    }
};


export const generateMealPlan = async (
  results: PlannerResults,
  cuisine: string,
  diet: string,
  healthCondition: string,
  lifestyleGoal: string,
  apiKey: string
): Promise<MealPlan> => {
  if (!apiKey) throw new Error('กรุณาตั้งค่า API Key ก่อนใช้งาน');
  const ai = new GoogleGenAI({ apiKey });
  const prompt = `
You are a Lifestyle Medicine Planner. Create a 7-day "Local Ingredient" Meal & Activity Plan.
**User Context:**
- TDEE Goal: ${results.tdee.toFixed(0)} kcal
- Cuisine: ${cuisine}
- Diet: ${diet}
- **Health Condition:** ${healthCondition} (Crucial! Adjust food/activity to be safe)
- **Lifestyle Goal:** ${lifestyleGoal} (e.g., Better Sleep -> add calming foods/activities)

**Requirements:**
1. Meals: Use local ingredients, easy to cook.
2. Activities: Suggest 1-2 activities per day (Exercise, Stress Relief, Social) aligning with the goal.
3. Return JSON.
`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: mealPlanSchema,
      }
    });

    const jsonText = response.text.trim();
    const parsedJson = JSON.parse(jsonText);

    if (!Array.isArray(parsedJson) || parsedJson.length !== 7) {
      throw new Error('API response is not a 7-day array.');
    }

    return parsedJson as MealPlan;
  } catch (error) {
    console.error("Error generating meal plan with Gemini:", error);
    throw new Error('ไม่สามารถสร้างแผนอาหารได้ กรุณาตรวจสอบข้อมูลและลองใหม่อีกครั้ง');
  }
};