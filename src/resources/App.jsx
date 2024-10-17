import React from 'react';
import ReactDOM from 'react-dom';
import { Login } from './Login.jsx';
import { AppProvider } from "@shopify/polaris";

const App = () => {
    return (
        <AppProvider>
            <Login />
        </AppProvider>
    )
}
ReactDOM.render(<App />, document.getElementById('root'));