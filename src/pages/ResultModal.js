import React, { useState, useEffect } from 'react';
import {
  Button,
  Modal,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Row,
  Col,
  Table,
} from 'reactstrap';

import { minimize } from '../utils/Minimizer';

const ResultModal = ({ automaton, setIsSubmitted }) => {
  const [modal, setModal] = useState(true);
  const [automatonGraph, setAutomatonGraph] = useState('');
  const [minimizedAutomaton, setMinimizedAutomaton] = useState(null);
  const [minimizedAutomatonGraph, setMinimizedAutomatonGraph] = useState('');
  const [equivalences, setEquivalences] = useState(null);

  const drawGraph = (automaton) => {
    var dotString = window.noam.fsm.printDotFormat(automaton);
    var gvizXml = window.Viz(dotString, 'svg');
    return gvizXml;
  };

  const generateAutomaton = (automaton) => {
    setAutomatonGraph(drawGraph(automaton));
    let minimizedAutomatonResult = minimize(automaton);
    setMinimizedAutomaton(minimizedAutomatonResult.minimizedAutomaton);
    setMinimizedAutomatonGraph(
      drawGraph(minimizedAutomatonResult.minimizedAutomaton)
    );
    setEquivalences(minimizedAutomatonResult.equivalences);
  };

  useEffect(() => {
    generateAutomaton(automaton);
    // eslint-disable-next-line
  }, []);

  const toggle = () => {
    setModal(!modal);
    setIsSubmitted(false);
  };

  const formatEquivalence = (equivalence) => {
    return JSON.stringify(equivalence)
      .replace(/\[/g, '{')
      .replace(/\]/g, '}')
      .replace(/,/g, ', ');
  };

  return (
    <Modal
      isOpen={modal}
      toggle={toggle}
      size='lg'
      style={{ width: '80vw', maxWidth: '100%', margin: 'auto' }}
    >
      <ModalHeader toggle={toggle}>Minimized Result</ModalHeader>
      <ModalBody>
        <div>
          <Row>
            <Col md='6'>
              <h6>Original State Transition Table</h6>
              <Table responsive bordered>
                <thead>
                  <tr>
                    <th>States</th>
                    {automaton.alphabet.map((symbol) => (
                      <th key={symbol}>{symbol}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {automaton.states.map((state) => {
                    return (
                      <tr key={`transition-${state}}`}>
                        <th scope='row'>{state}</th>
                        {automaton.alphabet.map((symbol) => (
                          <td key={`${state}-${symbol}`}>
                            {automaton.transitions.map((transition) => {
                              if (
                                transition.symbol === symbol &&
                                transition.fromState === state
                              ) {
                                return transition.toStates[0];
                              }
                            })}
                          </td>
                        ))}
                      </tr>
                    );
                  })}
                </tbody>
              </Table>
              <h6>Original Automaton Graph</h6>
              <div
                className='automaton-graphs'
                dangerouslySetInnerHTML={{ __html: automatonGraph }}
              ></div>
            </Col>

            <Col sm='6'>
              <h6>Minimized State Transition Table</h6>
              {minimizedAutomaton && (
                <Table responsive bordered>
                  <thead>
                    <tr>
                      <th>States</th>
                      {minimizedAutomaton.alphabet.map((symbol) => (
                        <th key={symbol}>{symbol}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {minimizedAutomaton.states.map((state) => {
                      return (
                        <tr key={`transition-${state}}`}>
                          <th scope='row'>{state}</th>
                          {minimizedAutomaton.alphabet.map((symbol) => (
                            <td key={`${state}-${symbol}`}>
                              {minimizedAutomaton.transitions.map(
                                (transition) => {
                                  if (
                                    transition.symbol === symbol &&
                                    transition.fromState === state
                                  ) {
                                    return transition.toStates[0];
                                  }
                                }
                              )}
                            </td>
                          ))}
                        </tr>
                      );
                    })}
                  </tbody>
                </Table>
              )}
              <h6>Computed Equivalences</h6>
              {equivalences &&
                equivalences.map((equivalence, index) => (
                  <p>
                    {`${index}-Equivalence: ${formatEquivalence(equivalence)}`}
                  </p>
                ))}
              <h6>Minimized Automaton Graph</h6>
              <div
                className='automaton-graphs'
                dangerouslySetInnerHTML={{ __html: minimizedAutomatonGraph }}
              ></div>
            </Col>
          </Row>
        </div>
      </ModalBody>
      <ModalFooter>
        <Button color='danger' onClick={toggle}>
          Close
        </Button>
      </ModalFooter>
    </Modal>
  );
};

export default ResultModal;
