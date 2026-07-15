/* eslint-disable no-loop-func */
import { isEqual } from './Helpers';

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

const refineEquivalence = (
  previousEquivalence,
  alphabet,
  transitions
) => {
  const currentEquivalence = [];

  previousEquivalence.forEach((set) => {
    if (set.length <= 1) {
      currentEquivalence.push(set);
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

export const minimize = (originalAutomaton) => {
  const automaton = removeUnreachableStates(originalAutomaton);
  const equivalences = [];

  const nonFinalStates = automaton.states.filter(
    (state) => !automaton.acceptingStates.includes(state)
  );
  let currentEquivalence = [nonFinalStates, automaton.acceptingStates].filter(
    (set) => set.length > 0
  );
  equivalences.push(currentEquivalence);

  while (true) {
    const nextEquivalence = refineEquivalence(
      currentEquivalence,
      automaton.alphabet,
      automaton.transitions
    );
    equivalences.push(nextEquivalence);

    if (isEqual(currentEquivalence, nextEquivalence)) {
      break;
    }

    currentEquivalence = nextEquivalence;
  }

  const sortedEquivalences = equivalences.map((equivalence) =>
    [...equivalence].sort((a, b) => b.length - a.length)
  );

  const finalEquivalence = sortedEquivalences[sortedEquivalences.length - 1];

  const minimizedAutomaton = {
    states: [],
    alphabet: automaton.alphabet,
    initialState: null,
    acceptingStates: [],
    transitions: [],
  };

  const separatedStates = [];

  finalEquivalence.forEach((set) => {
    minimizedAutomaton.states.push(set.join(''));
    separatedStates.push(set.join(','));
  });

  const initialSet = finalEquivalence.find((set) =>
    set.includes(automaton.initialState)
  );
  minimizedAutomaton.initialState = initialSet ? initialSet.join('') : null;

  minimizedAutomaton.acceptingStates = finalEquivalence
    .filter((set) =>
      set.some((state) => automaton.acceptingStates.includes(state))
    )
    .map((set) => set.join(''));

  separatedStates.forEach((state) => {
    const stateElements = state.replace(/(^\s*,)|(,\s*$)/g, '').split(',');
    const stateElement = stateElements[0];
    const transitions = automaton.transitions.filter(
      (transition) => transition.fromState === stateElement
    );

    transitions.forEach((transition) => {
      const oldToState = transition.toStates[0];
      const toStates = separatedStates.filter((candidate) => {
        const states = candidate.replace(/(^\s*,)|(,\s*$)/g, '').split(',');
        return states.includes(oldToState);
      });

      toStates[0] = toStates[0].replace(/,/g, '');
      minimizedAutomaton.transitions.push({
        fromState: state.replace(/,/g, ''),
        toStates,
        symbol: transition.symbol,
      });
    });
  });

  return { minimizedAutomaton, equivalences: sortedEquivalences };
};
