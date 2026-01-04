# LabMate AI Assistant Documentation

## Overview

**LabMate** is an intelligent AI assistant designed specifically for the Virtual Lab Simulator. It helps chemistry students in rural areas learn proper lab techniques, understand concepts, and perform experiments safely without access to physical laboratories.

## Key Features

### 🎯 Real-Time Error Detection
- Monitors student actions during experiments
- Detects measurement errors (volume, temperature)
- Provides immediate, actionable feedback
- Calculates error percentages and impact

### 📚 Concept Explanation
- Answers "why" questions about procedures
- Explains chemistry concepts concisely (3-4 sentences max)
- Adapts to student level (beginner/intermediate/advanced)
- Uses analogies and real-world examples

### 🧪 Procedure Guidance
- Provides proactive tips before each step
- Celebrates correct actions
- Guides students through proper techniques
- Ensures safety awareness

### 🧮 Calculation Help
- Step-by-step molarity calculations
- Formula explanations with stoichiometry
- Unit conversion assistance
- Result verification

## Architecture

### System Components

```
┌─────────────────────────────────────────────────────────┐
│                    Frontend (React)                      │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐        │
│  │ Lab Page   │  │ AI Chat    │  │ Components │        │
│  │ (page.tsx) │  │ Interface  │  │ (Flask,    │        │
│  │            │  │            │  │  Burette)  │        │
│  └─────┬──────┘  └─────┬──────┘  └─────┬──────┘        │
│        │               │               │                │
│        └───────────────┴───────────────┘                │
│                        │                                │
└────────────────────────┼────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────┐
│              API Route (/api/lab-assistant)              │
│  ┌──────────────────────────────────────────────────┐  │
│  │  1. Receive student actions & questions          │  │
│  │  2. Build context with error analysis            │  │
│  │  3. Generate prompt with LabMate system prompt   │  │
│  │  4. Call Gemini AI                               │  │
│  │  5. Return structured response                   │  │
│  └──────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────┐
│         LabMate System Prompt Library                    │
│  ┌──────────────────────────────────────────────────┐  │
│  │  • LABMATE_SYSTEM_PROMPT (comprehensive)         │  │
│  │  • analyzeStudentActions() - error detection     │  │
│  │  • buildUserPrompt() - context building          │  │
│  │  • TOLERANCE_RANGES - measurement validation     │  │
│  │  • PROACTIVE_TIPS - step-by-step guidance        │  │
│  └──────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────┐
│              Google Gemini 2.0 Flash                     │
│         (Fast, efficient, chemistry-focused)             │
└─────────────────────────────────────────────────────────┘
```

## API Usage

### Request Format

```typescript
POST /api/lab-assistant

{
  "experimentId": "kmno4-titration",
  "currentStep": 2,
  "studentActions": [
    {
      "step": 1,
      "action": "oxalic_acid",
      "value": 10,
      "unit": "ml",
      "timestamp": "2026-01-04T00:00:00Z"
    }
  ],
  "studentQuestion": "Why do we heat to 60°C?",
  "studentLevel": "intermediate"
}
```

### Response Format

```typescript
{
  "success": true,
  "responseType": "answer" | "error" | "tip" | "calculation" | "success",
  "response": "Heating accelerates the reaction...",
  "mistakes": [
    "⚠️ Used 15ml oxalic acid instead of 10ml..."
  ],
  "proactiveTip": "💡 Tip: Add H₂SO₄ slowly...",
  "severity": "warning" | "info"
}
```

## Error Detection System

### Tolerance Ranges

| Measurement | Target | Tolerance | Unit |
|------------|--------|-----------|------|
| Oxalic Acid | 10 | ±0.2 | ml |
| H₂SO₄ | 5 | ±0.5 | ml |
| Temperature | 60 | ±5 | °C |
| KMnO₄ Volume | 20 | ±1 | ml |

### Error Messages

The system automatically generates contextual error messages:

**Volume Errors:**
```
⚠️ Used 15ml oxalic acid instead of 10ml. This 5ml error will affect 
your molarity calculation by 50%. Use a pipette for precision - bottom 
of meniscus should align with the 10ml mark at eye level.
```

**Temperature Errors:**
```
🌡️ Temperature is 45°C, should be 60°C (±5°C). Below 55°C: reaction 
too slow, endpoint takes forever. Above 65°C: oxalic acid may decompose 
prematurely. Heat with stirring until thermometer reads 60°C.
```

## Proactive Tips

LabMate provides tips before each experimental step:

**Step 1 (Add Oxalic Acid):**
```
💡 Tip: Use a pipette for the 10ml oxalic acid. Rinse pipette with 
oxalic acid first to avoid dilution.
```

**Step 2 (Add H₂SO₄):**
```
💡 Tip: Add H₂SO₄ slowly down the flask's side to avoid splashing. 
Acid to water, never water to acid.
```

**Step 3 (Heat Solution):**
```
💡 Tip: Place thermometer in solution. Heat slowly with constant 
stirring. Stop at 60°C to avoid oxalic acid decomposition.
```

**Step 4 (Titrate):**
```
💡 Tip: Add KMnO₄ rapidly at first, then drop-by-drop near endpoint. 
Swirl continuously. First pink that lasts 30sec = endpoint.
```

## Common Questions & Answers

### Why self-indicator?
> KMnO₄ acts as its own indicator because it's purple when unreacted but becomes colorless Mn²⁺ when reduced. The endpoint is when excess KMnO₄ (still purple) remains - giving permanent pink color.

### Why heat to 60°C?
> Heating accelerates the reaction between oxalic acid and KMnO₄. At room temperature, the reaction is extremely slow and titration would take 30+ minutes. At 60°C, it completes in seconds.

### Why use H₂SO₄?
> H₂SO₄ provides the acidic medium (H⁺ ions) needed for KMnO₄'s oxidizing action (MnO₄⁻ + 8H⁺ → Mn²⁺). It also prevents formation of brown MnO₂ precipitate which would obscure the endpoint.

### How to calculate molarity?
> Use the formula 5M₂V₂ = 2M₁V₁. The coefficients (5 and 2) come from the balanced equation. Plug in: M₁=0.1M (oxalic acid), V₁=10ml, V₂={your volume}ml. Solve for M₂.

## Adaptive Teaching Levels

### Beginner Mode
- Explains every term the first time
- Uses analogies from daily life
- Encourages heavily, very patient
- Example: *"Think of KMnO₄ like a purple dye that loses color when it grabs electrons..."*

### Intermediate Mode (Default)
- Uses technical terms with brief definitions
- Focuses on underlying principles
- Example: *"The purple MnO₄⁻ ion gets reduced to colorless Mn²⁺ by accepting electrons..."*

### Advanced Mode
- Uses proper chemistry terminology
- Discusses electron transfer mechanisms
- Example: *"In this redox titration, permanganate's +7 oxidation state reduces to +2..."*

## Response Guidelines

### Tone & Style
✅ **DO:**
- Be concise (3-4 sentences max)
- Use status indicators (⚠️, ✅, 💡, 🌡️, 💧)
- Focus on "why" not just "what"
- Celebrate correct actions
- Provide actionable next steps

❌ **DON'T:**
- Say "As an AI..." or "I cannot perform experiments..."
- Write long explanations
- Use phrases like "Unfortunately..." or "I'm sorry but..."
- Be condescending or pedantic

### Response Structure
1. **Status Indicator:** ⚠️ (error), ✅ (correct), 💡 (tip), etc.
2. **Main Message:** What happened / What to know (1-2 sentences)
3. **Action Item:** What to do now (1 sentence)
4. **Optional:** Concept link (e.g., "This relates to: redox reactions")

## Integration Example

```typescript
// In your React component
const askLabMate = async (question: string) => {
  const response = await fetch('/api/lab-assistant', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      experimentId: 'kmno4-titration',
      currentStep: currentStep,
      studentActions: actions,
      studentQuestion: question,
      studentLevel: 'intermediate'
    })
  });
  
  const data = await response.json();
  
  if (data.mistakes.length > 0) {
    // Show error messages
    data.mistakes.forEach(mistake => {
      showNotification(mistake, 'warning');
    });
  }
  
  // Show AI response
  displayAIMessage(data.response);
  
  // Show proactive tip if available
  if (data.proactiveTip) {
    showTip(data.proactiveTip);
  }
};
```

## Configuration

### Environment Variables

```bash
# .env.local
GEMINI_API_KEY=your_gemini_api_key_here
```

### Model Settings

```typescript
const model = new ChatGoogleGenerativeAI({
  model: "gemini-2.0-flash-exp",
  maxOutputTokens: 512,      // Keep responses concise
  temperature: 0.7,          // Balanced creativity
  apiKey: process.env.GEMINI_API_KEY,
});
```

## Testing

### Test Cases

1. **Correct Measurement:**
   - Input: 10ml oxalic acid
   - Expected: ✅ Success message with encouragement

2. **Measurement Error:**
   - Input: 15ml oxalic acid
   - Expected: ⚠️ Error with percentage calculation

3. **Temperature Error:**
   - Input: 45°C
   - Expected: 🌡️ Warning with guidance

4. **Concept Question:**
   - Input: "Why heat to 60°C?"
   - Expected: Concise explanation (3-4 sentences)

5. **Calculation Request:**
   - Input: "How to calculate molarity?"
   - Expected: Step-by-step formula with example

## Future Enhancements

- [ ] Multi-language support (Nepali, Hindi)
- [ ] Voice interaction for accessibility
- [ ] Experiment report generation assistance
- [ ] Peer comparison (anonymized)
- [ ] Achievement system integration
- [ ] Video demonstrations for complex steps
- [ ] AR overlay for real lab practice

## Troubleshooting

### Common Issues

**Issue:** AI responses are too long
- **Solution:** Check `maxOutputTokens` setting (should be 512)

**Issue:** Error detection not working
- **Solution:** Verify `studentActions` array format matches `StudentAction` interface

**Issue:** No proactive tips showing
- **Solution:** Ensure `currentStep` is passed (1-4) and `studentQuestion` is empty

**Issue:** API returns 500 error
- **Solution:** Check `GEMINI_API_KEY` in `.env.local`

## Support

For questions or issues:
- Check the [main README](../README.md)
- Review the [system prompt](../lib/labmate-system-prompt.ts)
- Test with the [API route](../app/api/lab-assistant/route.ts)

---

**Built with ❤️ for rural students in Nepal**
