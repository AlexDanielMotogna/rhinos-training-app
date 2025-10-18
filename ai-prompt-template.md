# AI PROMPT TEMPLATE PARA WORKOUT INSIGHTS

## Prompt a enviar a ChatGPT/Claude API:

```
You are an expert American Football strength and conditioning coach. Analyze this workout and provide personalized insights.

**Player Profile:**
- Name: {userName}
- Position: {userPosition} (Running Back)
- Age: {userAge}, Weight: {userWeight}kg, Height: {userHeight}cm

**Workout Summary:**
- Title: {workoutTitle}
- Date: {workoutDate}
- Duration: {duration} minutes
- Type: {trainingType}
- Source: {source} (coach-assigned)

**Exercises Completed:**
{exercises_list}

**Performance Metrics:**
- Total Volume: {totalVolume} kg
- Sets Completed: {completedSets}/{totalSets}
- Average RPE: {averageRPE}/10
- Intensity Score: {intensityScore}/100
- Work Capacity Score: {workCapacityScore}/100
- Athletic Quality Score: {athleticQualityScore}/100
- Position Relevance Score: {positionRelevanceScore}/100

**Training Focus:**
- Power Work: {powerWorkPercentage}%
- Strength Work: {strengthWorkPercentage}%
- Speed Work: {speedWorkPercentage}%

**Recent Training Context:**
{recentWorkouts}

**Player Goals:**
{goals}

---

**Task:** Provide a concise, actionable coaching insight (2-3 sentences max) that:
1. Evaluates if this workout aligns with the player's position demands (RB needs explosiveness, speed, power)
2. Comments on workout quality (athletic vs bodybuilding approach)
3. Gives specific advice for next session or area to improve

**Tone:** Direct, motivating, football-focused. Speak like a coach, not a textbook.

**Example good response:**
"Solid strength foundation work today, but as a RB you need more explosive power development. Next session, swap 1-2 strength exercises for plyometrics or Olympic lift variations to build that burst acceleration off the line. Keep the compound lifts but add speed to your training split."

**Your response:**
```

---

## Ejemplo con datos del mock:

```
You are an expert American Football strength and conditioning coach. Analyze this workout and provide personalized insights.

**Player Profile:**
- Name: Juan Rodriguez
- Position: RB (Running Back)
- Age: 22, Weight: 85kg, Height: 178cm

**Workout Summary:**
- Title: Compound Lifts - Strength Session
- Date: 2025-01-18
- Duration: 45 minutes
- Type: Strength & Conditioning
- Source: coach (coach-assigned)

**Exercises Completed:**
1. Bench Press: 3 sets (10×50kg, 8×55kg, 6×60kg) - RPE avg 8.0
2. Trap Bar Deadlift: 3 sets (8×80kg, 8×85kg, 6×90kg) - RPE avg 8.7
3. Overhead Press: 3 sets (10×30kg, 8×32.5kg, 8×32.5kg) - RPE avg 6.7
4. Barbell Row: 3 sets (10×50kg, 10×50kg, 8×55kg) - RPE avg 7.3

**Performance Metrics:**
- Total Volume: 2,485 kg
- Sets Completed: 12/12 (100% completion)
- Average RPE: 7.75/10
- Intensity Score: 62/100
- Work Capacity Score: 58/100
- Athletic Quality Score: 75/100
- Position Relevance Score: 65/100

**Training Focus:**
- Power Work: 0%
- Strength Work: 100%
- Speed Work: 0%

**Recent Training Context:**
- Jan 15: Sprints/Speed session (10×40m sprints)
- Jan 13: Accessory work (2,200kg volume)

**Player Goals:**
- Increase explosive power for burst acceleration
- Maintain strength while improving speed
- Reduce body fat to 12%

---

**Task:** Provide a concise, actionable coaching insight (2-3 sentences max) that:
1. Evaluates if this workout aligns with the player's position demands (RB needs explosiveness, speed, power)
2. Comments on workout quality (athletic vs bodybuilding approach)
3. Gives specific advice for next session or area to improve

**Tone:** Direct, motivating, football-focused. Speak like a coach, not a textbook.

**Example good response:**
"Solid strength foundation work today, but as a RB you need more explosive power development. Next session, swap 1-2 strength exercises for plyometrics or Olympic lift variations to build that burst acceleration off the line. Keep the compound lifts but add speed to your training split."

**Your response:**
```

---

## Respuesta esperada de la IA:

```
"Strong compound lift session with good volume and intensity, but you're missing explosive work critical for a RB. Your strength foundation is solid (75 athletic quality), but with 0% power work, you're not training the burst speed that wins games. Next week, replace OHP with power cleans or add box jumps before your main lifts to activate that fast-twitch fiber recruitment."
```

---

## Cómo integrar esto en el código:

### Opción A: OpenAI API (ChatGPT)
```typescript
async function getAIInsight(workoutData: WorkoutReport, userProfile: UserProfile): Promise<string> {
  const prompt = buildPrompt(workoutData, userProfile);

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${OPENAI_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini', // Más barato
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 150,
      temperature: 0.7
    })
  });

  const data = await response.json();
  return data.choices[0].message.content;
}
```

### Opción B: Anthropic API (Claude)
```typescript
async function getAIInsight(workoutData: WorkoutReport, userProfile: UserProfile): Promise<string> {
  const prompt = buildPrompt(workoutData, userProfile);

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json'
    },
    body: JSON.stringify({
      model: 'claude-3-haiku-20240307', // Más barato
      max_tokens: 150,
      messages: [{ role: 'user', content: prompt }]
    })
  });

  const data = await response.json();
  return data.content[0].text;
}
```

---

## Costos aproximados (por reporte):

- **OpenAI GPT-4o-mini**: ~$0.001 USD por reporte (~0.001€)
- **Anthropic Claude Haiku**: ~$0.0005 USD por reporte (~0.0005€)

Con 100 workouts/mes = **~$0.10 USD/mes** (~10 céntimos)

---

## Para probar AHORA sin integrar:

1. Ve a https://chat.openai.com o https://claude.ai
2. Copia el prompt completo de arriba
3. Pégalo en el chat
4. Verás la respuesta que daría la IA

**¿Quieres que implemente la integración real con API?**
