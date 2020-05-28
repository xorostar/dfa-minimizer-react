import React from 'react';
import { Container } from 'reactstrap';
import Header from './includes/Header';
import Home from './pages/Home';

function App() {
  return (
    <>
      <Header />
      <Container style={{ position: 'relative', bottom: '150px' }}>
        <Home />
      </Container>
    </>
  );
}

export default App;
