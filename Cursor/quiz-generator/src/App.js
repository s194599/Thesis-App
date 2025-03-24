import React from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import './App.css';
import QuizForm from './components/QuizForm';

function App() {
  return (
    <div className="App">
      <div className="container mt-4">
        <div className="row justify-content-center">
          <div className="col-lg-8">
            <div className="card shadow">
              <div className="card-body">
                <h1 className="text-center mb-4">Create Quiz</h1>
                <QuizForm />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
