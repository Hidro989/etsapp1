import React from 'react';
import ReactDOM from 'react-dom';
import { Login } from './Login.jsx';
import Products from './Products.jsx';
import { AppProvider } from "@shopify/polaris";
import { BrowserRouter, Routes, Route } from 'react-router-dom';

const Main = () => {
    const urlParams = new URLSearchParams(window.location.search);
    // return urlParams.get('embedded') ? <Products/> : <Login/>;
    return <Products/>;
}

const App = () => {
    return (
        <AppProvider>
            <BrowserRouter>
                <Routes>
                    <Route path="/etsapp1/dev/" exact element={<Main />} />
                </Routes>
            </BrowserRouter>
        </AppProvider>
    )
}
ReactDOM.render(<App />, document.getElementById('root'));