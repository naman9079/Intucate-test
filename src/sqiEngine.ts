import { Attempt, StudentData, SQIResult, ConceptScore, TopicScore, RankedConcept } from './types';

const IMPORTANCE_WEIGHTS = { A: 1.0, B: 0.7, C: 0.5 };
const DIFFICULTY_WEIGHTS = { E: 0.6, M: 1.0, H: 1.4 };
const TYPE_WEIGHTS = { Practical: 1.1, Theory: 1.0 };

export function computeSQI(studentData: StudentData, diagnosticPromptVersion: string = 'v1'): SQIResult {
  const attempts = studentData.attempts;
  
  const scoredAttempts = attempts.map(attempt => {
    const base = attempt.correct ? attempt.marks : -attempt.neg_marks;
    
    let weighted = base * 
      IMPORTANCE_WEIGHTS[attempt.importance] * 
      DIFFICULTY_WEIGHTS[attempt.difficulty] * 
      TYPE_WEIGHTS[attempt.type];
    
    const timeRatio = attempt.time_spent_sec / attempt.expected_time_sec;
    if (timeRatio > 2) {
      weighted *= 0.8;
    } else if (timeRatio > 1.5) {
      weighted *= 0.9;
    }
    
    if (attempt.marked_review && !attempt.correct) {
      weighted *= 0.9;
    }
    
    if (attempt.revisits > 0 && attempt.correct) {
      weighted += 0.2 * attempt.marks;
    }
    
    return {
      ...attempt,
      base,
      weighted,
      timeRatio
    };
  });
  
  const maxPossible = scoredAttempts.reduce((sum, attempt) => {
    return sum + attempt.marks * 
      IMPORTANCE_WEIGHTS[attempt.importance] * 
      DIFFICULTY_WEIGHTS[attempt.difficulty] * 
      TYPE_WEIGHTS[attempt.type];
  }, 0);
  
  const totalWeighted = scoredAttempts.reduce((sum, a) => sum + a.weighted, 0);
  const overall_sqi = Math.max(0, Math.min(100, (totalWeighted / maxPossible) * 100));
  
  const topicMap = new Map<string, typeof scoredAttempts>();
  scoredAttempts.forEach(attempt => {
    if (!topicMap.has(attempt.topic)) {
      topicMap.set(attempt.topic, []);
    }
    topicMap.get(attempt.topic)!.push(attempt);
  });
  
  const topic_scores: TopicScore[] = Array.from(topicMap.entries()).map(([topic, attempts]) => {
    const topicWeighted = attempts.reduce((sum, a) => sum + a.weighted, 0);
    const topicMax = attempts.reduce((sum, a) => {
      return sum + a.marks * 
        IMPORTANCE_WEIGHTS[a.importance] * 
        DIFFICULTY_WEIGHTS[a.difficulty] * 
        TYPE_WEIGHTS[a.type];
    }, 0);
    
    const sqi = Math.max(0, Math.min(100, (topicWeighted / topicMax) * 100));
    return { topic, sqi: parseFloat(sqi.toFixed(1)) };
  });
  
  const conceptMap = new Map<string, typeof scoredAttempts>();
  scoredAttempts.forEach(attempt => {
    const key = `${attempt.topic}:::${attempt.concept}`;
    if (!conceptMap.has(key)) {
      conceptMap.set(key, []);
    }
    conceptMap.get(key)!.push(attempt);
  });
  
  const concept_scores: ConceptScore[] = Array.from(conceptMap.entries()).map(([key, attempts]) => {
    const [topic, concept] = key.split(':::');
    const conceptWeighted = attempts.reduce((sum, a) => sum + a.weighted, 0);
    const conceptMax = attempts.reduce((sum, a) => {
      return sum + a.marks * 
        IMPORTANCE_WEIGHTS[a.importance] * 
        DIFFICULTY_WEIGHTS[a.difficulty] * 
        TYPE_WEIGHTS[a.type];
    }, 0);
    
    const sqi = Math.max(0, Math.min(100, (conceptWeighted / conceptMax) * 100));
    return { topic, concept, sqi: parseFloat(sqi.toFixed(1)) };
  });
  
  const ranked_concepts_for_summary: RankedConcept[] = concept_scores.map(cs => {
    const conceptAttempts = conceptMap.get(`${cs.topic}:::${cs.concept}`)!;
    const wrongAtLeastOnce = conceptAttempts.some(a => !a.correct);
    
    const reasons: string[] = [];
    
    if (wrongAtLeastOnce) {
      reasons.push('Wrong at least once');
    }
    
    const hasHighImportance = conceptAttempts.some(a => a.importance === 'A');
    if (hasHighImportance) {
      reasons.push('High importance (A)');
    }
    
    const avgTimeRatio = conceptAttempts.reduce((sum, a) => sum + a.timeRatio, 0) / conceptAttempts.length;
    if (avgTimeRatio > 1.5) {
      reasons.push('Slow solving');
    } else if (avgTimeRatio < 0.7) {
      reasons.push('Fast solving');
    }
    
    if (cs.sqi < 50) {
      reasons.push('Low diagnostic score');
    }
    
    let weight = 0;
    if (wrongAtLeastOnce) weight += 0.4;
    
    const importanceWeight = conceptAttempts.reduce((sum, a) => 
      sum + IMPORTANCE_WEIGHTS[a.importance], 0) / conceptAttempts.length;
    weight += 0.25 * importanceWeight;
    
    const timeWeight = avgTimeRatio > 1.5 ? 0.4 : (avgTimeRatio < 0.7 ? 1.0 : 0.7);
    weight += 0.20 * timeWeight;
    
    weight += 0.15 * (1 - cs.sqi / 100);
    
    return {
      topic: cs.topic,
      concept: cs.concept,
      weight: parseFloat(weight.toFixed(2)),
      reasons
    };
  });
  
  ranked_concepts_for_summary.sort((a, b) => b.weight - a.weight);
  
  return {
    student_id: studentData.student_id,
    overall_sqi: parseFloat(overall_sqi.toFixed(1)),
    topic_scores,
    concept_scores,
    ranked_concepts_for_summary,
    metadata: {
      diagnostic_prompt_version: diagnosticPromptVersion,
      computed_at: new Date().toISOString(),
      engine: 'sqi-v0.1'
    }
  };
}
