// Match
export const TOTAL_ROUNDS = 5;
export const MAX_ROUND_SCORE = 10000;
export const MAX_MATCH_SCORE = TOTAL_ROUNDS * MAX_ROUND_SCORE;

// Scoring: score falls off quadratically and hits 0 at this error distance
export const SCORE_ZERO_ERROR_M = 30;

// Targets are generated uniformly within this radius
export const MAX_TARGET_DISTANCE_M = 35;

// Audio: manual attenuation reaches 0 at this distance
export const ATTENUATION_ZERO_DISTANCE_M = 50;
