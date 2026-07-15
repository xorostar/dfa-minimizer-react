/* eslint-disable no-loop-func */

const normalizeSet = (set) => [...set].sort().join('\0');

export const partitionsEqual = (a, b) => {
  if (!Array.isArray(a) || !Array.isArray(b) || a.length !== b.length) {
    return false;
  }

  const normalizedA = a.map(normalizeSet).sort();
  const normalizedB = b.map(normalizeSet).sort();

  return normalizedA.every((value, index) => value === normalizedB[index]);
};

// DOT-safe unique labels: p0_A_B, p1_F, ... (index prevents collisions like {1,2} vs {12})
const assignPartitionLabels = (partitions) =>
  partitions.map((set, index) => {
    const members = [...set].sort().join('_');
    return members ? `p${index}_${members}` : `p${index}`;
  });

const findPartitionIndex = (partitions, state) =>
  partitions.findIndex((set) => set.includes(state));

const removeUnreachableStates = (automaton) => {
  const reachable = new Set();
  const queue = [];

  if (automaton.initialState != null) {
    reachable.add(automaton.initialState);
    queue.push(automaton.initialState);
  }

  while (queue.length > 0) {
    const state = queue.shift();
    automaton.transitions
      .filter((transition) => transition.fromState === state)
      .forEach((transition) => {
        transition.toStates.forEach((toState) => {
          if (!reachable.has(toState)) {
            reachable.add(toState);
            queue.push(toState);
          }
        });
      });
  }

  return {
    ...automaton,
    states: automaton.states.filter((state) => reachable.has(state)),
    acceptingStates: automaton.acceptingStates.filter((state) =>
      reachable.has(state)
    ),
    transitions: automaton.transitions.filter((transition) =>
      reachable.has(transition.fromState)
    ),
  };
};

const getTransitionTarget = (transitions, fromState, symbol) => {
  const transition = transitions.find(
    (item) => item.fromState === fromState && item.symbol === symbol
  );
  return transition ? transition.toStates[0] : null;
};

const areStatesEquivalent = (
  pivotState,
  subsequentState,
  alphabet,
  transitions,
  previousEquivalence
) => {
  return alphabet.every((symbol) => {
    const pivotTarget = getTransitionTarget(transitions, pivotState, symbol);
    const subsequentTarget = getTransitionTarget(
      transitions,
      subsequentState,
      symbol
    );

    // Both missing the same symbol → treat as equivalent (partial DFAs)
    if (pivotTarget == null && subsequentTarget == null) {
      return true;
    }

    if (pivotTarget == null || subsequentTarget == null) {
      return false;
    }

    if (pivotTarget === subsequentTarget) {
      return true;
    }

    return previousEquivalence.some(
      (set) => set.includes(pivotTarget) && set.includes(subsequentTarget)
    );
  });
};

const refineEquivalence = (previousEquivalence, alphabet, transitions) => {
  const currentEquivalence = [];

  previousEquivalence.forEach((set) => {
    if (set.length <= 1) {
      currentEquivalence.push([...set]);
      return;
    }

    const paired = [];

    for (let j = 0; j < set.length; j++) {
      const pivotState = set[j];
      if (paired.includes(pivotState)) {
        continue;
      }

      const pair = [pivotState];
      paired.push(pivotState);

      for (let k = j + 1; k < set.length; k++) {
        const subsequentState = set[k];
        if (paired.includes(subsequentState)) {
          continue;
        }

        const isPair = areStatesEquivalent(
          pivotState,
          subsequentState,
          alphabet,
          transitions,
          previousEquivalence
        );

        if (isPair) {
          paired.push(subsequentState);
          pair.push(subsequentState);
        }
      }

      currentEquivalence.push(pair);
    }
  });

  return currentEquivalence;
};

const buildEmptyAutomaton = (alphabet) => ({
  states: [],
  alphabet,
  initialState: null,
  acceptingStates: [],
  transitions: [],
});

export const minimize = (originalAutomaton) => {
  const automaton = removeUnreachableStates(originalAutomaton);
  const equivalences = [];

  if (automaton.states.length === 0) {
    return {
      minimizedAutomaton: buildEmptyAutomaton(originalAutomaton.alphabet || []),
      equivalences: [],
    };
  }

  const nonFinalStates = automaton.states.filter(
    (state) => !automaton.acceptingStates.includes(state)
  );
  let currentEquivalence = [
    nonFinalStates,
    [...automaton.acceptingStates],
  ].filter((set) => set.length > 0);
  equivalences.push(currentEquivalence.map((set) => [...set]));

  while (true) {
    const nextEquivalence = refineEquivalence(
      currentEquivalence,
      automaton.alphabet,
      automaton.transitions
    );

    if (partitionsEqual(currentEquivalence, nextEquivalence)) {
      break;
    }

    equivalences.push(nextEquivalence.map((set) => [...set]));
    currentEquivalence = nextEquivalence;
  }

  const displayEquivalences = equivalences.map((equivalence) =>
    [...equivalence].sort((a, b) => b.length - a.length)
  );

  const finalEquivalence = currentEquivalence;
  const labels = assignPartitionLabels(finalEquivalence);
  const labelByState = new Map();

  finalEquivalence.forEach((set, index) => {
    set.forEach((state) => labelByState.set(state, labels[index]));
  });

  const minimizedAutomaton = {
    states: [...labels],
    alphabet: automaton.alphabet,
    initialState:
      automaton.initialState != null
        ? labelByState.get(automaton.initialState) || null
        : null,
    acceptingStates: finalEquivalence
      .map((set, index) =>
        set.some((state) => automaton.acceptingStates.includes(state))
          ? labels[index]
          : null
      )
      .filter(Boolean),
    transitions: [],
  };

  finalEquivalence.forEach((set, index) => {
    const fromLabel = labels[index];
    const representative = set[0];
    const transitions = automaton.transitions.filter(
      (transition) => transition.fromState === representative
    );

    transitions.forEach((transition) => {
      const oldToState = transition.toStates[0];
      const targetIndex = findPartitionIndex(finalEquivalence, oldToState);
      if (targetIndex < 0) {
        return;
      }

      minimizedAutomaton.transitions.push({
        fromState: fromLabel,
        toStates: [labels[targetIndex]],
        symbol: transition.symbol,
      });
    });
  });

  return { minimizedAutomaton, equivalences: displayEquivalences };
};
