export const GROWTH_STATE_VERSION = 1;

const ATTRIBUTES = ["stamina", "focus", "vitality"];

export function createGrowthState(dateKey, { initialProgress = 0 } = {}) {
  return {
    version: GROWTH_STATE_VERSION,
    daily: { dateKey, initialProgress, completedTaskIds: [] },
    totals: { stamina: 0, focus: 0, vitality: 0 },
    pendingRewards: [],
    claimedRewardIds: [],
  };
}

export function normalizeGrowthState(value, dateKey) {
  if (!isValidGrowthState(value)) return createGrowthState(dateKey, { initialProgress: 3 });
  if (value.daily.dateKey === dateKey) return value;

  return {
    ...value,
    daily: { dateKey, initialProgress: 0, completedTaskIds: [] },
  };
}

export function getDailyProgress(state) {
  return Math.min(4, state.daily.initialProgress + state.daily.completedTaskIds.length);
}

export function addTaskReward(state, reward) {
  if (state.pendingRewards.some(({ id }) => id === reward.id)
    || state.claimedRewardIds.includes(reward.id)) return state;

  const completedTaskIds = state.daily.completedTaskIds.includes(reward.taskId)
    ? state.daily.completedTaskIds
    : [...state.daily.completedTaskIds, reward.taskId];

  return {
    ...state,
    daily: { ...state.daily, completedTaskIds },
    pendingRewards: [...state.pendingRewards, { ...reward }],
  };
}

export function getVisibleBubbles(state) {
  const bubbles = state.pendingRewards.map(({ id, attribute, value, createdAt }) => ({
    key: id,
    rewardIds: [id],
    attribute,
    value,
    createdAt,
  }));

  while (bubbles.length > 4) {
    const pair = findEarliestMatchingPair(bubbles);
    if (!pair) break;

    const [firstIndex, secondIndex] = pair;
    const first = bubbles[firstIndex];
    const second = bubbles[secondIndex];
    bubbles.splice(secondIndex, 1);
    bubbles[firstIndex] = {
      key: first.key,
      rewardIds: [...first.rewardIds, ...second.rewardIds],
      attribute: first.attribute,
      value: first.value + second.value,
      createdAt: Math.min(first.createdAt, second.createdAt),
    };
  }

  return bubbles;
}

export function previewBubbleCollection(state, rewardIds) {
  const claimed = new Set(state.claimedRewardIds);
  const wanted = new Set(rewardIds);
  const rewards = state.pendingRewards.filter(({ id }) => wanted.has(id) && !claimed.has(id));
  if (rewards.length === 0) return null;

  const attributes = new Set(rewards.map(({ attribute }) => attribute));
  if (attributes.size !== 1) return null;

  const [attribute] = attributes;
  const increment = rewards.reduce((sum, reward) => sum + reward.value, 0);
  const previousTotal = state.totals[attribute];
  return { attribute, increment, previousTotal, nextTotal: previousTotal + increment };
}

export function collectBubble(state, rewardIds) {
  const preview = previewBubbleCollection(state, rewardIds);
  if (!preview) return state;

  const claimed = new Set(state.claimedRewardIds);
  const wanted = new Set(rewardIds);
  const rewards = state.pendingRewards.filter(({ id }) => wanted.has(id) && !claimed.has(id));
  const totals = { ...state.totals, [preview.attribute]: preview.nextTotal };

  const collectedIds = new Set(rewards.map(({ id }) => id));
  return {
    ...state,
    totals,
    pendingRewards: state.pendingRewards.filter(({ id }) => !collectedIds.has(id)),
    claimedRewardIds: [...state.claimedRewardIds, ...rewards.map(({ id }) => id)],
  };
}

function findEarliestMatchingPair(bubbles) {
  for (let first = 0; first < bubbles.length; first += 1) {
    for (let second = first + 1; second < bubbles.length; second += 1) {
      if (bubbles[first].attribute === bubbles[second].attribute) return [first, second];
    }
  }
  return null;
}

function isValidGrowthState(value) {
  return value
    && value.version === GROWTH_STATE_VERSION
    && value.daily
    && typeof value.daily.dateKey === "string"
    && Number.isFinite(value.daily.initialProgress)
    && Array.isArray(value.daily.completedTaskIds)
    && value.daily.completedTaskIds.every((id) => typeof id === "string")
    && value.totals
    && ATTRIBUTES.every((attribute) => Number.isFinite(value.totals[attribute]))
    && Array.isArray(value.pendingRewards)
    && value.pendingRewards.every(isValidReward)
    && Array.isArray(value.claimedRewardIds)
    && value.claimedRewardIds.every((id) => typeof id === "string");
}

function isValidReward(reward) {
  return reward
    && typeof reward.id === "string"
    && typeof reward.taskId === "string"
    && ATTRIBUTES.includes(reward.attribute)
    && Number.isFinite(reward.value)
    && Number.isFinite(reward.createdAt);
}
