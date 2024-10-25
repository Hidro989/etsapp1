import React from 'react';
import ReactDOM from 'react-dom';
import { Login } from './Login.jsx';
import Products from './Products.jsx';
import Reviews from './Reviews.jsx';
import { AppProvider } from "@shopify/polaris";
import { BrowserRouter, Routes, Route } from 'react-router-dom';

const Main = () => {
    const urlParams = new URLSearchParams(window.location.search);

    const isValidShop = (shop) => /^[a-zA-Z0-9-]+\.myshopify\.com$/.test(shop);
    
    const shop = urlParams.get('shop');

    if (urlParams.get('embedded')) {
        // return <Products/>;
        return <Reviews/>;
    }
    
    if (shop && isValidShop(shop)) {
        window.location.href = `${import.meta.env.VITE_APP_URL}/etsapp1/api/shopify/auth?shop=${shop}`;
        return;
    }

    return <Login/>;

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