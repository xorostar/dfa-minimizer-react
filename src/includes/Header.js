import React from 'react';
import { Jumbotron, Container } from 'reactstrap';

const Header = () => {
  return (
    <header>
      <Jumbotron
        className='text-white'
        style={{
          backgroundColor: '#4052B6',
          paddingBottom: '150px',
          borderRadius: '0px',
        }}
      >
        <Container>
          <h1 className='display-3 text-center'>DFA Minimizer</h1>
          <hr className='bg-white' />
          <p className='lead text-center'>
            Minimize a DFA using Equivalence Theorem. You just need to input the
            state transition table for the original DFA that you want to
            minimize and our algorithm with compute and visualize everything
            else for you.
          </p>
        </Container>
      </Jumbotron>
    </header>
  );
};

export default Header;
