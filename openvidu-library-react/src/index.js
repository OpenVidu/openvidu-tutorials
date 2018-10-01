import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import App from './App';
import registerServiceWorker from './registerServiceWorker';

import reactLogo from './assets/img/react-logo.svg';
import ovLogo from './assets/img/openvidu_vert_white_bg_trans_cropped.png';
import ovLogo2 from './assets/img/openvidu_logo.png';

ReactDOM.render(
    <div>
        <header className="App-header">
            <img src={ovLogo} className="App-logo" alt="logo" />
            <img src={reactLogo} className="React-logo" alt="logo" />
        </header>
        <div id="title">
            <a href="http://www.openvidu.io/" target="_blank" rel="noopener noreferrer">
                <img src={ovLogo2} className="mainLogo" alt="logo" />
            </a>
        </div>
        <App />{' '}
    </div>,

    document.getElementById('root'),
);
registerServiceWorker();
